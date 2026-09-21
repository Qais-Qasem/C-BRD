const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'c-bridge-regulatory-platform',
  databaseId: 'ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f',
});

async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  if (doc.exists) {
    const data = doc.data();
    const blocks = data.preLlmBlocks || [];
    blocks.forEach((b, i) => {
        if (b.type === 'table') {
            console.log(`=== TABLE BLOCK [${i}] ===`);
            console.log(b.rawText.substring(0, 500));
        }
    });
  }
}

run().catch(console.error);
