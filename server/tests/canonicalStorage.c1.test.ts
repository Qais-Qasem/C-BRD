import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import {
  LocalCanonicalStorageAdapter
} from '../storage/localCanonicalStorageAdapter';

import {
  deriveStorageKey,
  storeCanonicalBinary,
  retrieveCanonicalBinary,
  CanonicalStorageError
} from '../canonicalStorage';

import {
  computeServerByteSha256,
  deriveSourceVersionId,
  deriveExtractorKey,
  deriveBlockId,
  computeEvidenceHash,
  MAX_CANONICAL_RAW_BYTES,
  getSafeDisplayFilename,
  validateCanonicalPdfInput
} from '../canonicalIdentity';

async function runTests() {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'c1-test-'));
  try {
    const adapter = new LocalCanonicalStorageAdapter({ storageRoot: tmpDir });
    
    // Test data
    const bytes1 = Buffer.from('test binary content 1');
    const svid1 = deriveSourceVersionId(bytes1);
    const key1 = deriveStorageKey(svid1);
    
    const bytes2 = Buffer.from('test binary content 2');
    const svid2 = deriveSourceVersionId(bytes2);
    
    // C1-EVAL-010: Local adapter explicitly non-production
    const res1 = await adapter.putImmutable(key1, bytes1);
    assert.strictEqual(res1.durability, 'LOCAL_INTEGRATION');
    console.log("C1-EVAL-010 PASS");
    
    // C1-EVAL-001: Valid object can be stored
    const storeRes1 = await storeCanonicalBinary({
      sourceVersionId: svid1,
      bytes: bytes1
    }, adapter);
    assert.strictEqual(storeRes1.sourceVersionId, svid1);
    console.log("C1-EVAL-001 PASS");
    
    // C1-EVAL-002: Stored bytes retrieve unchanged
    // C1-EVAL-003: Retrieved SHA-256 equals original
    const retrieveRes1 = await retrieveCanonicalBinary({
      sourceVersionId: svid1
    }, adapter);
    assert.ok(retrieveRes1.bytes.equals(bytes1));
    assert.strictEqual(computeServerByteSha256(retrieveRes1.bytes), svid1);
    console.log("C1-EVAL-002 PASS");
    console.log("C1-EVAL-003 PASS");
    
    // C1-EVAL-004: Repeated storage idempotent
    const storeRes2 = await adapter.putImmutable(key1, bytes1);
    assert.strictEqual(storeRes2.status, 'EXISTING');
    console.log("C1-EVAL-004 PASS");
    
    // C1-EVAL-005: Changed bytes distinct (don't overwrite)
    // C1-EVAL-008: distinct remain distinct
    const storeRes3 = await storeCanonicalBinary({
      sourceVersionId: svid2,
      bytes: bytes2
    }, adapter);
    assert.strictEqual(storeRes3.sourceVersionId, svid2);
    const retrieveRes2 = await retrieveCanonicalBinary({ sourceVersionId: svid2 }, adapter);
    assert.ok(retrieveRes2.bytes.equals(bytes2));
    assert.notStrictEqual(svid1, svid2);
    console.log("C1-EVAL-005 PASS");
    console.log("C1-EVAL-008 PASS");
    
    // SUPPORTING-C1-COLLISION: same key + different bytes -> CONFLICT
    const collisionRes = await adapter.putImmutable(key1, bytes2);
    assert.strictEqual(collisionRes.status, 'CONFLICT');
    // Verify old bytes remain unchanged
    const retrieveAfterCollision = await retrieveCanonicalBinary({ sourceVersionId: svid1 }, adapter);
    assert.ok(retrieveAfterCollision.bytes.equals(bytes1));
    console.log("SUPPORTING-C1-COLLISION PASS");

    // C1-EVAL-006: Unsafe traversal/path input is rejected.
    let traversalRejected = false;
    const unsafeRes = await adapter.putImmutable('../../../unsafe', bytes1);
    if (unsafeRes.status === 'FAILURE' && unsafeRes.error && unsafeRes.error.includes('Invalid canonical storage key')) {
      traversalRejected = true;
    }
    assert.ok(traversalRejected);
    console.log("C1-EVAL-006 PASS");
    
    // C1-EVAL-007: Untrusted filename cannot control filesystem path.
    const fakeMetadata = { originalFilename: '../../evil.pdf' };
    const svid3 = deriveSourceVersionId(Buffer.from('test 3'));
    const storeRes4 = await storeCanonicalBinary({
      sourceVersionId: svid3,
      bytes: Buffer.from('test 3'),
      metadata: fakeMetadata
    } as any, adapter);
    const retrieved3 = await retrieveCanonicalBinary({ sourceVersionId: svid3 }, adapter);
    assert.strictEqual(retrieved3.metadata.originalFilename, undefined);
    // But object is stored under svid3 derived key
    assert.ok(storeRes4.storageKey.includes(svid3));
    console.log("C1-EVAL-007 PASS");
    
    // Cross-instance local persistence
    const adapter2 = new LocalCanonicalStorageAdapter({ storageRoot: tmpDir });
    const retrieveRes3 = await retrieveCanonicalBinary({ sourceVersionId: svid1 }, adapter2);
    assert.ok(retrieveRes3.bytes.equals(bytes1));
    console.log("CROSS-INSTANCE LOCAL PERSISTENCE PASS");

    // SUPPORTING-C1-SHARED-CONTENT
    const sharedBytes = Buffer.from('shared content bytes');
    const sharedSvid = deriveSourceVersionId(sharedBytes);
    const storeA = await storeCanonicalBinary({
      sourceId: 'SOURCE-A',
      sourceVersionId: sharedSvid,
      bytes: sharedBytes
    }, adapter);
    const storeB = await storeCanonicalBinary({
      sourceId: 'SOURCE-B',
      sourceVersionId: sharedSvid,
      bytes: sharedBytes
    }, adapter);
    
    assert.strictEqual(storeA.sourceVersionId, sharedSvid);
    assert.strictEqual(storeB.sourceVersionId, sharedSvid);
    assert.strictEqual(storeA.storageKey, storeB.storageKey);
    assert.strictEqual(storeA.sourceId, 'SOURCE-A');
    assert.strictEqual(storeB.sourceId, 'SOURCE-B');

    const retrievedShared = await retrieveCanonicalBinary({ sourceVersionId: sharedSvid }, adapter);
    assert.ok(retrievedShared.bytes.equals(sharedBytes));
    assert.strictEqual((retrievedShared.metadata as any).sourceId, undefined);
    assert.strictEqual((retrievedShared.metadata as any).projectId, undefined);
    console.log("SUPPORTING-C1-SHARED-CONTENT PASS");

    // SUPPORTING-C1-PREFIX-CONSISTENCY
    let prefixRejected = false;
    const badKey = 'source-versions/aa/' + 'b'.repeat(64);
    const badPutRes = await adapter.putImmutable(badKey, Buffer.from('test'));
    if (badPutRes.status === 'FAILURE' && badPutRes.error && badPutRes.error.includes('prefix mismatch')) {
      prefixRejected = true;
    }
    assert.ok(prefixRejected);
    console.log("SUPPORTING-C1-PREFIX-CONSISTENCY PASS");

    // SUPPORTING-C1-INCOMPLETE-OBJECT
    const incompleteBytes = Buffer.from('incomplete object bytes');
    const incompleteSvid = deriveSourceVersionId(incompleteBytes);
    const incompleteKey = deriveStorageKey(incompleteSvid);
    // write only bytes.bin to simulate crash
    const incompleteDir = path.join(tmpDir, incompleteKey);
    await fs.promises.mkdir(incompleteDir, { recursive: true });
    await fs.promises.writeFile(path.join(incompleteDir, 'bytes.bin'), incompleteBytes);
    
    let incompleteRejected = false;
    try {
      await retrieveCanonicalBinary({ sourceVersionId: incompleteSvid }, adapter);
    } catch (e: any) {
      if (e.code === 'INCOMPLETE_STORAGE_OBJECT') incompleteRejected = true;
    }
    assert.ok(incompleteRejected);
    
    const storeIncompleteAgain = await adapter.putImmutable(incompleteKey, incompleteBytes);
    assert.strictEqual(storeIncompleteAgain.status, 'FAILURE'); // Incomplete object
    console.log("SUPPORTING-C1-INCOMPLETE-OBJECT PASS");

    // SUPPORTING-C1-SYMLINK-ESCAPE
    const outsideDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'c1-outside-'));
    let symlinkAttempted = false;
    let symlinkRejected = false;
    try {
      const symlinkDir = path.join(tmpDir, 'source-versions');
      await fs.promises.mkdir(symlinkDir, { recursive: true });
      const symlinkPrefix = path.join(symlinkDir, 'cc');
      await fs.promises.symlink(outsideDir, symlinkPrefix, 'dir');
      symlinkAttempted = true;
    } catch (e) {
      // not supported
    }
    if (symlinkAttempted) {
      try {
        const symlinkKey = 'source-versions/cc/' + 'c'.repeat(64);
        const symlinkPutRes = await adapter.putImmutable(symlinkKey, Buffer.from('symlink test'));
        if (symlinkPutRes.status === 'FAILURE' && symlinkPutRes.error && symlinkPutRes.error.includes('Symlink traversal detected')) {
          symlinkRejected = true;
        }
        const outsideFiles = await fs.promises.readdir(outsideDir);
        assert.strictEqual(outsideFiles.length, 0);
      } finally {
        await fs.promises.rm(outsideDir, { recursive: true, force: true });
      }
      assert.ok(symlinkRejected);
      console.log("SUPPORTING-C1-SYMLINK-ESCAPE PASS");
    } else {
      await fs.promises.rm(outsideDir, { recursive: true, force: true });
      console.log("SUPPORTING-C1-SYMLINK-ESCAPE NOT RUN — PLATFORM CAPABILITY");
    }

    // SUPPORTING-C1-ROOT-SYMLINK
    const rootOutsideDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'c1-root-outside-'));
    const rootSymlinkPath = path.join(tmpDir, 'symlink-root');
    let rootSymlinkAttempted = false;
    let rootSymlinkRejected = false;
    try {
      await fs.promises.symlink(rootOutsideDir, rootSymlinkPath, 'dir');
      rootSymlinkAttempted = true;
    } catch (e) {
      // not supported
    }
    if (rootSymlinkAttempted) {
      try {
        const adapterSymlinkRoot = new LocalCanonicalStorageAdapter({ storageRoot: rootSymlinkPath });
        
        const res = await adapterSymlinkRoot.putImmutable(key1, bytes1);
        if (res.status === 'FAILURE' && res.error && res.error.includes('Symlink traversal detected')) {
          rootSymlinkRejected = true;
        }
        
        const outsideFiles = await fs.promises.readdir(rootOutsideDir);
        assert.strictEqual(outsideFiles.length, 0); // O receives nothing
      } finally {
        await fs.promises.rm(rootOutsideDir, { recursive: true, force: true });
      }
      assert.ok(rootSymlinkRejected);
      console.log("SUPPORTING-C1-ROOT-SYMLINK PASS");
    } else {
      await fs.promises.rm(rootOutsideDir, { recursive: true, force: true });
      console.log("SUPPORTING-C1-ROOT-SYMLINK NOT RUN — PLATFORM CAPABILITY");
    }

    // SUPPORTING-C1-BYTES-LEAF-SYMLINK
    const leafOutsideBytes = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'c1-leaf-bytes-'));
    const leafOutsideBytesFile = path.join(leafOutsideBytes, 'outside.bin');
    await fs.promises.writeFile(leafOutsideBytesFile, 'outside content');
    let bytesLeafSymlinkAttempted = false;
    let bytesLeafSymlinkRejected = false;
    try {
      const bSvid = deriveSourceVersionId(Buffer.from('bytes leaf symlink'));
      const bKey = deriveStorageKey(bSvid);
      const bDir = path.join(tmpDir, bKey);
      await fs.promises.mkdir(bDir, { recursive: true });
      await fs.promises.symlink(leafOutsideBytesFile, path.join(bDir, 'bytes.bin'));
      await fs.promises.writeFile(path.join(bDir, 'metadata.json'), JSON.stringify({}));
      bytesLeafSymlinkAttempted = true;

      try {
        await retrieveCanonicalBinary({ sourceVersionId: bSvid }, adapter);
      } catch (e: any) {
        if (e.message.includes('Symlink traversal detected')) {
          bytesLeafSymlinkRejected = true;
        }
      }
    } finally {
      await fs.promises.rm(leafOutsideBytes, { recursive: true, force: true });
    }
    if (bytesLeafSymlinkAttempted) {
      assert.ok(bytesLeafSymlinkRejected);
      console.log("SUPPORTING-C1-BYTES-LEAF-SYMLINK PASS");
    } else {
      console.log("SUPPORTING-C1-BYTES-LEAF-SYMLINK NOT RUN — PLATFORM CAPABILITY");
    }

    // SUPPORTING-C1-METADATA-LEAF-SYMLINK
    const leafOutsideMeta = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'c1-leaf-meta-'));
    const leafOutsideMetaFile = path.join(leafOutsideMeta, 'outside.json');
    await fs.promises.writeFile(leafOutsideMetaFile, JSON.stringify({ injected: true }));
    let metaLeafSymlinkAttempted = false;
    let metaLeafSymlinkRejected = false;
    try {
      const mSvid = deriveSourceVersionId(Buffer.from('meta leaf symlink'));
      const mKey = deriveStorageKey(mSvid);
      const mDir = path.join(tmpDir, mKey);
      await fs.promises.mkdir(mDir, { recursive: true });
      await fs.promises.writeFile(path.join(mDir, 'bytes.bin'), 'normal bytes');
      await fs.promises.symlink(leafOutsideMetaFile, path.join(mDir, 'metadata.json'));
      metaLeafSymlinkAttempted = true;

      try {
        await retrieveCanonicalBinary({ sourceVersionId: mSvid }, adapter);
      } catch (e: any) {
        if (e.message.includes('Symlink traversal detected')) {
          metaLeafSymlinkRejected = true;
        }
      }
    } finally {
      await fs.promises.rm(leafOutsideMeta, { recursive: true, force: true });
    }
    if (metaLeafSymlinkAttempted) {
      assert.ok(metaLeafSymlinkRejected);
      console.log("SUPPORTING-C1-METADATA-LEAF-SYMLINK PASS");
    } else {
      console.log("SUPPORTING-C1-METADATA-LEAF-SYMLINK NOT RUN — PLATFORM CAPABILITY");
    }

    // SUPPORTING-C1-ENOENT-NO-PATH-LEAK
    let enoentLeakSafe = false;
    const originalMkdir = fs.promises.mkdir;
    try {
      fs.promises.mkdir = async function(...args: any[]) {
        const err: any = new Error("ENOENT: synthetic failure at /secret/c1-test-path");
        err.code = 'ENOENT';
        throw err;
      } as any;
      const leakAdapter = new LocalCanonicalStorageAdapter({ storageRoot: tmpDir });
      const leakSvid = deriveSourceVersionId(Buffer.from('enoent leak'));
      const leakRes = await leakAdapter.putImmutable(deriveStorageKey(leakSvid), Buffer.from('enoent leak'));
      if (leakRes.status === 'FAILURE' && !leakRes.error?.includes('/secret/c1-test-path') && !leakRes.error?.includes('ENOENT')) {
        enoentLeakSafe = true;
      }
    } finally {
      fs.promises.mkdir = originalMkdir;
    }
    assert.ok(enoentLeakSafe);
    console.log("SUPPORTING-C1-ENOENT-NO-PATH-LEAK PASS");

    // SUPPORTING-C1-ERROR-NO-PATH-LEAK
    let errorLeakSafe = false;
    try {
      // Cause an intentional IO error by making root a file
      const notDirFile = path.join(tmpDir, 'notadir-leak.txt');
      await fs.promises.writeFile(notDirFile, 'leak test');
      const adapterLeak = new LocalCanonicalStorageAdapter({ storageRoot: notDirFile });
      
      const leakSvid = deriveSourceVersionId(Buffer.from('leak'));
      await storeCanonicalBinary({ sourceVersionId: leakSvid, bytes: Buffer.from('leak') }, adapterLeak);
    } catch (e: any) {
      if (e.code === 'STORAGE_IO_ERROR' && !e.message.includes(tmpDir) && !e.message.includes('notadir-leak.txt')) {
        errorLeakSafe = true;
      }
    }
    assert.ok(errorLeakSafe);
    console.log("SUPPORTING-C1-ERROR-NO-PATH-LEAK PASS");

    // C1-EVAL-009: Storage failure produces a controlled failure.
    // Configure adapter with a root that is a regular file
    const fileRoot = path.join(tmpDir, 'notadir.txt');
    await fs.promises.writeFile(fileRoot, 'file content');
    const adapterFail = new LocalCanonicalStorageAdapter({ storageRoot: fileRoot });
    let ioFailure = false;
    try {
      await storeCanonicalBinary({ sourceVersionId: deriveSourceVersionId(Buffer.from('fail')), bytes: Buffer.from('fail') }, adapterFail);
    } catch (e: any) {
      if (e.code === 'STORAGE_IO_ERROR') ioFailure = true;
    }
    assert.ok(ioFailure);
    console.log("C1-EVAL-009 PASS");

    // PATCH A/B REGRESSION
    assert.strictEqual(computeServerByteSha256(Buffer.from('abc', 'utf8')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const b1 = Buffer.from('a');
    const b2 = Buffer.from('a');
    const b3 = Buffer.from('b');
    assert.strictEqual(deriveSourceVersionId(b1), deriveSourceVersionId(b2));
    assert.notStrictEqual(deriveSourceVersionId(b1), deriveSourceVersionId(b3));
    assert.strictEqual(deriveExtractorKey('a','b','c','d'), deriveExtractorKey('a','b','c','d'));
    assert.strictEqual(deriveBlockId('a','b',1,0,'t'), deriveBlockId('a','b',1,0,'t'));
    assert.strictEqual(computeEvidenceHash('test'), computeEvidenceHash('test'));
    assert.strictEqual(MAX_CANONICAL_RAW_BYTES, 26214400);
    assert.strictEqual(getSafeDisplayFilename('../../secret/manual.pdf'), 'manual.pdf');
    const pdfSigTest = validateCanonicalPdfInput({bytes: Buffer.from('just text'), declaredMimeType: 'application/pdf', originalFilename: 'x.pdf'});
    assert.ok(!pdfSigTest.valid);
    console.log("PATCH A/B REGRESSION PASS");

  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

runTests().catch(e => {
  console.error("Test failed", e);
  process.exit(1);
});
