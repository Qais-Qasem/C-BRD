import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

initializeApp({
  projectId: "c-bridge-regulatory-platform"
});

const db = getFirestore("ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f");

async function run() {
  try {
    const doc = await db.collection('case_messages').doc('MSG-COACH-020942').get();
    if (!doc.exists) {
        console.log("Not found by ID, searching by property");
        const query = await db.collection('case_messages').where('id', '==', 'MSG-COACH-020942').get();
        if(!query.empty) {
            fs.writeFileSync('msg.json', JSON.stringify(query.docs[0].data(), null, 2));
            console.log("Written to msg.json");
        }
    } else {
        fs.writeFileSync('msg.json', JSON.stringify(doc.data(), null, 2));
        console.log("Written to msg.json");
    }
  } catch (e) {
    console.error(e);
  }
}
run();
