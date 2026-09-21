const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetFallback = `                  } else if (resolution.matchStatus === 'NO_MATCH' || resolution.matchStatus === 'NOT_AVAILABLE') {
                    // Try to generate synthetic fallback if it's one of the standard types
                    const docType = req.requestedDocumentType;
                    if (docType && ['MASTER_PURCHASE_AGREEMENT', 'CBP_ENTRY_SUMMARY_7501', 'FDA_ACE_FSVP_ENTRY_DATA', 'COMMERCIAL_INVOICE'].includes(docType)) {
                      const caseFacts = {
                        companyName: activeCase.virtualCompanyName || activeCase.companyName || "Levant Culinary Traditions Corp",
                        headquarters: "Chicago, IL",
                        facilityLocations: ["Chicago, IL", "Newark, NJ"],
                        commodities: (activeCase.products || []).map((p: any) => p.name || p.productName).length > 0 ? activeCase.products.map((p: any) => p.name || p.productName) : [
                          "Cold-Pressed Extra Virgin Olive Oil", "Artisanal Sesame Tahini", "Halva Confections", "Artisanal Za'atar Seasonings"
                        ],
                        ein: "36-9284102", duns: "08-392-1048",
                        supplierName: "Al-Arz Cedar Olive Press & Mill", supplierCountry: "Lebanon",
                        portOfEntry: "Port of Newark / New York (Port Code: 4601)",
                        brokerName: "Trans-Atlantic Customs Clearance Services LLC", brokerFilerCode: "9B2-849201",
                        entryNumber: "750-4829103-8", incotermsRule: "FOB"
                      };
                      const docResult = await generateSyntheticDocument({
                        projectId: projectId || "PRJ-324",
                        moduleId: moduleId || "MA-324-01",
                        caseId: caseId || "CASE-LEVANT-01",
                        sessionId: resolvedSessionId,
                        documentType: docType,
                        caseFacts,
                        generatedByPersonaId: "PER-01"
                      });
                      const attRecord = await createAndPersistSyntheticAttachment(docResult, clientMsgId, "CLIENT_ENGAGEMENT");
                      attRecord.disclosureStatus = "DISCLOSED";
                      // backfill instantly
                      backfillDocumentIdentity(attRecord, migrationResult.world);
                      
                      // Now check if it matches the requirement
                      const postGenResolution = resolveDocumentAttachment(req, [attRecord], activeSessionDisclosedAttIds, "CLIENT_EXEC");
                      if (postGenResolution.matchStatus === 'MATCH') {
                         if (!createdAttachments.some(a => (a.documentType && a.documentType === docType) || a.id === attRecord.id)) {
                           createdAttachments.push(attRecord);
                         }
                         resolutionStatusText += \`\\n[RESOLVER: SUCCESS] Document \${docType} was located and will be attached (ID: \${attRecord.id}). You may state in your response that you are attaching it.\`;
                      } else {
                         resolutionStatusText += \`\\n[RESOLVER: \${postGenResolution.matchStatus}] The requested document (Type: \${req.requestedDocumentType}) matching entities [\${req.requiredEntityRefs.join(', ')}] could not be found or is ambiguous/conflicted. DO NOT fabricate a document. State that you do not have it or need to look for it.\`;
                      }
                    } else {
                      resolutionStatusText += \`\\n[RESOLVER: \${resolution.matchStatus}] The requested document (Type: \${req.requestedDocumentType}) matching entities [\${req.requiredEntityRefs.join(', ')}] could not be found or is ambiguous/conflicted. DO NOT fabricate a document. State that you do not have it or need to look for it.\`;
                    }
                  } else {
                    resolutionStatusText += \`\\n[RESOLVER: \${resolution.matchStatus}] The requested document (Type: \${req.requestedDocumentType}) matching entities [\${req.requiredEntityRefs.join(', ')}] could not be found or is ambiguous/conflicted. DO NOT fabricate a document. State that you do not have it or need to look for it.\`;
                  }`;

const newFallback = `                  } else if (resolution.matchStatus === 'NO_MATCH' || resolution.matchStatus === 'NOT_AVAILABLE') {
                    resolutionStatusText += \`\\n[RESOLVER: \${resolution.matchStatus}] The requested document (Type: \${req.requestedDocumentType}) matching entities [\${req.requiredEntityRefs.join(', ')}] could not be found. DO NOT fabricate a document. State that you do not have it or need to look for it.\`;
                  } else {
                    resolutionStatusText += \`\\n[RESOLVER: \${resolution.matchStatus}] The requested document (Type: \${req.requestedDocumentType}) matching entities [\${req.requiredEntityRefs.join(', ')}] is ambiguous, conflicted, or unauthorized. DO NOT fabricate a document. State that you cannot provide it.\`;
                  }`;

if (code.includes(targetFallback)) {
  code = code.replace(targetFallback, newFallback);
  fs.writeFileSync('server.ts', code);
  console.log('Removed case-specific fallback.');
} else {
  console.log('Could not find case-specific fallback block.');
}
