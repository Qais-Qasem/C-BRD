import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: "c-bridge-regulatory-platform"
});

const db = getFirestore("ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f");

async function run() {
  try {
    const snapshot = await db.collection('case_messages')
      .where('senderRole', '==', 'AI_COACH')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
      
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${data.id}`);
      console.log(`Time: ${data.isoTimestamp}`);
      console.log(`Text: ${data.text.substring(0, 150).replace(/\n/g, ' ')}...`);
    });
  } catch (e) {
    console.error(e);
  }
}
run();
