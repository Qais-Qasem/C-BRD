const fs = require('fs');

function getModuleLabel(moduleId) {
  const map = {
    'MA-324-01': 'Module One',
    'MA-324-02': 'Module Two',
    'MA-324-03': 'Module Three',
    'MA-324-04': 'Module Four',
    'MA-324-05': 'Module Five',
    'MA-324-06': 'Module Six',
    'MA-324-07': 'Module Seven',
  };
  return map[moduleId] || moduleId;
}

function getNextModuleLabel(moduleId) {
  const map = {
    'MA-324-01': 'Module Two',
    'MA-324-02': 'Module Three',
    'MA-324-03': 'Module Four',
    'MA-324-04': 'Module Five',
    'MA-324-05': 'Module Six',
    'MA-324-06': 'Module Seven',
    'MA-324-07': null,
  };
  return map[moduleId] || null;
}

function resolveModuleSpans(blocks, moduleId) {
  const crypto = require("crypto");
  const label = getModuleLabel(moduleId);
  const nextLabel = getNextModuleLabel(moduleId);
  
  const spans = [];
  
  for (const block of blocks) {
    const text = block.rawText || "";
    const startIdx = text.indexOf(label);
    if (startIdx !== -1) {
      let endIdx = text.length;
      if (nextLabel) {
        const nextIdx = text.indexOf(nextLabel, startIdx);
        if (nextIdx !== -1) {
           endIdx = nextIdx;
        }
      }
      
      const sliceText = text.substring(startIdx, endIdx);
      const sliceHash = crypto.createHash("sha256").update(sliceText).digest("hex");
      
      spans.push({
         blockId: block.blockId,
         type: block.type,
         startOffset: startIdx,
         endOffset: endIdx,
         sliceHash,
         startMarker: label,
         endMarker: nextLabel || "END",
         text: sliceText
      });
    }
  }
  
  return spans;
}

async function run() {
  const { Firestore } = require('@google-cloud/firestore');
  const firebaseConfig = require('./firebase-applet-config.json');
  const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });
  
  const vId = "09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2";
  const snap = await db.collection('canonical_source_snapshots').doc(vId).get();
  
  const spans = resolveModuleSpans(snap.data().preLlmBlocks, "MA-324-01");
  console.log("Spans count:", spans.length);
  spans.forEach(s => console.log(s.blockId, s.text.substring(0, 100)));
}
run().catch(console.error);
