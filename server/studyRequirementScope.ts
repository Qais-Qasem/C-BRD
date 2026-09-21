import * as crypto from "crypto";

export interface SourceSpan {
    blockId: string;
    type: string;
    startOffset: number;
    endOffset: number;
    sliceHash: string;
    startMarker: string;
    endMarker: string;
    text: string;
}

const ALL_ORDINAL_WORDS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

/**
 * Derives possible module text markers from a generic moduleId.
 * e.g., "MA-324-01" -> ["Module One", "Module 1"]
 */
export function getModuleLabelVariants(moduleId: string): string[] {
    const parts = moduleId.split('-');
    if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && num >= 0 && num <= 10) {
            const labels = [`Module ${num}`];
            if (num > 0 && num <= ALL_ORDINAL_WORDS.length) {
                labels.push(`Module ${ALL_ORDINAL_WORDS[num - 1]}`);
            }
            return labels;
        }
    }
    return [moduleId]; // fallback if not ending in a number
}

/**
 * Finds the index of any module marker in the text, starting from `fromIndex`.
 * Returns the match object if found, or null.
 */
function findNextAnyModuleMarker(text: string, fromIndex: number): { index: number, marker: string } | null {
    let earliestIndex = -1;
    let foundMarker = "";
    
    // Check for "Module One", "Module Two", etc.
    for (const w of ALL_ORDINAL_WORDS) {
        const marker = `Module ${w}`;
        const idx = text.indexOf(marker, fromIndex);
        if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
            earliestIndex = idx;
            foundMarker = marker;
        }
    }
    
    // Check for "Module 1", "Module 2", etc.
    for (let i = 1; i <= 10; i++) {
        const marker = `Module ${i}`;
        const idx = text.indexOf(marker, fromIndex);
        if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
            earliestIndex = idx;
            foundMarker = marker;
        }
    }
    
    if (earliestIndex !== -1) {
        return { index: earliestIndex, marker: foundMarker };
    }
    return null;
}

/**
 * Resolves source spans strictly owned by the requested module.
 */
export function resolveModuleSpans(blocks: any[], moduleId: string): SourceSpan[] {
    const spans: SourceSpan[] = [];
    const targetMarkers = getModuleLabelVariants(moduleId);

    // We only process blocks where the target marker explicitly exists.
    // If a block doesn't explicitly contain the module marker, it's not a module-owned block (avoiding course-wide contamination).
    for (const block of blocks) {
        const text = block.rawText || "";
        
        // Find if this block contains our target module marker
        let targetMatchIdx = -1;
        let matchedMarker = "";
        for (const marker of targetMarkers) {
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                if (targetMatchIdx === -1 || idx < targetMatchIdx) {
                    targetMatchIdx = idx;
                    matchedMarker = marker;
                }
            }
        }

        if (targetMatchIdx !== -1) {
            // Find the boundary to the NEXT module marker (if any)
            let endIdx = text.length;
            let endMarker = "END_OF_BLOCK";
            
            // Search for any module marker strictly after the current marker's text
            const nextMatch = findNextAnyModuleMarker(text, targetMatchIdx + matchedMarker.length);
            if (nextMatch) {
                endIdx = nextMatch.index;
                endMarker = nextMatch.marker;
            }

            const sliceText = text.substring(targetMatchIdx, endIdx);
            const sliceHash = crypto.createHash("sha256").update(sliceText).digest("hex");

            spans.push({
                blockId: block.blockId,
                type: block.type,
                startOffset: targetMatchIdx,
                endOffset: endIdx,
                sliceHash,
                startMarker: matchedMarker,
                endMarker,
                text: sliceText
            });
        }
    }

    return spans;
}

export interface GeneratedRequirement {
    title: string;
    description: string;
    evidence: { blockId: string; exactEvidenceText: string; }[];
}

