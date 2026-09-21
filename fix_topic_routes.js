import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Replace analyze-sources ID generation
const analyzeSourcesRegex = /(const parsed = JSON\.parse\(result\.rawText\.trim\(\)\);\n\s*)(requirementsMap = \{)/;
code = code.replace(analyzeSourcesRegex, `$1
          if (parsed && Array.isArray(parsed.requirements)) {
             parsed.requirements.forEach((req, index) => {
                req.moduleId = moduleId || "MA-324-01";
                const hashInput = req.title || req.description || \`\${index}\`;
                let hash = 0;
                for (let i = 0; i < hashInput.length; i++) {
                   hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
                   hash |= 0;
                }
                const stableHash = Math.abs(hash).toString(16).substring(0, 8);
                req.id = \`REQ-\${req.moduleId}-\${stableHash}\`;
             });
          }
          $2`);

// Replace POST /api/module-study/generate-topics
const generateRegex = /app\.post\("\/api\/module-study\/generate-topics"[\s\S]*?\n\}\);\n/m;
const generateReplacement = `app.post("/api/module-study/generate-topics", async (req: any, res: any) => {
  try {
    const { projectId, moduleId, requirementsMapId } = req.body;
    if (!projectId || !moduleId) {
      return res.status(400).json({ error: "projectId and moduleId are required" });
    }

    let reqMap: any = null;
    const db = getDb();
    if (db) {
      const maps = await fetchCollectionDocs("module_requirements_maps");
      reqMap = maps.find((m: any) => m.projectId === projectId && m.moduleId === moduleId && (requirementsMapId ? m.id === requirementsMapId : true));
    } else {
      reqMap = getStoreCollection("module_requirements_maps").get(requirementsMapId);
    }
    
    if (!reqMap || reqMap.moduleId !== moduleId || !reqMap.requirements || reqMap.requirements.length === 0) {
      return res.json({ success: false, status: 'STUDY_MODULE_REQUIREMENTS_UNAVAILABLE' });
    }

    const ai = getGeminiClient();
    let topics: any[] = [];
    
    if (ai) {
      try {
        const canonicalReqsStr = JSON.stringify(reqMap.requirements, null, 2);
        const prompt = \`
You are the C-Bridge Consulting Practice Topic Map Generator.
Generate 3 distinct, grounded consulting practice topics for Module (\${moduleId}) in \${projectId}.

CRITICAL RULE: CANONICAL REQUIREMENTS ONLY
- You are provided with the CANONICAL REQUIREMENTS MAP for this module.
- You MAY ONLY use requirement IDs that appear in this map.
- ONLY supply canonical requirement IDs in 'moduleRequirementsCovered'.
- Classify topics as PRIMARY_MODULE_TOPIC or CROSS_MODULE_REFERENCE.
- If it covers primarily current module requirements, it is PRIMARY_MODULE_TOPIC.
- If it is a CROSS_MODULE_REFERENCE, you MUST provide sourceModuleId and sourceRequirementId, and set countsTowardCurrentCompletion = false.

CANONICAL REQUIREMENTS MAP:
\${canonicalReqsStr}

Return a JSON array of objects with:
[
  {
    "id": "TOPIC-...",
    "topicName": "...",
    "whyThisTopicExists": "...",
    "moduleObjectivesCovered": ["OBJ-01"],
    "moduleRequirementsCovered": ["REQ-ID-1"],
    "supportingSources": ["SRC-1"],
    "regulatoryReferences": ["21 CFR..."],
    "aiInterpretation": "...",
    "relevanceCategory": "PRIMARY_MODULE_TOPIC",
    "crossModuleNote": "",
    "suggestedDiagnosticGoal": "..."
  }
]
\`;
        const result = await executeGovernedModelCall({
          aiClient: ai,
          purpose: "DOCUMENT_ANALYSIS",
          contents: prompt,
          config: { responseMimeType: "application/json" },
          projectId,
          moduleId
        });
        
        if (result.success && result.rawText) {
          const parsed = JSON.parse(result.rawText.trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
             let validPrimaryTopics = 0;
             const validatedTopics = [];
             for (const t of parsed) {
                if (!Array.isArray(t.moduleRequirementsCovered)) continue;

                let isValidPrimary = true;
                if (t.relevanceCategory === "PRIMARY_MODULE_TOPIC") {
                   for (const reqId of t.moduleRequirementsCovered) {
                      const foundReq = reqMap.requirements.find((r: any) => r.id === reqId);
                      if (!foundReq || foundReq.moduleId !== moduleId) {
                         isValidPrimary = false;
                      }
                   }
                   if (t.moduleRequirementsCovered.length === 0) isValidPrimary = false;
                }

                if (t.relevanceCategory === "PRIMARY_MODULE_TOPIC" && !isValidPrimary) {
                   return res.json({ success: false, status: 'STUDY_TOPIC_VALIDATION_FAILED' });
                }
                
                if (t.relevanceCategory === "CROSS_MODULE_REFERENCE") {
                  t.countsTowardCurrentCompletion = false;
                  t.countsTowardCurrentAssessment = false;
                }

                validatedTopics.push({
                  ...t,
                  projectId,
                  moduleId,
                  isSelected: false,
                  modelMetadata: result.metadata
                });
             }

             if (validatedTopics.length > 0) {
                validatedTopics[0].isSelected = true;
             }
             topics = validatedTopics;
          }
        }
      } catch (e) {
        console.warn("AI topic generation failed:", e);
      }
    }

    if (topics.length === 0) {
       return res.json({ success: false, status: 'STUDY_TOPIC_VALIDATION_FAILED' });
    }

    if (db) {
      for (const t of topics) {
        await setDoc(doc(db, "consulting_practice_topics", t.id), t);
      }
    }

    return res.json({ success: true, topics });
  } catch (err: any) {
    console.error("Generate practice topics error:", err);
    res.status(500).json({ error: "Failed to generate topics: " + err.message });
  }
});
`;

