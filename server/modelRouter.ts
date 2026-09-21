/**
 * C-BRIDGE GENERIC AI MODEL ROUTER & GOVERNANCE PIPELINE
 * ======================================================================
 * Centralized, multi-purpose model router for C-Bridge Operating Platform.
 * 
 * PILOT CONFIGURATION:
 * Routes all substantive Case Room and regulatory reasoning functions to:
 *   gemini-3.1-pro-preview
 * 
 * SUBSTANTIVE PILOT FUNCTIONS:
 * - AI_COACH
 * - CLIENT_SIMULATION
 * - DOCUMENT_ANALYSIS
 * - REGULATORY_ANALYSIS
 * - EVIDENCE_REASONING
 * - CLAIM_VALIDATION
 * - SOURCE_GROUNDED_CASE_REASONING
 * 
 * CORE ARCHITECTURAL CONSTRAINTS:
 * 1. Strictly generic: No hardcoded project/case/member IDs in router logic.
 * 2. High reasoning quality: Configured for depth, source fidelity, condition preservation,
 *    multi-document reasoning, contradiction detection, and missing-evidence discovery.
 * 3. NO SILENT FALLBACK: If premium reasoning model is unavailable or errors on a substantive
 *    regulatory task, it returns a controlled status (PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE)
 *    and enables explicit retry, rather than silently downgrading to a lower-tier model.
 * 4. Model Observability: Persists modelProvider, modelId, modelVersion, requestPurpose,
 *    createdAt, and exact input/output token usage per execution.
 * 5. Cost Control: Records token counts and request purpose for granular cost reporting.
 */

import { GoogleGenAI, ThinkingLevel } from "@google/genai";

