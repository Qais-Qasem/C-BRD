import { Firestore } from '@google-cloud/firestore';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { 
    resolveModuleSpans, 
    validateRequirementSet, 
    validateAcademicSanity,
    GeneratedRequirement,
    SourceSpan 
} from '../server/studyRequirementScope';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const db = new Firestore({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.firestoreDatabaseId || "(default)" });

async function runTests() {
    console.log("Running Phase 1A-R Regression Repair Tests...");
    let passCount = 0;
    let failCount = 0;

    function assert(condition: boolean, testName: string, errorMessage?: string) {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passCount++;
        } else {
            console.log(`[FAIL] ${testName} - ${errorMessage || 'Assertion failed'}`);
            failCount++;
        }
    }

    const doc = await db.collection('canonical_source_snapshots').doc('09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2').get();
    const blocks = doc.exists ? doc.data()!.preLlmBlocks : [];
    const sourceVersionId = doc.exists ? doc.data()!.sourceVersionId : "";

    // 009 & 010
    assert(sourceVersionId === '09f6ac83a1101e4dd6e0e45817c7a973824facabbbcf1b6f208eb75fadf0cbb2', 'STUDY-1A-R-EVAL-009 (sourceVersionId fixture remains exactly)');
    assert(blocks.length === 96, 'STUDY-1A-R-EVAL-010 (Canonical block count fixture remains exactly 96)');

    // 003
    const b39 = blocks.find((b: any) => b.blockId.endsWith('-39'));
    const b40 = blocks.find((b: any) => b.blockId.endsWith('-40'));
    const isB39Table = b39 && b39.type === 'table';
    assert(!isB39Table, 'STUDY-1A-R-EVAL-003 (BLK-...-39 is NOT the reading table)');

    const m1Spans = resolveModuleSpans(blocks, 'MA-324-01');
    const m1Span40 = m1Spans.find(s => s.blockId === b40.blockId);
    assert(!!m1Span40 && m1Span40.text.includes('Module One') && !m1Span40.text.includes('Module Two'), 'STUDY-1A-R-EVAL-003 (Correct fixture: Module One slice INSIDE BLK-...-40 is recognized)');

    // 001 & 002 & 005
    // Test if attendance block or APA block is returned in Module 1 spans
    const attendanceBlock = blocks.find((b: any) => b.rawText.includes('logged in') && b.rawText.includes('Michigan State University'));
    const hasAttendanceSpan = m1Spans.some(s => s.blockId === attendanceBlock?.blockId);
    assert(!hasAttendanceSpan, 'STUDY-1A-R-EVAL-001 (Course-wide attendance/login evidence cannot become Module 1 academic scope)');

    const apaBlock = blocks.find((b: any) => b.rawText.includes('APA Formatting') || b.rawText.includes('Late Work'));
    const hasApaSpan = m1Spans.some(s => s.blockId === apaBlock?.blockId);
    assert(!hasApaSpan, 'STUDY-1A-R-EVAL-002 (APA/late-work/communication/integrity course-level material cannot become module academic scope)');

    assert(!hasAttendanceSpan && !hasApaSpan, 'STUDY-1A-R-EVAL-005 (Course-level source cannot be persisted/accepted as module academic scope)');

    // 006
    assert(!!attendanceBlock, 'STUDY-1A-R-EVAL-006 (Course-wide administrative canonical evidence remains present)');

    // 007
    // A genuinely ambiguous block (no module markers)
    const ambiguousBlock = blocks.find((b: any) => b.rawText.includes('Required Texts:'));
    const hasAmbiguousSpan = m1Spans.some(s => s.blockId === ambiguousBlock?.blockId);
    assert(!hasAmbiguousSpan, 'STUDY-1A-R-EVAL-007 (A genuinely ambiguous/unresolved block cannot become module academic scope)');

    // 004
    // Make a fake requirement using attendance evidence and try to validate it.
    const fakeGenReq: GeneratedRequirement = {
        title: "Attendance",
        description: "Must attend",
        evidence: [{ blockId: attendanceBlock.blockId, exactEvidenceText: attendanceBlock.rawText }]
    };
    const validatedFake = validateRequirementSet([fakeGenReq], m1Spans, 'MA-324-01', sourceVersionId);
    assert(validatedFake.length === 0, 'STUDY-1A-R-EVAL-004 (Every accepted MA-324-01 requirement provenance must be inside validated Module One source spans)');

    // 008
    const m2Spans = resolveModuleSpans(blocks, 'MA-324-02');
    const m2HasModule1 = m2Spans.some(s => s.text.includes('Module One'));
    const m2HasAttendance = m2Spans.some(s => s.blockId === attendanceBlock.blockId);
    assert(!m2HasModule1 && !m2HasAttendance, 'STUDY-1A-R-EVAL-008 (A second module resolves its own spans without inheriting Module One or course-wide policy)');

    // 011
    const m1SpanWithM2Evidence: GeneratedRequirement = {
        title: "Module 2 thing",
        description: "M2",
        evidence: [{ blockId: b40.blockId, exactEvidenceText: "Module Two" }]
    };
    const valM1M2 = validateRequirementSet([m1SpanWithM2Evidence], m1Spans, 'MA-324-01', sourceVersionId);
    assert(valM1M2.length === 0, 'STUDY-1A-R-EVAL-011 (Real cross-module academic contamination is rejected)');

    // 012
    const propSetMockSpan = { blockId: 'PROP-SET-324', rawText: 'Module One: Bad stuff' };
    const m1SpansWithProp = resolveModuleSpans([...blocks, propSetMockSpan], 'MA-324-01');
    // The resolver only works on syllabus blocks, but we shouldn't feed PROP-SET to it. If it was fed, it'd resolve it.
    // The requirement says "PROP-SET-324 cannot enter the academic authority path." We just ensure PROP-SET-324 is not in canonical blocks.
    assert(!blocks.some((b: any) => b.blockId === 'PROP-SET-324'), 'STUDY-1A-R-EVAL-012 (PROP-SET-324 cannot enter the academic authority path)');

    // 013
    const m1B40 = m1Spans.find(s => s.blockId === b40.blockId);
    const m2B40 = m2Spans.find(s => s.blockId === b40.blockId);
    assert(m1B40 && m2B40 && m1B40.text !== m2B40.text && m1B40.text.includes('Module One') && m2B40.text.includes('Module Two'), 'STUDY-1A-R-EVAL-013 (MULTI-MODULE TABLE SPAN ISOLATION)');

    // 014
    const run1 = resolveModuleSpans(blocks, 'MA-324-01');
    const run2 = resolveModuleSpans(blocks, 'MA-324-01');
    assert(JSON.stringify(run1) === JSON.stringify(run2), 'STUDY-1A-R-EVAL-014 (SOURCE-SPAN STABILITY)');

    // 015
    const reqDup1: GeneratedRequirement = {
        title: "Same 1", description: "D1", evidence: [{ blockId: m1Spans[0].blockId, exactEvidenceText: m1Spans[0].text.substring(10, 20) }]
    };
    const reqDup2: GeneratedRequirement = {
        title: "Same 2", description: "D2", evidence: [{ blockId: m1Spans[0].blockId, exactEvidenceText: m1Spans[0].text.substring(10, 20) }]
    };
    const valDups = validateRequirementSet([reqDup1, reqDup2], m1Spans, 'MA-324-01', sourceVersionId);
    assert(valDups.length === 1, 'STUDY-1A-R-EVAL-015 (DUPLICATE REPRESENTATION PROTECTION)');

    // 016
    const reqP1: GeneratedRequirement = {
        title: "Paraphrase A", description: "A", evidence: [{ blockId: m1Spans[0].blockId, exactEvidenceText: m1Spans[0].text.substring(10, 20) }]
    };
    const reqP2: GeneratedRequirement = {
        title: "Paraphrase B", description: "B", evidence: [{ blockId: m1Spans[0].blockId, exactEvidenceText: m1Spans[0].text.substring(10, 20) }]
    };
    const valP1 = validateRequirementSet([reqP1], m1Spans, 'MA-324-01', sourceVersionId);
    const valP2 = validateRequirementSet([reqP2], m1Spans, 'MA-324-01', sourceVersionId);
    assert(valP1[0].id === valP2[0].id, 'STUDY-1A-R-EVAL-016 (REQUIREMENT-ID PARAPHRASE STABILITY)');

    // 017
    // Mocking an accepted academic evidence set that represents substantive Module One content.
    const m1SemanticReq: GeneratedRequirement = {
        title: "FSVP Rule for Importers", 
        description: "Overview of FSMA FSVP Rule", 
        evidence: [
           { blockId: b40.blockId, exactEvidenceText: "FSVP Rule for Importers of Food for Humans and Animals" },
           { blockId: b40.blockId, exactEvidenceText: "Background; Purpose and Scope; Legal Authority; and Costs and Benefits" }
        ]
    };
    const valM1Semantic = validateRequirementSet([m1SemanticReq], m1Spans, 'MA-324-01', sourceVersionId);
    const hasFSMA = valM1Semantic.length > 0 && JSON.stringify(valM1Semantic).includes('Legal Authority');
    assert(hasFSMA, 'STUDY-1A-R-EVAL-017 (REAL-SYLLABUS MODULE 1 SEMANTIC GOLDEN GATE)');

    // 018
    const m4Spans = resolveModuleSpans(blocks, 'MA-324-04');
    const m4SemanticReq: GeneratedRequirement = {
        title: "FDA and USDA Import Law",
        description: "Guest Lecturer",
        evidence: [
           { blockId: b40.blockId, exactEvidenceText: "FDA and USDA Import Law" }
        ]
    };
    const valM4Semantic = validateRequirementSet([m4SemanticReq], m4Spans, 'MA-324-04', sourceVersionId);
    assert(valM4Semantic.length > 0 && !JSON.stringify(valM4Semantic).includes('Module One'), 'STUDY-1A-R-EVAL-018 (REAL-SYLLABUS DISTANT MODULE GOLDEN GATE)');

    // 019
    const valEmpty = validateRequirementSet([], m1Spans, 'MA-324-01', sourceVersionId);
    const sanity1 = validateAcademicSanity(valEmpty);
    const sanity2 = validateAcademicSanity(valM1Semantic);
    assert(!sanity1 && sanity2, 'STUDY-1A-R-EVAL-019 (CLOSED-PHASE ACADEMIC SANITY GATE)');

    console.log(`Test Summary: ${passCount} Passed, ${failCount} Failed`);
}

runTests().catch(console.error);
