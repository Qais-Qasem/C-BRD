import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

initializeApp({
  projectId: "c-bridge-regulatory-platform"
});

const db = getFirestore("ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f");

async function run() {
  try {
    const snapshot = await db.collection('case_audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
      
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}, Action: ${data.action}, Timestamp: ${data.timestamp}`);
      if (data.context) {
          console.log(`Context length: ${JSON.stringify(data.context).length}`);
      }
    });
  } catch (e) {
    console.error(e);
  }
}
run();
