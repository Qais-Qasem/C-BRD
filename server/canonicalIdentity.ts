/**
 * PURE CANONICAL DETERMINISTIC IDENTITY AND VALIDATION
 * 
 * NOTE: This file contains NO executable business logic other than pure functions.
 * No Firestore, No filesystem I/O, No HTTP, No Base64 decoding, No auth.
 */

import * as crypto from 'crypto';

export const MAX_CANONICAL_RAW_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

export interface CanonicalValidationResult {
  valid: boolean;
  safeDisplayFilename?: string;
  fileSizeBytes?: number;
  failureCode?: string;
  failureDiagnostic?: string;
}

/**
 * Computes the server SHA-256 hash of exact bytes.
 */
export function computeServerByteSha256(bytes: Buffer): string {
  return crypto.createHash('sha256').update(bytes).digest('hex').toLowerCase();
}

/**
 * Derives the immutable sourceVersionId from raw bytes.
 * Contract: lowercase_hex(SHA256(exact raw bytes))
 */
export function deriveSourceVersionId(bytes: Buffer): string {
  return computeServerByteSha256(bytes);
}

/**
 * Derives the deterministic extractor key.
 */
export function deriveExtractorKey(
  extractorId: string, 
  extractorSchemaVersion: string, 
  libraryName: string, 
  libraryVersion: string
): string {
  const preimage = [extractorId, extractorSchemaVersion, libraryName, libraryVersion].join('\0');
  return "EXT-" + crypto.createHash('sha256').update(preimage, 'utf8').digest('hex').toLowerCase();
}

/**
 * Derives the deterministic block ID.
 */
export function deriveBlockId(
  sourceVersionId: string,
  extractorKey: string,
  pageNumber: number,
  blockOrdinal: number,
  blockText: string
): string {
  if (pageNumber < 1) {
    throw new Error("Invalid pageNumber: must be >= 1");
  }
  if (blockOrdinal < 0) {
    throw new Error("Invalid blockOrdinal: must be >= 0");
  }
  const preimage = [
    sourceVersionId,
    extractorKey,
    pageNumber.toString(10),
    blockOrdinal.toString(10),
    blockText
  ].join('\0');
  return "BLK-" + crypto.createHash('sha256').update(preimage, 'utf8').digest('hex').toLowerCase();
}

/**
 * Derives the evidence hash from extracted text span.
 */
export function computeEvidenceHash(evidenceText: string): string {
  return crypto.createHash('sha256').update(evidenceText, 'utf8').digest('hex').toLowerCase();
}

/**
 * Safely normalizes the original browser filename for display.
 */
export function getSafeDisplayFilename(originalFilename: string): string {
  if (!originalFilename) return "";
  
  // Remove control characters (including NUL)
  let safe = originalFilename.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim surrounding whitespace from the complete input
  safe = safe.trim();
  
  // Split on BOTH / and \
  const parts = safe.split(/[\/\\]/);
  
  // Take ONLY the final path component
  let basename = parts[parts.length - 1];
  
  // Trim surrounding whitespace from that final component
  basename = basename.trim();
  
  // If basename is empty, return empty string
  if (!basename) return "";
  
  // Limit result to 255 UTF-16 code units
  if (basename.length > 255) {
    basename = basename.substring(0, 255);
  }
  
  return basename;
}

/**
 * Validates raw bytes and metadata for canonical PDF upload.
 */
export function validateCanonicalPdfInput(params: {
  bytes: Buffer;
  declaredMimeType: string;
  originalFilename: string;
}): CanonicalValidationResult {
  const { bytes, declaredMimeType, originalFilename } = params;

  if (!bytes || bytes.length === 0) {
    return { valid: false, failureCode: 'EMPTY_FILE', failureDiagnostic: 'File contains zero bytes.' };
  }

  if (bytes.length > MAX_CANONICAL_RAW_BYTES) {
    return { valid: false, failureCode: 'FILE_TOO_LARGE', failureDiagnostic: `File exceeds maximum raw size of ${MAX_CANONICAL_RAW_BYTES} bytes.` };
  }

  // Check MIME type
  const normalizedMime = declaredMimeType.split(';')[0].trim().toLowerCase();
  if (normalizedMime !== 'application/pdf') {
    return { valid: false, failureCode: 'UNSUPPORTED_MIME', failureDiagnostic: 'Declared MIME type is not application/pdf.' };
  }

  const safeDisplayFilename = getSafeDisplayFilename(originalFilename);
  if (!safeDisplayFilename) {
    return { valid: false, failureCode: 'UNSAFE_FILENAME', failureDiagnostic: 'Filename is empty or invalid after normalization.' };
  }

  // Check extension mismatch (secondary signal)
  const nameParts = safeDisplayFilename.split('.');
  if (nameParts.length > 1) {
    const ext = nameParts[nameParts.length - 1].toLowerCase();
    if (ext && ext !== 'pdf') {
      return { valid: false, failureCode: 'MIME_EXTENSION_MISMATCH', failureDiagnostic: `Declared application/pdf but extension is .${ext}` };
    }
  }

  // Check PDF Signature in first 1024 bytes
  const headerRegion = bytes.subarray(0, Math.min(bytes.length, 1024));
  const pdfSignature = Buffer.from('%PDF-', 'ascii');
  if (headerRegion.indexOf(pdfSignature) === -1) {
    return { valid: false, failureCode: 'PDF_SIGNATURE_MISSING', failureDiagnostic: 'Missing %PDF- signature in file header.' };
  }

  return {
    valid: true,
    safeDisplayFilename,
    fileSizeBytes: bytes.length
  };
}
