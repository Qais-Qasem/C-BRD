import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

initializeApp({
  projectId: "c-bridge-regulatory-platform"
});

const db = getFirestore("ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f");

async function run() {
  try {
    const doc = await db.collection('case_attachments').doc('ATT-SYNTH-MPA-740364').get();
    if (doc.exists) {
        fs.writeFileSync('att.json', JSON.stringify(doc.data(), null, 2));
        console.log("Written to att.json");
    } else {
        console.log("Document not found");
    }
  } catch (e) {
    console.error(e);
  }
}
run();
