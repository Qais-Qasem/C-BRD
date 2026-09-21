const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf-8');

const regex = /if \(ai\) \{\s*const prompt = \`You are C-Bridge AI Requirements Extraction Engine\.[^]*?Return JSON schema:[^]*?\}\`;/;

if (regex.test(s)) {
   s = s.replace(regex, `if (ai && moduleSpans.length > 0) {
      const prompt = \`You are C-Bridge AI Requirements Extraction Engine.
Extract formal Module Requirements for module: \${moduleId}.

You must use ONLY the following STRICTLY BOUNDED CANONICAL SOURCE SPANS.
These spans have been structurally proven to belong to \${moduleId}.
Do NOT extract general course-wide administrative policies. Extract substantive academic requirements and module-specific tasks.

\${blocksInfo}

If a concept is duplicated in multiple spans (e.g., schedule table and reading table), synthesize them into a single requirement.

For each requirement, provide:
- "title": A short, unique title
- "description": Description of the requirement
- "blockIds": An array of EXACT blockIds from the source spans above that authorize this requirement.

Return JSON schema:
{
  "requirements": [
    { 
      "title": "...", 
      "description": "...", 
      "blockIds": ["BLK-hash-0", "BLK-hash-1"]
    }
  ]
}\`;`);
   console.log("Patched prompt");
   fs.writeFileSync('server.ts', s);
} else {
   console.log("Prompt regex failed.");
}
