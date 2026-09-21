import {
  CanonicalPersistenceAdapter,
  PersistedLogicalSource,
  PersistedSourceVersion,
  PersistedSourceVersionAssociation,
  UpdateSourceVersionStatusParams,
  CanonicalPersistenceError
} from '../canonicalPersistence';
import { deriveStorageKey } from '../canonicalStorage';

const ACCEPTED_STATUSES = new Set([
  'RECEIVED', 'VALIDATED', 'HASHED', 'STORED', 'EXTRACTING', 'READY',
  'VALIDATION_FAILED', 'STORAGE_FAILED', 'EXTRACTION_FAILED',
  'UNSUPPORTED_TYPE', 'OCR_REQUIRED'
]);

function validateFailureDiagnostic(diag: any): { failureCode: string, failureDiagnostic: string } {
  if (!diag || typeof diag !== 'object' || diag instanceof Error) {
    throw new CanonicalPersistenceError('INVALID_RECORD', 'Invalid diagnostic object');
  }
  const { failureCode, failureDiagnostic } = diag;
  
  if (typeof failureCode !== 'string' || !/^[A-Z][A-Z0-9_]{0,63}$/.test(failureCode)) {
    throw new CanonicalPersistenceError('INVALID_RECORD', 'Invalid failureCode format');
  }
  if (typeof failureDiagnostic !== 'string' || failureDiagnostic.length > 255 || failureDiagnostic.includes('\n') || failureDiagnostic.includes('/') || failureDiagnostic.includes('\\') || failureDiagnostic.includes('://') || /[\x00-\x1F\x7F]/.test(failureDiagnostic)) {
    throw new CanonicalPersistenceError('INVALID_RECORD', 'Invalid or unsafe failureDiagnostic text');
  }
  
  return { failureCode, failureDiagnostic };
}

export class InMemoryCanonicalPersistenceAdapter implements CanonicalPersistenceAdapter {
  public classification = 'IN_MEMORY_TEST';

  private sources = new Map<string, PersistedLogicalSource>();
  private versions = new Map<string, PersistedSourceVersion>();
  private associations = new Map<string, PersistedSourceVersionAssociation>();
  
  private simulateInternalError?: Error;

  constructor(options?: { simulateInternalError?: Error }) {
    this.simulateInternalError = options?.simulateInternalError;
  }

  private checkFailure() {
    if (this.simulateInternalError) {
      throw new CanonicalPersistenceError('PERSISTENCE_FAILURE', 'Local persistence operation failed.');
    }
  }

  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  async createLogicalSource(source: PersistedLogicalSource): Promise<PersistedLogicalSource> {
    this.checkFailure();
    
    // Unknown property isolation
    const cleanSource: PersistedLogicalSource = {
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      displayName: source.displayName,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt
    };

    if (this.sources.has(cleanSource.sourceId)) {
      throw new CanonicalPersistenceError('CONFLICT', 'Logical source already exists.');
    }

    this.sources.set(cleanSource.sourceId, cleanSource);
    return this.clone(cleanSource);
  }

