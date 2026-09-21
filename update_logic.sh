sed -i '/topic.countsTowardCurrentCompletion = false;/i \
        const foreignMap = allReqMaps.find(m => m.moduleId === topic.sourceModuleId);\
        if (topic.sourceRequirementId) {\
            if (!foreignMap) {\
                return { isValid: false, reason: `Foreign module map ${topic.sourceModuleId} not found to validate sourceRequirementId` };\
            }\
            const foreignReq = foreignMap.requirements.find((r: any) => r.id === topic.sourceRequirementId);\
            if (!foreignReq) {\
                return { isValid: false, reason: `Foreign requirement ${topic.sourceRequirementId} not found in module ${topic.sourceModuleId}` };\
            }\
            if (foreignReq.moduleId !== topic.sourceModuleId) {\
                return { isValid: false, reason: `Foreign requirement ${topic.sourceRequirementId} ownership mismatch` };\
            }\
        }\
' server/studyModuleAuthority.ts
