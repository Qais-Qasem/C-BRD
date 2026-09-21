import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { CanonicalStorageAdapter, StorageDurabilityClassification, StoragePutResult } from '../canonicalTypes';
import { computeServerByteSha256 } from '../canonicalIdentity';

export interface LocalCanonicalStorageConfig {
  storageRoot: string;
}

export class LocalCanonicalStorageAdapter implements CanonicalStorageAdapter {
  private root: string;

  constructor(config: LocalCanonicalStorageConfig) {
    this.root = path.resolve(config.storageRoot);
  }

  private async validateAndResolveKey(key: string): Promise<string> {
    if (key.includes('\\') || key.startsWith('/') || key.includes('\0')) {
      throw new Error('Invalid canonical storage key');
    }
    
    const keyRegex = /^source-versions\/([a-f0-9]{2})\/([a-f0-9]{64})$/;
    const match = keyRegex.exec(key);
    if (!match) {
      throw new Error('Invalid canonical storage key format');
    }
    const [, prefix, hash] = match;
    if (prefix !== hash.substring(0, 2)) {
      throw new Error('Invalid canonical storage key: prefix mismatch');
    }

    const resolvedPath = path.resolve(this.root, key);
    if (!resolvedPath.startsWith(this.root + path.sep)) {
      throw new Error('Path traversal detected');
    }

    try {
      const rootStats = await fs.promises.lstat(this.root);
      if (rootStats.isSymbolicLink()) throw new Error('Symlink traversal detected');
      if (!rootStats.isDirectory()) throw new Error('Storage IO error');
    } catch (err: any) {
      if (err.message === 'Symlink traversal detected' || err.message === 'Storage IO error') throw err;
      if (err.code !== 'ENOENT') throw new Error('Storage IO error');
    }

    let currentPath = this.root;
    const parts = key.split('/');
    for (const part of parts) {
      currentPath = path.join(currentPath, part);
      try {
        const stats = await fs.promises.lstat(currentPath);
        if (stats.isSymbolicLink()) throw new Error('Symlink traversal detected');
      } catch (err: any) {
        if (err.message === 'Symlink traversal detected') throw err;
        if (err.code !== 'ENOENT') throw new Error('Storage IO error');
        break; 
      }
    }

    return resolvedPath;
  }

  private async checkLeafNotSymlink(filePath: string): Promise<void> {
    try {
      const stats = await fs.promises.lstat(filePath);
      if (stats.isSymbolicLink()) {
        throw new Error('Symlink traversal detected');
      }
    } catch (err: any) {
      if (err.message === 'Symlink traversal detected') throw err;
      if (err.code !== 'ENOENT') {
        throw new Error('Storage IO error');
      }
    }
  }

  private sanitizeError(error: any): Error {
    if (error.message && [
      'Symlink traversal detected', 
      'Invalid canonical storage key', 
      'Invalid canonical storage key format', 
      'Invalid canonical storage key: prefix mismatch', 
      'Path traversal detected',
      'Incomplete existing canonical object'
    ].includes(error.message)) {
      return new Error(error.message);
    }
    return new Error('Local canonical storage operation failed.');
  }

  async putImmutable(key: string, bytes: Buffer, metadata?: Record<string, string>): Promise<StoragePutResult> {
    try {
      const objectDir = await this.validateAndResolveKey(key);
      const dataPath = path.join(objectDir, 'bytes.bin');
      const metaPath = path.join(objectDir, 'metadata.json');

      try {
        const dirStats = await fs.promises.lstat(objectDir);
        if (dirStats.isDirectory()) {
          await this.checkLeafNotSymlink(dataPath);
          await this.checkLeafNotSymlink(metaPath);

          let hasBytes = false;
          let hasMeta = false;
          try { await fs.promises.access(dataPath); hasBytes = true; } catch (e) {}
          try { await fs.promises.access(metaPath); hasMeta = true; } catch (e) {}

          if (hasBytes && hasMeta) {
            const existingBytes = await fs.promises.readFile(dataPath);
            const existingHash = computeServerByteSha256(existingBytes);
            const incomingHash = computeServerByteSha256(bytes);
            
            if (existingHash === incomingHash) {
              return {
                status: 'EXISTING',
                durability: 'LOCAL_INTEGRATION',
                storageKey: key
              };
            } else {
              return {
                status: 'CONFLICT',
                durability: 'LOCAL_INTEGRATION',
                storageKey: key,
                error: 'Byte mismatch at canonical key'
              };
            }
          } else {
            return {
              status: 'FAILURE',
              durability: 'LOCAL_INTEGRATION',
              error: 'Incomplete existing canonical object'
            };
          }
        }
      } catch (err: any) {
        if (err.message === 'Symlink traversal detected') throw err;
        if (err.code !== 'ENOENT') {
          throw new Error('Storage IO error');
        }
      }

      await fs.promises.mkdir(this.root, { recursive: true });

      const stagingDir = path.join(this.root, `.staging-${crypto.randomBytes(16).toString('hex')}`);
      await fs.promises.mkdir(stagingDir, { recursive: true });
      const stagingDataPath = path.join(stagingDir, 'bytes.bin');
      const stagingMetaPath = path.join(stagingDir, 'metadata.json');

      try {
        await fs.promises.writeFile(stagingDataPath, bytes);
        if (metadata) {
          await fs.promises.writeFile(stagingMetaPath, JSON.stringify(metadata, null, 2), 'utf8');
        } else {
          await fs.promises.writeFile(stagingMetaPath, JSON.stringify({}, null, 2), 'utf8');
        }

        await fs.promises.mkdir(path.dirname(objectDir), { recursive: true });
        await fs.promises.rename(stagingDir, objectDir);
      } catch (err: any) {
        try {
          await fs.promises.rm(stagingDir, { recursive: true, force: true });
        } catch (cleanupErr) {}
        throw new Error('Storage IO error');
      }

      return {
        status: 'CREATED',
        durability: 'LOCAL_INTEGRATION',
        storageKey: key
      };

    } catch (error: any) {
      const sanitized = this.sanitizeError(error);
      return {
        status: 'FAILURE',
        durability: 'LOCAL_INTEGRATION',
        error: sanitized.message
      };
    }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const objectDir = await this.validateAndResolveKey(key);
      const dataPath = path.join(objectDir, 'bytes.bin');
      await this.checkLeafNotSymlink(dataPath);
      return await fs.promises.readFile(dataPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw this.sanitizeError(error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const objectDir = await this.validateAndResolveKey(key);
      const dataPath = path.join(objectDir, 'bytes.bin');
      const metaPath = path.join(objectDir, 'metadata.json');
      await this.checkLeafNotSymlink(dataPath);
      await this.checkLeafNotSymlink(metaPath);
      try {
        await fs.promises.access(dataPath);
        await fs.promises.access(metaPath);
        return true;
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          return false;
        }
        throw new Error('Storage IO error');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw this.sanitizeError(error);
    }
  }

  async getMetadata(key: string): Promise<Record<string, string> | null> {
    try {
      const objectDir = await this.validateAndResolveKey(key);
      const metaPath = path.join(objectDir, 'metadata.json');
      await this.checkLeafNotSymlink(metaPath);
      const content = await fs.promises.readFile(metaPath, 'utf8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw this.sanitizeError(error);
    }
  }
}
