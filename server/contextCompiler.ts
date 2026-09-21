
export type CanonicalFactStatus = "CONFIRMED" | "UNVERIFIED" | "DISPUTED" | "UNKNOWN" | "INFERRED" | "HIDDEN_SCENARIO" | "LEGACY_NARRATIVE";
export type KnowledgePolicy = "PUBLIC_TO_CASE" | "KNOWN_TO_CLIENT" | "KNOWN_TO_SPECIFIC_PERSONA" | "KNOWN_TO_CBRIDGE" | "DISCOVERABLE_BY_CONSULTANT" | "DISCLOSED_IN_ACTIVE_SESSION" | "HIDDEN_SCENARIO" | "INTERNAL_DIAGNOSTIC";

export interface CanonicalEntity {
  entityId: string;
  entityType: string;
  legalName?: string;
  displayName?: string;
  aliases?: string[];
  attributes?: Record<string, any>;
  provenance?: string[];
  status: CanonicalFactStatus;
}

export interface CanonicalRelationship {
  relationshipId: string;
  relationshipType: string;
  fromEntityId: string;
  toEntityId: string;
  roles: Record<string, string>;
  attributes?: Record<string, any>;
  status: CanonicalFactStatus;
  provenance?: string[];
  knowledgePolicy: KnowledgePolicy;
}

export interface CanonicalEvent {
  eventId: string;
  eventType: string;
  participantEntityIds: string[];
  locationRef?: string;
  transactionRef?: string;
  occurredAt?: string;
  status: CanonicalFactStatus;
  provenance?: string[];
  knowledgePolicy: KnowledgePolicy;
}

export interface CanonicalFact {
  factId: string;
  subjectRef: string;
  predicate: string;
  objectValueOrRef: string | any;
  factStatus: CanonicalFactStatus;
  provenance?: string[];
  confidence?: number;
  knowledgePolicy: KnowledgePolicy;
}

export interface CanonicalIssue {
  issueId: string;
  issueType: string;
  relatedRefs: string[];
  status: CanonicalFactStatus;
  provenance?: string[];
  knowledgePolicy: KnowledgePolicy;
}

export interface StructuredCaseWorld {
  entities: CanonicalEntity[];
  relationships: CanonicalRelationship[];
  events: CanonicalEvent[];
  facts: CanonicalFact[];
  issues: CanonicalIssue[];
}

export class PersonaContextCompiler {
  constructor(private world: StructuredCaseWorld) {}

  compileForPersona(personaId: string, role: string): string {
    const isClient = role.includes("CLIENT");
    const isConsultant = role.includes("CONSULTANT");

    const canSee = (policy: KnowledgePolicy) => {
      if (policy === "PUBLIC_TO_CASE") return true;
      if (isClient && policy === "KNOWN_TO_CLIENT") return true;
      if (isClient && policy === "DISCOVERABLE_BY_CONSULTANT") return true;
      if (isConsultant && policy === "DISCOVERABLE_BY_CONSULTANT") return false;
      if (policy === "DISCLOSED_IN_ACTIVE_SESSION") return true;
      if (policy === "KNOWN_TO_SPECIFIC_PERSONA") return true;
      return false;
    };

    const visibleEntities = this.world.entities.filter(e => e.status !== "HIDDEN_SCENARIO");
    const visibleRelationships = this.world.relationships.filter(r => canSee(r.knowledgePolicy));
    const visibleFacts = this.world.facts.filter(f => canSee(f.knowledgePolicy));
    const visibleIssues = this.world.issues.filter(i => canSee(i.knowledgePolicy));
    const visibleEvents = this.world.events.filter(e => canSee(e.knowledgePolicy));

    let context = "STRUCTURED CANONICAL PERSONA KNOWLEDGE:\n";
    
    if (visibleEntities.length > 0) {
      context += "- ENTITIES KNOWN TO YOU:\n";
      visibleEntities.forEach(e => {
        context += `  * [${e.entityId}] ${e.displayName || e.legalName} (Type: ${e.entityType})\n`;
      });
    }

    if (visibleRelationships.length > 0) {
      context += "- RELATIONSHIPS KNOWN TO YOU:\n";
      visibleRelationships.forEach(r => {
        context += `  * [${r.relationshipId}] Type: ${r.relationshipType}. Between [${r.fromEntityId}] and [${r.toEntityId}]. Roles: ${JSON.stringify(r.roles)}\n`;
      });
    }

    if (visibleEvents.length > 0) {
      context += "- EVENTS KNOWN TO YOU:\n";
      visibleEvents.forEach(e => {
        context += `  * [${e.eventId}] ${e.eventType}. Participants: ${e.participantEntityIds.join(", ")} ${e.locationRef ? `at ${e.locationRef}` : ''}\n`;
      });
    }

    if (visibleFacts.length > 0) {
      context += "- ESTABLISHED FACTS KNOWN TO YOU:\n";
      visibleFacts.forEach(f => {
        context += `  * [${f.factId}] Subject: [${f.subjectRef}] | Predicate: ${f.predicate} | Value: ${JSON.stringify(f.objectValueOrRef)} (Status: ${f.factStatus})\n`;
      });
    }

    if (visibleIssues.length > 0) {
      context += "- ISSUES/CONCERNS KNOWN TO YOU:\n";
      visibleIssues.forEach(i => {
        context += `  * [${i.issueId}] ${i.issueType} related to [${i.relatedRefs.join(", ")}]\n`;
      });
    }

    return context;
  }
}


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

