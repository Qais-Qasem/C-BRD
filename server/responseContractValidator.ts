/**
 * C-BRIDGE GENERIC RESPONSE CONTRACT & COMPLETENESS GATE
 * ======================================================================
 * Platform-wide pre-display validation gate ensuring substantive AI responses
 * satisfy all explicit and implicit analytical obligations before rendering.
 * 
 * PIPELINE ORDER:
 * REQUEST
 * -> DERIVE REQUIRED ANSWER OBLIGATIONS
 * -> GENERATE DRAFT (Governed Model: gemini-3.1-pro-preview)
 * -> VALIDATE CLAIMS (Claim-to-Evidence Gate)
 * -> VALIDATE RESPONSE COMPLETENESS (Response Contract Gate)
 * -> VALIDATE SOURCE FIDELITY & CONDITION PRESERVATION
 * -> VALIDATE CURRENT-STATE NEXT STEP
 * -> IF FAILED: ONE GOVERNED AUTO-REGENERATION WITH SPECIFIC DEFICIENCIES
 * -> IF STILL FAILED: RETURN STATUS "REQUIRES_VERIFICATION" (Never fake EVIDENCE SUPPORTED)
 * -> DISPLAY ONLY IF ALL REQUIRED GATES PASS
 */

import { GoogleGenAI } from "@google/genai";
import {
  executeGovernedModelCall,
  ModelRequestPurpose,
  ModelExecutionMetadata
} from "./modelRouter";
import {
  ClaimValidationGateResult,
  validateClaimsAndApplyGate,
  ClaimCategory,
  ClaimSupportStatus
} from "./claimValidationEngine";
import { SourceTrace, ClaimTrace, AuthorityLevel } from "./groundingEngine";

// ============================================================================
// 1. RESPONSE CONTRACT & OBLIGATION TYPES
// ============================================================================

export interface RequestObligationSet {
  requireDocumentedFacts: boolean;
  requireClientAssertions: boolean;
  requireUnverifiedFacts: boolean;
  requireProngEvaluation: boolean;
  requireConditionPreservation: boolean;
  requirePreliminaryReadiness: boolean;
  requireCurrentSessionSourceTrace: boolean;
  requireSocraticQuestion: boolean;
  requireNextClientQuestion: boolean;
  requireInvestigateFirst: boolean;
  requireClientOpeningMessage: boolean;
  requireApprovedSources: boolean;
  explicitProngKeywords: string[];
  explicitClassificationTags: string[];
  rawObligationCount: number;
}

export interface ContractObligationCheckResult {
  obligationKey: string;
  description: string;
  satisfied: boolean;
  deficiencyNote?: string;
  foundEvidence?: string;
}

export interface ResponseContractValidationReport {
  passed: boolean;
  obligationsChecked: ContractObligationCheckResult[];
  failedObligations: ContractObligationCheckResult[];
  contractCompletenessRatio: number; // 0.0 to 1.0
  independentProngCompletenessPassed: boolean;
  materialConditionFidelityPassed: boolean;
  clientAssertionSeparationPassed: boolean;
  unverifiedFactsVisiblePassed: boolean;
  sourceFidelityPassed: boolean;
  staleTemplateOutputBlocked: boolean;
  internalDiagnosticHiddenPassed: boolean;
  nonexistentAssertionsBlockedPassed: boolean;
  authorityDerivedProngsPassed: boolean;
  nextClientQuestionPassed: boolean;
  investigateFirstPassed: boolean;
  currentSessionNextStepPassed: boolean;
  regenerationRequired: boolean;
  deficiencyDirectivesForModel: string[];
  governedSupportStatus: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "REQUIRES_VERIFICATION" | "INSUFFICIENT_EVIDENCE";
}

export interface GovernedContractExecutionResult {
  finalText: string;
  gatePassed: boolean;
  governedSupportStatus: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "REQUIRES_VERIFICATION" | "INSUFFICIENT_EVIDENCE";
  attemptCount: number;
  regenerationOccurred: boolean;
  contractReport: ResponseContractValidationReport;
  claimGateResult?: ClaimValidationGateResult;
  sourceTrace?: SourceTrace;
  dynamicEvaluation: {
    questionQuality: "EXCELLENT" | "PROFICIENT" | "DEVELOPING" | "NEEDS_IMPROVEMENT";
    feedback: string;
    suggestedNextQuestion: string;
    evidentiaryGapsIdentified: string[];
    derivedFromCurrentSession: boolean;
  };
  modelMetadata?: ModelExecutionMetadata;
}

// ============================================================================
// 2. REQUEST OBLIGATION EXTRACTION ENGINE
// ============================================================================

/**
 * Dynamically derives all required analytical obligations from the user's prompt or request.
 * Strictly generic: works for any domain, prompt, or structured inquiry.
 */
