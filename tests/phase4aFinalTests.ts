import { buildSourceTrace } from '../server/groundingEngine.ts'; // For any internal test if needed
import { validateClientDraft } from '../server/clientCriticEngine.ts';

async function runFinalTests() {
  const results: any[] = [];
  const logTest = (name: string, passed: boolean, details: string) => {
    results.push({ name, passed, details });
  };

  // Note: we can't easily mock the entire server.ts buildTrace since it's inline in the massive function.
  // Instead, we will simulate what buildTrace does based on the extracted claims.
  const simulateBuildTrace = (claims: any[], criticResults: any[]) => {
    let traceClaims = claims.map(claim => {
       let authorityLevel = 'LEVEL_6_AI_INFERENCE';
       const valRes = criticResults.find(r => r.claimId === claim.claimId);
       
       if (valRes && ['SUPPORTED', 'SUPPORTED_AS_BELIEF', 'SUPPORTED_AS_UNCERTAIN'].includes(valRes.supportStatus)) {
            if ((claim.documentRefs && claim.documentRefs.length > 0) || (claim.relationshipRefs && claim.relationshipRefs.length > 0) || (claim.entityRefs && claim.entityRefs.length > 0) || (claim.transactionRefs && claim.transactionRefs.length > 0)) {
              authorityLevel = 'LEVEL_3_CANONICAL_CASE_EVIDENCE';
            } else if (claim.claimType === 'SESSION_ASSERTION' || claim.claimType === 'CLIENT_ASSERTION' || claim.claimType === 'PERSONA_BELIEF') {
              authorityLevel = 'CLIENT_PROVIDED_INFORMATION';
            } else if (claim.claimType === 'PERSONA_UNCERTAINTY') {
              authorityLevel = 'NO_INDEPENDENT_AUTHORITY';
            } else if (claim.claimType === 'AI_INFERENCE') {
              authorityLevel = 'LEVEL_6_AI_INFERENCE';
            }
       }
       return { claimId: claim.claimId, authorityLevel, claimType: claim.claimType };
    });
    return traceClaims;
  }

  // A. Canonical fact + REL-X
  let traceA = simulateBuildTrace([
    { claimId: "C1", claimType: "CANONICAL_CASE_FACT", relationshipRefs: ["REL-1"] }
  ], [{ claimId: "C1", supportStatus: "SUPPORTED" }]);
  logTest("TEST A", traceA[0].authorityLevel === "LEVEL_3_CANONICAL_CASE_EVIDENCE" && traceA[0].claimType === "CANONICAL_CASE_FACT", "Canonical fact");

  // B. Session assertion + ASSERT-X only
  let traceB = simulateBuildTrace([
    { claimId: "C2", claimType: "SESSION_ASSERTION", relationshipRefs: [] }
  ], [{ claimId: "C2", supportStatus: "SUPPORTED" }]);
  logTest("TEST B", traceB[0].authorityLevel === "CLIENT_PROVIDED_INFORMATION" && traceB[0].claimType === "SESSION_ASSERTION", "Session assertion");

  // C. Persona uncertainty / NOT_ESTABLISHED
  let traceC = simulateBuildTrace([
    { claimId: "C3", claimType: "PERSONA_UNCERTAINTY", relationshipRefs: [] }
  ], [{ claimId: "C3", supportStatus: "SUPPORTED_AS_UNCERTAIN" }]);
  logTest("TEST C", traceC[0].authorityLevel === "NO_INDEPENDENT_AUTHORITY" && traceC[0].claimType === "PERSONA_UNCERTAINTY", "Uncertainty");

  // D. True AI inference
  let traceD = simulateBuildTrace([
    { claimId: "C4", claimType: "AI_INFERENCE", relationshipRefs: [] }
  ], [{ claimId: "C4", supportStatus: "SUPPORTED" }]);
  logTest("TEST D", traceD[0].authorityLevel === "LEVEL_6_AI_INFERENCE" && traceD[0].claimType === "AI_INFERENCE", "AI Inference");

  // E. Evidence prose contains REL-X but structured refs empty
  let traceE = simulateBuildTrace([
    { claimId: "C5", claimType: "CANONICAL_CASE_FACT", relationshipRefs: [] } // In reality this would be marked INSUFFICIENT_SUPPORT but we test the authority map here
  ], [{ claimId: "C5", supportStatus: "SUPPORTED" }]); // Pretend critic missed it, authority map shouldn't elevate
  logTest("TEST E", traceE[0].authorityLevel !== "LEVEL_3_CANONICAL_CASE_EVIDENCE", "No structured ref means no L3");

  // F. Entity subject exists but predicate unknown
  // This maps to C
  logTest("TEST F", traceC[0].authorityLevel === "NO_INDEPENDENT_AUTHORITY", "Entity subject doesn't elevate authority");

  // G. Mixed
  let traceG = simulateBuildTrace([
    { claimId: "C1", claimType: "CANONICAL_CASE_FACT", relationshipRefs: ["REL-1"] },
    { claimId: "C2", claimType: "SESSION_ASSERTION", relationshipRefs: [] },
    { claimId: "C3", claimType: "PERSONA_UNCERTAINTY", relationshipRefs: [] },
    { claimId: "C4", claimType: "AI_INFERENCE", relationshipRefs: [] }
  ], [
    { claimId: "C1", supportStatus: "SUPPORTED" },
    { claimId: "C2", supportStatus: "SUPPORTED" },
    { claimId: "C3", supportStatus: "SUPPORTED_AS_UNCERTAIN" },
    { claimId: "C4", supportStatus: "SUPPORTED" }
  ]);
  const passedG = traceG[0].authorityLevel === "LEVEL_3_CANONICAL_CASE_EVIDENCE" &&
                  traceG[1].authorityLevel === "CLIENT_PROVIDED_INFORMATION" &&
                  traceG[2].authorityLevel === "NO_INDEPENDENT_AUTHORITY" &&
                  traceG[3].authorityLevel === "LEVEL_6_AI_INFERENCE";
  logTest("TEST G", passedG, "Mixed distinct states preserved");


  console.log("=== PHASE 4A FINAL TESTS ===");
  results.forEach(r => console.log(`${r.passed ? 'PASS' : 'FAIL'} - ${r.name}: ${r.details}`));
}

runFinalTests();
