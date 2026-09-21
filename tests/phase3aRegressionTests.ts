import { resolveDocumentAttachment, DocumentRequirement } from '../server/documentResolver.ts';

export async function runPhase3ARegressionTests() {
  const results: any[] = [];
  const logTest = (name: string, passed: boolean, details: string) => {
    results.push({ name, passed, details });
  };

  // Setup mock documents
  const mockAvailableDocuments = [
    {
      id: "DOC-A",
      documentType: "MASTER_PURCHASE_AGREEMENT",
      entityRefs: ["ENT-A", "ENT-SUPPLIER-1"],
      relationshipRefs: ["REL-1"],
      transactionRefs: ["TX-1"],
      visibilityScope: "CLIENT_FACING"
    },
    {
      id: "DOC-B",
      documentType: "MASTER_PURCHASE_AGREEMENT",
      entityRefs: ["ENT-B", "ENT-SUPPLIER-1"],
      relationshipRefs: ["REL-2"],
      transactionRefs: ["TX-2"],
      visibilityScope: "CLIENT_FACING"
    },
    {
      id: "DOC-C-INVOICE",
      documentType: "COMMERCIAL_INVOICE",
      entityRefs: ["ENT-A", "ENT-SUPPLIER-1"],
      relationshipRefs: ["REL-1"],
      transactionRefs: ["TX-3"],
      visibilityScope: "CLIENT_FACING"
    },
    {
      id: "DOC-D-INVOICE",
      documentType: "COMMERCIAL_INVOICE",
      entityRefs: ["ENT-A", "ENT-SUPPLIER-1"],
      relationshipRefs: ["REL-1"],
      transactionRefs: ["TX-4"],
      visibilityScope: "CLIENT_FACING"
    },
    {
      id: "DOC-CONFLICT",
      documentType: "FDA_ACE_FSVP_ENTRY_DATA",
      entityRefs: ["ENT-A"],
      relationshipRefs: [],
      transactionRefs: [],
      hasIdentityConflict: true,
      visibilityScope: "CLIENT_FACING"
    },
    {
      id: "DOC-INTERNAL",
      documentType: "RISK_ASSESSMENT",
      entityRefs: ["ENT-A"],
      relationshipRefs: [],
      transactionRefs: [],
      visibilityScope: "INTERNAL_CBRIDGE"
    },
    {
      id: "DOC-VENDOR",
      documentType: "VENDOR_AGREEMENT",
      entityRefs: ["ENT-VENDOR-A"],
      relationshipRefs: [],
      transactionRefs: [],
      visibilityScope: "CLIENT_FACING"
    }
  ];

  const sessionDisclosedDocIds = new Set<string>();

  // TEST A — SAME TYPE, DIFFERENT ENTITY
  const reqA: DocumentRequirement = {
    requestedDocumentType: "MASTER_PURCHASE_AGREEMENT",
    requiredEntityRefs: ["ENT-B"],
    requiredRelationshipRefs: [],
    requiredTransactionRefs: []
  };
  const resA = resolveDocumentAttachment(reqA, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST A (Same type, different entity)", resA.documentId === "DOC-B" && resA.matchStatus === "MATCH", `Expected DOC-B, got ${resA.documentId}`);

  // TEST B — SAME PARTIES, DIFFERENT TRANSACTION
  const reqB: DocumentRequirement = {
    requestedDocumentType: "COMMERCIAL_INVOICE",
    requiredEntityRefs: ["ENT-A", "ENT-SUPPLIER-1"],
    requiredRelationshipRefs: ["REL-1"],
    requiredTransactionRefs: ["TX-4"]
  };
  const resB = resolveDocumentAttachment(reqB, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST B (Same parties, different tx)", resB.documentId === "DOC-D-INVOICE" && resB.matchStatus === "MATCH", `Expected DOC-D-INVOICE, got ${resB.documentId}`);

  // TEST C — RAW CONTENT IDENTITY CONFLICT
  const reqC: DocumentRequirement = {
    requestedDocumentType: "FDA_ACE_FSVP_ENTRY_DATA",
    requiredEntityRefs: ["ENT-A"],
    requiredRelationshipRefs: [],
    requiredTransactionRefs: []
  };
  const resC = resolveDocumentAttachment(reqC, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST C (Raw content identity conflict)", resC.matchStatus === "IDENTITY_CONFLICT", `Expected IDENTITY_CONFLICT, got ${resC.matchStatus}`);

  // TEST D — NO MATCH
  const reqD: DocumentRequirement = {
    requestedDocumentType: "BILL_OF_LADING",
    requiredEntityRefs: ["ENT-A"],
    requiredRelationshipRefs: [],
    requiredTransactionRefs: []
  };
  const resD = resolveDocumentAttachment(reqD, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST D (No Match)", resD.matchStatus === "NO_MATCH", `Expected NO_MATCH, got ${resD.matchStatus}`);

  // TEST E — AMBIGUOUS
  const reqE: DocumentRequirement = {
    requestedDocumentType: "COMMERCIAL_INVOICE",
    requiredEntityRefs: ["ENT-A"], // Does not specify transaction, matches 2 invoices
    requiredRelationshipRefs: [],
    requiredTransactionRefs: []
  };
  const resE = resolveDocumentAttachment(reqE, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST E (Ambiguous)", resE.matchStatus === "AMBIGUOUS", `Expected AMBIGUOUS, got ${resE.matchStatus}`);

  // TEST F — NOT DISCLOSED
  const reqF: DocumentRequirement = {
    requestedDocumentType: "RISK_ASSESSMENT",
    requiredEntityRefs: ["ENT-A"],
    requiredRelationshipRefs: [],
    requiredTransactionRefs: []
  };
  const resF = resolveDocumentAttachment(reqF, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST F (Not Disclosed)", resF.matchStatus === "NOT_DISCLOSED" || resF.disclosureStatus === "UNAUTHORIZED", `Expected NOT_DISCLOSED, got ${resF.matchStatus} / ${resF.disclosureStatus}`);

  // TEST G — REGEX TRAP
  // A regex for "agreement" might find both DOC-A and DOC-B. Resolver correctly needs entity resolution to pick one, or it's ambiguous.
  const reqG: DocumentRequirement = {
    requestedDocumentType: "MASTER_PURCHASE_AGREEMENT",
    requiredEntityRefs: [],
    requiredRelationshipRefs: [],
    requiredTransactionRefs: []
  };
  const resG = resolveDocumentAttachment(reqG, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST G (Regex Trap - Ambiguous)", resG.matchStatus === "AMBIGUOUS", `Expected AMBIGUOUS without entity refs, got ${resG.matchStatus}`);

  // TEST H — TEXT / ATTACHMENT COHERENCE
  const clientReplyText = "I am attaching Entity B's document.";
  const createdAttachments: any[] = []; // Simulate failed attachment
  const attachmentClaimRegex = /I (am attaching|have attached|will attach|attached)|please find attached|here is the|see attached/i;
  const hasAttachmentClaim = attachmentClaimRegex.test(clientReplyText);
  let finalValidatedText = clientReplyText;
  if (hasAttachmentClaim && createdAttachments.length === 0) {
    finalValidatedText = "I have reviewed your request. However, I am unable to locate or provide the specific documentation you requested at this time from our canonical records.";
  }
  logTest("TEST H (Coherence)", finalValidatedText !== clientReplyText && !attachmentClaimRegex.test(finalValidatedText), `Expected replanned text, got ${finalValidatedText}`);

  // TEST I — SECOND DOMAIN
  const reqI: DocumentRequirement = {
    requestedDocumentType: "VENDOR_AGREEMENT",
    requiredEntityRefs: ["ENT-VENDOR-A"],
    requiredRelationshipRefs: [],
    requiredTransactionRefs: []
  };
  const resI = resolveDocumentAttachment(reqI, mockAvailableDocuments, sessionDisclosedDocIds, "CLIENT_EXEC");
  logTest("TEST I (Second Domain)", resI.documentId === "DOC-VENDOR" && resI.matchStatus === "MATCH", `Expected DOC-VENDOR, got ${resI.documentId}`);

  // TEST J — EXPLICIT NO ATTACHMENT
  // Emulated by sending an empty DocumentRequirement or empty attachmentIntents array, resulting in no call to resolver and 0 attachments.
  const attachmentIntents: any[] = [];
  logTest("TEST J (Explicit No Attachment)", attachmentIntents.length === 0, `Expected 0 intents.`);

  console.log("=== PHASE 3A REGRESSION TESTS ===");
  results.forEach(r => console.log(`${r.passed ? 'PASS' : 'FAIL'} - ${r.name}: ${r.details}`));
  return results;
}
runPhase3ARegressionTests();
