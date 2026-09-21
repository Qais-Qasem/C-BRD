export interface DocumentRequirement {
  requestedDocumentType?: string;
  requiredEntityRefs: string[];
  requiredRelationshipRefs: string[];
  requiredTransactionRefs: string[];
  purpose?: string;
}

export interface ResolvedAttachment {
  documentId: string;
  matchStatus: 'MATCH' | 'NO_MATCH' | 'AMBIGUOUS' | 'NOT_DISCLOSED' | 'NOT_AVAILABLE' | 'IDENTITY_CONFLICT';
  matchedCriteria: string[];
  unresolvedCriteria: string[];
  disclosureStatus: string;
  documentType?: string;
  originalFileName?: string;
  fileCategory?: string;
  formattedSize?: string;
  extractedTextSummary?: string;
  extractedTextSnippet?: string;
}

export function backfillDocumentIdentity(doc: any, world: any): void {
  doc.entityRefs = doc.entityRefs || [];
  doc.relationshipRefs = doc.relationshipRefs || [];
  doc.transactionRefs = doc.transactionRefs || [];
  
  if (!world || !world.entities) return;

  world.entities.forEach((entity: any) => {
    let found = false;
    const nameLower = entity.legalName ? entity.legalName.toLowerCase() : "";
    if (!nameLower) return;

    if (doc.structuredEvidenceData) {
      const walkExact = (obj: any) => {
        if (!obj) return;
        if (typeof obj === 'string') {
           if (obj.toLowerCase() === nameLower) found = true;
           else if (obj.toLowerCase().includes(nameLower)) found = true; 
        }
        else if (typeof obj === 'object') Object.values(obj).forEach(walkExact);
      };
      walkExact(doc.structuredEvidenceData);
    }
    
    if (!found) {
       if (doc.extractedTextSummary && doc.extractedTextSummary.toLowerCase().includes(nameLower)) {
           found = true;
       }
       if (doc.title && doc.title.toLowerCase().includes(nameLower)) {
           found = true;
       }
    }
    
    if (found && !doc.entityRefs.includes(entity.entityId)) {
       doc.entityRefs.push(entity.entityId);
    }
  });

  if (world.relationships) {
    world.relationships.forEach((rel: any) => {
      if (doc.entityRefs.includes(rel.fromEntityId) && doc.entityRefs.includes(rel.toEntityId)) {
        if (!doc.relationshipRefs.includes(rel.relationshipId)) {
          doc.relationshipRefs.push(rel.relationshipId);
        }
      }
    });
  }
}

export function resolveDocumentAttachment(
  requirement: DocumentRequirement,
  availableDocuments: any[],
  sessionDisclosedDocIds: Set<string>,
  personaId: string
): ResolvedAttachment {
  let candidates = availableDocuments;

  if (requirement.requestedDocumentType) {
    candidates = candidates.filter(d => d.documentType === requirement.requestedDocumentType);
  }

  if (requirement.requiredEntityRefs && requirement.requiredEntityRefs.length > 0) {
    candidates = candidates.filter(d => {
      const docEntityRefs = d.entityRefs || [];
      return requirement.requiredEntityRefs.every(ref => docEntityRefs.includes(ref));
    });
  }

  if (requirement.requiredRelationshipRefs && requirement.requiredRelationshipRefs.length > 0) {
    candidates = candidates.filter(d => {
      const docRelRefs = d.relationshipRefs || [];
      return requirement.requiredRelationshipRefs.every(ref => docRelRefs.includes(ref));
    });
  }
  
  if (requirement.requiredTransactionRefs && requirement.requiredTransactionRefs.length > 0) {
    candidates = candidates.filter(d => {
      const docTxRefs = d.transactionRefs || [];
      return requirement.requiredTransactionRefs.every(ref => docTxRefs.includes(ref));
    });
  }

  if (candidates.length === 0) {
    return {
      documentId: "",
      matchStatus: 'NO_MATCH',
      matchedCriteria: [],
      unresolvedCriteria: [],
      disclosureStatus: 'NOT_AVAILABLE'
    };
  }

  if (candidates.length > 1) {
    return {
      documentId: "",
      matchStatus: 'AMBIGUOUS',
      matchedCriteria: [],
      unresolvedCriteria: [],
      disclosureStatus: 'NOT_AVAILABLE'
    };
  }

  const matched = candidates[0];

  if (matched.hasIdentityConflict) {
    return {
      documentId: matched.id || matched.documentId,
      matchStatus: 'IDENTITY_CONFLICT',
      matchedCriteria: [],
      unresolvedCriteria: [],
      disclosureStatus: 'NOT_APPLICABLE'
    };
  }

  const matchedId = matched.id || matched.documentId;
  const isPreviouslyDisclosed = sessionDisclosedDocIds.has(matchedId);
  const isAuthorized = matched.visibilityScope === 'CLIENT_FACING';
  
  if (!isPreviouslyDisclosed && !isAuthorized) {
    return {
      documentId: matchedId,
      matchStatus: 'NOT_DISCLOSED',
      matchedCriteria: ['documentType', 'entityRefs', 'relationshipRefs'],
      unresolvedCriteria: [],
      disclosureStatus: 'UNAUTHORIZED'
    };
  }

  return {
    documentId: matchedId,
    matchStatus: 'MATCH',
    matchedCriteria: ['documentType', 'entityRefs', 'relationshipRefs'],
    unresolvedCriteria: [],
    disclosureStatus: isPreviouslyDisclosed ? 'PREVIOUSLY_DISCLOSED' : 'DISCLOSED',
    documentType: matched.documentType,
    originalFileName: matched.originalFileName,
    fileCategory: matched.fileCategory,
    formattedSize: matched.formattedSize,
    extractedTextSummary: matched.extractedTextSummary,
    extractedTextSnippet: matched.extractedTextSnippet
  };
}
