import { validateClientDraft } from '../server/clientCriticEngine.ts';
import { migrateToStructuredWorld } from '../server/contextCompiler.ts';
import { buildSourceTrace } from '../server/groundingEngine.ts';

// Reusing same builder for simulation
function buildTrace(criticGateResult: any, createdAttachments: any[] = []) {
  let traceClaims: any[] = [];
  let overallConf: any = "SUPPORTED";
  let hasConflicts = false;
  let hasInsufficient = false;

  if (criticGateResult && criticGateResult.extractedClaims && criticGateResult.criticResult && criticGateResult.criticResult.validationResults) {
    traceClaims = criticGateResult.extractedClaims.map((claim: any) => {
          const valRes = criticGateResult.criticResult.validationResults.find((r: any) => r.claimId === claim.claimId);
          
          let confidenceState = "SUPPORTED";
          let classification = "CLIENT_EVIDENCE";
          let authorityLevel = "LEVEL_3_CANONICAL_CASE_EVIDENCE";
          
          if (valRes) {
            if (valRes.supportStatus === 'SUPPORTED_AS_UNCERTAIN') {
              confidenceState = 'REQUIRES_CURRENT_VERIFICATION';
            } else if (valRes.supportStatus === 'CONFLICTING_EVIDENCE') {
              confidenceState = 'CONFLICTING_EVIDENCE';
              hasConflicts = true;
            } else if (['UNSUPPORTED', 'CONTRADICTED', 'ENTITY_MISMATCH', 'RELATIONSHIP_MISMATCH', 'TRANSACTION_MISMATCH', 'DOCUMENT_MISMATCH', 'SUPERSEDED', 'PERSONA_OVERREACH', 'INSUFFICIENT_SUPPORT', 'HIDDEN_NOT_AUTHORIZED'].includes(valRes.supportStatus)) {
              confidenceState = 'INSUFFICIENT_EVIDENCE';
              hasInsufficient = true;
            }
          }

          classification = claim.claimType || 'UNKNOWN';

          if (claim.claimType === 'PERSONA_UNCERTAINTY') {
             confidenceState = 'REQUIRES_CURRENT_VERIFICATION';
          }

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

          // Safely map document Refs
          const supportingDocumentIds = (claim.documentRefs && Array.isArray(claim.documentRefs)) 
            ? claim.documentRefs 
            : [];

          // Canonical refs
          const supportingSourceIds = [
            ...(claim.entityRefs || []),
            ...(claim.relationshipRefs || []),
            ...(claim.transactionRefs || [])
          ];

          return {
            claimId: claim.claimId,
            claimText: claim.claimText,
            classification,
            supportingSourceIds,
            supportingDocumentIds,
            evidenceSnippet: valRes?.reasoning || "Derived from case state",
            reasoningRationale: valRes?.reasoning || claim.predicate || "Client statement",
            confidenceState,
            authorityLevel
          };
        });
      }

    if (hasInsufficient) {
    overallConf = "INSUFFICIENT_EVIDENCE";
  } else if (hasConflicts) {
    overallConf = "CONFLICTING_EVIDENCE";
  } else if (traceClaims.some(c => c.confidenceState === 'REQUIRES_CURRENT_VERIFICATION')) {
    overallConf = "REQUIRES_CURRENT_VERIFICATION";
  }

  if (traceClaims.length === 0) {
    traceClaims.push({
      claimId: `CLM-CLI-FALLBACK`,
      claimText: "Conversational response without material factual claims.",
      classification: "CLIENT_ASSERTION",
      supportingSourceIds: [],
      supportingDocumentIds: [],
      evidenceSnippet: "N/A",
      reasoningRationale: "General dialogue",
      confidenceState: "SUPPORTED",
      authorityLevel: "LEVEL_6_AI_INFERENCE"
    });
  }

  return buildSourceTrace({
    projectId: "PRJ-324",
    moduleId: "MA-324-01",
    queryOrContext: "test",
    actingRole: "CLIENT_EXEC",
    channel: "CLIENT_ENGAGEMENT",
    claims: traceClaims,
    overallConfidence: overallConf,
    unknownsOrGaps: []
  });
}

