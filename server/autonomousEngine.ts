import { GoogleGenAI } from "@google/genai";
import { executeGovernedModelCall } from "./modelRouter";

// Types
export interface RuleElement {
  id: string;
  sourceText: string;
  logicalOperator: "AND" | "OR" | "NONE";
  condition: string;
}

export interface AnalyticalStructure {
  obligations: string[];
  rules: RuleElement[];
}

export async function extractAnalyticalStructure(aiClient: GoogleGenAI, query: string, sources: string): Promise<AnalyticalStructure> {
  const prompt = `Analyze the query and the provided sources. Extract the analytical structure required to answer the query. Do not hardcode specific domains.
Query: ${query}
Sources: ${sources}

Return JSON with "obligations" (array of strings) and "rules" (array of { id, sourceText, logicalOperator, condition }). Ensure compound conditions (A AND B) are separated.
`;
  
  const res = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
    }
  });

  return JSON.parse(res.text || "{}");
}
