export function validateTopicAgainstRequirements(topic: any, reqMap: any, activeModuleId: string, allReqMaps: any[] = []): { isValid: boolean, reason?: string, validatedTopic?: any } {
    if (!topic) return { isValid: false, reason: "No topic provided" };
    if (!reqMap || reqMap.moduleId !== activeModuleId) return { isValid: false, reason: "Invalid requirements map" };
    if (!reqMap.requirements || !Array.isArray(reqMap.requirements)) return { isValid: false, reason: "No canonical requirements found" };

    if (topic.relevanceCategory === "PRIMARY_MODULE_TOPIC") {
        if (!Array.isArray(topic.moduleRequirementsCovered) || topic.moduleRequirementsCovered.length === 0) {
            return { isValid: false, reason: "Primary topic must cover at least one canonical requirement" };
        }
        for (const reqId of topic.moduleRequirementsCovered) {
            const foundReq = reqMap.requirements.find((r: any) => r.id === reqId);
            if (!foundReq) {
                return { isValid: false, reason: `Requirement ${reqId} not found in canonical map` };
            }
            if (foundReq.moduleId !== activeModuleId) {
                return { isValid: false, reason: `Requirement ${reqId} belongs to a different module` };
            }
        }
    } else if (topic.relevanceCategory === "CROSS_MODULE_REFERENCE") {
        if (!topic.sourceModuleId) {
            return { isValid: false, reason: "CROSS_MODULE_REFERENCE requires sourceModuleId" };
        }
        const foreignMap = allReqMaps.find(m => m.moduleId === topic.sourceModuleId);
        if (topic.sourceRequirementId) {
            if (!foreignMap) {
                return { isValid: false, reason: `Foreign module map ${topic.sourceModuleId} not found to validate sourceRequirementId` };
            }
            const foreignReq = foreignMap.requirements.find((r: any) => r.id === topic.sourceRequirementId);
            if (!foreignReq) {
                return { isValid: false, reason: `Foreign requirement ${topic.sourceRequirementId} not found in module ${topic.sourceModuleId}` };
            }
            if (foreignReq.moduleId !== topic.sourceModuleId) {
                return { isValid: false, reason: `Foreign requirement ${topic.sourceRequirementId} ownership mismatch` };
            }
        }

        topic.countsTowardCurrentCompletion = false;
        topic.countsTowardCurrentAssessment = false;
        topic.isSelected = false; // prevent selection as current objective
    }

    return { isValid: true, validatedTopic: { ...topic, moduleId: activeModuleId } };
}
