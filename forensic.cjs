const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: "ai-studio-cbridgeregulator-d62d5a18-0fc2-4836-9722-be48f6e81a6f" });
const db = getFirestore();

async function run() {
    const messagesRef = db.collection('case_messages');
    const snapshot = await messagesRef.orderBy('createdAt', 'desc').limit(5).get();
    console.log("Recent case messages:");
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`[${data.createdAt}] ${data.senderId}: ${data.text}`);
    });
}
run().catch(console.error);
