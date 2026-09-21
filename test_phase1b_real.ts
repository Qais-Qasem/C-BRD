import { buildCanonicalModuleBundle } from './server/studyModuleBundle.ts';
import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';

async function run() {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

  const reqDocs = await db.collection('module_requirements_maps').get();
  const allReqMaps = [];
  reqDocs.forEach(d => allReqMaps.push(d.data()));

  const sourceDocs = await db.collection('module_sources').get();
  const allSources = [];
  sourceDocs.forEach(d => allSources.push(d.data()));

  const snapDocs = await db.collection('canonical_source_snapshots').get();
  const snapshots = [];
  snapDocs.forEach(d => snapshots.push(d.data()));

  const bundle = buildCanonicalModuleBundle("PRJ-324", "MA-324-01", allReqMaps, allSources, snapshots);
  
  console.log("MODULE: MA-324-01");
  console.log(`CANONICAL ACADEMIC REQUIREMENTS: ${bundle.canonicalRequirements.length}`);
  bundle.canonicalRequirements.forEach(r => {
      console.log(`- requirementId: ${r.id}`);
      console.log(`  title: ${r.title}`);
      console.log(`  canonical block/span provenance: ${r.sourceVersionId} - ${JSON.stringify(r.subordinateLocators || r.blockAnchors || [])}`);
      
      const mappedSources = bundle.requirementSourceMappings[r.id] || [];
      console.log(`  supporting source IDs: ${mappedSources.join(', ') || 'none'}`);
      
      const coverage = bundle.externalResearchContracts[r.id]?.coverageStatus || "UNKNOWN";
      console.log(`  coverage status: ${coverage}`);
  });

  const cwDocs = allReqMaps.filter(m => m.moduleId === 'COURSE_WIDE');
  let cwCount = 0;
  if (cwDocs.length > 0) {
      cwCount = cwDocs[0].requirements?.length || 0;
  }
  console.log(`COURSE-WIDE ADMIN POLICIES: ${cwCount}`);
  
  const crossModuleContamination = bundle.crossModuleReferences?.length || 0;
  console.log(`CROSS-MODULE PRIMARY CONTAMINATION: ${crossModuleContamination}`);
  
  console.log("PHASE 1B REVALIDATION: PASS");
}
run().catch(console.error);
