const fs = require('fs');
let code = fs.readFileSync('server/contextCompiler.ts', 'utf8');

// We will redefine the migration function to return a result object.
const newMigrationLogic = `
export interface MigrationGap {
  caseId: string;
  migrationStatus: "COMPLETE" | "PARTIAL" | "BLOCKED";
  missingObjectTypes: string[];
  unresolvedRefs: string[];
  blockedRelationships: string[];
  sourceFieldsInspected: string[];
  prohibitedNarrativeSources: string[];
  nextRequiredCanonicalInput: string[];
}

export interface MigrationResult {
  status: "COMPLETE" | "PARTIAL" | "BLOCKED";
  world: StructuredCaseWorld | null;
  gap?: MigrationGap;
}

export function migrateToStructuredWorld(activeCase: any): MigrationResult {
  if (activeCase.structuredWorld) {
    return { status: "COMPLETE", world: activeCase.structuredWorld };
  }

  const entities: CanonicalEntity[] = [];
  const relationships: CanonicalRelationship[] = [];
  const events: CanonicalEvent[] = [];
  const facts: CanonicalFact[] = [];
  const issues: CanonicalIssue[] = [];

  const sourceFieldsInspected = [];
  const prohibitedNarrativeSources = [];
  
  if (activeCase.clientSituation) prohibitedNarrativeSources.push("clientSituation");
  if (activeCase.caseNarrative) prohibitedNarrativeSources.push("caseNarrative");

  const clientId = "ENT-CLIENT-01";
  if (activeCase.virtualCompanyName || activeCase.companyName) {
    entities.push({
      entityId: clientId,
      entityType: "CLIENT_COMPANY",
      legalName: activeCase.virtualCompanyName || activeCase.companyName,
      displayName: activeCase.virtualCompanyName || activeCase.companyName,
      status: "CONFIRMED",
      provenance: ["LEGACY_STRUCTURED_FIELD:companyName"]
    });
    sourceFieldsInspected.push("companyName", "virtualCompanyName");
  } else {
    return {
      status: "BLOCKED",
      world: null,
      gap: {
        caseId: activeCase.id || activeCase.caseId || "UNKNOWN",
        migrationStatus: "BLOCKED",
        missingObjectTypes: ["CLIENT_COMPANY"],
        unresolvedRefs: [],
        blockedRelationships: [],
        sourceFieldsInspected,
        prohibitedNarrativeSources,
        nextRequiredCanonicalInput: ["companyName"]
      }
    };
  }

  let hasStructuredRelationships = false;

  // Generic relationship resolution from multiple possible fields
  const supplierLists = [
    { field: "foreignSupplierFacilities", type: "FOREIGN_SUPPLIER", role: "SUPPLIER", customerRole: "IMPORTER" },
    { field: "suppliers", type: "SUPPLIER", role: "SUPPLIER", customerRole: "CUSTOMER" },
    { field: "vendors", type: "VENDOR", role: "VENDOR", customerRole: "CUSTOMER" },
    { field: "parties", type: "PARTY", role: "COUNTERPARTY", customerRole: "CLIENT" },
    { field: "organizations", type: "ORGANIZATION", role: "COUNTERPARTY", customerRole: "CLIENT" }
  ];

  let supplierIndex = 1;

  for (const list of supplierLists) {
    if (activeCase[list.field] && Array.isArray(activeCase[list.field]) && activeCase[list.field].length > 0) {
      sourceFieldsInspected.push(list.field);
      activeCase[list.field].forEach((item: any) => {
        const itemId = \`ENT-REL-\${supplierIndex++}\`;
        entities.push({
          entityId: itemId,
          entityType: list.type,
          legalName: item.name || item.legalName || \`\${list.type} \${supplierIndex}\`,
          status: "CONFIRMED",
          provenance: [\`LEGACY_STRUCTURED_FIELD:\${list.field}\`]
        });
        relationships.push({
          relationshipId: \`REL-\${supplierIndex}\`,
          relationshipType: \`\${list.role}_\${list.customerRole}\`,
          fromEntityId: itemId,
          toEntityId: clientId,
          roles: {
            [itemId]: list.role,
            [clientId]: list.customerRole
          },
          status: "CONFIRMED",
          knowledgePolicy: "KNOWN_TO_CLIENT",
          provenance: [\`LEGACY_STRUCTURED_FIELD:\${list.field}\`]
        });
        hasStructuredRelationships = true;
      });
    }
  }

  if (activeCase.hiddenCaseFacts && Array.isArray(activeCase.hiddenCaseFacts)) {
      sourceFieldsInspected.push("hiddenCaseFacts");
      activeCase.hiddenCaseFacts.forEach((hcf: any) => {
          facts.push({
              factId: hcf.id || \`FACT-\${Math.random().toString(36).substring(7)}\`,
              subjectRef: clientId,
              predicate: hcf.category || "Hidden Case Fact",
              objectValueOrRef: hcf.fact,
              factStatus: "HIDDEN_SCENARIO",
              knowledgePolicy: hcf.isDiscovered ? "DISCOVERABLE_BY_CONSULTANT" : "HIDDEN_SCENARIO",
              provenance: ["LEGACY_STRUCTURED_FIELD:hiddenCaseFacts"]
          });
      });
  }

  // Preserve legacy narrative as a fact but restrict it so it doesn't pollute the context as canonical truth.
  if (activeCase.clientSituation) {
      facts.push({
          factId: "FACT-LEGACY-NARRATIVE",
          subjectRef: clientId,
          predicate: "legacySituationNarrative",
          objectValueOrRef: activeCase.clientSituation,
          factStatus: "LEGACY_NARRATIVE",
          knowledgePolicy: "INTERNAL_DIAGNOSTIC",
          provenance: ["LEGACY_STRUCTURED_FIELD:clientSituation"]
      });
  }

  if (!hasStructuredRelationships) {
    return {
      status: "BLOCKED",
      world: null,
      gap: {
        caseId: activeCase.id || activeCase.caseId || "UNKNOWN",
        migrationStatus: "BLOCKED",
        missingObjectTypes: ["RELATIONSHIP"],
        unresolvedRefs: [],
        blockedRelationships: ["Missing structured counterparty arrays"],
        sourceFieldsInspected,
        prohibitedNarrativeSources,
        nextRequiredCanonicalInput: ["suppliers", "parties", "vendors", "foreignSupplierFacilities"]
      }
    };
  }

  const world: StructuredCaseWorld = { entities, relationships, events, facts, issues };
  return { status: "COMPLETE", world };
}
`;

code = code.replace(/export function migrateToStructuredWorld[\s\S]*$/, newMigrationLogic);

fs.writeFileSync('server/contextCompiler.ts', code);
console.log('Updated server/contextCompiler.ts');
