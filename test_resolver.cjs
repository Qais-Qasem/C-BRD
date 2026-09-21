const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

const moduleLabels = [
  { id: 'MA-324-01', label: 'Module One' },
  { id: 'MA-324-02', label: 'Module Two' },
  { id: 'MA-324-03', label: 'Module Three' },
  { id: 'MA-324-04', label: 'Module Four' },
  { id: 'MA-324-05', label: 'Module Five' },
  { id: 'MA-324-06', label: 'Module Six' },
  { id: 'MA-324-07', label: 'Module Seven' }
];

async function run() {
  const vId = "09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2";
  const snap = await db.collection('canonical_source_snapshots').doc(vId).get();
  const blocks = snap.data().preLlmBlocks || [];
  
  let currentModuleIdx = -1;
  
  for (let i = 0; i < blocks.length; i++) {
    const text = blocks[i].rawText || "";
    let foundAny = false;
    let textOut = text.substring(0, 50).replace(/\n/g, " ");
    
    for (let j = 0; j < moduleLabels.length; j++) {
      if (text.includes(moduleLabels[j].label)) {
        console.log(`[${i}] contains ${moduleLabels[j].label} - ${textOut}`);
        foundAny = true;
      }
    }
  }
}

run().catch(console.error);
