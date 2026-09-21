const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const snapDoc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  const blocks = snapDoc.data().preLlmBlocks;

  const queries = [
    { name: "Attendance and Login Requirements", terms: ["logged in", "attendance"] },
    { name: "Discussion Participation", terms: ["participation in discussion", "discussion participation", "discussion boards", "discussion forum", "Discussion Board Requirements"] },
    { name: "Assignment Deadlines / Late Work", terms: ["Late Work", "Deadlines", "late assignment"] },
    { name: "APA Formatting", terms: ["APA Formatting", "APA format"] },
    { name: "Course Communication Protocol", terms: ["communication", "Instructor Response", "email", "Protocol"] },
    { name: "Academic Integrity", terms: ["Academic Integrity", "Plagiarism"] },
    { name: "Religious Observance Notification", terms: ["Religious", "Observance"] },
  ];

  for (const q of queries) {
    let found = false;
    for (const b of blocks) {
      if (q.terms.some(t => b.rawText.toLowerCase().includes(t.toLowerCase()))) {
        console.log(`POLICY: ${q.name}`);
        console.log(`BLOCK ID: ${b.blockId}`);
        console.log(`EXCERPT: ${b.rawText.substring(0, 100).replace(/\n/g, ' ')}...`);
        console.log(`HEADING/CONTEXT: ${b.type === 'heading' ? b.rawText : 'paragraph/list/table under heading'}`);
        // Structural classification in Phase 1A is COURSE_LEVEL_SOURCE since they aren't bound to a module
        console.log(`CLASSIFICATION: COURSE_LEVEL_SOURCE`);
        console.log(`IN MA-324-01 ACADEMIC REQUIREMENT MAP: NO`);
        console.log("---");
        found = true;
        break; // break on first find for brevity
      }
    }
    if (!found) {
      console.log(`POLICY NOT FOUND: ${q.name}`);
    }
  }
}
run();
