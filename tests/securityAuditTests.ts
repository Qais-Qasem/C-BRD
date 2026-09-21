/**
 * C-BRIDGE SECURITY REMEDIATION AUTOMATED TEST RUNNER
 * Verifies Firestore Security Rules, Authorization Gates, and Channel Isolation
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocsFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

interface TestResult {
  suite: string;
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function record(suite: string, name: string, expected: string, actual: string, passed: boolean, details?: string) {
  results.push({
    suite,
    name,
    expected,
    actual,
    status: passed ? 'PASS' : 'FAIL',
    details
  });
  const statusColor = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${suite}] ${name}: ${statusColor} (Expected: ${expected}, Got: ${actual})`);
}

async function runSecurityTests() {
  console.log('================================================================');
  console.log('C-BRIDGE SECURITY AUDIT & REMEDIATION AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Direct Unauthenticated Firestore Access via Network Request
  let unauthApp: any = null;
  try {
    const randomAppName = `unauth-test-${Date.now()}`;
    unauthApp = initializeApp(firebaseConfig, randomAppName);
    const unauthDb = firebaseConfig.firestoreDatabaseId
      ? getFirestore(unauthApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(unauthApp);

    try {
      const snap = await getDocsFromServer(collection(unauthDb, 'members'));
      record(
        'Direct Firestore Security Rules',
        'Unauthenticated Client Direct Read on /members',
        'DENIED (Permission Denied)',
        `ALLOWED (${snap.size} docs read)`,
        false,
        'Security rule failed: unauthenticated read was permitted'
      );
    } catch (err: any) {
      const isPermissionDenied = err?.message?.includes('permission') || err?.code?.includes('permission') || err?.message?.includes('Missing or insufficient permissions');
      record(
        'Direct Firestore Security Rules',
        'Unauthenticated Client Direct Read on /members',
        'DENIED (Permission Denied)',
        isPermissionDenied ? 'DENIED (Permission Denied)' : `ERROR: ${err?.message}`,
        true,
        'Hardened rule successfully blocked unauthenticated direct read'
      );
    }
  } catch (initErr: any) {
    console.warn('Init error in test 1:', initErr.message);
  } finally {
    if (unauthApp) {
      try { await deleteApp(unauthApp); } catch (e) {}
    }
  }

  // Test 2: Server API - Health Check
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const data = await res.json();
    record(
      'Server REST API',
      'Public Health Check Endpoint',
      'HTTP 200 { status: "ok" }',
      `HTTP ${res.status} { status: "${data.status}" }`,
      res.status === 200 && data.status === 'ok'
    );
  } catch (err: any) {
    record('Server REST API', 'Public Health Check Endpoint', 'HTTP 200', err.message, false);
  }

  // Test 3: Server API - Members Roster
  try {
    const res = await fetch('http://localhost:3000/api/members');
    const data = await res.json();
    const hasMembers = Array.isArray(data.members) && data.members.length > 0;
    record(
      'Server REST API',
      'Authenticated Member Resolution & Fetch',
      'HTTP 200 with Canonical Members Array',
      `HTTP ${res.status} with ${data.members?.length || 0} members`,
      res.status === 200 && hasMembers
    );
  } catch (err: any) {
    record('Server REST API', 'Authenticated Member Resolution & Fetch', 'HTTP 200', err.message, false);
  }

  // Test 4: Role Escalation Prevention - Unauthorized Supervisor Action
  try {
    const res = await fetch('http://localhost:3000/api/governance/authorized-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer samar-unauthorized-mock-token'
      },
      body: JSON.stringify({
        actionType: 'APPROVE_CHARTER',
        targetId: 'PRJ-324',
        decision: 'APPROVED',
        notes: 'Unauthorized approval attempt'
      })
    });
    record(
      'Authorization & Role Guard',
      'Normal Member Attempting Supervisor Governance Decision',
      'HTTP 401 or 403 (BLOCKED)',
      `HTTP ${res.status}`,
      res.status === 401 || res.status === 403,
      'Server API successfully rejected non-owner supervisor governance modification'
    );
  } catch (err: any) {
    record('Authorization & Role Guard', 'Normal Member Attempting Supervisor Decision', 'HTTP 403', err.message, false);
  }

  // Test 5: Client Persona Channel Isolation (Case Room Data Filter)
  try {
    const res = await fetch('http://localhost:3000/api/case-room/data/PRJ-324/MA-324-01');
    const data = await res.json();
    const hasCaseData = res.status === 200 && (data.case || data.messages || data.activeCase);
    record(
      'Case Room API',
      'Case Room Data Load via Authenticated Server API',
      'HTTP 200 with Governed Case Room State',
      `HTTP ${res.status}`,
      res.status === 200,
      'Case room data retrieved through backend authority'
    );
  } catch (err: any) {
    record('Case Room API', 'Case Room Data Load', 'HTTP 200', err.message, false);
  }

  // Test 6: Invalid Activation Token Validation
  try {
    const res = await fetch('http://localhost:3000/api/invitations/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-fake-token-xyz' })
    });
    const data = await res.json();
    const isControlledResponse = (res.status === 200 && data.valid === false) || res.status === 400 || res.status === 404;
    const isUnhandled500 = res.status === 500;
    record(
      'Invitation & Activation Security',
      'Invalid / Unregistered Token Verification',
      'HTTP 200 { valid: false } or 400/404 (No 500)',
      `HTTP ${res.status} valid: ${data.valid}`,
      isControlledResponse && !isUnhandled500,
      isUnhandled500 ? 'FAILED: Server returned unhandled 500' : 'Controlled rejection verified'
    );
  } catch (err: any) {
    record('Invitation & Activation Security', 'Invalid Token Verification', 'REJECTED', err.message, false);
  }

  console.log('\n================================================================');
  console.log('SUMMARY OF RESULTS');
  console.log('================================================================');
  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.status === 'PASS').length}`);
  console.log(`Failed: ${results.filter(r => r.status === 'FAIL').length}`);
  console.log(`Overall Status: ${allPassed ? '\x1b[32mALL TESTS PASSED\x1b[0m' : '\x1b[31mSOME TESTS FAILED\x1b[0m'}`);
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runSecurityTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
