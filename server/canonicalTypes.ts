/**
 * PURE CANONICAL DOMAIN CONTRACTS
 * 
 * NOTE: This file contains NO executable business logic. 
 * Types/interfaces/constants only.
 */

/**
 * Processing status types consistent with the frozen design.
 */
export type CanonicalProcessingStatus =
  // Active/Happy Path
  | 'RECEIVED'
  | 'VALIDATED'
  | 'HASHED'
  | 'STORED'
  | 'EXTRACTING'
  | 'READY'
  // Controlled Failures
  | 'VALIDATION_FAILED'
  | 'STORAGE_FAILED'
  | 'EXTRACTION_FAILED'
  | 'UNSUPPORTED_TYPE'
  | 'OCR_REQUIRED';

/**
 * Pure domain classification for historical audit records.
 * Legacy placeholders are not an active canonical processing transition.
 */
export type LegacySourceClassification = 
  | 'LEGACY_PLACEHOLDER';

/**
 * Diagnostic type capable of preserving failure details without executing logic.
 * Not intended to expose stack traces or sensitive internals.
 */
export interface FailureDiagnostic {
  failureCode: string;
  failureDiagnostic: string;
}

/**
 * LOGICAL SOURCE
 * Represents the conceptual source associated with an authorized project/module.
 */
export interface LogicalSource {
  /**
   * The logical source identity. 
   * It is NOT derived from filename, title, or file hash.
   */
  sourceId: string;
}

/**
 * SOURCE VERSION
 * Represents exact uploaded bytes.
 */
export interface CanonicalSourceVersion {
  /**
   * Identity: server-computed SHA-256 of bytes.
   * This type MUST NOT treat projectId, moduleId, or extractorVersion as part of immutable byte identity.
   */
  sourceVersionId: string;
  serverByteSha256: string;
  fileSizeBytes: number;
  mimeType: string;
  originalFilename: string;
  
  /**
   * Represents provider-neutral stored-byte metadata.
   * Do NOT expose arbitrary filesystem paths as canonical public identity.
   */
  storageProvider: string;
  storageRef: string; // opaque storage reference/key

  status: CanonicalProcessingStatus;
  createdAt: string;
  failureDiagnostic?: FailureDiagnostic;
}

/**
 * LOGICAL SOURCE ↔ VERSION ASSOCIATION
 * Represents an authorized logical source's association with an immutable source version.
 */
export interface LogicalSourceVersionAssociation {
  sourceId: string;
  sourceVersionId: string;
  projectId: string;
  moduleId?: string; // source scope where applicable
  
  /**
   * Association timestamp / lifecycle metadata
   */
  associatedAt: string;
  
  /**
   * Current/accepted relationship semantics where required.
   * This ensures old source versions remain associated/auditable.
   */
  isCurrentAcceptedVersion: boolean;
}

/**
 * EXTRACTION VERSION
 * Extraction identity is distinct from byte identity.
 */
export interface CanonicalExtractionVersion {
  /**
   * extractorKey = EXT-<lowercase SHA-256 hex>
   * Derived from extractorId \0 extractorSchemaVersion \0 libraryName \0 libraryVersion
   */
  extractorKey: string;
  sourceVersionId: string;
  
  extractorId: string;
  extractorSchemaVersion: string;
  libraryName: string;
  libraryVersion: string;
  
  status: CanonicalProcessingStatus;
  pageCount: number;
  blockCount: number;
  createdAt: string;
  
  failureDiagnostic?: FailureDiagnostic;
}

/**
 * CANONICAL BLOCK
 * Represents deterministic extracted evidence.
 */
export interface CanonicalBlock {
  /**
   * blockId = BLK-<lowercase SHA-256 hex>
   * Derived from sourceVersionId \0 extractorKey \0 pageNumber \0 blockOrdinal \0 blockText
   */
  blockId: string;
  sourceVersionId: string;
  extractorKey: string;
  
  pageNumber: number;
  blockOrdinal: number;
  text: string;
  
  // Optionally / preferably included for canonical page reconstruction
  pageStartOffset?: number;
  pageEndOffset?: number;
}

/**
 * EVIDENCE LOCATOR
 * Represents exact proven span of extracted text.
 */
export interface EvidenceLocator {
  sourceId: string;
  sourceVersionId: string;
  extractorKey: string;
  pageNumber: number;
  blockId: string;
  
  /**
   * block-relative UTF-16 JavaScript code-unit index, inclusive.
   * MUST NOT imply this offset points into original PDF bytes.
   */
  startOffset: number;
  
  /**
   * block-relative UTF-16 JavaScript code-unit index, exclusive.
   * MUST NOT imply this offset points into original PDF bytes.
   */
  endOffset: number;
  
  evidenceHash: string;
}

/**
 * STORAGE DURABILITY CLASSIFICATION
 * Ensures test storage is not confused with production durability.
 */
export type StorageDurabilityClassification = 
  | 'EPHEMERAL_TEST'
  | 'LOCAL_INTEGRATION'
  | 'PRODUCTION_DURABLE';

/**
 * Result object from a putImmutable storage operation.
 */
export interface StoragePutResult {
  status: 'CREATED' | 'EXISTING' | 'CONFLICT' | 'FAILURE';
  durability: StorageDurabilityClassification;
  storageKey?: string;
  error?: string;
}

/**
 * STORAGE CONTRACT
 * Provider-neutral immutable storage interface.
 * MUST NOT assume Firebase, GCS, gs://, S3, or Cloud Tasks.
 */
export interface CanonicalStorageAdapter {
  putImmutable(key: string, bytes: Buffer, metadata?: Record<string, string>): Promise<StoragePutResult>;
  get(key: string): Promise<Buffer | null>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<Record<string, string> | null>;
}
