import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: "c-bridge-regulatory-platform"
});

const db = getFirestore("ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f");

async function run() {
  try {
    const collections = await db.listCollections();
    console.log("Collections:", collections.map(c => c.id));
  } catch (e) {
    console.error(e);
  }
}
run();
