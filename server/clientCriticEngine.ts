import { executeGovernedModelCall } from './modelRouter.ts';
import { ResolvedAttachment } from './documentResolver.ts';

export interface MaterialClaim {
  claimId: string;
  claimText: string;
  claimType: 'CANONICAL_CASE_FACT' | 'PERSONA_KNOWLEDGE' | 'PERSONA_BELIEF' | 'PERSONA_UNCERTAINTY' | 'CLIENT_ASSERTION' | 'SESSION_ASSERTION' | 'DOCUMENT_FACT' | 'SOURCE_FACT' | 'AI_INFERENCE' | 'UNKNOWN' | 'REGULATORY_OR_LEGAL_INTERPRETATION' | 'OPERATIONAL_RECOMMENDATION';
  subjectRefs: string[];
  predicate: string;
  objectValueOrRefs: string[];
  temporalScope?: string;
  transactionRefs: string[];
  documentRefs: string[];
  relationshipRefs: string[];
  epistemicStatus: 'CONFIRMED' | 'SUPPORTED' | 'UNVERIFIED' | 'DISPUTED' | 'UNCERTAIN' | 'BELIEVED' | 'INFERRED' | 'UNKNOWN' | 'CONTRADICTED';
  sourceExpectation: string;
  materiality: 'MATERIAL' | 'MINOR' | 'PASS';
  draftSpan: string;
  polarity?: "POSITIVE" | "NEGATIVE";
}

export interface ClaimValidationResult {
  claimId: string;
  supportStatus: 'SUPPORTED' | 'SUPPORTED_AS_BELIEF' | 'SUPPORTED_AS_UNCERTAIN' | 'UNSUPPORTED' | 'CONTRADICTED' | 'HIDDEN_NOT_AUTHORIZED' | 'ENTITY_MISMATCH' | 'RELATIONSHIP_MISMATCH' | 'TRANSACTION_MISMATCH' | 'DOCUMENT_MISMATCH' | 'SUPERSEDED' | 'PERSONA_OVERREACH' | 'CONFLICTING_EVIDENCE' | 'INSUFFICIENT_SUPPORT';
  severity: 'MATERIAL' | 'MINOR' | 'PASS';
  reasoning: string;
  explicitNegativeSupport?: boolean;
  exclusivitySupport?: boolean;
}

export interface CriticResult {
  passed: boolean;
  validationResults: ClaimValidationResult[];
  rawEvidenceParity: boolean;
  replanRequired: boolean;
  feedbackToPrimary: string;
}