export function normalizeRelationshipRole(sourceRole?: string, defaultRole: string = "ROLE_UNKNOWN"): string {
  if (!sourceRole || typeof sourceRole !== "string" || sourceRole.trim() === "") {
    return defaultRole;
  }
  const roleStr = sourceRole.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  return roleStr.replace(/_+/g, '_');
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
        const currentIndex = supplierIndex++;
        const itemId = `ENT-REL-${currentIndex}`;
        entities.push({
          entityId: itemId,
          entityType: list.type,
          legalName: item.name || item.legalName || `${list.type} ${supplierIndex}`,
          status: "CONFIRMED",
          provenance: [`LEGACY_STRUCTURED_FIELD:${list.field}`]
        });
        
        const sourceRole = item.role || item.partyRole || item.relationshipRole;
        const normalizedRole = sourceRole ? normalizeRelationshipRole(sourceRole) : (item.role === undefined ? "ROLE_UNKNOWN" : list.role);
        // Fallback for list.role is UNKNOWN if there's no sourceRole but we expect it, actually list.role was COUNTERPARTY but the requirement says "Not COUNTERPARTY as false semantic certainty... use explicit state such as ROLE_UNKNOWN". So if sourceRole is completely absent, use ROLE_UNKNOWN.
        const finalRole = sourceRole ? normalizedRole : "ROLE_UNKNOWN";
        const relationshipType = sourceRole ? `${normalizedRole}_${list.customerRole}` : `ROLE_UNKNOWN_${list.customerRole}`;

        relationships.push({
          relationshipId: `REL-${currentIndex}`,
          relationshipType: relationshipType,
          fromEntityId: itemId,
          toEntityId: clientId,
          roles: {
            [itemId]: finalRole,
            [clientId]: list.customerRole
          },
          status: "CONFIRMED",
          knowledgePolicy: "KNOWN_TO_CLIENT",
          provenance: [
            `LEGACY_STRUCTURED_FIELD:${list.field}`,
            ...(sourceRole ? [`SOURCE_ROLE:${sourceRole}`, `NORMALIZED_ROLE:${normalizedRole}`] : [])
          ]
        });
        hasStructuredRelationships = true;
      });
    }
  }

  if (activeCase.hiddenCaseFacts && Array.isArray(activeCase.hiddenCaseFacts)) {
      sourceFieldsInspected.push("hiddenCaseFacts");
      activeCase.hiddenCaseFacts.forEach((hcf: any) => {
          facts.push({
              factId: hcf.id || `FACT-${Math.random().toString(36).substring(7)}`,
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
