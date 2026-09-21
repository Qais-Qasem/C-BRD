import { Firestore } from '@google-cloud/firestore';
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

async function run() {
  const db = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId
  });
  
  const projectId = "PRJ-324";
  const moduleId = "MA-324-01";

  const attachmentsSnap = await db.collection("case_attachments").get();
  const allAtts = attachmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const existingCaseAtts = allAtts.filter((a: any) =>
    (a.projectId === projectId || a.projectId === "PRJ-FSVP-01") &&
    a.moduleId === moduleId && a.documentType === 'CBP_ENTRY_SUMMARY_7501'
  );
  
  console.log("CBP DOCS STATUSES:");
  existingCaseAtts.forEach((a: any) => {
     console.log(`ID: ${a.id}, version: ${a.version}, status: ${a.auditStatus}, synthetic: ${a.synthetic}`);
  });
}

run().catch(console.error);
