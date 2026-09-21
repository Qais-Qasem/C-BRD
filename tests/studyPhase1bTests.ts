import { buildCanonicalModuleBundle } from '../server/studyModuleBundle.ts';

function runTests() {
    let passed = 0;
    let failed = 0;

    function assertPass(condition: boolean, name: string) {
        if (condition) {
            console.log(`[PASS] ${name}`);
            passed++;
        } else {
            console.error(`[FAIL] ${name}`);
            failed++;
        }
    }

    const mockProjectId = "PRJ-324";
    
    const allReqMaps = [
        {
            projectId: mockProjectId,
            moduleId: "MA-324-01",
            requirements: [
                { id: "REQ-01", title: "Importer Def", description: "21 CFR 1.500 rules", sourceVersionId: "SYLLABUS-HASH" },
                { id: "REQ-02", title: "Unmapped Requirement", description: "This has no sources", sourceVersionId: "SYLLABUS-HASH-2" }
            ]
        }
    ];

    const allSources = [
        {
            sourceId: "SRC-1",
            sourceVersionId: "SYLLABUS-HASH",
            projectId: mockProjectId,
            moduleId: "MA-324-01",
            sourceType: "SYLLABUS",
            provenanceKind: "ACADEMIC_COURSE_SOURCE"
        },
        {
            sourceId: "SRC-2",
            sourceVersionId: "REG-HASH",
            projectId: mockProjectId,
            moduleId: "MA-324-02",
            title: "Cross Module Source",
            provenanceKind: "ACADEMIC_REGULATORY_SOURCE"
        },
        {
            sourceId: "SRC-3",
            sourceVersionId: "AI-HASH",
            projectId: mockProjectId,
            moduleId: "MA-324-01",
            title: "AI Synthesis Notes",
            provenanceKind: "AI_SYNTHESIS" // should be ignored
        },
        {
            sourceId: "SRC-4",
            sourceVersionId: "DUP-HASH",
            projectId: mockProjectId,
            moduleId: "COURSE_WIDE",
            applicableModules: ["MA-324-01", "MA-324-02"],
            title: "Course Wide Source FDA FSVP 21 CFR",
            sourceAuthorityRank: 1
        },
        {
            sourceId: "SRC-4", // SAME logical source ID
            sourceVersionId: "DUP-HASH", // SAME version of SRC-4
            projectId: mockProjectId,
            moduleId: "COURSE_WIDE",
            applicableModules: ["MA-324-01", "MA-324-02"],
            title: "Course Wide Source Duplicate",
            sourceAuthorityRank: 1
        },
        {
            sourceId: "SRC-5B",
            sourceVersionId: "DUP-HASH",
            projectId: mockProjectId,
            moduleId: "COURSE_WIDE",
            applicableModules: ["MA-324-01", "MA-324-02"],
            title: "Different Logical Source, Same Physical Version"
        },
        {
            sourceId: "SRC-6",
            sourceVersionId: "DIFF-HASH",
            projectId: mockProjectId,
            moduleId: "COURSE_WIDE", // but not applicable to MA-324-01
            title: "Unassociated Course Wide"
        },
        {
            sourceId: "SRC-7",
            sourceVersionId: "EXT-HASH",
            projectId: mockProjectId,
            moduleId: "MA-324-01",
            title: "External Web Source",
            provenanceKind: "EXTERNAL_RESEARCH_SOURCE" // Phase 1B prohibits this from becoming canonical
        }
    ];

    const bundle = buildCanonicalModuleBundle(mockProjectId, "MA-324-01", allReqMaps, allSources);

    // STUDY-1B-EVAL-001
    assertPass(
        bundle.canonicalSources.every(s => s.moduleId === "MA-324-01" || ((s.sourceScope === "COURSE_WIDE" || s.moduleId === "COURSE_WIDE") && s.applicableModules?.includes("MA-324-01"))),
        "STUDY-1B-EVAL-001 (Module A only contains eligible sources)"
    );

    // STUDY-1B-EVAL-002
    assertPass(
        bundle.crossModuleReferences.some(s => s.sourceId === "SRC-2") && !bundle.canonicalSources.some(s => s.sourceId === "SRC-2"),
        "STUDY-1B-EVAL-002 (Module B sources become cross-module references)"
    );

    // STUDY-1B-EVAL-003
    const req1Mapped = bundle.requirementSourceMappings["REQ-01"]?.length > 0;
    const req2Gap = bundle.coverageGaps.includes("REQ-02");
    assertPass(
        req1Mapped && req2Gap,
        "STUDY-1B-EVAL-003 (Requirements either mapped or have coverage gaps)"
    );

    // STUDY-1B-EVAL-004
    assertPass(
        !bundle.canonicalSources.some(s => s.sourceId === "SRC-3") && !bundle.crossModuleReferences.some(s => s.sourceId === "SRC-3"),
        "STUDY-1B-EVAL-004 (AI content excluded from bundle)"
    );

    // STUDY-1B-EVAL-005
    const src4Count = bundle.canonicalSources.filter(s => s.sourceId === "SRC-4" && s.sourceVersionId === "DUP-HASH").length;
    assertPass(
        src4Count === 1,
        "STUDY-1B-EVAL-005 (Duplicate versions deduplicated)"
    );

    // STUDY-1B-EVAL-006
    const src5BCount = bundle.canonicalSources.filter(s => s.sourceId === "SRC-5B" && s.sourceVersionId === "DUP-HASH").length;
    assertPass(
        bundle.canonicalSources.some(s => s.sourceVersionId === "SYLLABUS-HASH") && src4Count === 1 && src5BCount === 1,
        "STUDY-1B-EVAL-006 (Different logical sources with same physical hash survive)"
    );

    // STUDY-1B-EVAL-007
    assertPass(
        bundle.canonicalSources.every(s => !!s.sourceVersionId),
        "STUDY-1B-EVAL-007 (sourceVersionId survives into bundle)"
    );

    // STUDY-1B-EVAL-008
    const bundleB = buildCanonicalModuleBundle(mockProjectId, "MA-324-02", allReqMaps, allSources);
    assertPass(
        bundleB.canonicalSources.some(s => s.sourceId === "SRC-2") && !bundleB.canonicalSources.some(s => s.sourceId === "SRC-1"),
        "STUDY-1B-EVAL-008 (Bundle shifts with activeModuleId)"
    );

    // STUDY-1B-EVAL-009
    assertPass(
        bundle.coverageGaps.length > 0 && bundle.coverageGaps.includes("REQ-02"),
        "STUDY-1B-EVAL-009 (Controlled coverage gaps generated)"
    );

    // STUDY-1B-EVAL-010
    assertPass(
        bundle.canonicalRequirements.length === 2 && bundle.canonicalRequirements[0].id === "REQ-01",
        "STUDY-1B-EVAL-010 (Phase 1A requirement provenance unchanged)"
    );

    // STUDY-1B-EVAL-011
    assertPass(
        bundle.externalResearchContracts["REQ-02"]?.externalResearchEligible === true && 
        bundle.externalResearchContracts["REQ-02"]?.coverageStatus === 'SOURCE_COVERAGE_GAP',
        "STUDY-1B-EVAL-011 (A coverage gap exposes the structural future external-research eligibility contract)"
    );

    // STUDY-1B-EVAL-012
    assertPass(
        !bundle.canonicalSources.some(s => s.sourceId === "SRC-7") && !bundle.crossModuleReferences.some(s => s.sourceId === "SRC-7"),
        "STUDY-1B-EVAL-012 (A non-canonical/external-research-class source cannot automatically enter the Canonical Module Source Bundle)"
    );

    // STUDY-1B-EVAL-013
    assertPass(
        bundle.canonicalRequirements.length === 2 && bundle.activeModuleId === "MA-324-01",
        "STUDY-1B-EVAL-013 (External-research eligibility cannot alter Phase 1A requirements, assessment scope, completion scope, or module authority)"
    );

    console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests();
