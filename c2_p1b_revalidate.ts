import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';
import { buildCanonicalModuleBundle } from './server/studyModuleBundle';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function run() {
  const reqMapsSnapshot = await db.collection('module_requirements_maps').get();
  const allReqMaps = reqMapsSnapshot.docs.map(d => d.data());

  const sourcesSnapshot = await db.collection('academic_sources').get();
  const allSources = sourcesSnapshot.docs.map(d => d.data());

  const snapshotsSnapshot = await db.collection('canonical_source_snapshots').get();
  const canonicalSnapshots = snapshotsSnapshot.docs.map(d => d.data());

  const bundle = buildCanonicalModuleBundle("PRJ-324", "MA-324-01", allReqMaps, allSources, canonicalSnapshots);
  
  console.log("PHASE 1B CORRECTED BUNDLE REQUIREMENT COUNT:", bundle.canonicalRequirements.length);
  
  let crossModule = 0;
  for (const req of bundle.canonicalRequirements) {
    if (req.moduleId !== "MA-324-01") crossModule++;
  }
  
  console.log("PHASE 1B CROSS-MODULE PRIMARY CONTAMINATION:", crossModule);
  
  for (const req of bundle.canonicalRequirements) {
    const sources = bundle.requirementSourceMappings[req.id] || [];
    const isGap = bundle.coverageGaps.includes(req.id);
    console.log(`\nREQUIREMENT ID: ${req.id}`);
    console.log(`TITLE: ${req.title}`);
    console.log(`PROVENANCE: ${req.provenance} / ${req.blockAnchors.join(',')}`);
    console.log(`SUPPORTING SOURCE IDS: ${sources.join(', ')}`);
    console.log(`COVERAGE STATUS: ${isGap ? 'SOURCE_COVERAGE_GAP' : 'MAPPED'}`);
  }
}
run();