code = code.replace(generateRegex, generateReplacement);

// Replace GET /api/module-study/topics
const getTopicsRegex = /app\.get\("\/api\/module-study\/topics\/:projectId\/:moduleId"[\s\S]*?\n\}\);\n/m;
const getTopicsReplacement = `app.get("/api/module-study/topics/:projectId/:moduleId", async (req: any, res: any) => {
  try {
    const { projectId, moduleId } = req.params;
    const db = getDb();
    let topics: any[] = [];
    
    // Check if dev fallback is requested explicitly
    if (req.query.devFallback === 'true') {
      return res.json({ success: true, topics: BASELINE_CONSULTING_PRACTICE_TOPICS.map(t => ({...t, isDevFallback: true})) });
    }

    // Resolve canonical requirements map
    let reqMap: any = null;
    if (db) {
      const maps = await fetchCollectionDocs("module_requirements_maps");
      reqMap = maps.find((m: any) => m.projectId === projectId && m.moduleId === moduleId);
    }
    
    if (!reqMap || reqMap.moduleId !== moduleId || !reqMap.requirements) {
      return res.json({ success: false, status: 'STUDY_MODULE_REQUIREMENTS_UNAVAILABLE' });
    }

    if (db) {
      try {
        const stored = await fetchCollectionDocs("consulting_practice_topics");
        const filtered = stored.filter((t: any) => t.projectId === projectId && t.moduleId === moduleId);
        
        // Validate each primary topic's requirements against the canonical map
        const validTopics = filtered.filter((t: any) => {
          if (t.relevanceCategory === "PRIMARY_MODULE_TOPIC") {
            if (!t.moduleRequirementsCovered || t.moduleRequirementsCovered.length === 0) return false;
            for (const reqId of t.moduleRequirementsCovered) {
              const foundReq = reqMap.requirements.find((r: any) => r.id === reqId);
              if (!foundReq || foundReq.moduleId !== moduleId) return false;
            }
          }
          return true;
        });

        if (validTopics.length > 0) {
          topics = validTopics;
        }
      } catch (e) {
        console.warn("Firestore topics error:", e);
      }
    }

    return res.json({ success: true, topics });
  } catch (err: any) {
    console.error("Get topics error:", err);
    res.status(500).json({ error: "Failed to load topics: " + err.message });
  }
});
`;
code = code.replace(getTopicsRegex, getTopicsReplacement);

fs.writeFileSync('server.ts', code);
