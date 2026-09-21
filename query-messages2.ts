import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: "c-bridge-regulatory-platform"
});

const db = getFirestore("ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f");

async function run() {
  try {
    const snapshot = await db.collection('case_messages').limit(5).get();
    console.log(`Found ${snapshot.size} messages.`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Content: ${data.content?.substring(0, 100)}`);
      console.log('Keys:', Object.keys(data));
      console.log('---');
    });
  } catch (e) {
    console.error(e);
  }
}
run();
