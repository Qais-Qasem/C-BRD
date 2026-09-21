const { Firestore } = require('@google-cloud/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const snapDoc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  const blocks = snapDoc.data().preLlmBlocks;

  const b_comm = blocks.find(b => b.rawText.includes("Email from your instructor"));
  if (b_comm) {
      console.log(`POLICY: Course Communication Protocol`);
      console.log(`BLOCK ID: ${b_comm.blockId}`);
      console.log(`EXCERPT: ${b_comm.rawText.substring(0, 100).replace(/\n/g, ' ')}...`);
  }

  const mapDoc = await db.collection('module_requirements_maps').doc('REQ-MAP-MA-324-01-1788402396017').get();
  const reqs = mapDoc.data().requirements;
  
  const allPolicyBlocks = [
      'BLK-09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2-46', // Attendance
      'BLK-09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2-49', // Discussion
      'BLK-09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2-25', // Deadlines
      'BLK-09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2-53', // APA
      b_comm ? b_comm.blockId : null,
      'BLK-09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2-77', // Academic Integrity
      'BLK-09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2-85'  // Religious
  ];

  let foundInMap = false;
  for (const req of reqs) {
      for (const loc of req.subordinateLocators || []) {
          if (allPolicyBlocks.includes(loc.blockId)) {
              console.log("FOUND POLICY BLOCK IN REQUIREMENTS MAP!", loc.blockId);
              foundInMap = true;
          }
      }
  }
  if (!foundInMap) console.log("NO POLICY BLOCKS FOUND IN MA-324-01 REQUIREMENTS.");

  // Output requirement records exactly
  console.log("REQ-97C9A9A8:");
  console.log(JSON.stringify(reqs.find(r => r.id === 'REQ-97C9A9A8'), null, 2));
  console.log("REQ-EC3D2C1F:");
  console.log(JSON.stringify(reqs.find(r => r.id === 'REQ-EC3D2C1F'), null, 2));

}
run();
