async function doFetch(url: string, options: any = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
    // There isn't an obvious API to just get case attachments directly without authentication,
    // let's use Firestore to inspect the attachments.
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
    const fs = require('fs');

    const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
    const app = initializeApp(config);
    const db = getFirestore(app, config.firestoreDatabaseId);

    const snapshot = await getDocs(collection(db, 'case_attachments'));
    const attachments = snapshot.docs.map(d => d.data());
    
    console.log(`Found ${attachments.length} attachments`);
    if (attachments.length > 0) {
        console.log("Sample attachment:");
        console.log(JSON.stringify(attachments[0], null, 2));
    }
}
run().catch(console.error);
