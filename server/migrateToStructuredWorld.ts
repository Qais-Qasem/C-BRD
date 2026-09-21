import { 
  StructuredCaseWorld, 
  CanonicalEntity, 
  CanonicalRelationship, 
  CanonicalEvent, 
  CanonicalFact, 
  CanonicalIssue 
} from "./contextCompiler.ts";

export function migrateToStructuredWorld(activeCase: any): StructuredCaseWorld | null {
  if (activeCase.structuredWorld) {
    return activeCase.structuredWorld;
  }

  // We check if it has enough explicit structured fields to form relationships.
  // Legacy cases mostly just have `products` and `hiddenCaseFacts`.
  // They don't have explicit arrays of foreign suppliers or intermediaries.
  // If we can't find explicitly structured relationships (like `foreignSupplierFacilities` if it existed as detailed objects), we consider it incomplete.
  
  const entities: CanonicalEntity[] = [];
  const relationships: CanonicalRelationship[] = [];
  const events: CanonicalEvent[] = [];
  const facts: CanonicalFact[] = [];
  const issues: CanonicalIssue[] = [];

  // 1. Client Company Entity
  const clientId = "ENT-CLIENT-01";
  if (activeCase.virtualCompanyName || activeCase.companyName) {
    entities.push({
      entityId: clientId,
      entityType: "CLIENT_COMPANY",
      legalName: activeCase.virtualCompanyName || activeCase.companyName,
      displayName: activeCase.virtualCompanyName || activeCase.companyName,
      status: "CONFIRMED"
    });
  } else {
    return null; // Not even a client company
  }

  // Do we have structured suppliers?
  const foreignFacilities = activeCase.foreignSupplierFacilities;
  if (foreignFacilities && Array.isArray(foreignFacilities) && foreignFacilities.length > 0) {
    foreignFacilities.forEach((facility: any, index: number) => {
      const facilityId = `ENT-SUPPLIER-${index + 1}`;
      entities.push({
        entityId: facilityId,
        entityType: "FOREIGN_SUPPLIER",
        legalName: facility.name || `Supplier ${index+1}`,
        status: "CONFIRMED"
      });
      relationships.push({
        relationshipId: `REL-SUPPLY-${index + 1}`,
        relationshipType: "SUPPLIER_CUSTOMER",
        fromEntityId: facilityId,
        toEntityId: clientId,
        roles: {
          [facilityId]: "SUPPLIER",
          [clientId]: "IMPORTER"
        },
        status: "CONFIRMED",
        knowledgePolicy: "KNOWN_TO_CLIENT"
      });
    });
  }

  // If there are no structured relationships, the case world is incomplete for a multi-party simulation
  if (relationships.length === 0) {
    return null; 
  }

  return { entities, relationships, events, facts, issues };
}
