const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');

// 1. Remove helper functions
const helperCodeRegex = /function getModuleLabel\(moduleId\).*?return spans;\n}/s;
serverTs = serverTs.replace(helperCodeRegex, '');

// 2. Restore analyze-sources endpoint
const startMarker = 'app.post("/api/module-study/analyze-sources", async (req: any, res: any) => {\n  try {\n    const { projectId, moduleId, sourceIds, customFocus } = req.body;';
const endMarker = 'const db = getDb();\n    if (db) {\n      await setDoc(doc(db, "module_requirements_maps", requirementsMap.id), requirementsMap);\n    }\n\n    return res.json({\n      success: true,\n      requirementsMap,\n      message: "Generated requirements anchored to canonical syllabus blocks."\n    });';

const preB1Body = `
    const db = getDb();
    if (!db) {
      return res.json({ success: false, status: "STUDY_SYLLABUS_SOURCE_UNAVAILABLE", message: "Database unavailable." });
    }

    let syllabusSnapshot: any = null;
    const currentDoc = await getDoc(doc(db, "canonical_syllabus_current", projectId || "PRJ-324"));
    if (currentDoc.exists()) {
      const { currentSourceVersionId } = currentDoc.data();
      if (currentSourceVersionId) {
        const snapDoc = await getDoc(doc(db, "canonical_source_snapshots", currentSourceVersionId));
        if (snapDoc.exists()) {
          syllabusSnapshot = snapDoc.data();
        }
      }
    }

    if (!syllabusSnapshot || !syllabusSnapshot.preLlmBlocks || syllabusSnapshot.preLlmBlocks.length === 0) {
      return res.json({
        success: false,
        status: "STUDY_SYLLABUS_SOURCE_UNAVAILABLE",
        message: "Canonical syllabus document extraction is unavailable. Cannot generate deterministic module requirements."
      });
    }

    // Prepare blocks for Gemini
    const blocksInfo = syllabusSnapshot.preLlmBlocks.map((b: any) => \`[\${b.blockId}] (\${b.type}): \${b.rawText}\`).join("\\n");
        
    const ai = getGeminiClient();
    let generatedRequirements: any[] = [];
    if (ai) {
      const prompt = \`You are C-Bridge AI Requirements Extraction Engine.
Extract formal Module Requirements for module: \${moduleId}.
You must use the following CANONICAL SYLLABUS BLOCKS.
\${blocksInfo}

For each requirement, provide:
- "title": A short title
- "description": Description of the requirement
- "blockIds": An array of EXACT blockIds from the syllabus blocks above that authorize this requirement.

Return JSON schema:
{
  "requirements": [
    { 
      "title": "...", 
      "description": "...", 
      "blockIds": ["BLK-hash-0", "BLK-hash-1"]
    }
  ]
}\`;
      const result = await executeGovernedModelCall({
        aiClient: ai,
        purpose: "DOCUMENT_ANALYSIS",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      if (result.success && result.rawText) {
        const parsed = JSON.parse(result.rawText.trim());
        generatedRequirements = parsed.requirements || [];
      }
    } else {
       // Fallback mock requirement if Gemini is not available, but properly anchored.
       generatedRequirements = [
          { 
             title: "FSVP Importer Definition", 
             description: "Understand FSVP requirements under 21 CFR 1.500", 
             blockIds: [syllabusSnapshot.preLlmBlocks[0].blockId]
          }
       ];
    }

    // Validate blockIds and generate canonical requirement IDs
    const validBlocks = new Set(syllabusSnapshot.preLlmBlocks.map((b: any) => b.blockId));
    const requirementsMap: any = {
      id: \`REQ-MAP-\${moduleId}-\${Date.now()}\`,
      projectId: projectId || "PRJ-324",
      moduleId: moduleId || "MA-324-01",
      status: "DRAFT",
      requirements: [],
      sourceIds: sourceIds || [],
      customFocus: customFocus || ""
    };

    let reqIndex = 1;
    for (const req of generatedRequirements) {
      if (!req.blockIds || req.blockIds.length === 0) continue; // Skip if no block authorization

      const isValid = req.blockIds.every((id: string) => validBlocks.has(id));
      if (!isValid) continue; // Reject requirement if block doesn't exist
      
      // Stable ID generation based on module, source version, and block anchors
      const sortedBlocks = [...req.blockIds].sort().join(",");
      const reqIdSource = \`\${moduleId}-\${syllabusSnapshot.sourceVersionId}-\${sortedBlocks}\`;
      const crypto = require("crypto");
      const canonicalReqId = "REQ-" + crypto.createHash("sha256").update(reqIdSource).digest("hex").substring(0, 8).toUpperCase();

      requirementsMap.requirements.push({
        id: canonicalReqId,
        moduleId: moduleId || "MA-324-01",
        title: req.title,
        description: req.description,
        provenance: "CANONICAL_SYLLABUS",
        sourceVersionId: syllabusSnapshot.sourceVersionId,
        blockAnchors: req.blockIds,
        reviewStatus: "PENDING_MEMBER_REVIEW"
      });
      reqIndex++;
    }
`;

// we need to slice it from `startMarker` to `endMarker` in current serverTs and replace it.
const startIndex = serverTs.indexOf('app.post("/api/module-study/analyze-sources", async (req: any, res: any) => {\n  try {\n    const { projectId, moduleId, sourceIds, customFocus } = req.body;');
const endIndex = serverTs.indexOf('    const db = getDb();\n    if (db) {\n      await setDoc(doc(db, "module_requirements_maps", requirementsMap.id), requirementsMap);\n    }');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = 'app.post("/api/module-study/analyze-sources", async (req: any, res: any) => {\n  try {\n    const { projectId, moduleId, sourceIds, customFocus } = req.body;\n' + preB1Body;
  serverTs = serverTs.substring(0, startIndex) + replacement + serverTs.substring(endIndex);
  fs.writeFileSync('server.ts', serverTs);
  console.log("Successfully reverted analyze-sources endpoint in server.ts");
} else {
  console.log("Could not find start or end index for analyze-sources");
}

