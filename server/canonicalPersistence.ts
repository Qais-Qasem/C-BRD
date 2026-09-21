import {
  LogicalSource,
  CanonicalSourceVersion,
  LogicalSourceVersionAssociation,
  CanonicalProcessingStatus,
  FailureDiagnostic
} from './canonicalTypes';

export type PersistenceErrorCode = 
  | 'NOT_FOUND' 
  | 'CONFLICT' 
  | 'INVALID_STATE' 
  | 'PERSISTENCE_FAILURE' 
  | 'INVALID_RECORD';

export class CanonicalPersistenceError extends Error {
  constructor(public code: PersistenceErrorCode, message: string) {
    super(message);
    this.name = 'CanonicalPersistenceError';
  }
}

// Global Source Version Record (composed of immutable and mutable parts)
export type PersistedSourceVersion = Pick<CanonicalSourceVersion, 
  'sourceVersionId' | 
  'serverByteSha256' | 
  'fileSizeBytes' | 
  'mimeType' | 
  'storageProvider' | 
  'storageRef' | 
  'status' | 
  'createdAt' | 
  'failureDiagnostic'
>;

// Logical Source Record
export interface PersistedLogicalSource extends LogicalSource {
  sourceType?: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

// Logical Source Version Association
export type PersistedSourceVersionAssociation = Pick<LogicalSourceVersionAssociation,
  'sourceId' |
  'sourceVersionId' |
  'projectId' |
  'moduleId' |
  'associatedAt' |
  'isCurrentAcceptedVersion'
>;

export interface UpdateSourceVersionStatusParams {
  sourceVersionId: string;
  expectedCurrentStatus?: CanonicalProcessingStatus;
  nextStatus: CanonicalProcessingStatus;
  failureDiagnostic?: FailureDiagnostic;
}

export interface CanonicalPersistenceAdapter {
  createLogicalSource(source: PersistedLogicalSource): Promise<PersistedLogicalSource>;
  getLogicalSource(sourceId: string): Promise<PersistedLogicalSource>;
  
  createSourceVersion(version: PersistedSourceVersion): Promise<PersistedSourceVersion>;
  getSourceVersion(sourceVersionId: string): Promise<PersistedSourceVersion>;
  updateSourceVersionStatus(params: UpdateSourceVersionStatusParams): Promise<PersistedSourceVersion>;
  
  associateSourceVersion(association: PersistedSourceVersionAssociation): Promise<PersistedSourceVersionAssociation>;
  listSourceVersionAssociations(sourceVersionId: string): Promise<PersistedSourceVersionAssociation[]>;
  listSourceVersionsForLogicalSource(sourceId: string): Promise<PersistedSourceVersion[]>;
}
