import { validateClientDraft } from '../server/clientCriticEngine.ts';

async function runNegationTests() {
  const results: any[] = [];
  const logTest = (name: string, passed: boolean, details: string) => {
    results.push({ name, passed, details });
  };

  const createMockAi = (extractedClaims: any[], criticResults: any[]) => ({
    models: {
      generateContent: async (args: any) => {
        if (args.contents.includes('Extract material claims')) {
          return { text: JSON.stringify({ claims: extractedClaims }) };
        }
        if (args.contents.includes('C-Bridge Client Critic')) {
          return { text: JSON.stringify({ validationResults: criticResults, passed: true, replanRequired: false }) };
        }
        return { text: JSON.stringify({ text: "Replanned text" }) };
      }
    }
  });

  const metadata = { projectId: "p", moduleId: "m", caseId: "c", sessionId: "s" };

  // TEST A - ABSENT ROLE
  const aiA = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not a supplier.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resA = await validateClientDraft(aiA as any, "Draft", { entities: [], relationships: [], facts: [] }, [], [], "p1", metadata);
  logTest("TEST A (Absent Role)", resA.criticResult.passed === false && resA.criticResult.validationResults[0].supportStatus === 'INSUFFICIENT_SUPPORT', "Blocked unsupported negative");

  // TEST B - OTHER ENTITY HAS ROLE
  const aiB = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not a supplier.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resB = await validateClientDraft(aiB as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST B (Other Entity)", resB.criticResult.passed === false, "Blocked unsupported negative");

  // TEST C - MULTI-ROLE ENTITY
  const aiC = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is a supplier.", polarity: "POSITIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resC = await validateClientDraft(aiC as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST C (Multi-role)", resC.criticResult.passed === true, "Allowed positive facts");

  // TEST D - EXPLICIT NEGATIVE FACT
  const aiD = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not a supplier.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", explicitNegativeSupport: true, exclusivitySupport: false }]
  );
  const resD = await validateClientDraft(aiD as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST D (Explicit Negative Fact)", resD.criticResult.passed === true, "Allowed supported negative");

  // TEST E - EXPLICIT EXCLUSIVITY
  const aiE = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not a supplier.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", explicitNegativeSupport: false, exclusivitySupport: true }]
  );
  const resE = await validateClientDraft(aiE as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST E (Explicit Exclusivity)", resE.criticResult.passed === true, "Allowed explicit exclusivity");

  // TEST F - UNKNOWN WORDING
  const aiF = createMockAi(
    [{ claimId: "C1", claimText: "Supplier status is unknown.", polarity: "POSITIVE", claimType: "PERSONA_UNCERTAINTY" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resF = await validateClientDraft(aiF as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST F (Unknown Wording)", resF.criticResult.passed === true, "Allowed uncertainty phrasing");

  // TEST G - "STRICTLY" OVERREACH
  const aiG = createMockAi(
    [{ claimId: "C1", claimText: "Entity A acts strictly as logistics provider.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resG = await validateClientDraft(aiG as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST G (Strictly Overreach)", resG.criticResult.passed === false, "Blocked strictly qualifier");

  // TEST H - DOCUMENT SILENCE
  const aiH = createMockAi(
    [{ claimId: "C1", claimText: "Document proves Entity A is not manufacturer.", polarity: "NEGATIVE", claimType: "DOCUMENT_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resH = await validateClientDraft(aiH as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST H (Document Silence)", resH.criticResult.passed === false, "Blocked document silence inference");

  // TEST I - DOCUMENT EXPLICIT NEGATIVE
  const aiI = createMockAi(
    [{ claimId: "C1", claimText: "Document explicitly says Entity A is not manufacturer.", polarity: "NEGATIVE", claimType: "DOCUMENT_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", explicitNegativeSupport: true, exclusivitySupport: false }]
  );
  const resI = await validateClientDraft(aiI as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST I (Document Explicit Negative)", resI.criticResult.passed === true, "Allowed document explicit negative");

  // TEST J - CLIENT ASSERTION ONLY
  const aiJ = createMockAi(
    [{ claimId: "C1", claimText: "We believe Entity A is not manufacturer.", polarity: "NEGATIVE", claimType: "CLIENT_ASSERTION" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED_AS_BELIEF", severity: "PASS", explicitNegativeSupport: true, exclusivitySupport: false }]
  );
  const resJ = await validateClientDraft(aiJ as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST J (Client Assertion Only)", resJ.criticResult.passed === true, "Allowed as belief");

  // TEST K - CONTRADICTION
  const aiK = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not manufacturer.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "CONTRADICTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resK = await validateClientDraft(aiK as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST K (Contradiction)", resK.criticResult.passed === false, "Blocked contradiction");

  // TEST L - TEMPORAL SCOPE
  const aiL = createMockAi(
    [{ claimId: "C1", claimText: "Entity A was not supplier for Transaction 1.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", explicitNegativeSupport: true, exclusivitySupport: false }]
  );
  const resL = await validateClientDraft(aiL as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST L (Temporal Scope)", resL.criticResult.passed === true, "Allowed temporal scope negative");

  // TEST M - PRODUCT SCOPE
  const aiM = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not supplier for Product 2.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resM = await validateClientDraft(aiM as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST M (Product Scope)", resM.criticResult.passed === false, "Blocked unsupported product scope negative");

  // TEST N - SECOND DOMAIN
  const aiN = createMockAi(
    [{ claimId: "C1", claimText: "Employee A does not hold Role Y.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resN = await validateClientDraft(aiN as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST N (Second Domain)", resN.criticResult.passed === false, "Blocked unrelated domain negative inference");

  // TEST O - NEGATION + PHASE 4A HANDOFF
  const aiO = createMockAi(
    [{ claimId: "C1", claimText: "Role Y is not established.", polarity: "POSITIVE", claimType: "PERSONA_UNCERTAINTY" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED_AS_UNCERTAIN", severity: "PASS", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const resO = await validateClientDraft(aiO as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST O (Phase 4A Handoff)", resO.criticResult.passed === true && resO.extractedClaims[0].claimType === 'PERSONA_UNCERTAINTY', "Preserved UNKNOWN state for trace");

  // TEST P - LIVE FAILURE REPRODUCTION
  const aiP = createMockAi(
    [
      { claimId: "C1", claimText: "Entity A is not supplier.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" },
      { claimId: "C2", claimText: "Entity A is not manufacturer.", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }
    ],
    [
      { claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false },
      { claimId: "C2", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }
    ]
  );
  const resP = await validateClientDraft(aiP as any, "Draft", {}, [], [], "p1", metadata);
  logTest("TEST P (Live Failure Repro)", resP.criticResult.passed === false && resP.criticResult.validationResults[0].supportStatus === 'INSUFFICIENT_SUPPORT', "Blocked both unsupported negatives");

  console.log("=== PHASE 3B NEGATION TESTS ===");
  results.forEach(r => console.log(`${r.passed ? 'PASS' : 'FAIL'} - ${r.name}: ${r.details}`));
}

runNegationTests();