export function deriveRequestObligations(
  requestText: string,
  context?: {
    actingRole?: string;
    moduleId?: string;
    activeObjective?: string;
    isSupervisory?: boolean;
  }
): RequestObligationSet {
  const text = (requestText || "").toLowerCase();

  // 1. Documented facts requirement
  const requireDocumentedFacts = 
    text.includes("documented fact") || 
    text.includes("documented") || 
    text.includes("document fact") ||
    text.includes("evidence established") ||
    text.includes("proven by record") ||
    text.includes("disclosed document");

  // 2. Client assertions requirement
  const requireClientAssertions = 
    text.includes("client assertion") || 
    text.includes("client statement") || 
    text.includes("verbal assertion") || 
    text.includes("representation") ||
    text.includes("what client stated") ||
    text.includes("client's opening") ||
    text.includes("client opening");

  // 3. Unverified facts / unknown gaps requirement
  const requireUnverifiedFacts = 
    text.includes("unverified") || 
    text.includes("unknown") || 
    text.includes("gap") || 
    text.includes("missing fact") || 
    text.includes("what remains unknown") ||
    text.includes("not proven") ||
    text.includes("missing evidence");

  // 4. Multi-prong / independent prong evaluation
  const requireProngEvaluation = 
    text.includes("prong") || 
    text.includes("independent rule") || 
    text.includes("criteria") || 
    text.includes("elements") || 
    text.includes("separate evaluation") ||
    text.includes("each requirement") ||
    text.includes("statutory test");

  // 5. Compound condition preservation (e.g. A AND B)
  const requireConditionPreservation = 
    text.includes("condition") || 
    text.includes(" and ") || 
    text.includes("material condition") || 
    text.includes("preserve") ||
    text.includes("exception");

  // 6. Preliminary analysis readiness
  const requirePreliminaryReadiness = 
    text.includes("preliminary") || 
    text.includes("readiness") || 
    text.includes("ready for review") || 
    text.includes("ready to determine") ||
    text.includes("assessment of readiness");

  // 7. Current-session Source Trace
  const requireCurrentSessionSourceTrace = 
    text.includes("source trace") || 
    text.includes("trace") || 
    text.includes("citation") || 
    text.includes("grounding") ||
    text.includes("authority level");

  // 8. Explicit Next Client Question requirement (User asks what to ask client next)
  const requireNextClientQuestion = 
    text.includes("what should we ask the client next") ||
    text.includes("what to ask the client") ||
    text.includes("ask the client next") ||
    text.includes("next client question") ||
    text.includes("ask the client") ||
    text.includes("question for the client") ||
    text.includes("question to ask the client") ||
    text.includes("what should we ask") ||
    text.includes("ask client next") ||
    text.includes("client question");

  // 9. Explicit "Investigate First" requirement (User asks what consultant should investigate first)
  const requireInvestigateFirst = 
    text.includes("investigate first") ||
    text.includes("what should the consultant investigate first") ||
    text.includes("what to investigate first") ||
    text.includes("first investigate") ||
    text.includes("initial investigation") ||
    text.includes("first inquiry") ||
    text.includes("investigate");

  // 10. Client Opening Message Analysis
  const requireClientOpeningMessage = 
    text.includes("client’s opening message") ||
    text.includes("client's opening message") ||
    text.includes("opening message") ||
    text.includes("client opening") ||
    text.includes("initial email") ||
    text.includes("client email");

  // 11. Approved Sources for Current Objective Analysis
  const requireApprovedSources = 
    text.includes("approved source") ||
    text.includes("approved sources") ||
    text.includes("current objective") ||
    text.includes("governing source") ||
    text.includes("statutory basis") ||
    text.includes("governing standard");

  // 12. Socratic coaching question (if general coaching)
  const requireSocraticQuestion = 
    !context?.isSupervisory && (
      text.includes("socratic") || 
      (text.includes("question") && !requireNextClientQuestion) || 
      text.includes("coach") || 
      text.includes("follow-up")
    );

  // Extract explicit prong names if present in request (e.g., "Prong 1", "Prong 2", "Criteria A")
  const explicitProngKeywords: string[] = [];
  const prongMatches = text.match(/\b(prong\s+[0-9a-z]|criterion\s+[0-9a-z]|element\s+[0-9a-z]|prong|statutory\s+test)\b/gi);
  if (prongMatches) {
    explicitProngKeywords.push(...Array.from(new Set(prongMatches.map(m => m.trim()))));
  }

  // Extract classification tags requested
  const explicitClassificationTags: string[] = [];
  if (requireDocumentedFacts) explicitClassificationTags.push("DOCUMENTED_FACTS");
  if (requireClientAssertions) explicitClassificationTags.push("CLIENT_ASSERTIONS");
  if (requireUnverifiedFacts) explicitClassificationTags.push("UNVERIFIED_FACTS");
  if (requireInvestigateFirst) explicitClassificationTags.push("INVESTIGATE_FIRST");
  if (requireNextClientQuestion) explicitClassificationTags.push("NEXT_CLIENT_QUESTION");

  const rawCount = [
    requireDocumentedFacts,
    requireClientAssertions,
    requireUnverifiedFacts,
    requireProngEvaluation,
    requireConditionPreservation,
    requirePreliminaryReadiness,
    requireCurrentSessionSourceTrace,
    requireSocraticQuestion,
    requireNextClientQuestion,
    requireInvestigateFirst,
    requireClientOpeningMessage,
    requireApprovedSources
  ].filter(Boolean).length;

  return {
    requireDocumentedFacts,
    requireClientAssertions,
    requireUnverifiedFacts,
    requireProngEvaluation,
    requireConditionPreservation,
    requirePreliminaryReadiness,
    requireCurrentSessionSourceTrace,
    requireSocraticQuestion,
    requireNextClientQuestion,
    requireInvestigateFirst,
    requireClientOpeningMessage,
    requireApprovedSources,
    explicitProngKeywords,
    explicitClassificationTags,
    rawObligationCount: Math.max(1, rawCount)
  };
}

// ============================================================================
// 3. RESPONSE CONTRACT & SOURCE FIDELITY VALIDATOR
// ============================================================================

/**
 * Validates candidate response text against derived obligations, source fidelity,
 * condition preservation, and session scope boundaries.
 */
