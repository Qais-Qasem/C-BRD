const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccount = require('./firebase-applet-config.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const reqs = require('./reqs.json').requirementsMap.requirements;
  // Get unique sourceVersionIds
  const versionIds = [...new Set(reqs.map(r => r.sourceVersionId))];
  
  for (const vId of versionIds) {
    if (!vId) continue;
    const snap = await db.collection('canonical_source_snapshots').doc(vId).get();
    if (snap.exists) {
      const data = snap.data();
      const blocks = data.blocks || [];
      console.log(`\n\n--- VERSION ID: ${vId} ---`);
      
      // Let's get the blocks used by the requirements
      const usedAnchors = new Set();
      reqs.filter(r => r.sourceVersionId === vId).forEach(r => {
        (r.blockAnchors || []).forEach(a => usedAnchors.add(a));
      });
      
      blocks.forEach((b, index) => {
        if (usedAnchors.has(b.blockId)) {
          console.log(`[TARGET] Block Index: ${index}, BlockId: ${b.blockId}`);
          console.log(`Heading: ${b.headingContext}`);
          console.log(`Content: ${b.content}`);
          console.log(`---`);
        }
      });
      
      console.log("\n\n--- SEARCHING FOR MODULE MA-324-01 SUBSTANTIVE BLOCKS ---");
      // Find where module MA-324-01 actually starts in the syllabus
      blocks.forEach((b, index) => {
        if (b.content.toLowerCase().includes('ma-324') || b.content.toLowerCase().includes('module 1') || b.headingContext.toLowerCase().includes('module 1')) {
           console.log(`[MODULE 1 CANDIDATE] Block Index: ${index}`);
           console.log(`Heading: ${b.headingContext}`);
           console.log(`Content: ${b.content}`);
           console.log(`---`);
        }
      });
      
    } else {
      console.log("Snapshot not found for", vId);
    }
  }
}

run().catch(console.error);
