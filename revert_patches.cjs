const fs = require('fs');

// Revert server.ts
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  `{ facilityName: "Petra Artisanal Foods Ltd.", country: "Jordan", productsSupplied: "Stone-Ground Sesame Tahini", certification: "HACCP Certified / Third-party Audited", fdaRegistered: true }`,
  `{ facilityName: "Jordan Valley Sesame & Tahini Processing Co.", country: "Jordan", productsSupplied: "Stone-Ground Sesame Tahini", certification: "HACCP Certified / Third-party Audited", fdaRegistered: true }`
);

const txTarget1 = `    transactions: [
      { id: "TX-LEBANON-001", supplier: "Al-Arz Cedar Olive Press & Mill" },
      { id: "TX-JORDAN-001", supplier: "Petra Artisanal Foods Ltd." }
    ],`;
server = server.replace(txTarget1, "");

const txTarget2 = `        transactions: [
          { id: "TX-LEBANON-001", supplier: "Al-Arz Cedar Olive Press & Mill" },
          { id: "TX-JORDAN-001", supplier: "Petra Artisanal Foods Ltd." }
        ],`;
server = server.replace(txTarget2, "");

const hcfTarget = `,
        {
          id: "HCF-05",
          category: "Missing Supply Agreements",
          fact: "The Master Purchase Agreement for Petra Artisanal Foods Ltd. (DOC-MPA-PETRA) does not exist or was never executed. In contrast, DOC-MPA-AL-ARZ is fully executed.",
          discoveryTrigger: "Inquire about supplier contracts for Jordan/Petra compared to Lebanon/Al-Arz.",
          isDiscovered: false
        }`;
server = server.replace(hcfTarget, "");

const handleTarget = `            const enrichedFacts = { ...caseFacts };
            if (docType === 'COMMERCIAL_INVOICE') {
              enrichedFacts.documentId = 'DOC-INVOICE-0403';
              enrichedFacts.invoiceNo = 'INVOICE-0403';
            } else if (docType === 'MASTER_PURCHASE_AGREEMENT') {
              enrichedFacts.documentId = 'DOC-MPA-AL-ARZ';
            }
            const docResult = await generateSyntheticDocument({
              projectId: projectId || "PRJ-324",
              moduleId: moduleId || "MA-324-01",
              caseId: caseId || "CASE-LEVANT-01",
              sessionId: resolvedSessionId,
              documentType: docType,
              caseFacts: enrichedFacts,
              generatedByPersonaId: "PER-01"
            });`;
const handleReplace = `            const docResult = await generateSyntheticDocument({
              projectId: projectId || "PRJ-324",
              moduleId: moduleId || "MA-324-01",
              caseId: caseId || "CASE-LEVANT-01",
              sessionId: resolvedSessionId,
              documentType: docType,
              caseFacts,
              generatedByPersonaId: "PER-01"
            });`;
server = server.replace(handleTarget, handleReplace);

const startCaseSessionTarget1 = `      const mpaDoc = await generateMasterPurchaseAgreement({
        caseFacts: { ...caseFacts, documentId: 'DOC-MPA-AL-ARZ' },
        projectId,
        moduleId,
        caseId,
        sessionId,
        documentType: 'MASTER_PURCHASE_AGREEMENT'
      });`;
const startCaseSessionReplace1 = `      const mpaDoc = await generateMasterPurchaseAgreement({
        projectId,
        moduleId,
        caseId,
        sessionId,
        documentType: 'MASTER_PURCHASE_AGREEMENT',
        caseFacts
      });`;
server = server.replace(startCaseSessionTarget1, startCaseSessionReplace1);
server = server.replace(startCaseSessionTarget1, startCaseSessionReplace1);

fs.writeFileSync('server.ts', server);

// Revert syntheticDocumentEngine.ts
let synth = fs.readFileSync('server/syntheticDocumentEngine.ts', 'utf8');
synth = synth.replace(
  'const docId = cf.documentId || `DOC-MPA-${Date.now().toString().slice(-6)}`;',
  'const docId = `DOC-MPA-${Date.now().toString().slice(-6)}`;'
);
synth = synth.replace(
  'const docId = cf.documentId || `DOC-INV-${Date.now().toString().slice(-6)}`;',
  'const docId = `DOC-INV-${Date.now().toString().slice(-6)}`;'
);
synth = synth.replace(
  'const invoiceNo = cf.invoiceNo || `INV-${Date.now().toString().slice(-4)}`;',
  'const invoiceNo = `INV-${Date.now().toString().slice(-4)}`;'
);
fs.writeFileSync('server/syntheticDocumentEngine.ts', synth);

console.log("Reverted");
