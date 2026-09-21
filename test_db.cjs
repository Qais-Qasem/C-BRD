const fs = require('fs');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const app = initializeApp({
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId
});
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const snap = await getDocs(collection(db, "consulting_cases"));
    console.log("Cases:");
    snap.docs.forEach(d => console.log(d.id, d.data().caseId));
  } catch(e) {
    console.log("Error:", e.message);
  }
}
check();