export async function runDryRun() {
  const results: any[] = [];
  const logTest = (name: string, passed: boolean, details: string) => {
    results.push({ name, passed, details });
  };

  const createMockAiClient = (extractResponse: any, criticResponse: any, replanResponse?: any) => {
    let callCount = 0;
    return {
      models: {
        generateContent: async (args: any) => {
          callCount++;
          if (callCount === 1) return { text: JSON.stringify(extractResponse) };
          if (callCount === 2) return { text: JSON.stringify(criticResponse) };
          if (callCount === 3) return { text: JSON.stringify(replanResponse) };
          return { text: "{}" };
        }
      }
    };
  };

  const caseData = {
    id: "CASE-LEVANT-01",
    virtualCompanyName: "Levant Culinary Traditions Corp",
    parties: [
      { name: "Levant Culinary Traditions Corp", role: "IMPORTER" },
      { name: "Al-Arz Cedar Olive Press & Mill", role: "SUPPLIER" },
      { name: "Trans-Atlantic Customs Clearance Services LLC", role: "BROKER" }
    ],
    hiddenScenario: "The supplier actually sources from a non-compliant third party."
  };

  const migrationResult = migrateToStructuredWorld(caseData);
  const contextMetadata = { projectId: "test", moduleId: "test", caseId: "CASE-LEVANT-01", sessionId: "test" };
  const personaId = "PER-1";
  
  // Create a combined scenario for the dry run mapping directly to the live request specs
  const mockAi = createMockAiClient(
    { claims: [
      { claimId: "C1", claimText: "Al-Arz Cedar Olive Press & Mill is our supplier/packer.", claimType: "CANONICAL_CASE_FACT", relationshipRefs: ["REL-SUPPLIER-1"] },
      { claimId: "C2", claimText: "We need to verify who manufactures it.", claimType: "PERSONA_UNCERTAINTY" },
      { claimId: "C3", claimText: "We believe we have good internal compliance.", claimType: "SESSION_ASSERTION" },
      { claimId: "C4", claimText: "The invoice mentions Z.", claimType: "DOCUMENT_FACT", documentRefs: ["DOC-INV-1"] }
    ] },
    { passed: true, validationResults: [
      { claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", reasoning: "Canonical relationship." },
      { claimId: "C2", supportStatus: "SUPPORTED_AS_UNCERTAIN", severity: "PASS", reasoning: "Manufacturing unknown." },
      { claimId: "C3", supportStatus: "SUPPORTED", severity: "PASS", reasoning: "Client statement." },
      { claimId: "C4", supportStatus: "SUPPORTED", severity: "PASS", reasoning: "Invoice exists." }
    ], replanRequired: false }
  );

  const res = await validateClientDraft(mockAi, "Combined draft response.", migrationResult.world, [], [{id: "DOC-INV-1", documentType: "COMMERCIAL_INVOICE", visibilityScope: "CLIENT_FACING", documentId: "DOC-INV-1"} as any, {id: "DOC-WRONG", documentType: "OTHER", visibilityScope: "CLIENT_FACING", documentId: "DOC-WRONG"} as any], personaId, contextMetadata);
  
  const trace = buildTrace(res, [{id: "DOC-INV-1"}, {id: "DOC-WRONG"}]);

  logTest("Canonical relationship trace", trace.claims.some(c => c.supportingSourceIds.includes("REL-SUPPLIER-1") && c.confidenceState === "SUPPORTED"), "Found canonical relationship claim trace");
  logTest("Uncertainty trace", trace.claims.some(c => c.confidenceState === "REQUIRES_CURRENT_VERIFICATION" && c.claimText.includes("manufactures")), "Found unverified/uncertainty claim trace");
  logTest("Session assertion trace", trace.claims.some(c => c.classification === "SESSION_ASSERTION" && c.claimText.includes("compliance")), "Found session assertion trace");
  logTest("Document trace", trace.claims.some(c => c.supportingDocumentIds.includes("DOC-INV-1")), "Found precise document claim trace");
  logTest("Hidden source excluded from visible trace", !trace.claims.some(c => c.claimText.includes("non-compliant")), "Hidden info omitted from trace claims");
  logTest("Irrelevant document attribution", !trace.claims.some(c => c.supportingDocumentIds.includes("DOC-WRONG")), "Irrelevant document NOT attributed");

  console.log("=== PHASE 4A ACTIVE CASE DRY RUN ===");
  results.forEach(r => console.log(`${r.passed ? 'PASS' : 'FAIL'} - ${r.name}: ${r.details}`));
}
runDryRun();
