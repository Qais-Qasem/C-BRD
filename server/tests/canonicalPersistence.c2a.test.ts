import * as assert from 'assert';
import { InMemoryCanonicalPersistenceAdapter } from '../persistence/inMemoryCanonicalPersistenceAdapter';
import { CanonicalPersistenceError, PersistedSourceVersion } from '../canonicalPersistence';

async function runTests() {
  const adapter = new InMemoryCanonicalPersistenceAdapter();

  // C2A-EVAL-001
  const ls1 = {
    sourceId: 'src-1',
    sourceType: 'TEST',
    displayName: 'Test Source',
    createdAt: '2026-09-04T12:00:00Z',
    updatedAt: '2026-09-04T12:00:00Z'
  };
  const createdLs1 = await adapter.createLogicalSource(ls1);
  const fetchedLs1 = await adapter.getLogicalSource('src-1');
  assert.deepStrictEqual(createdLs1, ls1);
  assert.deepStrictEqual(fetchedLs1, ls1);
  console.log("C2A-EVAL-001 PASS");

  // C2A-EVAL-002
  const sv1: PersistedSourceVersion = {
    sourceVersionId: 'a'.repeat(64),
    serverByteSha256: 'a'.repeat(64),
    fileSizeBytes: 100,
    mimeType: 'application/pdf',
    storageProvider: 'LOCAL',
    storageRef: 'source-versions/aa/' + 'a'.repeat(64),
    status: 'RECEIVED',
    createdAt: '2026-09-04T12:01:00Z'
  };;
  const createdSv1 = await adapter.createSourceVersion(sv1);
  const fetchedSv1 = await adapter.getSourceVersion(sv1.sourceVersionId);
  assert.deepStrictEqual(createdSv1, sv1);
  assert.deepStrictEqual(fetchedSv1, sv1);
  console.log("C2A-EVAL-002 PASS");

  // C2A-EVAL-003
  const dupSv1 = await adapter.createSourceVersion(sv1);
  assert.deepStrictEqual(dupSv1, sv1);
  console.log("C2A-EVAL-003 PASS");

  // C2A-EVAL-004
  const conflictSv1 = { ...sv1, fileSizeBytes: 999 };
  let conflictRejected = false;
  try {
    await adapter.createSourceVersion(conflictSv1);
  } catch (e: any) {
    if (e.code === 'CONFLICT') conflictRejected = true;
  }
  assert.ok(conflictRejected);
  const stillSv1 = await adapter.getSourceVersion(sv1.sourceVersionId);
  assert.strictEqual(stillSv1?.fileSizeBytes, 100);
  console.log("C2A-EVAL-004 PASS");

  // C2A-EVAL-005
  const sv2: PersistedSourceVersion = {
    sourceVersionId: 'b'.repeat(64),
    serverByteSha256: 'b'.repeat(64),
    fileSizeBytes: 200,
    mimeType: 'application/pdf',
    storageProvider: 'LOCAL',
    storageRef: 'source-versions/bb/' + 'b'.repeat(64),
    status: 'VALIDATED',
    createdAt: '2026-09-04T12:02:00Z'
  };
  await adapter.createSourceVersion(sv2);

  await adapter.associateSourceVersion({
    sourceId: 'src-1',
    sourceVersionId: sv1.sourceVersionId,
    projectId: 'proj-1',
    associatedAt: '2026-09-04T12:01:30Z',
    isCurrentAcceptedVersion: false
  });
  await adapter.associateSourceVersion({
    sourceId: 'src-1',
    sourceVersionId: sv2.sourceVersionId,
    projectId: 'proj-1',
    associatedAt: '2026-09-04T12:02:30Z',
    isCurrentAcceptedVersion: true
  });

  const svsForSrc1 = await adapter.listSourceVersionsForLogicalSource('src-1');
  assert.strictEqual(svsForSrc1.length, 2);
  assert.strictEqual(svsForSrc1[0].sourceVersionId, sv1.sourceVersionId);
  assert.strictEqual(svsForSrc1[1].sourceVersionId, sv2.sourceVersionId);
  
  const checkSv1 = await adapter.getSourceVersion(sv1.sourceVersionId);
  assert.deepStrictEqual(checkSv1, sv1);
  console.log("C2A-EVAL-005 PASS");

  // C2A-EVAL-006
  const updatedSv2 = await adapter.updateSourceVersionStatus({
    sourceVersionId: sv2.sourceVersionId,
    nextStatus: 'STORED'
  });
  assert.strictEqual(updatedSv2.status, 'STORED');
  assert.strictEqual(updatedSv2.serverByteSha256, sv2.serverByteSha256);
  assert.strictEqual(updatedSv2.fileSizeBytes, sv2.fileSizeBytes);
  assert.strictEqual(updatedSv2.storageRef, sv2.storageRef);
  console.log("C2A-EVAL-006 PASS");

  // C2A-EVAL-007
  await adapter.updateSourceVersionStatus({
    sourceVersionId: sv2.sourceVersionId,
    nextStatus: 'READY'
  });
  let readyTerminalRejected = false;
  try {
    await adapter.updateSourceVersionStatus({
      sourceVersionId: sv2.sourceVersionId,
      nextStatus: 'RECEIVED'
    });
  } catch (e: any) {
    if (e.code === 'INVALID_STATE') readyTerminalRejected = true;
  }
  assert.ok(readyTerminalRejected);
  console.log("C2A-EVAL-007 PASS");

  // C2A-EVAL-008
  const assoc1 = {
    sourceId: 'src-1',
    sourceVersionId: sv2.sourceVersionId,
    projectId: 'proj-1',
    associatedAt: '2026-09-04T12:02:30Z', // exact same time
    isCurrentAcceptedVersion: true
  };
  const dupAssoc = await adapter.associateSourceVersion(assoc1);
  assert.deepStrictEqual(dupAssoc, assoc1);
  
  const assocsForSv2 = await adapter.listSourceVersionAssociations(sv2.sourceVersionId);
  assert.strictEqual(assocsForSv2.length, 1);
  console.log("C2A-EVAL-008 PASS");

  // C2A-EVAL-009
  const assocWithExtra = { ...assoc1, requirementId: 'req-1', coverage: 100 };
  const assocClean = await adapter.associateSourceVersion(assocWithExtra as any);
  assert.strictEqual((assocClean as any).requirementId, undefined);
  assert.strictEqual((assocClean as any).coverage, undefined);
  console.log("C2A-EVAL-009 PASS");

  // C2A-EVAL-010
  let getMissingSourceRejected = false;
  try {
    await adapter.getLogicalSource('missing');
  } catch (e: any) {
    if (e.code === 'NOT_FOUND') getMissingSourceRejected = true;
  }
  assert.ok(getMissingSourceRejected);

  let getMissingVersionRejected = false;
  try {
    await adapter.getSourceVersion('missing');
  } catch (e: any) {
    if (e.code === 'NOT_FOUND') getMissingVersionRejected = true;
  }
  assert.ok(getMissingVersionRejected);
  
  let persistenceFailureRejected = false;
  try {
    const failAdapter = new InMemoryCanonicalPersistenceAdapter({ simulateInternalError: new Error("synthetic internal details /secret/path") });
    await failAdapter.getSourceVersion(sv1.sourceVersionId);
  } catch (e: any) {
    if (e.code === 'PERSISTENCE_FAILURE') persistenceFailureRejected = true;
  }
  assert.ok(persistenceFailureRejected);
  console.log("C2A-EVAL-010 PASS");

  // C2A-EVAL-011
  let noLeakSafe = false;
  try {
    const failAdapter2 = new InMemoryCanonicalPersistenceAdapter({ simulateInternalError: new Error("synthetic internal details /secret/path") });
    await failAdapter2.getSourceVersion(sv1.sourceVersionId);
  } catch (e: any) {
    if (!e.message.includes('/secret/path') && !e.message.includes('synthetic')) {
      noLeakSafe = true;
    }
  }
  assert.ok(noLeakSafe);
  console.log("C2A-EVAL-011 PASS");

  // C2A-EVAL-012
  const badStorageRefs = [
    '/absolute/path',
    'C:\\private\\source.pdf',
    '../source-version',
    'source-versions/bb/' + 'c'.repeat(64), // mismatched prefix for c
    'source-versions/cc/' + 'a'.repeat(64), // wrong sourceVersionId
    'source-versions/cc/' + 'c'.repeat(63), // short length
    'source-versions/cc/' + 'c'.repeat(65), // long length
    'file:///secret/file.pdf',
    'gs://bucket/object.pdf',
    'https://signed-url.com/obj'
  ];

  for (const badRef of badStorageRefs) {
    const badRefSv: PersistedSourceVersion = {
      sourceVersionId: 'c'.repeat(64),
      serverByteSha256: 'c'.repeat(64),
      fileSizeBytes: 100,
      mimeType: 'application/pdf',
      storageProvider: 'LOCAL',
      storageRef: badRef,
      status: 'RECEIVED',
      createdAt: '2026-09-04T12:01:00Z'
    };
    let absoluteRejected = false;
    try {
      await adapter.createSourceVersion(badRefSv);
    } catch (e: any) {
      if (e.code === 'INVALID_RECORD') absoluteRejected = true;
    }
    assert.ok(absoluteRejected, `Failed to reject bad storageRef: ${badRef}`);
  }
  console.log("C2A-EVAL-012 PASS");

  // C2A-EVAL-013
  await adapter.createLogicalSource({ ...ls1, sourceId: 'src-A', displayName: 'Display A' });
  await adapter.createLogicalSource({ ...ls1, sourceId: 'src-B', displayName: 'Display B' });
  const sharedSv: PersistedSourceVersion = {
    sourceVersionId: 'd'.repeat(64),
    serverByteSha256: 'd'.repeat(64),
    fileSizeBytes: 100,
    mimeType: 'application/pdf',
    storageProvider: 'LOCAL',
    storageRef: 'source-versions/dd/' + 'd'.repeat(64),
    status: 'RECEIVED',
    createdAt: '2026-09-04T12:01:00Z'
  };;
  await adapter.createSourceVersion(sharedSv);
  await adapter.associateSourceVersion({
    sourceId: 'src-A',
    sourceVersionId: sharedSv.sourceVersionId,
    projectId: 'proj-A',
    associatedAt: '2026-09-04T12:00:00Z',
    isCurrentAcceptedVersion: true
  });
  await adapter.associateSourceVersion({
    sourceId: 'src-B',
    sourceVersionId: sharedSv.sourceVersionId,
    projectId: 'proj-B',
    associatedAt: '2026-09-04T12:00:00Z',
    isCurrentAcceptedVersion: true
  });
  const fetchShared = await adapter.getSourceVersion(sharedSv.sourceVersionId);
  assert.strictEqual((fetchShared as any).sourceId, undefined);
  assert.strictEqual((fetchShared as any).projectId, undefined);
  
  const assocA = await adapter.listSourceVersionsForLogicalSource('src-A');
  const assocB = await adapter.listSourceVersionsForLogicalSource('src-B');
  assert.strictEqual(assocA.length, 1);
  assert.strictEqual(assocB.length, 1);

  const assocListA = await adapter.listSourceVersionAssociations(sharedSv.sourceVersionId);
  assert.strictEqual(assocListA.length, 2);
  const foundA = assocListA.find(a => a.sourceId === 'src-A');
  const foundB = assocListA.find(a => a.sourceId === 'src-B');
  assert.strictEqual(foundA?.projectId, 'proj-A');
  assert.strictEqual(foundB?.projectId, 'proj-B');
  assert.strictEqual((foundA as any).evidence, undefined);
  
  const fetchLsA = await adapter.getLogicalSource('src-A');
  const fetchLsB = await adapter.getLogicalSource('src-B');
  assert.strictEqual(fetchLsA.displayName, 'Display A');
  assert.strictEqual(fetchLsB.displayName, 'Display B');
  assert.strictEqual((fetchShared as any).displayName, undefined);
  assert.strictEqual((fetchShared as any).sourceId, undefined);
  assert.strictEqual((fetchShared as any).projectId, undefined);
  
  console.log("C2A-EVAL-013 PASS");

  // C2A-EVAL-014
  // We already tested that version 1 is retrievable after version 2 was added in 005
  const history1 = await adapter.getSourceVersion(sv1.sourceVersionId);
  assert.ok(history1 !== null);
  console.log("C2A-EVAL-014 PASS");

  // C2A-EVAL-015
  assert.strictEqual(adapter.classification, 'IN_MEMORY_TEST');
  console.log("C2A-EVAL-015 PASS");

  // C2A-EVAL-016
  const svWithBytes = { ...sharedSv, sourceVersionId: 'e'.repeat(64), serverByteSha256: 'e'.repeat(64), storageRef: 'source-versions/ee/' + 'e'.repeat(64), bytes: Buffer.from('test bytes') };
  const svCleanBytes = await adapter.createSourceVersion(svWithBytes as any);
  assert.strictEqual((svCleanBytes as any).bytes, undefined);
  const fetchCleanBytes = await adapter.getSourceVersion('e'.repeat(64));
  assert.strictEqual((fetchCleanBytes as any).bytes, undefined);
  console.log("C2A-EVAL-016 PASS");

  // SUPPORTING-C2A-SNAPSHOT-ISOLATION
  const snapObj = { ...ls1, sourceId: 'src-snap' };
  const createdSnap = await adapter.createLogicalSource(snapObj);
  snapObj.displayName = 'mutated';
  createdSnap.displayName = 'mutated2';
  const fetchSnap = await adapter.getLogicalSource('src-snap');
  assert.strictEqual(fetchSnap?.displayName, 'Test Source');
  console.log("SUPPORTING-C2A-SNAPSHOT-ISOLATION PASS");

  // SUPPORTING-C2A-UNKNOWN-FIELD-ISOLATION
  const unknownObj = { ...ls1, sourceId: 'src-unk', someExtraField: 'hi' };
  const createdUnk = await adapter.createLogicalSource(unknownObj as any);
  assert.strictEqual((createdUnk as any).someExtraField, undefined);
  const fetchUnk = await adapter.getLogicalSource('src-unk');
  assert.strictEqual((fetchUnk as any).someExtraField, undefined);
  console.log("SUPPORTING-C2A-UNKNOWN-FIELD-ISOLATION PASS");

  // SUPPORTING-C2A-STATUS-CREATE-NO-MUTATION
  const statusTestSv: PersistedSourceVersion = {
    sourceVersionId: 'f'.repeat(64),
    serverByteSha256: 'f'.repeat(64),
    fileSizeBytes: 100,
    mimeType: 'application/pdf',
    storageProvider: 'LOCAL',
    storageRef: 'source-versions/ff/' + 'f'.repeat(64),
    status: 'RECEIVED',
    createdAt: '2026-09-04T12:01:00Z'
  };;
  await adapter.createSourceVersion(statusTestSv);
  const mutatedStatusSv = { ...statusTestSv, status: 'VALIDATED' as any };
  await adapter.createSourceVersion(mutatedStatusSv);
  const fetchStatusTest = await adapter.getSourceVersion(statusTestSv.sourceVersionId);
  assert.strictEqual(fetchStatusTest?.status, 'RECEIVED');
  console.log("SUPPORTING-C2A-STATUS-CREATE-NO-MUTATION PASS");
  // SUPPORTING-C2A-STATUS-UPDATE-ATOMICITY
  const atomicityTestSv: PersistedSourceVersion = {
    sourceVersionId: '0'.repeat(64),
    serverByteSha256: '0'.repeat(64),
    fileSizeBytes: 100,
    mimeType: 'application/pdf',
    storageProvider: 'LOCAL',
    storageRef: 'source-versions/00/' + '0'.repeat(64),
    status: 'VALIDATION_FAILED',
    createdAt: '2026-09-04T12:01:00Z',
    failureDiagnostic: { failureCode: 'SAFE_ERROR', failureDiagnostic: 'Safe message' }
  };
  await adapter.createSourceVersion(atomicityTestSv);
  
  let atomicityRejected = false;
  try {
    await adapter.updateSourceVersionStatus({
      sourceVersionId: atomicityTestSv.sourceVersionId,
      nextStatus: 'STORAGE_FAILED',
      failureDiagnostic: { failureCode: 'BAD_ERROR', failureDiagnostic: '/secret/provider/path' } as any
    });
  } catch(e: any) {
    if (e.code === 'INVALID_RECORD') atomicityRejected = true;
  }
  assert.ok(atomicityRejected);
  
  const atomicityFetch = await adapter.getSourceVersion(atomicityTestSv.sourceVersionId);
  assert.strictEqual(atomicityFetch.status, 'VALIDATION_FAILED');
  assert.deepStrictEqual(atomicityFetch.failureDiagnostic, { failureCode: 'SAFE_ERROR', failureDiagnostic: 'Safe message' });
  console.log("SUPPORTING-C2A-STATUS-UPDATE-ATOMICITY PASS");
  
  // SUPPORTING-C2A-SAME-STATUS-IDEMPOTENCY
  await adapter.updateSourceVersionStatus({
    sourceVersionId: atomicityTestSv.sourceVersionId,
    nextStatus: 'VALIDATION_FAILED'
  });
  
  await adapter.updateSourceVersionStatus({
    sourceVersionId: atomicityTestSv.sourceVersionId,
    nextStatus: 'VALIDATION_FAILED',
    failureDiagnostic: { failureCode: 'SAFE_ERROR', failureDiagnostic: 'Safe message' }
  });
  
  let sameStatusMutationRejected = false;
  try {
    await adapter.updateSourceVersionStatus({
      sourceVersionId: atomicityTestSv.sourceVersionId,
      nextStatus: 'VALIDATION_FAILED',
      failureDiagnostic: { failureCode: 'SAFE_ERROR_B', failureDiagnostic: 'New safe message' }
    });
  } catch (e: any) {
    if (e.code === 'INVALID_STATE') sameStatusMutationRejected = true;
  }
  assert.ok(sameStatusMutationRejected);
  const idempotencyFetch = await adapter.getSourceVersion(atomicityTestSv.sourceVersionId);
  assert.deepStrictEqual(idempotencyFetch.failureDiagnostic, { failureCode: 'SAFE_ERROR', failureDiagnostic: 'Safe message' });
  console.log("SUPPORTING-C2A-SAME-STATUS-IDEMPOTENCY PASS");


  // SUPPORTING-C2A-DIAGNOSTIC-SAFETY
  const diagTestSv: PersistedSourceVersion = {
    sourceVersionId: '1'.repeat(64),
    serverByteSha256: '1'.repeat(64),
    fileSizeBytes: 100,
    mimeType: 'application/pdf',
    storageProvider: 'LOCAL',
    storageRef: 'source-versions/11/' + '1'.repeat(64),
    status: 'VALIDATION_FAILED',
    createdAt: '2026-09-04T12:01:00Z',
    failureDiagnostic: { failureCode: 'SAFE_ERROR_01', failureDiagnostic: 'Validation failed cleanly' }
  };
  const createdDiag = await adapter.createSourceVersion(diagTestSv);
  assert.deepStrictEqual(createdDiag.failureDiagnostic, { failureCode: 'SAFE_ERROR_01', failureDiagnostic: 'Validation failed cleanly' });

  const badDiags = [
    { failureCode: 'SAFE_ERROR_01', failureDiagnostic: '/secret/provider/path' },
    { failureCode: 'STORAGE_FAILED', failureDiagnostic: 'C:\\Windows\\System32\\secrets.txt' },
    { failureCode: 'ERROR', failureDiagnostic: 'Error\n  at SomeModule (test.js:1:1)' },
    { failureCode: 'lower_case', failureDiagnostic: 'bad code' },
    { failureCode: '1BADCODE', failureDiagnostic: 'bad code' },
    { failureCode: 'SAFE_ERROR_01', failureDiagnostic: 'http://internal-provider.com/logs' },
    new Error('raw error'),
    { failureCode: 'SAFE_ERROR_01', failureDiagnostic: 'bad\rdiagnostic' },
    { failureCode: 'SAFE_ERROR_01', failureDiagnostic: 'bad\tdiagnostic' },
    { failureCode: 'SAFE_ERROR_01', failureDiagnostic: 'bad\u0000diagnostic' },
    { failureCode: 'SAFE_ERROR_01', failureDiagnostic: 'bad\u007Fdiagnostic' }
  ];

  for (const bd of badDiags) {
    let diagRejected = false;
    try {
      await adapter.updateSourceVersionStatus({
        sourceVersionId: diagTestSv.sourceVersionId,
        nextStatus: 'STORAGE_FAILED',
        failureDiagnostic: bd as any
      });
    } catch (e: any) {
      if (e.code === 'INVALID_RECORD') diagRejected = true;
    }
    assert.ok(diagRejected, `Failed to reject bad diagnostic: ${JSON.stringify(bd)}`);
  }
  console.log("SUPPORTING-C2A-DIAGNOSTIC-SAFETY PASS");
  // SUPPORTING-C2A-ASSOCIATION-KEY-ISOLATION
  const assocIsolSv: PersistedSourceVersion = {
    sourceVersionId: '0'.repeat(63) + '1',
    serverByteSha256: '0'.repeat(63) + '1',
    fileSizeBytes: 100,
    mimeType: 'application/pdf',
    storageProvider: 'LOCAL',
    storageRef: 'source-versions/00/' + '0'.repeat(63) + '1',
    status: 'RECEIVED',
    createdAt: '2026-09-04T12:01:00Z'
  };;
  await adapter.createSourceVersion(assocIsolSv);
  
  const commonAssoc = {
    sourceId: 'src-1',
    sourceVersionId: assocIsolSv.sourceVersionId,
    projectId: 'proj-1',
    associatedAt: '2026-09-04T12:01:30Z',
    isCurrentAcceptedVersion: true
  };
  
  await adapter.associateSourceVersion({ ...commonAssoc, moduleId: undefined });
  await adapter.associateSourceVersion({ ...commonAssoc, moduleId: "" });
  await adapter.associateSourceVersion({ ...commonAssoc, moduleId: 'none' });
  await adapter.associateSourceVersion({ ...commonAssoc, moduleId: 'proj::1' });
  await adapter.associateSourceVersion({ ...commonAssoc, projectId: 'proj::1', moduleId: 'mod::1' });
  
  const isolAssocs = await adapter.listSourceVersionAssociations(assocIsolSv.sourceVersionId);
  assert.strictEqual(isolAssocs.length, 5);
  assert.strictEqual(new Set(isolAssocs.map(a => a.moduleId)).size, 5);
  console.log("SUPPORTING-C2A-ASSOCIATION-KEY-ISOLATION PASS");


}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