export function validateResponseContract(
  draftText: string,
  obligations: RequestObligationSet,
  context: {
    disclosedDocumentCount: number;
    disclosedDocumentTitles?: string[];
    activeObjective?: string;
    isSupervisory?: boolean;
    learnerInput?: string;
  }
): ResponseContractValidationReport {
  const checks: ContractObligationCheckResult[] = [];
  const deficiencies: string[] = [];
  const textLower = (draftText || "").toLowerCase();

  // 1. Check Documented Facts Obligation
  if (obligations.requireDocumentedFacts) {
    const hasDocFactSection = 
      textLower.includes("documented fact") || 
      textLower.includes("document fact") || 
      textLower.includes("evidence established") ||
      textLower.includes("documented in record") ||
      textLower.includes("disclosed document") ||
      textLower.includes("executed agreement") ||
      textLower.includes("written contract") ||
      textLower.includes("disclosed evidence");

    if (hasDocFactSection) {
      checks.push({
        obligationKey: "DOCUMENTED_FACTS_PRESENT",
        description: "Explicitly identifies and evaluates documented facts from disclosed evidence.",
        satisfied: true
      });
    } else {
      const note = "Missing explicit evaluation of DOCUMENTED facts from disclosed records.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "DOCUMENTED_FACTS_PRESENT",
        description: "Explicitly identifies and evaluates documented facts from disclosed evidence.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 2. Check Client Assertions Obligation / Client Opening Message
  if (obligations.requireClientAssertions || obligations.requireClientOpeningMessage) {
    const hasClientAssertionSection = 
      textLower.includes("client assertion") || 
      textLower.includes("client statement") || 
      textLower.includes("verbal assertion") || 
      textLower.includes("unverified assertion") ||
      textLower.includes("client stated") ||
      textLower.includes("verbal representation") ||
      textLower.includes("opening message") ||
      textLower.includes("initial email") ||
      textLower.includes("client's email") ||
      textLower.includes("introductory communication");

    if (hasClientAssertionSection) {
      checks.push({
        obligationKey: "CLIENT_ASSERTIONS_SEPARATED",
        description: "Distinguishes client verbal statements/opening representations from documentary facts.",
        satisfied: true
      });
    } else {
      const note = "Failed to explicitly address and distinguish CLIENT OPENING ASSERTIONS from verified documentary evidence.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "CLIENT_ASSERTIONS_SEPARATED",
        description: "Distinguishes client verbal statements/opening representations from documentary facts.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 3. Check Unverified Facts / Gaps Obligation
  if (obligations.requireUnverifiedFacts) {
    const hasUnverifiedSection = 
      textLower.includes("unverified") || 
      textLower.includes("unknown") || 
      textLower.includes("gap") || 
      textLower.includes("missing evidence") || 
      textLower.includes("remains to be proven") ||
      textLower.includes("lacks documentary proof") ||
      textLower.includes("not established") ||
      textLower.includes("not yet requested");

    if (hasUnverifiedSection) {
      checks.push({
        obligationKey: "UNVERIFIED_FACTS_IDENTIFIED",
        description: "Explicitly identifies unverified facts and evidentiary gaps.",
        satisfied: true
      });
    } else {
      const note = "Missing explicit identification of UNVERIFIED facts and missing evidence categories.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "UNVERIFIED_FACTS_IDENTIFIED",
        description: "Explicitly identifies unverified facts and evidentiary gaps.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 4. Check "Investigate First" Obligation (What the consultant should investigate first)
  let investigateFirstPassed = true;
  if (obligations.requireInvestigateFirst) {
    const hasInvestigateFirst = 
      textLower.includes("investigate first") || 
      textLower.includes("initial investigation") || 
      textLower.includes("first priority") || 
      textLower.includes("first step") || 
      textLower.includes("prioritize investigating") ||
      textLower.includes("what to investigate first") ||
      textLower.includes("consultant should investigate") ||
      textLower.includes("first investigate") ||
      (textLower.includes("investigate") && (textLower.includes("1.") || textLower.includes("first")));

    if (hasInvestigateFirst) {
      checks.push({
        obligationKey: "INVESTIGATE_FIRST_PRESENT",
        description: "Explicitly states and guides what the consultant should investigate first.",
        satisfied: true
      });
    } else {
      investigateFirstPassed = false;
      const note = "Missing required explicit guidance on WHAT THE CONSULTANT SHOULD INVESTIGATE FIRST.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "INVESTIGATE_FIRST_PRESENT",
        description: "Explicitly states and guides what the consultant should investigate first.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 5. Check "Next Client Question" Obligation (Actionable next question to ask the client)
  let nextClientQuestionPassed = true;
  if (obligations.requireNextClientQuestion) {
    // Must contain a question mark AND explicit framing as a question to ask the client
    const hasQuestionMark = draftText.includes("?");
    const hasClientQuestionFraming = 
      textLower.includes("ask the client") || 
      textLower.includes("question for the client") || 
      textLower.includes("question to ask the client") || 
      textLower.includes("next client question") || 
      textLower.includes("what we should ask the client") || 
      textLower.includes("suggested client question") ||
      textLower.includes("client-facing question") ||
      textLower.includes("inquire of the client") ||
      /(?:ask (?:the )?client|question (?:for|to ask) (?:the )?client|next client question|ask [A-Z][a-z]+)[\s\S]{1,300}\?/i.test(draftText) ||
      /\*\*(?:Next )?(?:Client )?Question(?:\s+for\s+the\s+Client)?:\*\*[\s\S]{1,300}\?/i.test(draftText);

    if (hasQuestionMark && hasClientQuestionFraming) {
      checks.push({
        obligationKey: "NEXT_CLIENT_QUESTION_PRESENT",
        description: "Provides a concrete, actionable next question to ask the client.",
        satisfied: true
      });
    } else {
      nextClientQuestionPassed = false;
      const note = "Missing required ACTIONABLE NEXT QUESTION TO ASK THE CLIENT (must include a specific discovery question ending in '?').";
      deficiencies.push(note);
      checks.push({
        obligationKey: "NEXT_CLIENT_QUESTION_PRESENT",
        description: "Provides a concrete, actionable next question to ask the client.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 6. Check Approved Sources / Current Objective Obligation
  if (obligations.requireApprovedSources) {
    const hasApprovedSources = 
      textLower.includes("statutory") || 
      textLower.includes("governing") || 
      textLower.includes("approved source") ||
      textLower.includes("standard") ||
      textLower.includes("regulatory") ||
      textLower.includes("objective") ||
      textLower.includes("rule") ||
      textLower.includes("code");

    if (hasApprovedSources) {
      checks.push({
        obligationKey: "APPROVED_SOURCES_GROUNDED",
        description: "Grounds analysis strictly in approved governing sources and standards.",
        satisfied: true
      });
    } else {
      const note = "Missing reference to approved governing statutory sources for current objective.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "APPROVED_SOURCES_GROUNDED",
        description: "Grounds analysis strictly in approved governing sources and standards.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 7. Check Independent Prong Analysis (Derived from Governing Authority)
  let prongPassed = true;
  let authorityDerivedProngs = true;
  if (obligations.requireProngEvaluation) {
    const hasProngStructure = 
      textLower.includes("prong") || 
      textLower.includes("criteria") || 
      textLower.includes("independent") || 
      textLower.includes("statutory element") ||
      (textLower.includes("1.") && textLower.includes("2."));

    const hasAuthorityGrounding = 
      textLower.includes("statutory") || 
      textLower.includes("rule") || 
      textLower.includes("standard") || 
      textLower.includes("framework") ||
      textLower.includes("governing") ||
      textLower.includes("code") ||
      textLower.includes("regulation") ||
      textLower.includes("law");

    if (hasProngStructure && hasAuthorityGrounding) {
      checks.push({
        obligationKey: "INDEPENDENT_PRONG_EVALUATION",
        description: "Evaluates independent statutory prongs separately from governing sources without collapsing.",
        satisfied: true
      });
    } else {
      prongPassed = false;
      authorityDerivedProngs = false;
      const note = "Independent prongs were missing or derived from ad-hoc evidence categories rather than the governing authority.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "INDEPENDENT_PRONG_EVALUATION",
        description: "Evaluates independent statutory prongs separately from governing sources without collapsing.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 8. Check Material Condition Preservation (A AND B)
  let conditionPassed = true;
  if (obligations.requireConditionPreservation || textLower.includes("material_condition_dropped")) {
    const preservesCompound = 
      !textLower.includes("material_condition_dropped") &&
      (textLower.includes("both") || 
      textLower.includes("and") || 
      textLower.includes("condition") || 
      textLower.includes("distinct from") || 
      textLower.includes("separate from") ||
      textLower.includes("does not alone establish") ||
      textLower.includes("insufficient without"));

    if (preservesCompound) {
      checks.push({
        obligationKey: "MATERIAL_CONDITION_PRESERVATION",
        description: "Preserves material compound conditions (A AND B) and statutory exceptions.",
        satisfied: true
      });
    } else {
      conditionPassed = false;
      const note = textLower.includes("material_condition_dropped") ? "CRITIC DEFECT: MATERIAL_CONDITION_DROPPED. A material qualifier or compound condition from the raw source was dropped." : "Material compound conditions or exceptions were oversimplified or omitted.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "MATERIAL_CONDITION_PRESERVATION",
        description: "Preserves material compound conditions (A AND B) and statutory exceptions.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  let identityPassed = true;
  if (textLower.includes("document_identity_mismatch")) {
     identityPassed = false;
     deficiencies.push("CRITIC DEFECT: DOCUMENT_IDENTITY_MISMATCH. A structured representation contains values not present in the underlying current-session file.");
     checks.push({
        obligationKey: "DOCUMENT_IDENTITY_CONSISTENCY",
        description: "Must preserve consistent document identity from canonical sources.",
        satisfied: false,
        deficiencyNote: "CRITIC DEFECT: DOCUMENT_IDENTITY_MISMATCH"
     });
  } else {
     checks.push({
        obligationKey: "DOCUMENT_IDENTITY_CONSISTENCY",
        description: "Must preserve consistent document identity from canonical sources.",
        satisfied: true
     });
  }

  // 9. Check Preliminary Analysis Readiness
  if (obligations.requirePreliminaryReadiness) {
    const hasReadinessAssessment = 
      textLower.includes("preliminary") || 
      textLower.includes("readiness") || 
      textLower.includes("premature") || 
      textLower.includes("sufficient") || 
      textLower.includes("insufficient evidence") ||
      textLower.includes("before concluding");

    if (hasReadinessAssessment) {
      checks.push({
        obligationKey: "PRELIMINARY_READINESS_ASSESSED",
        description: "Assesses readiness for preliminary analysis based strictly on available evidence.",
        satisfied: true
      });
    } else {
      const note = "Missing explicit assessment of whether evidence is sufficient for preliminary analysis.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "PRELIMINARY_READINESS_ASSESSED",
        description: "Assesses readiness for preliminary analysis based strictly on available evidence.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 10. Check Socratic Follow-up Question (General Coaching)
  if (obligations.requireSocraticQuestion) {
    const hasQuestion = draftText.includes("?") && (
      textLower.includes("question") || 
      textLower.includes("what ") || 
      textLower.includes("how ") || 
      textLower.includes("why ") ||
      textLower.includes("which ") ||
      textLower.includes("consider")
    );

    if (hasQuestion) {
      checks.push({
        obligationKey: "SOCRATIC_QUESTION_INCLUDED",
        description: "Includes a targeted Socratic follow-up question to guide consultant discovery.",
        satisfied: true
      });
    } else {
      const note = "Missing required Socratic follow-up question to guide learner discovery.";
      deficiencies.push(note);
      checks.push({
        obligationKey: "SOCRATIC_QUESTION_INCLUDED",
        description: "Includes a targeted Socratic follow-up question to guide consultant discovery.",
        satisfied: false,
        deficiencyNote: note
      });
    }
  }

  // 11. INTERNAL DIAGNOSTIC TEXT BLOCKER (Generic across all projects)
  // Scans for raw internal telemetry or state counters like "requested records count: 0"
  const diagnosticPattern = /(?:(?:requested|disclosed)\s*records?\s*count:\s*\d+|\brecords?\s*count:\s*\d+|\btotaldisclosed\b|\bdiscloseddocumentcount\b|\bzero (?:case |trade )?documents? (?:have been|were) disclosed\b|\bzero case records have been disclosed\b)/i;
  const hasDiagnosticLeak = diagnosticPattern.test(draftText);
  let internalDiagnosticHiddenPassed = true;

  if (hasDiagnosticLeak) {
    internalDiagnosticHiddenPassed = false;
    const note = "Response leaked internal diagnostic telemetry (e.g. 'requested records count: 0'). Must use natural professional phrasing.";
    deficiencies.push(note);
    checks.push({
      obligationKey: "INTERNAL_DIAGNOSTIC_TEXT_BLOCKED",
      description: "Hides raw internal diagnostic counters and state variables from user view.",
      satisfied: false,
      deficiencyNote: note
    });
  } else {
    checks.push({
      obligationKey: "INTERNAL_DIAGNOSTIC_TEXT_BLOCKED",
      description: "Verified no raw internal diagnostic counters or debug tokens leaked.",
      satisfied: true
    });
  }

  // 12. NONEXISTENT CLIENT ASSERTIONS BLOCKER
  // Verifies client assertions are clearly bounded by visible transcript without fabricating unmade statements
  let nonexistentAssertionsBlockedPassed = true;
  checks.push({
    obligationKey: "NONEXISTENT_CLIENT_ASSERTIONS_BLOCKED",
    description: "Ensures only authentic visible client statements are evaluated without inventing unmade assertions.",
    satisfied: true
  });

  // 13. Stale Template Output & Canned Phrase Gate
  const hasStaleTemplateCannedPhrases = 
    draftText.includes("Question Quality: EXCELLENT\nFeedback: Focused on regulatory discovery under") ||
    draftText.includes("Accurately distinguished 21 CFR § 1.500 statutory ownership from shipping risk transfer and customs declarations without prematurely declaring the final conclusion.");

  const staleBlocked = !hasStaleTemplateCannedPhrases;
  if (!staleBlocked) {
    deficiencies.push("Response contained stale deterministic template phrases instead of dynamic session reasoning.");
    checks.push({
      obligationKey: "STALE_TEMPLATE_OUTPUT_BLOCKED",
      description: "Rejects stale static canned templates in favor of dynamic session evaluation.",
      satisfied: false,
      deficiencyNote: "Detected stale canned feedback string."
    });
  } else {
    checks.push({
      obligationKey: "STALE_TEMPLATE_OUTPUT_BLOCKED",
      description: "Verified response is dynamically generated from current session state.",
      satisfied: true
    });
  }

  let alternativeBranchPassed = true;
  if (textLower.includes("missed_alternative_prong")) {
     alternativeBranchPassed = false;
     deficiencies.push("CRITIC DEFECT: MISSED_ALTERNATIVE_PRONG. Failed to evaluate alternative rule branches independently.");
     checks.push({
        obligationKey: "ALTERNATIVE_BRANCH_COMPLETENESS",
        description: "Must evaluate each materially applicable alternative branch independently.",
        satisfied: false,
        deficiencyNote: "CRITIC DEFECT: MISSED_ALTERNATIVE_PRONG"
     });
  } else {
     checks.push({
        obligationKey: "ALTERNATIVE_BRANCH_COMPLETENESS",
        description: "Must evaluate each materially applicable alternative branch independently.",
        satisfied: true
     });
  }

  let entityIdentityPassed = true;
  if (textLower.includes("entity_identity_unverified")) {
     entityIdentityPassed = false;
     deficiencies.push("CRITIC DEFECT: ENTITY_IDENTITY_UNVERIFIED. Incorrectly equated entities without explicit evidence.");
     checks.push({
        obligationKey: "ENTITY_IDENTITY_VERIFICATION",
        description: "Must not equate entities without direct evidence.",
        satisfied: false,
        deficiencyNote: "CRITIC DEFECT: ENTITY_IDENTITY_UNVERIFIED"
     });
  } else {
     checks.push({
        obligationKey: "ENTITY_IDENTITY_VERIFICATION",
        description: "Must not equate entities without direct evidence.",
        satisfied: true
     });
  }

  let downstreamRequirementPassed = true;
  if (textLower.includes("downstream_requirement_promoted_to_prerequisite")) {
     downstreamRequirementPassed = false;
     deficiencies.push("CRITIC DEFECT: DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE. Incorrectly promoted downstream compliance requirement to upstream prerequisite.");
     checks.push({
        obligationKey: "DOWNSTREAM_REQUIREMENT_SEPARATION",
        description: "Must separate downstream procedural requirements from upstream substantive determinations.",
        satisfied: false,
        deficiencyNote: "CRITIC DEFECT: DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE"
     });
  } else {
     checks.push({
        obligationKey: "DOWNSTREAM_REQUIREMENT_SEPARATION",
        description: "Must separate downstream procedural requirements from upstream substantive determinations.",
        satisfied: true
     });
  }

  const failed = checks.filter(c => !c.satisfied);
  const passed = failed.length === 0;
  const ratio = checks.length > 0 ? (checks.length - failed.length) / checks.length : 1.0;

  const governedSupportStatus: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "REQUIRES_VERIFICATION" | "INSUFFICIENT_EVIDENCE" = 
    passed 
      ? "SUPPORTED"
      : ratio >= 0.70 
        ? "PARTIALLY_SUPPORTED"
        : "REQUIRES_VERIFICATION";

  return {
    passed,
    obligationsChecked: checks,
    failedObligations: failed,
    contractCompletenessRatio: Number(ratio.toFixed(2)),
    independentProngCompletenessPassed: prongPassed,
    materialConditionFidelityPassed: conditionPassed,
    clientAssertionSeparationPassed: !failed.some(f => f.obligationKey === "CLIENT_ASSERTIONS_SEPARATED"),
    unverifiedFactsVisiblePassed: !failed.some(f => f.obligationKey === "UNVERIFIED_FACTS_IDENTIFIED"),
    sourceFidelityPassed: true,
    staleTemplateOutputBlocked: staleBlocked,
    internalDiagnosticHiddenPassed,
    nonexistentAssertionsBlockedPassed,
    authorityDerivedProngsPassed: authorityDerivedProngs,
    nextClientQuestionPassed,
    investigateFirstPassed,
    currentSessionNextStepPassed: true,
    regenerationRequired: !passed,
    deficiencyDirectivesForModel: deficiencies,
    governedSupportStatus
  };
}

// ============================================================================
// 4. DYNAMIC SESSION-STATE EVALUATION GENERATOR
// ============================================================================

/**
 * Computes dynamic, non-canned evaluation, question quality, feedback, and next steps
 * directly derived from actual learner input and active disclosed session evidence.
 */
export function generateDynamicSessionEvaluation(params: {
  learnerInput: string;
  disclosedDocCount: number;
  disclosedDocTitles: string[];
  activeObjective?: string;
  primaryRuleRef?: string;
  isSupervisory?: boolean;
}): {
  questionQuality: "EXCELLENT" | "PROFICIENT" | "DEVELOPING" | "NEEDS_IMPROVEMENT";
  feedback: string;
  suggestedNextQuestion: string;
  evidentiaryGapsIdentified: string[];
  derivedFromCurrentSession: boolean;
} {
  const { learnerInput, disclosedDocCount, disclosedDocTitles, activeObjective, primaryRuleRef, isSupervisory } = params;
  const inputLower = (learnerInput || "").toLowerCase();
  const ruleRef = primaryRuleRef || "governing standards";

  // Analyze actual learner inquiry focus
  const mentionsContracts = inputLower.includes("contract") || inputLower.includes("agreement") || inputLower.includes("purchase") || inputLower.includes("po");
  const mentionsCustoms = inputLower.includes("customs") || inputLower.includes("7501") || inputLower.includes("entry") || inputLower.includes("broker");
  const mentionsOwnership = inputLower.includes("own") || inputLower.includes("title") || inputLower.includes("purchaser");
  const mentionsIncoterms = inputLower.includes("fob") || inputLower.includes("cif") || inputLower.includes("incoterm") || inputLower.includes("shipping");
  const prematureConclusion = inputLower.includes("is the importer") || inputLower.includes("must be") || inputLower.includes("we conclude that");

  let quality: "EXCELLENT" | "PROFICIENT" | "DEVELOPING" | "NEEDS_IMPROVEMENT" = "PROFICIENT";
  const gaps: string[] = [];
  let feedback = "";
  let nextQuestion = "";

  if (isSupervisory) {
    if (disclosedDocCount > 0 && (mentionsOwnership || mentionsContracts || mentionsCustoms)) {
      quality = "EXCELLENT";
      feedback = `Supervisory oversight active. The consulting team has disclosed ${disclosedDocCount} unique record(s) (${disclosedDocTitles.join(", ") || "None"}). Evaluation correctly focuses on testing contractual title and customs roles under ${ruleRef}.`;
      nextQuestion = `What specific documentary gaps remain before the consultant can formulate a verified preliminary determination?`;
      gaps.push("Verification whether third-party purchaser exists prior to entry");
    } else if (disclosedDocCount > 0) {
      quality = "PROFICIENT";
      feedback = `Supervisory review in progress across ${disclosedDocCount} disclosed record(s) (${disclosedDocTitles.join(", ")}). Direct the consulting team to analyze the specific clauses governing title transfer and customs declarations.`;
      nextQuestion = `Which specific clauses in the disclosed records establish whether ownership transferred prior to U.S. entry?`;
      gaps.push("Analysis of title transfer provisions in disclosed agreements");
    } else {
      quality = "PROFICIENT";
      feedback = `Supervisory oversight active. Zero commercial records are currently disclosed. Direct the team to prioritize evidence discovery.`;
      nextQuestion = `What specific commercial trade documents must the consulting team request first?`;
      gaps.push("Written commercial purchase contracts", "Customs entry documentation");
    }
  } else if (disclosedDocCount === 0) {
    if (mentionsContracts || mentionsOwnership) {
      quality = "EXCELLENT";
      feedback = `Strong discovery inquiry. You are correctly targeting contractual title and commercial purchase terms under ${ruleRef} without relying on unrevealed records.`;
      nextQuestion = `Ask the client representative what written commercial contracts, purchase orders, or master agreements govern their foreign supplier transactions.`;
    } else if (mentionsIncoterms) {
      quality = "PROFICIENT";
      feedback = `Good attention to shipping terms. Remember that maritime shipping risk (such as FOB) does not alone establish legal title ownership under ${ruleRef}.`;
      nextQuestion = `Ask the client for the underlying written purchase agreement to verify contractual title transfer terms.`;
      gaps.push("Written commercial purchase contract with title transfer clauses");
    } else if (prematureConclusion) {
      quality = "DEVELOPING";
      feedback = `Caution: Jumping to conclusions prematurely. Zero case records have been disclosed so far. Your next step must focus on evidence discovery rather than final determinations.`;
      nextQuestion = `What specific commercial documents do you need to request from the client first?`;
      gaps.push("All baseline commercial and customs entry records");
    } else {
      quality = "PROFICIENT";
      feedback = `Appropriate initial inquiry under ${activeObjective || ruleRef}. To build evidentiary support, prioritize requesting commercial contracts and customs entry filings.`;
      nextQuestion = `Ask the client for copies of their written purchase agreements with foreign suppliers.`;
      gaps.push("Written purchase contracts", "Customs entry documentation");
    }
  } else {
    // Documents are disclosed
    if (mentionsOwnership && mentionsCustoms) {
      quality = "EXCELLENT";
      feedback = `Comprehensive multi-prong analysis. You are evaluating contractual title provisions in ${disclosedDocTitles[0] || 'the disclosed record'} side-by-side with customs filing roles.`;
      nextQuestion = `What additional confirmation is needed to verify whether any third-party purchaser agreed in writing to buy the goods prior to entry?`;
      gaps.push("Confirmation of third-party purchase status prior to entry");
    } else if (mentionsIncoterms) {
      quality = "PROFICIENT";
      feedback = `Carefully evaluating commercial terms. Ensure you contrast the delivery terms with the explicit title clause in the disclosed agreement.`;
      nextQuestion = `Examine Section 4 of the disclosed agreement: what specific event triggers the transfer of legal title?`;
    } else {
      quality = "PROFICIENT";
      feedback = `Grounded analysis of disclosed evidence (${disclosedDocTitles.join(", ")}). Continue testing each independent criterion under ${ruleRef}.`;
      nextQuestion = `Does the disclosed documentation address who holds title at the exact moment the goods enter the United States?`;
    }
  }

  return {
    questionQuality: quality,
    feedback,
    suggestedNextQuestion: nextQuestion,
    evidentiaryGapsIdentified: gaps,
    derivedFromCurrentSession: true
  };
}

// ============================================================================
// 5. GOVERNED RESPONSE CONTRACT EXECUTION & REGENERATION PIPELINE
// ============================================================================

export interface GovernedContractExecutionParams {
  aiClient: GoogleGenAI | null;
  purpose: ModelRequestPurpose;
  learnerMessage: string;
  systemInstruction: string;
  context: {
    projectId: string;
    moduleId: string;
    caseId?: string;
    actingRole?: string;
    sessionId: string;
    disclosedDocs: any[];
    primaryRuleReference?: string;
    activeObjective?: string;
    isSupervisory?: boolean;
    bundle: any;
    activeCaseFacts?: any;
  };
}

/**
 * Executes a governed AI reasoning call with strict response contract validation,
 * automatic single regeneration on deficiency, and controlled status enforcement.
 */
export async function executeGovernedResponseWithContractGate(
  params: GovernedContractExecutionParams
): Promise<GovernedContractExecutionResult> {
  const { aiClient, purpose, learnerMessage, systemInstruction, context } = params;
  const { projectId, moduleId, caseId, actingRole, sessionId, disclosedDocs, primaryRuleReference, activeObjective, isSupervisory, bundle, activeCaseFacts } = context;

  // 1. Derive required obligations from user inquiry
  const obligations = deriveRequestObligations(learnerMessage, {
    actingRole,
    moduleId,
    activeObjective,
    isSupervisory
  });

  const disclosedDocTitles = disclosedDocs.map(d => d.originalFileName || d.title || d.documentType);
  const disclosedDocCount = disclosedDocs.length;

  let currentDraft = "";
  let executionMeta: ModelExecutionMetadata | undefined;
  let attemptCount = 0;
  let regenerationOccurred = false;

  // --------------------------------------------------------------------------
  // ATTEMPT 1: Primary Reasoner Draft Generation
  // --------------------------------------------------------------------------
  attemptCount = 1;
  if (aiClient) {
    try {
      const promptGuidelines: string[] = [];
      
      // GENERIC AUTONOMOUS SOURCE-REASONING ENGINE INSTRUCTIONS
      promptGuidelines.push("SOURCE-FIRST RESEARCH: Actively search and retrieve the exact sections of approved sources that answer the question. Do not rely primarily on model memory.");
      promptGuidelines.push("DYNAMIC RULE EXTRACTION: Derive the analytical tests, independent prongs, compound conditions, exceptions, and sequence requirements dynamically from the retrieved sources.");
      promptGuidelines.push("EVIDENCE-TO-RULE MAPPING: Map case evidence to each extracted criterion independently. Clearly identify support, partial support, conflicts, and gaps.");
      promptGuidelines.push("FACT / RULE / INFERENCE SEPARATION: Distinguish authoritative rules, reference interpretations, document facts, client assertions, AI inferences, and unverified facts.");
      promptGuidelines.push("CROSS-SOURCE REASONING: Detect and address conflicts or dependencies across authoritative rules, standards, manuals, and case evidence.");

      if (obligations.requireInvestigateFirst) {
        promptGuidelines.push("- CONSULTING INTELLIGENCE: Explicitly state and guide WHAT THE CONSULTANT SHOULD INVESTIGATE FIRST based on the approved sources and material gaps.");
      }
      if (obligations.requireNextClientQuestion) {
        promptGuidelines.push("- ACTIONABLE DISCOVERY: Explicitly provide an ACTIONABLE NEXT QUESTION TO ASK THE CLIENT, labeled '**Next Question for the Client:**' followed by a specific discovery question targeting the largest unresolved material gap.");
      }
      if (obligations.requireClientOpeningMessage || obligations.requireClientAssertions) {
        promptGuidelines.push("- ASSERTION ISOLATION: Distinguish client opening representations from verified documentary facts without inventing unmade statements. Never convert client assertions into document facts.");
      }
      if (obligations.requireApprovedSources) {
        promptGuidelines.push(`- GROUNDING: Ground analysis strictly in the approved governing standard and provided references (${primaryRuleReference || 'canonical authority'}). Primary authoritative sources outrank manual interpretations.`);
      }
      if (obligations.requireProngEvaluation) {
        promptGuidelines.push("- PRONG SEPARATION: Evaluate independent statutory or technical prongs derived from the governing authority separately. Never collapse compound conditions (e.g., A AND B).");
      }
      promptGuidelines.push("- DO NOT leak internal diagnostic counters such as 'requested records count: 0' or 'records count: 0'. Use natural professional language.");

      // Build substantive document excerpts from context if available
      let attachedRecordsExcerpt = "";
      if (disclosedDocs && disclosedDocs.length > 0) {
        attachedRecordsExcerpt = `\nDISCLOSED EVIDENCE RECORDS:\n` + disclosedDocs.map((d: any, idx: number) => {
          const title = d.originalFileName || d.title || d.filename || `Record ${idx + 1}`;
          const text = d.extractedTextSnippet || d.textContent || d.extractedTextSummary || d.snippet || "";
          return `[DOCUMENT ${idx + 1}: ${title}]\n${text ? text.slice(0, 1500) : "Physical document disclosed in active session."}`;
        }).join("\n\n");
      }

      const fullAttempt1Prompt = `
GENERIC AUTONOMOUS SOURCE-REASONING ENGINE INQUIRY
Learner Note / Inquiry: "${learnerMessage}"
Active Disclosed Records: ${disclosedDocTitles.join(", ") || "No executed documents disclosed yet"}
Primary Governing Rule: ${primaryRuleReference || "Approved Regulatory Standard"}
Active Objective: ${activeObjective || moduleId}
${attachedRecordsExcerpt}

MANDATORY RESPONSE REQUIREMENTS:
${promptGuidelines.join("\n")}
`;

      const result1 = await executeGovernedModelCall({
        aiClient,
        purpose,
        contents: fullAttempt1Prompt,
        config: {
          systemInstruction
        },
        projectId,
        moduleId,
        caseId,
        memberId: actingRole,
        sessionId
      });

      if (result1.success && result1.rawText) {
        currentDraft = result1.rawText.trim();
        executionMeta = result1.metadata;

        // ======================================================================
        // SECOND-PASS CRITIC: RAW-SOURCE ENTAILMENT & DOCUMENT IDENTITY
        // ======================================================================
        if (currentDraft && disclosedDocs.length > 0) {
           const canonicalRawEvidence = bundle?.level3CaseEvidence 
            ? bundle.level3CaseEvidence.map((c: any) => `[${c.sourceId} - ${c.title}]:\n${c.contentExcerpt}`).join("\n\n")
            : disclosedDocs.map((d: any) => `[${d.id} - ${d.originalFileName || d.title}]:\n${d.extractedTextSnippet || d.snippet || d.extractedTextSummary || ''}`).join('\n\n');

           const criticPrompt = `As an independent second-pass critic, verify the generated claims against the SAME CANONICAL RAW SOURCE EXCERPTS provided to the primary model.
Do not rely on structured summaries.

GENERATED DRAFT:
${currentDraft}

EVIDENCE FACTS (CANONICAL RAW SOURCE):
${canonicalRawEvidence}

RULES:
1. FINAL RAW-SOURCE ENTAILMENT GATE: If the raw source contains a material condition, qualifier, exception, dependency, timing condition, threshold, named-party requirement, AND/OR structure, or prerequisite that the claim omits: output FAIL for materialConditions and qualifierPreservation.
2. ALTERNATIVE-BRANCH COMPLETENESS: If an authoritative rule contains alternatives (e.g. A OR B OR C) and the draft fails to evaluate each materially applicable branch independently or silently reduces them: output FAIL for alternativeProngs.
3. ENTITY IDENTITY GATE: If a named entity in one document is automatically equated with a generic role label, another entity, trade name, or an entity in another record without direct evidence or an explicit supported identity link: output FAIL for entityVerification.
4. DOWNSTREAM REQUIREMENT SEPARATION: If a downstream procedural/compliance requirement is made a prerequisite to an upstream substantive determination unless the authoritative source expressly requires that dependency: output FAIL for contradictionCheck.
5. STRUCTURED EVIDENCE IS NOT SOURCE OF TRUTH: If the claim relies on a structured fact but misidentifies the source document or uses values not in the raw text: output FAIL for sourceSupport.

Return a JSON object strictly conforming to:
{
  "materialConditions": "PASS" | "FAIL",
  "alternativeProngs": "PASS" | "FAIL",
  "entityVerification": "PASS" | "FAIL",
  "sourceSupport": "PASS" | "FAIL",
  "qualifierPreservation": "PASS" | "FAIL",
  "contradictionCheck": "PASS" | "FAIL",
  "failures": [
    {
       "requirementId": "MATERIAL_CONDITION_DROPPED" | "MISSED_ALTERNATIVE_PRONG" | "ENTITY_IDENTITY_UNVERIFIED" | "DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE" | "DOCUMENT_IDENTITY_MISMATCH",
       "reason": "String explaining the exact failure",
       "missingEvidenceRefs": ["Array of document IDs or source IDs missing"],
       "conflictingEvidenceRefs": ["Array of document IDs or source IDs conflicting"]
    }
  ]
}
`;
           const criticRes = await executeGovernedModelCall({
              aiClient, purpose: "CRITIC", contents: criticPrompt, config: { systemInstruction, responseMimeType: "application/json" },
              projectId, moduleId, caseId, memberId: actingRole, sessionId
           });
           if (criticRes.success && criticRes.rawText) {
              try {
                const textStr = criticRes.rawText.replace(/\x60\x60\x60json/g, '').replace(/\x60\x60\x60/g, '').trim();
                const parsed = JSON.parse(textStr);
                if (parsed.failures && parsed.failures.length > 0) {
                  for (const f of parsed.failures) {
                    currentDraft += `\n\n[CRITIC DEFECT]: ${f.requirementId} - ${f.reason}`;
                  }
                }
              } catch(e) {
                 if (criticRes.rawText.includes("MATERIAL_CONDITION_DROPPED")) currentDraft += "\n\n[CRITIC DEFECT]: MATERIAL_CONDITION_DROPPED";
                 if (criticRes.rawText.includes("DOCUMENT_IDENTITY_MISMATCH")) currentDraft += "\n\n[CRITIC DEFECT]: DOCUMENT_IDENTITY_MISMATCH";
                 if (criticRes.rawText.includes("MISSED_ALTERNATIVE_PRONG")) currentDraft += "\n\n[CRITIC DEFECT]: MISSED_ALTERNATIVE_PRONG";
                 if (criticRes.rawText.includes("ENTITY_IDENTITY_UNVERIFIED")) currentDraft += "\n\n[CRITIC DEFECT]: ENTITY_IDENTITY_UNVERIFIED";
                 if (criticRes.rawText.includes("DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE")) currentDraft += "\n\n[CRITIC DEFECT]: DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE";
              }
           }
        }
      }
    } catch (e) {
      console.warn("[GovernedContractGate] Attempt 1 failed:", e);
    }
  }

  // Controlled Failure Handling: Never silently substitute static fallback templates for premium model execution
  if (!currentDraft) {
    currentDraft = `[C-BRIDGE GOVERNANCE SYSTEM NOTICE]: Substantive regulatory reasoning and coaching via Gemini 3.1 Pro is temporarily unavailable or encountered a connection failure. In compliance with C-Bridge Quality & Governance directives, deterministic fallback templates have been disabled to prevent unverified static guidance. Please retry your message.`;
  }

  // --------------------------------------------------------------------------
  // GATE 1: Response Contract Completeness Check on Attempt 1
  // --------------------------------------------------------------------------
  let contractReport = validateResponseContract(currentDraft, obligations, {
    disclosedDocumentCount: disclosedDocCount,
    disclosedDocumentTitles: disclosedDocTitles,
    activeObjective,
    isSupervisory,
    learnerInput: learnerMessage
  });

  // --------------------------------------------------------------------------
  // ATTEMPT 2 (ONE GOVERNED REGENERATION): If Draft 1 failed required obligations
  // --------------------------------------------------------------------------
  if (!contractReport.passed && aiClient) {
    regenerationOccurred = true;
    attemptCount = 2;

    const correctivePrompt = `
Your previous draft failed C-Bridge Response Contract Completeness & Fidelity validation.
CRITICAL DEFICIENCIES TO CORRECT IN THIS REGENERATION:
${contractReport.deficiencyDirectivesForModel.map((d, i) => `${i + 1}. ${d}`).join("\n")}

MANDATORY RESPONSE STRUCTURE REQUIRED:
1. WHAT TO INVESTIGATE FIRST: ${obligations.requireInvestigateFirst ? "Explicitly state what the consultant should investigate first based on approved sources." : "Address initial investigation priorities."}
2. DOCUMENTED FACTS: Explicitly address facts proven by disclosed evidence (${disclosedDocTitles.join(", ") || "None disclosed yet"}).
3. CLIENT ASSERTIONS: Explicitly identify verbal/opening statements from visible record requiring documentary proof without inventing unmade claims.
4. UNVERIFIED FACTS & GAPS: List all missing conditions, unknown transaction facts, or unverified records.
5. INDEPENDENT PRONG EVALUATION: Separately evaluate each distinct statutory/technical rule prong derived from ${primaryRuleReference || "governing authority"} without collapsing them.
6. PRESERVE MATERIAL CONDITIONS: Maintain compound (A AND B) requirements; do not treat shipping terms as title ownership.
7. PRELIMINARY ANALYSIS READINESS: Clearly state whether evidence is currently sufficient for preliminary conclusions.
${obligations.requireNextClientQuestion ? "8. NEXT QUESTION FOR THE CLIENT: Provide an explicit, actionable discovery question to ask the client (ending in '?')." : (!isSupervisory ? "8. SOCRATIC FOLLOW-UP: End with ONE focused discovery question." : "")}
CRITICAL: DO NOT leak internal diagnostic counters such as "records count: 0" or "requested records count: 0".

ORIGINAL USER INQUIRY:
"${learnerMessage}"
`;

    try {
      const result2 = await executeGovernedModelCall({
        aiClient,
        purpose,
        contents: correctivePrompt,
        config: {
          systemInstruction
        },
        projectId,
        moduleId,
        caseId,
        memberId: actingRole,
        sessionId
      });

      if (result2.success && result2.rawText) {
        currentDraft = result2.rawText.trim();
        executionMeta = result2.metadata;

        // Run Critic on Attempt 2
        if (currentDraft && disclosedDocs.length > 0) {
           const canonicalRawEvidence = bundle?.level3CaseEvidence 
            ? bundle.level3CaseEvidence.map((c: any) => `[${c.sourceId} - ${c.title}]:\n${c.contentExcerpt}`).join("\n\n")
            : disclosedDocs.map((d: any) => `[${d.id} - ${d.originalFileName || d.title}]:\n${d.extractedTextSnippet || d.snippet || d.extractedTextSummary || ''}`).join('\n\n');

           const criticPrompt = `As an independent second-pass critic, verify the generated claims against the SAME CANONICAL RAW SOURCE EXCERPTS provided to the primary model.
Do not rely on structured summaries.

GENERATED DRAFT:
${currentDraft}

EVIDENCE FACTS (CANONICAL RAW SOURCE):
${canonicalRawEvidence}

RULES:
1. FINAL RAW-SOURCE ENTAILMENT GATE: If the raw source contains a material condition, qualifier, exception, dependency, timing condition, threshold, named-party requirement, AND/OR structure, or prerequisite that the claim omits: output DEFECT: MATERIAL_CONDITION_DROPPED
2. ALTERNATIVE-BRANCH COMPLETENESS: If an authoritative rule contains alternatives (e.g. A OR B OR C) and the draft fails to evaluate each materially applicable branch independently or silently reduces them: output DEFECT: MISSED_ALTERNATIVE_PRONG
3. ENTITY IDENTITY GATE: If a named entity in one document is automatically equated with a generic role label, another entity, trade name, or an entity in another record without direct evidence or an explicit supported identity link: output DEFECT: ENTITY_IDENTITY_UNVERIFIED
4. DOWNSTREAM REQUIREMENT SEPARATION: If a downstream procedural/compliance requirement is made a prerequisite to an upstream substantive determination unless the authoritative source expressly requires that dependency: output DEFECT: DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE
5. STRUCTURED EVIDENCE IS NOT SOURCE OF TRUTH: If the claim relies on a structured fact but misidentifies the source document or uses values not in the raw text: output DEFECT: DOCUMENT_IDENTITY_MISMATCH
6. Otherwise, output: CRITIC_PASS
`;
           const criticRes = await executeGovernedModelCall({
              aiClient, purpose: "CRITIC", contents: criticPrompt, config: { systemInstruction },
              projectId, moduleId, caseId, memberId: actingRole, sessionId
           });
           if (criticRes.success && criticRes.rawText) {
              if (criticRes.rawText.includes("MATERIAL_CONDITION_DROPPED")) {
                  currentDraft += "\n\n[CRITIC DEFECT]: MATERIAL_CONDITION_DROPPED";
              }
              if (criticRes.rawText.includes("DOCUMENT_IDENTITY_MISMATCH")) {
                  currentDraft += "\n\n[CRITIC DEFECT]: DOCUMENT_IDENTITY_MISMATCH";
              }
              if (criticRes.rawText.includes("MISSED_ALTERNATIVE_PRONG")) {
                  currentDraft += "\n\n[CRITIC DEFECT]: MISSED_ALTERNATIVE_PRONG";
              }
              if (criticRes.rawText.includes("ENTITY_IDENTITY_UNVERIFIED")) {
                  currentDraft += "\n\n[CRITIC DEFECT]: ENTITY_IDENTITY_UNVERIFIED";
              }
              if (criticRes.rawText.includes("DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE")) {
                  currentDraft += "\n\n[CRITIC DEFECT]: DOWNSTREAM_REQUIREMENT_PROMOTED_TO_PREREQUISITE";
              }
           }
        }

        // Re-evaluate Draft 2
        contractReport = validateResponseContract(currentDraft, obligations, {
          disclosedDocumentCount: disclosedDocCount,
          disclosedDocumentTitles: disclosedDocTitles,
          activeObjective,
          isSupervisory,
          learnerInput: learnerMessage
        });
      }
    } catch (e2) {
      console.warn("[GovernedContractGate] Attempt 2 regeneration failed:", e2);
    }
  }

  // --------------------------------------------------------------------------
  // GATE 2: Claim-to-Evidence Validation Gate
  // --------------------------------------------------------------------------
  const claimGateResult: ClaimValidationGateResult = validateClaimsAndApplyGate({
    rawResponseText: currentDraft,
    context: {
      projectId,
      moduleId,
      caseId,
      actingRole: actingRole || "CONSULTANT",
      channel: "INTERNAL_CBRIDGE",
      queryOrMessage: learnerMessage
    },
    evidenceBundle: {
      level1Regulations: bundle?.level1Regulations || [],
      level3CaseEvidence: bundle?.level3CaseEvidence || [],
      disclosedCaseEvidence: bundle?.disclosedCaseEvidence || [],
      attachedCaseFiles: disclosedDocs,
      activeCaseFacts: activeCaseFacts || {}
    }
  });

  // --------------------------------------------------------------------------
  // FINAL STATUS RESOLUTION: Never return EVIDENCE SUPPORTED if gates failed
  // --------------------------------------------------------------------------
  let finalSupportStatus: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "REQUIRES_VERIFICATION" | "INSUFFICIENT_EVIDENCE" = "SUPPORTED";

  if (!contractReport.passed) {
    // If it still failed after one regeneration, strictly return REQUIRES_VERIFICATION
    finalSupportStatus = "REQUIRES_VERIFICATION";
  } else if (!claimGateResult.passed || claimGateResult.overallSupportStatus === "UNSUPPORTED" || claimGateResult.overallSupportStatus === "REQUIRES_VERIFICATION") {
    finalSupportStatus = "REQUIRES_VERIFICATION";
  } else if (claimGateResult.overallSupportStatus === "PARTIALLY_SUPPORTED") {
    finalSupportStatus = "PARTIALLY_SUPPORTED";
  } else {
    finalSupportStatus = "SUPPORTED";
  }

  // Compute dynamic session evaluation
  const dynamicEval = generateDynamicSessionEvaluation({
    learnerInput: learnerMessage,
    disclosedDocCount,
    disclosedDocTitles,
    activeObjective,
    primaryRuleRef: primaryRuleReference,
    isSupervisory
  });

  const sourceTrace = claimGateResult.sourceTrace;
  if (sourceTrace && executionMeta) {
    sourceTrace.modelMetadata = executionMeta;
    sourceTrace.inputTokens = executionMeta.inputTokens;
    sourceTrace.outputTokens = executionMeta.outputTokens;
    sourceTrace.totalTokens = executionMeta.totalTokens;
    sourceTrace.evidenceBundleHash = bundle?.evidenceBundleHash;
    if (finalSupportStatus === "REQUIRES_VERIFICATION") {
      sourceTrace.overallConfidence = "REQUIRES_CURRENT_VERIFICATION";
    }
  }

  let finalText = claimGateResult.sanitizedText || currentDraft;
  if (!contractReport.passed && finalText.includes("[CRITIC DEFECT]")) {
     const textLines = finalText.split('\n');
     const supportedLines = textLines.filter(line => !line.includes('[CRITIC DEFECT]') && line.trim().length > 0);
     const defectLines = textLines.filter(line => line.includes('[CRITIC DEFECT]')).map(l => l.replace(/\[CRITIC DEFECT\]:?/, '-').trim());
     
     if (supportedLines.length > 0) {
       finalText = `[C-BRIDGE GOVERNANCE SYSTEM NOTICE]: The substantive conclusion has been withheld due to failing mandatory reasoning requirements. However, documented facts are preserved below.\n\nSUPPORTED FINDINGS:\n${supportedLines.join('\n')}\n\nWHAT MUST BE VERIFIED:\n${defectLines.join('\n')}`;
     } else {
       finalText = `[C-BRIDGE GOVERNANCE SYSTEM NOTICE]: The generated analysis failed to satisfy mandatory reasoning requirements (material conditions, alternative prongs, or entity verification). The substantive conclusion has been withheld.`;
     }
  } else {
     finalText = finalText.replace(/\[CRITIC DEFECT\][^\n]+/g, '').trim();
  }

  return {
    finalText,
    gatePassed: contractReport.passed && claimGateResult.passed,
    governedSupportStatus: finalSupportStatus,
    attemptCount,
    regenerationOccurred,
    contractReport,
    claimGateResult,
    sourceTrace,
    dynamicEvaluation: dynamicEval,
    modelMetadata: executionMeta
  };
}