  async getLogicalSource(sourceId: string): Promise<PersistedLogicalSource> {
    this.checkFailure();
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new CanonicalPersistenceError('NOT_FOUND', 'Logical source not found.');
    }
    return this.clone(source);
  }

  async createSourceVersion(version: PersistedSourceVersion): Promise<PersistedSourceVersion> {
    this.checkFailure();

    if ('bytes' in version || (version as any).originalFilename) {
      // Ignored and stripped out in cleanVersion
    }

    if (version.sourceVersionId !== version.serverByteSha256) {
      throw new CanonicalPersistenceError('INVALID_RECORD', 'sourceVersionId must match serverByteSha256');
    }

    // Storage ref validation against C1 contract
    let expectedStorageRef: string;
    try {
      expectedStorageRef = deriveStorageKey(version.sourceVersionId);
    } catch (e) {
      throw new CanonicalPersistenceError('INVALID_RECORD', 'Invalid sourceVersionId for storage key derivation');
    }
    if (version.storageRef !== expectedStorageRef) {
      throw new CanonicalPersistenceError('INVALID_RECORD', 'storageRef does not match canonical storage key contract');
    }

    if (!ACCEPTED_STATUSES.has(version.status)) {
      throw new CanonicalPersistenceError('INVALID_RECORD', 'Invalid processing status');
    }

    let safeDiagnostic = undefined;
    if (version.failureDiagnostic) {
      safeDiagnostic = validateFailureDiagnostic(version.failureDiagnostic);
    }

    const cleanVersion: PersistedSourceVersion = {
      sourceVersionId: version.sourceVersionId,
      serverByteSha256: version.serverByteSha256,
      fileSizeBytes: version.fileSizeBytes,
      mimeType: version.mimeType,
      storageProvider: version.storageProvider,
      storageRef: version.storageRef,
      status: version.status,
      createdAt: version.createdAt,
      failureDiagnostic: safeDiagnostic
    };

    const existing = this.versions.get(cleanVersion.sourceVersionId);
    if (existing) {
      // Check immutable fields
      const isIdentical = 
        existing.serverByteSha256 === cleanVersion.serverByteSha256 &&
        existing.fileSizeBytes === cleanVersion.fileSizeBytes &&
        existing.mimeType === cleanVersion.mimeType &&
        existing.storageProvider === cleanVersion.storageProvider &&
        existing.storageRef === cleanVersion.storageRef &&
        existing.createdAt === cleanVersion.createdAt;
      
      if (!isIdentical) {
        throw new CanonicalPersistenceError('CONFLICT', 'Conflicting immutable metadata for same sourceVersionId.');
      }
      return this.clone(existing);
    }

    this.versions.set(cleanVersion.sourceVersionId, cleanVersion);
    return this.clone(cleanVersion);
  }

  async getSourceVersion(sourceVersionId: string): Promise<PersistedSourceVersion> {
    this.checkFailure();
    const version = this.versions.get(sourceVersionId);
    if (!version) {
      throw new CanonicalPersistenceError('NOT_FOUND', 'Source version not found.');
    }
    return this.clone(version);
  }

  async updateSourceVersionStatus(params: UpdateSourceVersionStatusParams): Promise<PersistedSourceVersion> {
    this.checkFailure();

    const existing = this.versions.get(params.sourceVersionId);
    if (!existing) {
      throw new CanonicalPersistenceError('NOT_FOUND', 'Source version not found.');
    }

    if (params.expectedCurrentStatus && existing.status !== params.expectedCurrentStatus) {
      throw new CanonicalPersistenceError('INVALID_STATE', 'Current status does not match expected status.');
    }

    if (existing.status === params.nextStatus) {
      if (params.failureDiagnostic) {
        // Need to check if diagnostic is identical
        const isIdenticalDiagnostic = 
          (!existing.failureDiagnostic && !params.failureDiagnostic) ||
          (existing.failureDiagnostic && 
           params.failureDiagnostic &&
           existing.failureDiagnostic.failureCode === params.failureDiagnostic.failureCode &&
           existing.failureDiagnostic.failureDiagnostic === params.failureDiagnostic.failureDiagnostic);
        
        if (!isIdenticalDiagnostic) {
          throw new CanonicalPersistenceError('INVALID_STATE', 'Cannot change diagnostic on same status.');
        }
      }
      return this.clone(existing);
    }

    if (!ACCEPTED_STATUSES.has(params.nextStatus)) {
      throw new CanonicalPersistenceError('INVALID_RECORD', 'Invalid processing status');
    }

    if (existing.status === 'READY' && params.nextStatus !== 'READY') {
      throw new CanonicalPersistenceError('INVALID_STATE', 'READY is terminal at the persistence layer.');
    }

    let safeDiagnostic = undefined;
    if (params.failureDiagnostic) {
      safeDiagnostic = validateFailureDiagnostic(params.failureDiagnostic);
    }
    
    const updated = {
      ...existing,
      status: params.nextStatus,
      failureDiagnostic: safeDiagnostic
    };

    this.versions.set(params.sourceVersionId, updated);
    
    return this.clone(updated);
  }

  async associateSourceVersion(association: PersistedSourceVersionAssociation): Promise<PersistedSourceVersionAssociation> {
    this.checkFailure();

    if (!this.sources.has(association.sourceId)) {
      throw new CanonicalPersistenceError('NOT_FOUND', 'Logical source not found.');
    }
    if (!this.versions.has(association.sourceVersionId)) {
      throw new CanonicalPersistenceError('NOT_FOUND', 'Source version not found.');
    }

    const cleanAssoc: PersistedSourceVersionAssociation = {
      sourceId: association.sourceId,
      sourceVersionId: association.sourceVersionId,
      projectId: association.projectId,
      moduleId: association.moduleId,
      associatedAt: association.associatedAt,
      isCurrentAcceptedVersion: association.isCurrentAcceptedVersion
    };

    const assocKey = JSON.stringify([
      cleanAssoc.sourceId,
      cleanAssoc.sourceVersionId,
      cleanAssoc.projectId,
      cleanAssoc.moduleId ?? null
    ]);
    
    const existing = this.associations.get(assocKey);
    if (existing) {
      const isIdentical = existing.associatedAt === cleanAssoc.associatedAt && existing.isCurrentAcceptedVersion === cleanAssoc.isCurrentAcceptedVersion;
      if (!isIdentical) {
        throw new CanonicalPersistenceError('CONFLICT', 'Conflicting association details.');
      }
      return this.clone(existing);
    }

    this.associations.set(assocKey, cleanAssoc);
    return this.clone(cleanAssoc);
  }

  async listSourceVersionAssociations(sourceVersionId: string): Promise<PersistedSourceVersionAssociation[]> {
    this.checkFailure();
    const result: PersistedSourceVersionAssociation[] = [];
    for (const assoc of this.associations.values()) {
      if (assoc.sourceVersionId === sourceVersionId) {
        result.push(this.clone(assoc));
      }
    }
    return result.sort((a, b) => a.associatedAt.localeCompare(b.associatedAt));
  }

  async listSourceVersionsForLogicalSource(sourceId: string): Promise<PersistedSourceVersion[]> {
    this.checkFailure();
    const result: PersistedSourceVersion[] = [];
    const sourceVersionIds = new Set<string>();
    
    for (const assoc of this.associations.values()) {
      if (assoc.sourceId === sourceId) {
        sourceVersionIds.add(assoc.sourceVersionId);
      }
    }

    for (const svid of sourceVersionIds) {
      const version = this.versions.get(svid);
      if (version) {
        result.push(this.clone(version));
      }
    }
    return result.sort((a, b) => {
      const timeCmp = a.createdAt.localeCompare(b.createdAt);
      return timeCmp !== 0 ? timeCmp : a.sourceVersionId.localeCompare(b.sourceVersionId);
    });
  }
}
