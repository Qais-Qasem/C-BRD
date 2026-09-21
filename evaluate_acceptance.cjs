const fs = require("fs");
const b1 = JSON.parse(fs.readFileSync("/tmp/bundle-01.json", "utf8")).bundle;
const b2 = JSON.parse(fs.readFileSync("/tmp/bundle-02.json", "utf8")).bundle;

console.log("\n--- TEST C ---\n");
if (b1.coverageGaps.length > 0) {
    const gap = b1.coverageGaps[0];
    const req = b1.canonicalRequirements.find(r => r.id === (gap.requirementId || gap));
    if (req) {
        console.log(`REQUIREMENT ID:
${req.id}

REQUIREMENT:
${req.title}

COVERAGE STATUS:
SOURCE_COVERAGE_GAP

EXTERNAL RESEARCH ELIGIBLE:
YES

CAN GEMINI/MODEL KNOWLEDGE SILENTLY FILL THIS GAP:
NO
`);
    } else {
        console.log("Could not resolve gap requirement ID.");
    }
} else {
    console.log("NO REAL SOURCE_COVERAGE_GAP EXISTS FOR THIS MODULE");
}

console.log("\n--- TEST D ---\n");
const src1 = b1.canonicalSources.find(s => s.moduleId === 'MA-324-01');
if (src1) {
    const inB2 = b2.canonicalSources.some(s => s.sourceId === src1.sourceId);
    const inB2Cross = b2.crossModuleReferences.some(s => s.sourceId === src1.sourceId);
    let result = "FAILURE";
    if (inB2Cross) result = "CROSS_MODULE_REFERENCE";
    else if (!inB2) result = "EXCLUDED";
    
    console.log(`SOURCE ID:
${src1.sourceId}

SOURCE MODULE:
MA-324-01

ACTIVE MODULE:
MA-324-02

RESULT:
${result}

IS SOURCE PRESENT IN MODULE 2 CANONICAL SOURCES:
${inB2 ? 'YES' : 'NO'}
`);
} else {
    console.log("NO SOURCE SPECIFIC TO MA-324-01 FOUND IN STORED DATA.");
}

console.log("\n--- TEST E ---\n");
const b1Srcs = b1.canonicalSources.map(s => s.sourceId);
const b2Srcs = b2.canonicalSources.map(s => s.sourceId);
const changed = b1Srcs.join(',') !== b2Srcs.join(',');
console.log(`MODULE 1 PRIMARY/CURRENT SOURCE IDS:
${b1Srcs.length ? b1Srcs.join(', ') : 'NONE'}

MODULE 2 PRIMARY/CURRENT SOURCE IDS:
${b2Srcs.length ? b2Srcs.join(', ') : 'NONE'}

DID ACTIVE MODULE CHANGE ALTER THE CURRENT SOURCE BUNDLE:
${changed ? 'YES' : 'NO'}
`);

