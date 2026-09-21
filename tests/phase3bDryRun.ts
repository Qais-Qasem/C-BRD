import { validateClientDraft } from '../server/clientCriticEngine.ts';

async function runDryRun() {
  const logTest = (name: string, passed: boolean) => console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}`);

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

  const ai1 = createMockAi(
    [{ claimId: "C1", claimText: "Logistics role confirmed", polarity: "POSITIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "PASS", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const res1 = await validateClientDraft(ai1 as any, "Draft", {}, [], [], "p1", metadata);
  logTest("KNOWN LOGISTICS ROLE", res1.criticResult.passed === true);

  const ai2 = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not a supplier", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const res2 = await validateClientDraft(ai2 as any, "Draft", {}, [], [], "p1", metadata);
  logTest("NOT-SUPPLIER CLAIM (BLOCKED)", res2.criticResult.passed === false);

  const ai3 = createMockAi(
    [{ claimId: "C1", claimText: "Entity A is not a manufacturer", polarity: "NEGATIVE", claimType: "CANONICAL_CASE_FACT" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED", severity: "MATERIAL", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const res3 = await validateClientDraft(ai3 as any, "Draft", {}, [], [], "p1", metadata);
  logTest("NOT-MANUFACTURER CLAIM (BLOCKED)", res3.criticResult.passed === false);

  const ai4 = createMockAi(
    [{ claimId: "C1", claimText: "Supplier role not established", polarity: "POSITIVE", claimType: "PERSONA_UNCERTAINTY" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED_AS_UNCERTAIN", severity: "PASS", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const res4 = await validateClientDraft(ai4 as any, "Draft", {}, [], [], "p1", metadata);
  logTest("SUPPLIER NOT-ESTABLISHED STATE", res4.criticResult.passed === true);

  const ai5 = createMockAi(
    [{ claimId: "C1", claimText: "Manufacturer role not established", polarity: "POSITIVE", claimType: "PERSONA_UNCERTAINTY" }],
    [{ claimId: "C1", supportStatus: "SUPPORTED_AS_UNCERTAIN", severity: "PASS", explicitNegativeSupport: false, exclusivitySupport: false }]
  );
  const res5 = await validateClientDraft(ai5 as any, "Draft", {}, [], [], "p1", metadata);
  logTest("MANUFACTURER NOT-ESTABLISHED STATE", res5.criticResult.passed === true);
}

runDryRun();
