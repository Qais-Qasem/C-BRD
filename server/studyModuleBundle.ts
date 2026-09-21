export interface CanonicalBundle {
    activeModuleId: string;
    canonicalModuleIdentity: { projectId: string, moduleId: string };
    canonicalRequirements: any[];
    canonicalSources: any[];
    requirementSourceMappings: Record<string, string[]>;
    crossModuleReferences: any[];
    coverageGaps: string[];
    externalResearchContracts: Record<string, { coverageStatus: string, externalResearchEligible: boolean }>;
}

export function buildCanonicalModuleBundle(
    projectId: string, 
    moduleId: string, 
    allReqMaps: any[], 
    allSources: any[],
    canonicalSnapshots: any[] = []
): CanonicalBundle {
    const reqMap = allReqMaps.find(m => m.projectId === projectId && m.moduleId === moduleId);
    const canonicalRequirements = reqMap?.requirements || [];

    const currentModuleSources: any[] = [];
    const crossModuleReferences: any[] = [];
    
    const requirementSourceMappings: Record<string, string[]> = {};
    const coverageGaps: string[] = [];
    const externalResearchContracts: Record<string, { coverageStatus: string, externalResearchEligible: boolean }> = {};

    for (const req of canonicalRequirements) {
        requirementSourceMappings[req.id] = [];
    }

    // Deduplication tracking (logical / physical identity)
    const seenVersions = new Set<string>();

    for (const source of allSources) {
        // Exclude completely unrelated projects
        if (source.projectId !== projectId) continue;
        
        // STUDY-1B-EVAL-004: Exclude AI synthesis from becoming canonical source authority
        if (source.provenanceKind === 'AI_SYNTHESIS' || source.sourceType === 'AI_SYNTHESIS') continue;

        // STUDY-1B-EVAL-012: Exclude external research from automatically becoming canonical
        if (source.provenanceKind === 'EXTERNAL_RESEARCH_SOURCE' || source.isExternalResearch === true) continue;

        // Stable identity: prefer sourceVersionId, fallback to logical sourceId
        const versionKey = source.sourceId + "::" + (source.sourceVersionId || "NO_VER"); 

        // Structural Ownership Evaluation
        let isCurrent = false;
        let isCross = false;

        if (source.moduleId === moduleId) {
            isCurrent = true;
        } else if (source.sourceScope === 'COURSE_WIDE' || source.moduleId === 'COURSE_WIDE') {
            // A COURSE_WIDE source can become current ONLY if explicitly associated
            if (source.applicableModules && source.applicableModules.includes(moduleId)) {
                isCurrent = true;
            } else {
                isCross = true;
            }
        } else {
            // It belongs to a different specific module
            isCross = true;
        }

        if (isCurrent) {
            if (!seenVersions.has(versionKey)) {
                seenVersions.add(versionKey);
                currentModuleSources.push(source);
            }
        } else if (isCross) {
            if (!seenVersions.has(versionKey)) {
                seenVersions.add(versionKey);
                crossModuleReferences.push(source);
            }
        }
    }

    // Deterministic Requirement -> Source Resolution
    // In Phase 1B, we resolve mappings either explicitly or structurally.
    for (const req of canonicalRequirements) {
        let mappedSourcesCount = 0;

        for (const source of currentModuleSources) {
             let isMapped = false;
             
             // Rule 1: The canonical syllabus inherently supports the requirements derived from it
             if (source.sourceVersionId && req.sourceVersionId === source.sourceVersionId) {
                 isMapped = true;
             }
             // Rule 2: Explicit section mapping ties the source to the module requirement
             else if (source.moduleSectionMappings && source.moduleSectionMappings.some((m: any) => m.moduleId === moduleId)) {
                 // For now, if it's explicitly section-mapped to this module, we map it to all requirements it conceptually covers
                 // We do a simple structural match: if the mapping topics match the requirement title/description
                 const mapping = source.moduleSectionMappings.find((m: any) => m.moduleId === moduleId);
                 if (mapping && mapping.relevantTopics) {
                     const reqText = (req.title + " " + req.description).toLowerCase();
                     if (mapping.relevantTopics.some((t: string) => reqText.includes(t.toLowerCase()))) {
                         isMapped = true;
                     }
                 }
             }
             // Rule 3 Removed: Semantic similarity alone cannot create canonical source authority without explicit auditable eligibility rule.

             if (isMapped) {
                 const refId = source.sourceVersionId || source.sourceId;
                 // Only add unique source refs
                 if (!requirementSourceMappings[req.id].includes(refId)) {
                     requirementSourceMappings[req.id].push(refId);
                 }
                 mappedSourcesCount++;
             }
        }

        if (mappedSourcesCount === 0) {
             coverageGaps.push(req.id);
             // Contract for future external research
             externalResearchContracts[req.id] = {
                 coverageStatus: 'SOURCE_COVERAGE_GAP',
                 externalResearchEligible: true
             };
        }
    }

    return {
        activeModuleId: moduleId,
        canonicalModuleIdentity: { projectId, moduleId },
        canonicalRequirements,
        canonicalSources: currentModuleSources,
        requirementSourceMappings,
        crossModuleReferences,
        coverageGaps,
        externalResearchContracts
    };
}
