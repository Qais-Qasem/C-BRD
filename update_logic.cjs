const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const startMarker = `const clientPrompt = \`
You are the Virtual Client acting as the executive team`;

const endMarker = `      // CRITICAL INVARIANT: Clean any false "I attached" statements if 0 attachments were actually created
      const sanitizedClientText = cleanFalseAttachmentClaims(clientReplyText, createdAttachments.length);`;

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers.");
  process.exit(1);
}

const replacement = `
          // PHASE 3A: TWO-PASS ATTACHMENT RESOLUTION
          const existingCaseAtts = Array.from(getStoreCollection("case_attachments").values()).filter((a: any) =>
            (a.projectId === (projectId || "PRJ-324") || a.projectId === "PRJ-324" || a.projectId === "PRJ-FSVP-01") &&
            a.moduleId === (moduleId || "MA-324-01") &&
            a.auditStatus === "ACTIVE"
          );

          existingCaseAtts.forEach(att => backfillDocumentIdentity(att, migrationResult.world));
          
          const intentPrompt = \`You are a C-Bridge Attachment Intent Analyzer.
Analyze the active session conversation and the latest incoming message.
Determine if the client persona needs to attach a document in their next response to satisfy the consultant's request.
Output a JSON array of attachment requirements. If no attachments are needed, output an empty array.

JSON Schema:
{
  "attachmentIntents": [
    {
      "requestedDocumentType": "MASTER_PURCHASE_AGREEMENT" | "CBP_ENTRY_SUMMARY_7501" | "FDA_ACE_FSVP_ENTRY_DATA" | "COMMERCIAL_INVOICE",
      "requiredEntityRefs": ["ENT-REL-X", "ENT-CLIENT-Y"],
      "requiredRelationshipRefs": ["REL-Z"],
      "requiredTransactionRefs": [],
      "purpose": "Provide commercial invoice for the supplier"
    }
  ]
}

Available canonical entities:
\${migrationResult.world.entities.map(e => \`[\${e.entityId}] \${e.legalName} (\${e.entityType})\`).join('\\n')}

Available canonical relationships:
\${migrationResult.world.relationships.map(r => \`[\${r.relationshipId}] \${r.relationshipType} between \${r.fromEntityId} and \${r.toEntityId}\`).join('\\n')}

Consultant Message: "\${messageBodyText}"
\`;

          const intentResult = await executeGovernedModelCall({
            aiClient: ai,
            purpose: "GENERAL_ASSIST",
            contents: intentPrompt,
            config: { responseMimeType: "application/json" },
            projectId, moduleId, caseId: activeCase.id || resolvedCaseId, memberId: senderName || 'Samar', sessionId: resolvedSessionId
          });

          const createdAttachments: any[] = [];
          let resolutionStatusText = "";

          if (intentResult.success && intentResult.rawText) {
            try {
              const parsedIntent = JSON.parse(intentResult.rawText.trim());
              if (parsedIntent.attachmentIntents && parsedIntent.attachmentIntents.length > 0) {
                for (const req of parsedIntent.attachmentIntents) {
                  const resolution = resolveDocumentAttachment(req, existingCaseAtts, activeSessionDisclosedAttIds, "CLIENT_EXEC");
                  if (resolution.matchStatus === 'MATCH') {
                    resolutionStatusText += \`\\n[RESOLVER: SUCCESS] Document \${resolution.documentType} successfully resolved and will be attached (ID: \${resolution.documentId}). You may state in your response that you are attaching it.\`;
                    
                    const matchedCanonical = existingCaseAtts.find(a => a.id === resolution.documentId || a.documentId === resolution.documentId);
                    if (matchedCanonical) {
                      matchedCanonical.messageId = clientMsgId;
                      matchedCanonical.disclosureStatus = "DISCLOSED";
                      matchedCanonical.disclosedAt = new Date().toISOString();
                      getStoreCollection("case_attachments").set(matchedCanonical.id, matchedCanonical);
                      if (db) {
                        try {
                          await setDoc(doc(db, "case_attachments", matchedCanonical.id), matchedCanonical);
                        } catch (e) {
                          console.warn("[Firestore] update disclosed attachment warning:", e);
                        }
                      }
                      if (!createdAttachments.some(a => (a.documentType && a.documentType === req.requestedDocumentType) || a.id === matchedCanonical.id)) {
                        createdAttachments.push(matchedCanonical);
                      }
                    }
                  } else if (resolution.matchStatus === 'NO_MATCH' || resolution.matchStatus === 'NOT_AVAILABLE') {
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
                  }
                }
              }
            } catch (e) {
              console.warn("Intent parsing error", e);
            }
          }

          const clientPrompt = \`
You are the Virtual Client acting as the executive team (e.g. Elena Rostova / Marco Bellini) of \${activeCase?.virtualCompanyName || activeCase?.companyName || "the company"}.

\${caseContextBlock}

SESSION MEMORY (Material Assertions & Corrections):
\${assertionHistory || "No prior material assertions recorded in this session."}

ACTIVE SESSION CONVERSATION HISTORY:
\${chatHistory}

NEW INCOMING MESSAGE from \${senderName || 'Samar'}:
"\${messageBodyText}"

\${attachmentBriefing}

ATTACHMENT RESOLUTION SYSTEM RESULT:
\${resolutionStatusText || "No documents requested or attached in this turn."}

CRITICAL INSTRUCTION:
Do not introduce new concrete case facts merely because they are plausible. If information is not present in authorized canonical persona knowledge, active-session conversation, or permitted persona belief state, do not state it as established fact. Use uncertainty or lack of knowledge where appropriate.
Return a JSON object strictly conforming to this schema:
{
  "speaker": "Elena Rostova" | "Marco Bellini" | "Elena Rostova & Marco Bellini",
  "text": "Your professional reply. Answer naturally, provide enough detail to respond accurately, remain concise when the question is simple, and provide additional detail when required to preserve factual consistency."
}
\`;

          console.log("[CLIENT_EXEC_TRACE]", JSON.stringify({
            model: process.env.CLIENT_SIMULATION_MODEL || process.env.PREMIUM_REASONING_MODEL || "gemini-3.1-pro-preview",
            caseId: activeCase.id || resolvedCaseId,
            sessionId: resolvedSessionId,
            personaId: senderName || 'Samar',
            structuredEntitiesCount: migrationResult.world ? migrationResult.world.entities.length : 0,
            structuredRelationshipsCount: migrationResult.world ? migrationResult.world.relationships.length : 0,
            structuredFactsCount: migrationResult.world ? migrationResult.world.facts.length : 0,
            personaVisibleFactsCount: migrationResult.world ? migrationResult.world.facts.filter(f => f.knowledgePolicy !== "HIDDEN_SCENARIO" && f.knowledgePolicy !== "INTERNAL_DIAGNOSTIC").length : 0,
            hiddenFactsExcludedCount: migrationResult.world ? migrationResult.world.facts.filter(f => f.knowledgePolicy === "HIDDEN_SCENARIO").length : 0,
            legacyNarrativeUsedAsAuthority: false,
            sessionAssertionCount: sessionAssertions.length,
            contextBuildResult: migrationResult.world ? "SUCCESS" : "CASE_WORLD_INCOMPLETE",
            canonicalContextPresent: !!activeCase,
            personaKnowledgeContextPresent: !!migrationResult.world,
            contextResolutionFailure: !migrationResult.world,
            migrationGap: migrationResult.gap
          }));

          const result = await executeGovernedModelCall({
            aiClient: ai,
            purpose: "CLIENT_SIMULATION",
            contents: clientPrompt,
            config: {
              responseMimeType: "application/json"
            },
            projectId,
            moduleId,
            caseId: activeCase.id || resolvedCaseId,
            memberId: senderName || 'Samar',
            sessionId
          });

          if (result.success && result.rawText) {
            try {
              const parsed = JSON.parse(result.rawText.trim());
              if (parsed.text) clientReplyText = parsed.text.trim();
            } catch (pErr) {
              clientReplyText = result.rawText.trim();
            }
            
            // Asynchronously extract assertions
            extractAndStoreAssertions({
              aiClient: ai,
              projectId,
              moduleId,
              caseId: activeCase.id || resolvedCaseId,
              sessionId: resolvedSessionId,
              messageId: clientMsgId,
              speaker: (() => { try { return JSON.parse(result.rawText.trim()).speaker || 'Client'; } catch { return 'Client'; } })(),
              text: clientReplyText,
              priorAssertions: sessionAssertions
            }).catch(err => console.warn("Failed to extract assertions:", err));
          }
        } catch (e) {
          console.warn("Gemini client response generation failed:", e);
        }
      }

`;

const newCode = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync('server.ts', newCode);
console.log("Updated AI logic in server.ts");
