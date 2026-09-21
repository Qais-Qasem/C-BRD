import { resolveDocumentAttachment, backfillDocumentIdentity, DocumentRequirement } from '../server/documentResolver.ts';
import { migrateToStructuredWorld } from '../server/contextCompiler.ts';

// Mock the getStoreCollection and other dependencies for a quick dry run
const caseData = {
  id: "CASE-LEVANT-01",
  virtualCompanyName: "Levant Culinary Traditions Corp",
  parties: [
    { name: "Levant Culinary Traditions Corp", role: "IMPORTER" },
    { name: "Al-Arz Cedar Olive Press & Mill", role: "SUPPLIER" },
    { name: "Trans-Atlantic Customs Clearance Services LLC", role: "BROKER" }
  ]
};

const migrationResult = migrateToStructuredWorld(caseData);
console.log("MIGRATION WORLD ENTITIES:", migrationResult.world?.entities?.length);

const mockExistingAttachments = [
  {
    id: "ATT-SYNTH-MPA-740364",
    documentType: "MASTER_PURCHASE_AGREEMENT",
    visibilityScope: "CLIENT_FACING",
    extractedTextSummary: "Master purchase agreement for Levant Culinary Traditions Corp and Al-Arz Cedar Olive Press & Mill."
  },
  {
    id: "ATT-SYNTH-INV-860403",
    documentType: "COMMERCIAL_INVOICE",
    visibilityScope: "CLIENT_FACING",
    structuredEvidenceData: { supplier: "Al-Arz Cedar Olive Press & Mill" }
  }
];

mockExistingAttachments.forEach(att => backfillDocumentIdentity(att, migrationResult.world));
console.log("BACKFILLED ATTACHMENTS:");
mockExistingAttachments.forEach(att => {
  console.log(`- ${att.id} [${att.documentType}] Entities: ${JSON.stringify((att as any).entityRefs)} Rels: ${JSON.stringify((att as any).relationshipRefs)}`);
});

const req: DocumentRequirement = {
  requestedDocumentType: "MASTER_PURCHASE_AGREEMENT",
  requiredEntityRefs: migrationResult.world?.entities?.filter(e => e.legalName === "Al-Arz Cedar Olive Press & Mill").map(e => e.entityId) || [],
  requiredRelationshipRefs: [],
  requiredTransactionRefs: []
};

// Simulate that it's NOT in the active session disclosure set (empty set) to test if it's DISCLOSED via visibilityScope = CLIENT_FACING
const sessionDisclosedDocIds = new Set<string>();

console.log("REQ:", req);
const res = resolveDocumentAttachment(req, mockExistingAttachments, sessionDisclosedDocIds, "CLIENT_EXEC");
console.log("RESOLUTION:", res);

const internalReq: DocumentRequirement = {
  requestedDocumentType: "RISK_ASSESSMENT",
  requiredEntityRefs: [],
  requiredRelationshipRefs: [],
  requiredTransactionRefs: []
};
const internalAtt = {
    id: "ATT-INTERNAL-1",
    documentType: "RISK_ASSESSMENT",
    visibilityScope: "INTERNAL_CBRIDGE",
    entityRefs: []
};
const resInternal = resolveDocumentAttachment(internalReq, [internalAtt], sessionDisclosedDocIds, "CLIENT_EXEC");
console.log("INTERNAL RESOLUTION:", resInternal);
