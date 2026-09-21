import { CanonicalStorageAdapter, StorageDurabilityClassification, StoragePutResult } from './canonicalTypes';
import { computeServerByteSha256 } from './canonicalIdentity';

export type CanonicalStorageErrorCode =
  | 'INVALID_STORAGE_KEY'
  | 'SOURCE_VERSION_HASH_MISMATCH'
  | 'STORAGE_IO_ERROR'
  | 'STORAGE_CONFLICT'
  | 'STORED_BYTE_INTEGRITY_FAILURE'
  | 'OBJECT_NOT_FOUND'
  | 'INCOMPLETE_STORAGE_OBJECT';

export class CanonicalStorageError extends Error {
  constructor(public code: CanonicalStorageErrorCode, message: string) {
    super(message);
    this.name = 'CanonicalStorageError';
  }
}

export interface StoreCanonicalBinaryParams {
  sourceId?: string; // Logical source association may be preserved in returned reference
  sourceVersionId: string;
  bytes: Buffer;
}

export interface RetrieveCanonicalBinaryParams {
  sourceVersionId: string;
}

export interface CanonicalStorageReference {
  sourceId?: string;
  sourceVersionId: string;
  storageKey: string;
  durability: StorageDurabilityClassification;
}

/**
 * Validates and derives the storage key from sourceVersionId.
 * Format: source-versions/<first-two-hex>/<sourceVersionId>
 */
export function deriveStorageKey(sourceVersionId: string): string {
  if (!/^[a-f0-9]{64}$/.test(sourceVersionId)) {
    throw new CanonicalStorageError('INVALID_STORAGE_KEY', 'sourceVersionId must be exactly 64 lowercase hexadecimal characters.');
  }
  const prefix = sourceVersionId.substring(0, 2);
  return `source-versions/${prefix}/${sourceVersionId}`;
}

const safeErrorMessages = [
  'Symlink traversal detected', 
  'Invalid canonical storage key', 
  'Invalid canonical storage key format', 
  'Invalid canonical storage key: prefix mismatch', 
  'Path traversal detected'
];

/**
 * Stores canonical binary with strict byte verification.
 */
export async function storeCanonicalBinary(
  params: StoreCanonicalBinaryParams,
  adapter: CanonicalStorageAdapter
): Promise<CanonicalStorageReference> {
  const { sourceVersionId, bytes } = params;

  // 1. Verify caller-provided sourceVersionId matches actual bytes
  const computedHash = computeServerByteSha256(bytes);
  if (computedHash !== sourceVersionId) {
    throw new CanonicalStorageError('SOURCE_VERSION_HASH_MISMATCH', 'The provided sourceVersionId does not match the SHA-256 hash of the provided bytes.');
  }

  // 2. Derive deterministic storage key
  const storageKey = deriveStorageKey(sourceVersionId);

  // 3. Prepare provider-neutral metadata (GLOBAL CONTENT METADATA ONLY)
  const enrichedMetadata: Record<string, string> = {
    sourceVersionId,
    serverByteSha256: computedHash,
    fileSizeBytes: bytes.length.toString(10),
  };

  // 4. Store immutably
  let result: StoragePutResult;
  try {
    result = await adapter.putImmutable(storageKey, bytes, enrichedMetadata);
  } catch (error: any) {
    throw new CanonicalStorageError('STORAGE_IO_ERROR', 'Local canonical storage operation failed.');
  }

  if (result.status === 'CONFLICT') {
    throw new CanonicalStorageError('STORAGE_CONFLICT', 'A different object already exists at this canonical key.');
  }

  if (result.status === 'FAILURE') {
    let errorCode: CanonicalStorageErrorCode = 'STORAGE_IO_ERROR';
    let errorMessage = result.error || 'Local canonical storage operation failed.';
    
    if (errorMessage === 'Incomplete existing canonical object') {
      errorCode = 'INCOMPLETE_STORAGE_OBJECT';
      errorMessage = 'Canonical storage object is incomplete.';
    } else if (errorMessage.startsWith('Invalid canonical storage key')) {
      errorCode = 'INVALID_STORAGE_KEY';
    } else if (!safeErrorMessages.includes(errorMessage)) {
      errorMessage = 'Local canonical storage operation failed.';
    }

    throw new CanonicalStorageError(errorCode, errorMessage);
  }

  return {
    sourceId: params.sourceId,
    sourceVersionId,
    storageKey,
    durability: result.durability,
  };
}

/**
 * Retrieves canonical binary and verifies byte integrity round-trip.
 */
export async function retrieveCanonicalBinary(
  params: RetrieveCanonicalBinaryParams,
  adapter: CanonicalStorageAdapter
): Promise<{ bytes: Buffer; metadata: Record<string, string> }> {
  const storageKey = deriveStorageKey(params.sourceVersionId);

  let bytes: Buffer | null;
  let metadata: Record<string, string> | null;
  
  try {
    bytes = await adapter.get(storageKey);
    metadata = await adapter.getMetadata(storageKey);
  } catch (error: any) {
    let msg = 'Local canonical storage operation failed.';
    if (error.message && safeErrorMessages.includes(error.message)) {
      msg = error.message;
    }
    throw new CanonicalStorageError('STORAGE_IO_ERROR', msg);
  }

  if (!bytes && !metadata) {
    throw new CanonicalStorageError('OBJECT_NOT_FOUND', 'Canonical binary object not found.');
  }

  if (!bytes || !metadata) {
    throw new CanonicalStorageError('INCOMPLETE_STORAGE_OBJECT', 'Canonical binary object is incomplete.');
  }

  // Verify byte integrity upon retrieval
  const retrievedHash = computeServerByteSha256(bytes);
  if (retrievedHash !== params.sourceVersionId) {
    throw new CanonicalStorageError('STORED_BYTE_INTEGRITY_FAILURE', 'Retrieved bytes do not match the requested sourceVersionId.');
  }

  return { bytes, metadata };
}