export async function validateClientDraft(
  aiClient: any,
  draftText: string,
  canonicalWorld: any,
  sessionAssertions: any[],
  resolvedAttachments: ResolvedAttachment[],
  personaId: string,
  contextMetadata: { projectId: string, moduleId: string, caseId: string, sessionId: string },
  replanCount: number = 0
): Promise<{ finalValidatedText: string, criticResult: CriticResult, replanCount: number, extractedClaims: MaterialClaim[] }> {
  
  const extractPrompt = `
Extract material claims from the following client draft response.
A material claim is a statement whose incorrectness could materially affect factual case understanding, entity identity, document interpretation, regulatory reasoning, or persona credibility.
STRICT ATOMIZATION REQUIRED: You must strictly atomize propositions. If a sentence claims an entity has multiple roles (e.g. supplier and manufacturer) or applies to multiple products, split these into separate atomic claims if they could have different evidentiary support or uncertainty states.
Represent the logical polarity of the proposition. A negative factual claim (e.g. "Entity A is not a supplier", "cannot perform", "does not manufacture") must have polarity: "NEGATIVE". Regular claims are "POSITIVE". If a claim expresses epistemic uncertainty (e.g., "not established", "unknown"), its polarity is POSITIVE but epistemicStatus is UNVERIFIED/UNKNOWN.
CANONICAL MAPPING REQUIRED: You MUST output the exact canonical IDs (e.g., REL-123, DOC-456, ENT-789) directly into the \`relationshipRefs\`, \`documentRefs\`, and \`entityRefs\` JSON arrays. DO NOT leave these arrays empty if the claim relies on canonical evidence. DO NOT just put the IDs in the prose evidence snippets.
Do not extract simple conversational courtesies unless they assert a fact.
Output a JSON array of claims under the "claims" key.
JSON Schema:
{
  "claims": [
    {
      "claimId": "CLM-...",
      "claimText": "string",
      "claimType": "CANONICAL_CASE_FACT" | "PERSONA_KNOWLEDGE" | "PERSONA_BELIEF" | "PERSONA_UNCERTAINTY" | "CLIENT_ASSERTION" | "SESSION_ASSERTION" | "DOCUMENT_FACT" | "SOURCE_FACT" | "AI_INFERENCE" | "UNKNOWN" | "REGULATORY_OR_LEGAL_INTERPRETATION" | "OPERATIONAL_RECOMMENDATION",
      "subjectRefs": ["string"],
      "predicate": "string",
      "objectValueOrRefs": ["string"],
      "temporalScope": "string",
      "transactionRefs": ["string"],
      "documentRefs": ["string"],
      "relationshipRefs": ["string"],
      "epistemicStatus": "CONFIRMED" | "SUPPORTED" | "UNVERIFIED" | "DISPUTED" | "UNCERTAIN" | "BELIEVED" | "INFERRED" | "UNKNOWN" | "CONTRADICTED",
      "sourceExpectation": "string",
      "materiality": "MATERIAL" | "MINOR" | "PASS",
      "draftSpan": "string",
      "polarity": "POSITIVE" | "NEGATIVE"
    }
  ]
}

Draft Text:
"""
${draftText}
"""
`;

  const extractRes = await executeGovernedModelCall({
    aiClient,
    purpose: "GENERAL_ASSIST",
    contents: extractPrompt,
    config: { responseMimeType: "application/json" },
    ...contextMetadata,
    memberId: personaId
  });

  let extractedClaims: MaterialClaim[] = [];
  try {
    if (extractRes.rawText) {
      extractedClaims = JSON.parse(extractRes.rawText.trim()).claims || [];
    }
  } catch (e) {
    console.warn("Failed to extract claims", e);
  }

  if (extractedClaims.length === 0) {
    return {
      finalValidatedText: draftText,
      criticResult: { passed: true, validationResults: [], rawEvidenceParity: true, replanRequired: false, feedbackToPrimary: '' },
      replanCount,
      extractedClaims: []
    };
  }

  const criticPrompt = `
You are the C-Bridge Client Critic.
Validate the following structured claims against the authoritative Canonical Case World, Session History, and Document Intelligence.
You must detect contradictions, persona overreach, entity mismatches, document mismatches, unsupported certainty, hidden fact leakage, and missing material qualifiers.
IMPORTANT: The primary model had access to raw document facts. You have the exact same evidence parity (RAW EVIDENCE PARITY = PASS).

OPEN-WORLD NEGATION RULES:
1. Absence of evidence is not evidence of absence. Do not infer that a negative claim (polarity="NEGATIVE") is SUPPORTED merely because the canonical world or session history lacks the positive relationship/fact.
2. A negative claim (e.g. "not a supplier") requires EXPLICIT NEGATIVE SUPPORT to be SUPPORTED. Explicit negative support means:
   A. Explicit canonical negative fact
   B. Explicit exclusivity constraint or mutually-exclusive roles explicitly declared
   C. Authoritative document explicitly states the negative
   D. Valid session correction establishes the negative
3. An entity holding one role (e.g. LOGISTICS_PROVIDER) DOES NOT establish they are not another role (e.g. SUPPLIER) unless explicitly excluded. Multiple roles are allowed.
4. If a negative claim lacks explicit negative support, it MUST NOT PASS. Its supportStatus MUST be INSUFFICIENT_SUPPORT, and you must require a replan.
5. If replanning a rejected negative claim, feedback must instruct the primary model to use an UNKNOWN or NOT_ESTABLISHED epistemic formulation (e.g. "Supplier status is not established", or "We have not confirmed they act as a supplier") rather than an explicit negative.

Canonical World Entities:
${JSON.stringify(canonicalWorld?.entities || [], null, 2)}

Canonical World Relationships:
${JSON.stringify(canonicalWorld?.relationships || [], null, 2)}

Canonical World Facts:
${JSON.stringify(canonicalWorld?.facts || [], null, 2)}

Session Assertions:
${JSON.stringify(sessionAssertions, null, 2)}

Resolved Document Attachments (Document Facts):
${JSON.stringify(resolvedAttachments, null, 2)}

Claims to validate:
${JSON.stringify(extractedClaims, null, 2)}

Output JSON:
{
  "validationResults": [
    {
      "claimId": "CLM-...",
      "supportStatus": "SUPPORTED" | "SUPPORTED_AS_BELIEF" | "SUPPORTED_AS_UNCERTAIN" | "UNSUPPORTED" | "CONTRADICTED" | "HIDDEN_NOT_AUTHORIZED" | "ENTITY_MISMATCH" | "RELATIONSHIP_MISMATCH" | "TRANSACTION_MISMATCH" | "DOCUMENT_MISMATCH" | "SUPERSEDED" | "PERSONA_OVERREACH" | "CONFLICTING_EVIDENCE" | "INSUFFICIENT_SUPPORT",
      "severity": "MATERIAL" | "MINOR" | "PASS",
      "reasoning": "string explaining the finding",
      "explicitNegativeSupport": boolean,
      "exclusivitySupport": boolean
    }
  ],
  "passed": boolean,
  "replanRequired": boolean,
  "feedbackToPrimary": "String providing specific replan directives if replanRequired is true"
}
`;

  const criticRes = await executeGovernedModelCall({
    aiClient,
    purpose: "GENERAL_ASSIST",
    contents: criticPrompt,
    config: { responseMimeType: "application/json" },
    ...contextMetadata,
    memberId: personaId
  });

  let criticResult: CriticResult = { passed: true, validationResults: [], rawEvidenceParity: true, replanRequired: false, feedbackToPrimary: '' };
  try {
    if (criticRes.rawText) {
      const parsed = JSON.parse(criticRes.rawText.trim());
      criticResult = {
        ...parsed,
        rawEvidenceParity: true
      };
      
      // Safety override: if any result is MATERIAL and NOT SUPPORTED, enforce replanRequired.
      let hasMaterialFailures = criticResult.validationResults.some(r => r.severity === 'MATERIAL' && r.supportStatus !== 'SUPPORTED' && r.supportStatus !== 'SUPPORTED_AS_BELIEF' && r.supportStatus !== 'SUPPORTED_AS_UNCERTAIN');
      
      // FINAL VALIDATION NEGATION GATE
      if (criticResult.validationResults && extractedClaims) {
        criticResult.validationResults.forEach((r) => {
          const claim = extractedClaims.find(c => c.claimId === r.claimId);
          if (claim && claim.polarity === 'NEGATIVE') {
             if (r.supportStatus === 'SUPPORTED' && !r.explicitNegativeSupport && !r.exclusivitySupport) {
                // Independent rejection of unsupported factual negation
                r.supportStatus = 'INSUFFICIENT_SUPPORT';
                r.severity = 'MATERIAL';
                r.reasoning = "FINAL VALIDATION GATE: Rejected unsupported negative claim. Absence of evidence is not evidence of absence.";
                hasMaterialFailures = true;
             }
          }
        });
      }

      if (hasMaterialFailures) {
         criticResult.passed = false;
         criticResult.replanRequired = true;
      }
    }
  } catch (e) {
    console.warn("Failed to parse critic result", e);
  }

  if (criticResult.replanRequired && replanCount < 1) {
    // We do one bounded replan
    const replanPrompt = `
You are the primary C-Bridge CLIENT_EXEC model. 
Your previous draft was rejected by the Client Critic due to material claim failures.
CRITIC FEEDBACK:
${criticResult.feedbackToPrimary}

Original Draft:
${draftText}

Revise your draft to fix the material errors. Preserve the persona voice. Do not fabricate missing information, express uncertainty or acknowledge lack of knowledge if required.
Output a JSON object matching:
{ "text": "Revised reply here" }
`;
    const replanRes = await executeGovernedModelCall({
      aiClient,
      purpose: "CLIENT_SIMULATION",
      contents: replanPrompt,
      config: { responseMimeType: "application/json" },
      ...contextMetadata,
      memberId: personaId
    });

    let newDraftText = draftText;
    if (replanRes.rawText) {
      try {
        newDraftText = JSON.parse(replanRes.rawText.trim()).text || draftText;
      } catch (e) {}
    }
    
    // We could re-validate, but to avoid loops we just return the replanned text.
    // The requirement says: "initial draft -> validation -> one or limited controlled replan -> validation"
    // So let's revalidate it once.
    return validateClientDraft(
      aiClient,
      newDraftText,
      canonicalWorld,
      sessionAssertions,
      resolvedAttachments,
      personaId,
      contextMetadata,
      replanCount + 1
    );
  }

  let finalValidatedText = draftText;
  if (!criticResult.passed && replanCount >= 1) {
    // If it still failed after replan, we block the response safely.
    finalValidatedText = "I am unable to provide a verified response to that specific question at this time based on my authorized records. Let's regroup and clarify the requirements.";
  }

  return {
    finalValidatedText,
    criticResult,
    replanCount,
    extractedClaims
  };
}