let sharedGenAiClient: GoogleGenAI | null = null;
export function getSharedGeminiClient(): GoogleGenAI | null {
  if (!sharedGenAiClient && process.env.GEMINI_API_KEY) {
    sharedGenAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return sharedGenAiClient;
}

export type ModelRequestPurpose =
  | "AI_COACH"
  | "COACH_FILE_ANALYSIS"
  | "CLIENT_SIMULATION"
  | "DOCUMENT_ANALYSIS"
  | "REGULATORY_ANALYSIS"
  | "CRITIC"
  | "EVIDENCE_REASONING"
  | "CLAIM_VALIDATION"
  | "SOURCE_GROUNDED_CASE_REASONING"
  | "LEARNING_EVALUATOR"
  | "UI_NAVIGATION"
  | "GENERAL_ASSIST";

export interface ModelExecutionMetadata {
  modelProvider: "GOOGLE";
  modelId: string;
  modelVersion?: string;
  requestPurpose: ModelRequestPurpose;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  createdAt: string;
  isSubstantive: boolean;
  status: "SUCCESS" | "PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE" | "ERROR";
  fallbackApplied?: boolean;
  fallbackReason?: string;
  latencyMs?: number;
  thinkingLevel?: string;
}

export interface ModelExecutionResult<T = any> {
  success: boolean;
  status: "SUCCESS" | "PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE" | "ERROR";
  data?: T;
  rawText?: string;
  error?: string;
  canRetry?: boolean;
  metadata: ModelExecutionMetadata;
}

export interface GovernedModelCallParams {
  aiClient: GoogleGenAI | null;
  purpose: ModelRequestPurpose;
  contents: any;
  config?: any;
  projectId?: string;
  moduleId?: string;
  caseId?: string;
  memberId?: string;
  sessionId?: string;
  dbLogger?: (log: any) => Promise<void>;
}

// Current Pilot Premium Reasoning Model Default
export const PILOT_PREMIUM_REASONING_MODEL = "gemini-3.1-pro-preview";
export const NON_SUBSTANTIVE_DEFAULT_MODEL = "gemini-3.7-flash";

/**
 * Resolves the configured model ID for any given purpose.
 * Generic and independently configurable via environment variables without code redesign.
 */
export function resolveModelForPurpose(purpose: ModelRequestPurpose): string {
  const premiumOverride = process.env.PREMIUM_REASONING_MODEL || PILOT_PREMIUM_REASONING_MODEL;

  switch (purpose) {
    case "AI_COACH":
    case "COACH_FILE_ANALYSIS":
      return process.env.AI_COACH_MODEL || premiumOverride;
    case "CLIENT_SIMULATION":
      return process.env.CLIENT_SIMULATION_MODEL || premiumOverride;
    case "DOCUMENT_ANALYSIS":
      return process.env.DOCUMENT_ANALYSIS_MODEL || premiumOverride;
    case "REGULATORY_ANALYSIS":
      return process.env.REGULATORY_REASONING_MODEL || premiumOverride;
    case "CLAIM_VALIDATION":
      return process.env.CLAIM_VALIDATION_MODEL || premiumOverride;
    case "EVIDENCE_REASONING":
      return process.env.EVIDENCE_REASONING_MODEL || premiumOverride;
    case "SOURCE_GROUNDED_CASE_REASONING":
      return process.env.SOURCE_GROUNDED_CASE_REASONING_MODEL || premiumOverride;
    case "LEARNING_EVALUATOR":
      return process.env.LEARNING_EVALUATOR_MODEL || premiumOverride;
    case "UI_NAVIGATION":
    case "GENERAL_ASSIST":
      return process.env.GENERAL_ASSIST_MODEL || NON_SUBSTANTIVE_DEFAULT_MODEL;
    default:
      return premiumOverride;
  }
}

/**
 * Determines whether a given request purpose represents substantive regulatory reasoning
 * that must not undergo silent lower-tier fallback.
 */
export function isSubstantiveRegulatoryPurpose(purpose: ModelRequestPurpose): boolean {
  return [
    "AI_COACH",
    "COACH_FILE_ANALYSIS",
    "CLIENT_SIMULATION",
    "DOCUMENT_ANALYSIS",
    "REGULATORY_ANALYSIS",
    "EVIDENCE_REASONING",
    "CLAIM_VALIDATION",
    "SOURCE_GROUNDED_CASE_REASONING",
    "LEARNING_EVALUATOR"
  ].includes(purpose);
}

/**
 * Returns the current active routing table for all platform reasoning functions.
 */
export function getActiveModelRoutingTable(): Record<string, string> {
  return {
    CLIENT_SIMULATION_MODEL: resolveModelForPurpose("CLIENT_SIMULATION"),
    AI_COACH_MODEL: resolveModelForPurpose("AI_COACH"),
    DOCUMENT_ANALYSIS_MODEL: resolveModelForPurpose("DOCUMENT_ANALYSIS"),
    REGULATORY_REASONING_MODEL: resolveModelForPurpose("REGULATORY_ANALYSIS"),
    CLAIM_VALIDATION_MODEL: resolveModelForPurpose("CLAIM_VALIDATION"),
    EVIDENCE_REASONING_MODEL: resolveModelForPurpose("EVIDENCE_REASONING"),
    SOURCE_GROUNDED_CASE_REASONING_MODEL: resolveModelForPurpose("SOURCE_GROUNDED_CASE_REASONING"),
    LEARNING_EVALUATOR_MODEL: resolveModelForPurpose("LEARNING_EVALUATOR"),
    UI_NAVIGATION_MODEL: resolveModelForPurpose("UI_NAVIGATION")
  };
}

/**
 * Executes a governed model call with strict observability, token accounting,
 * high reasoning configuration, and controlled failure handling (no silent fallback).
 */
export async function executeGovernedModelCall(
  params: GovernedModelCallParams
): Promise<ModelExecutionResult> {
  const startTime = Date.now();
  const { aiClient, purpose, contents, config = {}, projectId, moduleId, caseId, memberId, sessionId, dbLogger } = params;
  const isSubstantive = isSubstantiveRegulatoryPurpose(purpose);
  const targetModel = resolveModelForPurpose(purpose);
  const createdAt = new Date().toISOString();

  // 1. Availability Check
  const activeClient = aiClient || getSharedGeminiClient();
  if (!activeClient) {
    const unavailableMeta: ModelExecutionMetadata = {
      modelProvider: "GOOGLE",
      modelId: targetModel,
      requestPurpose: purpose,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      createdAt,
      isSubstantive,
      status: "PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE",
      fallbackApplied: false,
      fallbackReason: "Google GenAI client unavailable or GEMINI_API_KEY uninitialized.",
      latencyMs: 0
    };

    return {
      success: false,
      status: "PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE",
      error: `Premium reasoning model (${targetModel}) is temporarily unavailable. Substantive regulatory operations require authorized premium reasoning and will not silently fallback to lower-capability models.`,
      canRetry: true,
      metadata: unavailableMeta
    };
  }

  // 2. High Reasoning Quality Configuration
  const isGemini3Pro = targetModel.includes("gemini-3.1-pro") || targetModel.includes("gemini-3-pro");
  const isGemini3 = targetModel.includes("gemini-3");

  const enhancedConfig: any = {
    ...config
  };

  // For Gemini 3 Pro series, thinkingLevel HIGH provides deep reasoning, multi-document synthesis & contradiction detection
  if (isGemini3 && !enhancedConfig.thinkingConfig && isSubstantive) {
    enhancedConfig.thinkingConfig = {
      thinkingLevel: ThinkingLevel.HIGH
    };
  }

  try {
    let response;
    try {
      response = await activeClient.models.generateContent({
        model: targetModel,
        contents,
        config: enhancedConfig
      });
    } catch (primaryErr: any) {
      // If advanced config parameter was rejected, retry cleanly with base config
      if (enhancedConfig.thinkingConfig) {
        console.warn(`[ModelRouter] Retrying ${targetModel} without thinkingConfig:`, primaryErr?.message || primaryErr);
        response = await activeClient.models.generateContent({
          model: targetModel,
          contents,
          config: { ...config }
        });
      } else {
        throw primaryErr;
      }
    }

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = response.usageMetadata?.totalTokenCount || (inputTokens + outputTokens);

    const successMeta: ModelExecutionMetadata = {
      modelProvider: "GOOGLE",
      modelId: targetModel,
      modelVersion: response.modelVersion || "preview",
      requestPurpose: purpose,
      inputTokens,
      outputTokens,
      totalTokens,
      createdAt,
      isSubstantive,
      status: "SUCCESS",
      fallbackApplied: false,
      latencyMs,
      thinkingLevel: enhancedConfig.thinkingConfig?.thinkingLevel || (isGemini3Pro ? "HIGH" : undefined)
    };

    // Asynchronously log execution for cost governance & audit
    if (dbLogger) {
      dbLogger({
        ...successMeta,
        projectId: projectId || "GENERAL",
        moduleId: moduleId || "GENERAL",
        caseId: caseId || "GENERAL",
        memberId: memberId || "ANONYMOUS",
        sessionId: sessionId || "GENERAL"
      }).catch(err => console.warn("[ModelRouter Logger Warning]:", err));
    }

    return {
      success: true,
      status: "SUCCESS",
      rawText: response.text || "",
      metadata: successMeta
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error(`[ModelRouter Execution Error] Purpose: ${purpose}, Model: ${targetModel}:`, err);

    if (isSubstantive) {
      // STRICT RULE: No silent downgrade for substantive regulatory reasoning
      const failedMeta: ModelExecutionMetadata = {
        modelProvider: "GOOGLE",
        modelId: targetModel,
        requestPurpose: purpose,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        createdAt,
        isSubstantive: true,
        status: "PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE",
        fallbackApplied: false,
        fallbackReason: err?.message || "Model execution error or rate limit",
        latencyMs
      };

      if (dbLogger) {
        dbLogger({
          ...failedMeta,
          projectId: projectId || "GENERAL",
          moduleId: moduleId || "GENERAL",
          caseId: caseId || "GENERAL",
          memberId: memberId || "ANONYMOUS",
          sessionId: sessionId || "GENERAL",
          errorMessage: err?.message
        }).catch(lErr => console.warn("[ModelRouter Logger Warning]:", lErr));
      }

      return {
        success: false,
        status: "PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE",
        error: `PREMIUM_REASONING_TEMPORARILY_UNAVAILABLE: Premium reasoning model (${targetModel}) encountered an issue (${err?.message || 'Rate limited or service busy'}). Silent downgrade is disabled for substantive regulatory analysis. Please retry shortly.`,
        canRetry: true,
        metadata: failedMeta
      };
    }

    // Non-substantive operations can return normal ERROR status
    const errorMeta: ModelExecutionMetadata = {
      modelProvider: "GOOGLE",
      modelId: targetModel,
      requestPurpose: purpose,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      createdAt,
      isSubstantive: false,
      status: "ERROR",
      fallbackApplied: false,
      fallbackReason: err?.message || "Execution error",
      latencyMs
    };

    return {
      success: false,
      status: "ERROR",
      error: err?.message || "Non-substantive AI operation failed.",
      canRetry: true,
      metadata: errorMeta
    };
  }
}
