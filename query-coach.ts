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
      .get();
      
    const messages = snapshot.docs.map(d => d.data());
    messages.sort((a, b) => b.timestamp - a.timestamp);
    
    for (let i = 0; i < Math.min(5, messages.length); i++) {
      const data = messages[i];
      console.log(`ID: ${data.id}`);
      console.log(`Time: ${data.isoTimestamp}`);
      console.log(`Text: ${data.text.substring(0, 150).replace(/\n/g, ' ')}...`);
      console.log(`Channel: ${data.channel}`);
      if (data.sourceTrace) {
         console.log(`SourceTrace Object Keys: ${Object.keys(data.sourceTrace)}`);
      }
      if (data.sourceTraceId) {
         console.log(`SourceTrace ID: ${data.sourceTraceId}`);
      }
      console.log('---');
    }
  } catch (e) {
    console.error(e);
  }
}
run();
