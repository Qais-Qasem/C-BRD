const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

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
    const snap = await getDocs(collection(db, "module_requirements_maps"));
    snap.docs.forEach(d => {
      console.log(d.id, "projectId:", d.data().projectId, "moduleId:", d.data().moduleId, "status:", d.data().status);
    });
  } catch(e) { console.error(e); }
}
check();