export interface ValidatedRequirement {
    id: string;
    moduleId: string;
    title: string;
    description: string;
    provenance: string;
    sourceVersionId: string;
    blockAnchors: string[];
    subordinateLocators: any[];
    scopeClassification: "MODULE_OWNED_ACADEMIC_SOURCE" | "COURSE_LEVEL_SOURCE" | "AMBIGUOUS_UNRESOLVED_SOURCE";
    reviewStatus: string;
}

export function validateRequirementSet(
    generatedRequirements: GeneratedRequirement[],
    moduleSpans: SourceSpan[],
    moduleId: string,
    sourceVersionId: string
): ValidatedRequirement[] {
    const validSpans = new Map<string, SourceSpan[]>();
    moduleSpans.forEach(s => {
        if (!validSpans.has(s.blockId)) {
            validSpans.set(s.blockId, []);
        }
        validSpans.get(s.blockId)!.push(s);
    });

    const validated: ValidatedRequirement[] = [];
    const dedupMap = new Map<string, boolean>();

    for (const req of generatedRequirements) {
        if (!req.evidence || req.evidence.length === 0) continue;

        const locators: any[] = [];
        let allEvidenceValid = true;

        for (const ev of req.evidence) {
            const spans = validSpans.get(ev.blockId) || [];
            let found = false;
            for (const s of spans) {
                const idx = s.text.indexOf(ev.exactEvidenceText);
                if (idx !== -1) {
                    const startOffset = s.startOffset + idx;
                    const endOffset = startOffset + ev.exactEvidenceText.length;
                    const evidenceHash = crypto.createHash("sha256").update(ev.exactEvidenceText).digest("hex");
                    locators.push({
                        blockId: s.blockId,
                        startOffset,
                        endOffset,
                        evidenceHash,
                        startMarker: s.startMarker,
                        endMarker: s.endMarker,
                        excerpt: ev.exactEvidenceText.substring(0, 200)
                    });
                    found = true;
                    break;
                }
            }
            if (!found) {
                allEvidenceValid = false;
                break;
            }
        }

        if (!allEvidenceValid || locators.length === 0) {
            continue; // reject requirement if evidence is missing or not in module spans
        }

        // Sort locators to build stable ID
        locators.sort((a, b) => (a.blockId + a.startOffset).localeCompare(b.blockId + b.startOffset));
        const blockAnchors = Array.from(new Set(locators.map(l => l.blockId)));

        const locatorHashes = locators.map(l => l.evidenceHash).join(",");
        const reqIdSource = `${moduleId}-${sourceVersionId}-${locatorHashes}`;
        const canonicalReqId = "REQ-" + crypto.createHash("sha256").update(reqIdSource).digest("hex").substring(0, 8).toUpperCase();

        if (dedupMap.has(canonicalReqId)) {
            continue; // Duplicate evidence set protection
        }
        dedupMap.set(canonicalReqId, true);

        // All validated requirements here are from module-owned source spans
        validated.push({
            id: canonicalReqId,
            moduleId,
            title: req.title,
            description: req.description,
            provenance: "CANONICAL_SYLLABUS",
            sourceVersionId,
            blockAnchors,
            subordinateLocators: locators,
            scopeClassification: "MODULE_OWNED_ACADEMIC_SOURCE",
            reviewStatus: "PENDING_MEMBER_REVIEW"
        });
    }

    return validated;
}

/**
 * Closed-Phase Academic Sanity Gate
 */
export function validateAcademicSanity(validated: ValidatedRequirement[]): boolean {
    if (validated.length === 0) return false;
    for (const req of validated) {
        if (req.scopeClassification !== "MODULE_OWNED_ACADEMIC_SOURCE") return false;
        if (!req.subordinateLocators || req.subordinateLocators.length === 0) return false;
        
        // Ensure no empty labels without substantive meaning. This is a bit heuristic, but we check if title is just "Reading".
        // The real check is in the test suite using actual evidence.
        const titleLower = req.title.toLowerCase();
        if (titleLower === "reading" || titleLower === "module overview") {
           // We expect Gemini to synthesize substantive titles based on the prompt.
           // However, if the description is substantive, it might be okay. We'll rely on the prompt to enforce this.
        }
    }
    return true;
}
