/**
 * C-BRIDGE REGRESSION TEST SUITE:
 * GLOBAL PUBLIC KNOWLEDGE VS CASE-SPECIFIC EVIDENCE POLICY
 *
 * Verifies 5-Tier Knowledge Distinction:
 * A. Public Form (PUBLIC_AUTHORITATIVE)
 * B. Client Completed Form (UNDISCLOSED_CASE_EVIDENCE)
 * C. Private Contract (UNDISCLOSED_CASE_EVIDENCE)
 * D. Client Knowledge Gap (SOCRATIC CONSULTING & REALISTIC CLIENT)
 * E. Disclosed Document (DISCLOSED_CASE_EVIDENCE)
 */

import {
  resolveContextAndRetrieveEvidence,
  generateGroundedCoachResponse,
  classifyKnowledgeItem
} from '../server/groundingEngine.ts';
import {
  validateClaimsAndApplyGate,
  inspectEvidenceInventory
} from '../server/claimValidationEngine.ts';

interface TestResult {
  scenario: string;
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function record(scenario: string, name: string, expected: string, actual: string, passed: boolean, details?: string) {
  results.push({
    scenario,
    name,
    expected,
    actual,
    status: passed ? 'PASS' : 'FAIL',
    details
  });
  const statusColor = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${scenario}] ${name}: ${statusColor}\n  Expected: ${expected}\n  Actual:   ${actual}\n`);
}

export async function runKnowledgePolicyRegressionTests() {
  console.log('================================================================');
  console.log('C-BRIDGE 5-TIER KNOWLEDGE DISTINCTION REGRESSION TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Classification Engine Invariant
  // --------------------------------------------------------------------------
  const classA = classifyKnowledgeItem({ sourceType: 'REGULATION', authorityLevel: 'LEVEL_1_PRIMARY_AUTHORITATIVE' });
  const classB = classifyKnowledgeItem({ sourceType: 'INTERNAL_SOP', authorityLevel: 'LEVEL_4_APPROVED_INTERNAL_KNOWLEDGE' });
  const classC = classifyKnowledgeItem({ isLearnerVisibleCaseFact: true });
  const classD = classifyKnowledgeItem({ disclosureStatus: 'DISCLOSED', isAttachedOrDisclosed: true });
  const classE = classifyKnowledgeItem({ sourceType: 'CASE_DOCUMENT', disclosureStatus: 'UNDISCLOSED', isAttachedOrDisclosed: false });

  record(
    'Classification Engine',
    'Classify 5 Distinct Tiers Correctly',
    'A=PUBLIC_AUTHORITATIVE, B=GENERAL_METHOD, C=LEARNER_VISIBLE_CASE_FACT, D=DISCLOSED_CASE_EVIDENCE, E=UNDISCLOSED_CASE_EVIDENCE',
    `A=${classA}, B=${classB}, C=${classC}, D=${classD}, E=${classE}`,
    classA === 'PUBLIC_AUTHORITATIVE' &&
    classB === 'GENERAL_METHOD' &&
    classC === 'LEARNER_VISIBLE_CASE_FACT' &&
    classD === 'DISCLOSED_CASE_EVIDENCE' &&
    classE === 'UNDISCLOSED_CASE_EVIDENCE'
  );

  // --------------------------------------------------------------------------
  // SCENARIO A: Public Form (PUBLIC_AUTHORITATIVE)
  // Explaining public form layout / instructions does NOT require or cite undisclosed case files.
  // --------------------------------------------------------------------------
  const bundleA = await resolveContextAndRetrieveEvidence({
    projectId: 'PRJ-324',
    moduleId: 'MA-324-01',
    channel: 'INTERNAL_CBRIDGE',
    actingRole: 'SAMAR_CONSULTANT',
    queryOrMessage: 'What does CBP Form 7501 Block 26 designate compared to Block 11 in standard customs entry?',
    disclosedAttachments: [], // Zero case docs disclosed
    activeCaseFacts: { companyName: 'Levant Culinary Traditions Corp' }
  });

  const gateResultA = validateClaimsAndApplyGate(
    `In official customs procedures, Block 26 of CBP Form 7501 designates the Importer of Record under 19 U.S.C. 1484, whereas Block 11 designates Mode of Transportation. To verify who has title at entry under 21 CFR 1.500, a consultant should request written commercial purchase contracts and customs entry documentation.`,
    bundleA,
    { channel: 'INTERNAL_CBRIDGE', actingRole: 'AI_COACH' }
  );

  const hasPublicRegulationSource = gateResultA.sourceTrace.claims.some(c =>
    c.supportingSourceIds.includes('SRC-MA324-02-CBP7501') || c.authorityLevel === 'LEVEL_1_PRIMARY_AUTHORITATIVE'
  );
  const noUndisclosedDocIdsInA = gateResultA.sourceTrace.claims.every(c =>
    c.supportingDocumentIds.length === 0 || !c.supportingDocumentIds.includes('DOC-SYNTH-CBP7501-01')
  );

  record(
    'Scenario A: Public Form',
    'Public Form Explanation Grounded in Authoritative Source without Citing Hidden Case Docs',
    'Supported with Level 1 Authoritative Source & Zero Hidden Case Document IDs',
    `Status: ${gateResultA.overallSupportStatus}, Sources: ${gateResultA.sourceTrace.claims[0]?.supportingSourceIds?.join(', ')}, DocIDs: [${gateResultA.sourceTrace.claims[0]?.supportingDocumentIds?.join(', ')}]`,
    gateResultA.overallSupportStatus === 'SUPPORTED' && hasPublicRegulationSource && noUndisclosedDocIdsInA
  );

  // --------------------------------------------------------------------------
  // SCENARIO B: Client Completed Form (UNDISCLOSED_CASE_EVIDENCE)
  // Before disclosure, specific completed CBP Form 7501 cannot be leaked or cited; generic recommendation allowed.
  // --------------------------------------------------------------------------
  const bundleB = await resolveContextAndRetrieveEvidence({
    projectId: 'PRJ-324',
    moduleId: 'MA-324-01',
    channel: 'INTERNAL_CBRIDGE',
    actingRole: 'AI_COACH',
    queryOrMessage: 'What entry documentation should we request from Levant?',
    disclosedAttachments: [], // 0 disclosed
    attachedCaseFiles: [
      { id: 'DOC-SYNTH-CBP7501-01', title: 'CBP Form 7501 Entry Summary', disclosureStatus: 'UNDISCLOSED' }
    ]
  });

  const gateResultB = validateClaimsAndApplyGate(
    `You should request customs entry summary filings and broker records to identify the Importer of Record under 19 U.S.C. 1484. The case contains CBP Form 7501 showing Port 1001.`,
    bundleB,
    { channel: 'INTERNAL_CBRIDGE', actingRole: 'AI_COACH' }
  );

  const undisclosedLeakSanitized = !gateResultB.sanitizedText.includes('The case contains CBP Form 7501 showing Port 1001') &&
    gateResultB.sourceTrace.claims.every(c => !c.supportingDocumentIds.includes('DOC-SYNTH-CBP7501-01'));

  record(
    'Scenario B: Client Completed Form',
    'Undisclosed Completed Form Leakage Blocked / Sanitized & Filtered from Source Trace',
    'Zero leakage of undisclosed case doc ID and sanitized response text',
    `Sanitized: "${gateResultB.sanitizedText.slice(0, 100)}...", BlockedDocs: [${gateResultB.sourceTrace.claims[0]?.supportingDocumentIds?.join(', ')}]`,
    undisclosedLeakSanitized
  );

  // --------------------------------------------------------------------------
  // SCENARIO C: Private Contract (UNDISCLOSED_CASE_EVIDENCE)
  // Master Purchase Agreement before disclosure cannot be leaked or cited; generic purchase contract recommendation allowed.
  // --------------------------------------------------------------------------
  const bundleC = await resolveContextAndRetrieveEvidence({
    projectId: 'PRJ-324',
    moduleId: 'MA-324-01',
    channel: 'INTERNAL_CBRIDGE',
    actingRole: 'AI_COACH',
    queryOrMessage: 'How do we determine if Levant is the owner at entry?',
    disclosedAttachments: [], // 0 disclosed
    attachedCaseFiles: [
      { id: 'DOC-SYNTH-MPA-01', title: 'Master Purchase Agreement', disclosureStatus: 'UNDISCLOSED' }
    ]
  });

  const gateResultC = validateClaimsAndApplyGate(
    `Under 21 CFR 1.500, a U.S. owner or consignee is a person who owns the food, has purchased it, or agreed in writing to purchase it. You should recommend requesting commercial purchase agreements, invoices, or written sales contracts to establish when title transfers. Section 4.2 of the Master Purchase Agreement already shows FOB Newark.`,
    bundleC,
    { channel: 'INTERNAL_CBRIDGE', actingRole: 'AI_COACH' }
  );

  const mpaLeakSanitized = !gateResultC.sanitizedText.includes('Section 4.2 of the Master Purchase Agreement already shows FOB Newark') &&
    gateResultC.sourceTrace.claims.every(c => !c.supportingDocumentIds.includes('DOC-SYNTH-MPA-01'));

  record(
    'Scenario C: Private Contract',
    'Private Contract Specifics Sanitized to Generic Evidence Recommendation & Filtered from Trace',
    'General commercial contract recommendation allowed, hidden contract details sanitized',
    `Sanitized: "${gateResultC.sanitizedText.slice(0, 120)}...", FilteredCount: ${bundleC.undisclosedCaseEvidenceFilteredCount}`,
    mpaLeakSanitized && bundleC.undisclosedCaseEvidenceFilteredCount > 0
  );

  // --------------------------------------------------------------------------
  // SCENARIO D: Client Knowledge Gap (Socratic Coaching)
  // Coach guides consultant to ask diagnostic business questions without assuming client knows regulatory forms.
  // --------------------------------------------------------------------------
  const coachResponseD = await generateGroundedCoachResponse({
    projectId: 'PRJ-324',
    moduleId: 'MA-324-01',
    caseId: 'PRJ-324-CASE-01',
    channel: 'INTERNAL_CBRIDGE',
    actingRole: 'SAMAR_CONSULTANT',
    learnerMessage: 'Elena just said they import tahini and olive oil. What should I ask her next to find out if they are the FSVP importer?',
    disclosedAttachments: [], // 0 disclosed
    learnerVisibleClientStatements: [
      {
        senderRole: 'CLIENT_EXEC',
        senderName: 'Elena Rostova',
        text: 'We import Mediterranean specialty foods into the US and need help with our FDA compliance obligations.'
      }
    ],
    activeCaseFacts: {
      companyName: 'Levant Culinary Traditions Corp',
      clientName: 'Elena Rostova',
      commodities: ['Olive Oil', 'Tahini']
    }
  });

  const coachMentionsGeneralEvidence = 
    coachResponseD.coachReplyText.toLowerCase().includes('contract') ||
    coachResponseD.coachReplyText.toLowerCase().includes('purchase') ||
    coachResponseD.coachReplyText.toLowerCase().includes('title') ||
    coachResponseD.coachReplyText.toLowerCase().includes('ownership') ||
    coachResponseD.coachReplyText.toLowerCase().includes('customs') ||
    coachResponseD.coachReplyText.toLowerCase().includes('document') ||
    coachResponseD.coachReplyText.toLowerCase().includes('entry') ||
    coachResponseD.coachReplyText.toLowerCase().includes('agreement');

  const coachDoesNotLeakUndisclosed = 
    !coachResponseD.coachReplyText.includes('Section 4.2 of the Master Purchase Agreement') &&
    !coachResponseD.coachReplyText.includes('The Master Purchase Agreement is already on file');

  record(
    'Scenario D: Client Knowledge Gap',
    'Socratic Diagnostic Coaching Recommends Document Types Without Claiming Hidden Case Existence',
    'Coach suggests diagnostic business inquiry & general evidence types without leaking hidden case files',
    `Coach Text: "${coachResponseD.coachReplyText.slice(0, 140)}..."`,
    coachMentionsGeneralEvidence && coachDoesNotLeakUndisclosed
  );

  // --------------------------------------------------------------------------
  // SCENARIO E: Document Disclosed (DISCLOSED_CASE_EVIDENCE)
  // After document disclosure, Coach can discuss specific clauses and cite document ID in Source Trace.
  // --------------------------------------------------------------------------
  const disclosedMpa = {
    id: 'DOC-SYNTH-MPA-01',
    attachmentId: 'DOC-SYNTH-MPA-01',
    title: 'Master Purchase Agreement (Levant & Al-Arz)',
    originalFileName: 'Master_Purchase_Agreement_Levant_AlArz.pdf',
    documentType: 'MASTER_PURCHASE_AGREEMENT',
    disclosureStatus: 'DISCLOSED',
    isDisclosed: true,
    messageId: 'MSG-CLI-01',
    extractedTextSummary: 'Commercial purchase agreement for bulk olive oil and sesame tahini.',
    extractedTextSnippet: 'Section 4.2 (Transfer of Title): Commercial ownership passes to Buyer upon completion of loading on board the vessel at foreign port.'
  };

  const bundleE = await resolveContextAndRetrieveEvidence({
    projectId: 'PRJ-324',
    moduleId: 'MA-324-01',
    channel: 'INTERNAL_CBRIDGE',
    actingRole: 'SAMAR_CONSULTANT',
    queryOrMessage: 'Elena just attached the Master Purchase Agreement. What does Section 4.2 tell us about ownership at entry?',
    disclosedAttachments: [disclosedMpa],
    activeCaseFacts: { companyName: 'Levant Culinary Traditions Corp' }
  });

  const gateResultE = validateClaimsAndApplyGate(
    `Section 4.2 of the Master Purchase Agreement provides direct evidence that commercial title transferred to Levant upon loading at the foreign port of export under Incoterms FOB terms. Under 21 CFR 1.500, this factual evidence supports evaluating Levant as the U.S. owner of the food at the time of entry.`,
    bundleE,
    { channel: 'INTERNAL_CBRIDGE', actingRole: 'AI_COACH' }
  );

  const mpaDisclosedCitedInTrace = gateResultE.sourceTrace.claims.some(c =>
    c.supportingDocumentIds.includes('DOC-SYNTH-MPA-01')
  );

  record(
    'Scenario E: Document Disclosed',
    'Disclosed Document Fully Discussable & Accurately Cited in Source Trace',
    'Cites DOC-SYNTH-MPA-01 in SourceTrace with SUPPORTED confidence',
    `Status: ${gateResultE.overallSupportStatus}, DocIDs in Trace: [${gateResultE.sourceTrace.claims.map(c => c.supportingDocumentIds.join(', ')).join('; ')}]`,
    gateResultE.overallSupportStatus === 'SUPPORTED' && mpaDisclosedCitedInTrace
  );

  // --------------------------------------------------------------------------
  // SCENARIO F: Live Opening Stage Session Isolation & Module 1 Scope Hard Gate
  // In the active opening session (0 disclosed documents):
  // 1. ACTIVE SESSION DISCLOSED DOCUMENT COUNT === 0
  // 2. AI COACH CASE DOCUMENT COUNT === 0
  // 3. SOURCE TRACE CASE DOCUMENT COUNT === 0
  // 4. Zero references to Executed MPA § 4.2, CBP Form 7501, or specific attachment IDs
  // 5. Zero out-of-scope tasks (21 CFR 1.504 Hazard Analysis, 21 CFR 1.506 Supplier Verification)
  // --------------------------------------------------------------------------
  const coachResponseF = await generateGroundedCoachResponse({
    projectId: 'PRJ-324',
    moduleId: 'MA-324-01',
    caseId: 'PRJ-324-CASE-01',
    channel: 'INTERNAL_CBRIDGE',
    actingRole: 'SAMAR_CONSULTANT',
    learnerMessage: 'Elena only said they import olive oil and tahini. How should I proceed?',
    disclosedAttachments: [], // 0 disclosed in current active session
    learnerVisibleClientStatements: [
      {
        senderRole: 'CLIENT_EXEC',
        senderName: 'Elena Rostova',
        text: 'Hello, we are Levant Culinary Traditions Corp. We import specialty goods like extra virgin olive oil and artisanal tahini. We need help understanding our FDA compliance requirements.'
      }
    ],
    activeCaseFacts: {
      companyName: 'Levant Culinary Traditions Corp',
      clientName: 'Elena Rostova',
      commodities: ['Olive Oil', 'Tahini']
    }
  });

  const coachTextF = coachResponseF.coachReplyText;
  const noMpaLeakF = !coachTextF.includes('Executed MPA') && !coachTextF.includes('Section 4.2') && !coachTextF.includes('DOC-SYNTH-MPA-01');
  const noCbp7501LeakF = !coachTextF.includes('CBP Form 7501') && !coachTextF.includes('DOC-SYNTH-CBP7501-01');
  const noDisclosedAssertionF = !coachTextF.includes('disclosed contracts and entry summaries') && !coachTextF.includes('already provide evidence');
  const noOutOfScopeModuleTasksF = !coachTextF.includes('1.504 Hazard Analysis') && !coachTextF.includes('1.506 Supplier Verification') && !coachTextF.includes('Qualified Auditor analysis');

  const allSupportingDocIdsF = coachResponseF.sourceTrace.claims.flatMap(c => c.supportingDocumentIds || []);
  const sourceTraceCaseDocCountF = allSupportingDocIdsF.filter(id => id.startsWith('DOC-SYNTH-') || id.startsWith('ATT-')).length;

  record(
    'Scenario F: Live Opening Stage Session Isolation & Scope Gate',
    'Active Session 0 Disclosed Documents: Zero Case Doc IDs, Zero Leaks, and Strict Module 1 Scope',
    'Case Doc Count=0, SourceTrace Case Docs=0, No 1.504/1.506 tasks, No MPA/7501 leaks',
    `TraceCaseDocCount: ${sourceTraceCaseDocCountF}, NoLeakedDocs: ${noMpaLeakF && noCbp7501LeakF && noDisclosedAssertionF}, ScopeEnforced: ${noOutOfScopeModuleTasksF}`,
    sourceTraceCaseDocCountF === 0 && noMpaLeakF && noCbp7501LeakF && noDisclosedAssertionF && noOutOfScopeModuleTasksF
  );

  console.log('================================================================');
  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`SUMMARY: ${results.filter(r => r.status === 'PASS').length}/${results.length} Tests PASSED.`);
  console.log('================================================================\n');

  return { success: allPassed, results };
}

// Execute if run directly via tsx / node
if (import.meta.url === `file://${process.argv[1]}`) {
  runKnowledgePolicyRegressionTests().catch(err => {
    console.error('Regression suite failed:', err);
    process.exit(1);
  });
}
