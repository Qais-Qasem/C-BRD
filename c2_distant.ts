import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';
import { resolveModuleSpans } from './server/studyRequirementScope';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
  const blocks = doc.data()!.preLlmBlocks;
  
  const m4Spans = resolveModuleSpans(blocks, 'MA-324-04');
  let hasFDA = false;
  let hasModuleOne = false;
  let hasAdmin = false;
  
  m4Spans.forEach(s => {
    if (s.text.includes("FDA and USDA Import Law")) hasFDA = true;
    if (s.text.includes("Module One")) hasModuleOne = true;
    if (s.text.includes("Attendance") || s.text.includes("APA Formatting")) hasAdmin = true;
  });
  
  console.log(`FDA present in M4: ${hasFDA}`);
  console.log(`Module 1 absent in M4: ${!hasModuleOne}`);
  console.log(`Admin absent in M4: ${!hasAdmin}`);
  if (hasFDA && !hasModuleOne && !hasAdmin) {
    console.log("DISTANT MODULE REAL-SOURCE GATE: PASS");
  } else {
    console.log("DISTANT MODULE REAL-SOURCE GATE: FAIL");
  }
}
run();
