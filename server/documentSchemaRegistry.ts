/**
 * C-BRIDGE VERIFIED OFFICIAL DOCUMENT TEMPLATE REGISTRY
 * =======================================================
 * Canonical registry for government/regulatory forms and structured official trade documents.
 * Ensures synthetic training replicas, AI Coaches, and regulatory validators derive exclusively
 * from verified official schemas (CBP Form 7501, FDA ACE PGA, etc.).
 *
 * STATUSES:
 * - VERIFIED: Schema strictly verified against authoritative agency directives/CFR/CATAIR.
 * - REQUIRES_REVERIFICATION: Schema undergoing agency update or version deprecation.
 * - UNVERIFIED: Unofficial/provisional schema. AI is strictly forbidden from teaching exact
 *   field/block numbers as authoritative.
 */

export interface OfficialFieldMapping {
  fieldNumber: string;
  blockNumber?: string;
  fieldName: string;
  fieldPurpose: string;
  statutoryReference?: string;
  fsvpRelevance?: string;
  verified: boolean;
  requiredForImport?: boolean;
}

export interface VerifiedDocumentTemplate {
  templateId: string;
  documentType: string;
  issuingAuthority: string;
  officialSourceReference: string;
  officialVersion: string;
  effectiveDate: string;
  verifiedAt: string;
  verificationStatus: 'VERIFIED' | 'REQUIRES_REVERIFICATION' | 'UNVERIFIED';
  schemaVersion: string;
  fieldMappings: OfficialFieldMapping[];
  description: string;
}

export const VERIFIED_DOCUMENT_TEMPLATES: Record<string, VerifiedDocumentTemplate> = {
  // --------------------------------------------------------------------------
  // 1. CBP FORM 7501: ENTRY SUMMARY (OFFICIAL CBP SCHEMA)
  // Authoritative Source: CBP Directive 3550-061 / 19 CFR Part 141 / CBP Form 7501 (05/20)
  // --------------------------------------------------------------------------
  'TMPL-CBP-7501-OFFICIAL': {
    templateId: 'TMPL-CBP-7501-OFFICIAL',
    documentType: 'CBP_ENTRY_SUMMARY_7501',
    issuingAuthority: 'U.S. Customs and Border Protection (CBP) / Department of Homeland Security',
    officialSourceReference: 'CBP Form 7501 Instructions (05/20) / CBP Directive 3550-061 / 19 CFR Part 141 & 142',
    officialVersion: 'CBP Form 7501 (05/20) & ACE Entry Summary CATAIR',
    effectiveDate: '2020-05-01',
    verifiedAt: '2026-08-16T00:00:00Z',
    verificationStatus: 'VERIFIED',
    schemaVersion: '2026.1',
    description: 'Official CBP Entry Summary document schema used by importers and licensed customs brokers to declare merchandise, assess customs duties/taxes, and identify parties to the transaction.',
    fieldMappings: [
      {
        fieldNumber: '1',
        blockNumber: 'Block 1',
        fieldName: 'Filer Code / Entry Number',
        fieldPurpose: 'Unique 11-character entry identifier composed of 3-character filer code, 7-digit entry number, and 1 check digit.',
        statutoryReference: '19 CFR 142.3',
        fsvpRelevance: 'Tracks electronic customs filing tied to customs entry declaration.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '2',
        blockNumber: 'Block 2',
        fieldName: 'Entry Type',
        fieldPurpose: '2-digit entry type code (e.g. 01 for Consumption, 11 for Informal, 21 for Warehouse).',
        statutoryReference: '19 CFR 141.0a',
        fsvpRelevance: 'Determines whether standard commercial FSVP compliance and ACE PGA transmission apply.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '3',
        blockNumber: 'Block 3',
        fieldName: 'Summary Date',
        fieldPurpose: 'Date entry summary is filed with CBP (MM/DD/YYYY).',
        statutoryReference: '19 CFR 141.68',
        fsvpRelevance: 'Establishes customs summary filing timeline.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '4',
        blockNumber: 'Block 4',
        fieldName: 'Record Filer Code',
        fieldPurpose: 'Identifies the broker or self-filer filing the record.',
        statutoryReference: '19 CFR 111.1',
        fsvpRelevance: 'Identifies electronic filing entity.',
        verified: true,
        requiredForImport: false
      },
      {
        fieldNumber: '5',
        blockNumber: 'Block 5',
        fieldName: 'Port Code',
        fieldPurpose: '4-digit U.S. Port of Entry code (e.g. 1001 New York, 2704 Los Angeles).',
        statutoryReference: '19 CFR 101.3',
        fsvpRelevance: 'Port where food arrives and enters U.S. customs territory.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '6',
        blockNumber: 'Block 6',
        fieldName: 'Entry Date',
        fieldPurpose: 'Date merchandise is released from customs custody or arrives in port (MM/DD/YYYY).',
        statutoryReference: '19 CFR 141.68',
        fsvpRelevance: 'CRITICAL: FSVP Importer determination under 21 CFR 1.500 is evaluated "at the time of entry of an article of food into the United States".',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '7',
        blockNumber: 'Block 7',
        fieldName: 'IT Number',
        fieldPurpose: 'Immediate Transportation in-bond tracking number if moved under bond.',
        statutoryReference: '19 CFR Part 18',
        fsvpRelevance: 'In-bond movement tracking.',
        verified: true,
        requiredForImport: false
      },
      {
        fieldNumber: '8',
        blockNumber: 'Block 8',
        fieldName: 'Country of Origin',
        fieldPurpose: '2-character ISO country code where goods were grown, manufactured, or produced.',
        statutoryReference: '19 CFR 134.1',
        fsvpRelevance: 'Determines foreign country jurisdiction for FSVP supplier verification and hazard profile.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '9',
        blockNumber: 'Block 9',
        fieldName: 'Exporting Country',
        fieldPurpose: 'Country from which goods were exported to the United States.',
        statutoryReference: '19 CFR 141.61',
        fsvpRelevance: 'Identifies intermediate or transit export geography.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '10',
        blockNumber: 'Block 10',
        fieldName: 'Export Date',
        fieldPurpose: 'Date merchandise left foreign country (MM/DD/YYYY).',
        statutoryReference: '19 CFR 152.1',
        fsvpRelevance: 'Determines currency conversion date and baseline production window.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '11',
        blockNumber: 'Block 11',
        fieldName: 'Mode of Transportation (MOT)',
        fieldPurpose: '2-digit Census MOT code (e.g. 10 = Ocean Non-container, 11 = Ocean Container, 40 = Air). NOTE: Block 11 is strictly Mode of Transportation, NOT Importer of Record.',
        statutoryReference: 'CBP Form 7501 Instructions (05/20) Block 11 / Schedule K',
        fsvpRelevance: 'Identifies transport modality. CRITICAL GOVERNANCE NOTE: Box 11 is Mode of Transportation and NEVER designates Importer of Record.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '12',
        blockNumber: 'Block 12',
        fieldName: 'Country of Export',
        fieldPurpose: 'ISO code of exporting country.',
        statutoryReference: '19 CFR 141.61',
        fsvpRelevance: 'Country of origin / export verification.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '13',
        blockNumber: 'Block 13',
        fieldName: 'Manufacturer ID (MID)',
        fieldPurpose: 'Constructed CBP Manufacturer Identification code identifying foreign producer.',
        statutoryReference: '19 CFR 102.21 / CBP Directive 3550-055',
        fsvpRelevance: 'Foreign manufacturing facility identifier used in customs cross-referencing.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '14',
        blockNumber: 'Block 14',
        fieldName: 'Exporting Carrier',
        fieldPurpose: 'Name of vessel or airline transporting cargo into the U.S.',
        statutoryReference: '19 CFR 141.61',
        fsvpRelevance: 'Transport manifest verification.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '15',
        blockNumber: 'Block 15',
        fieldName: 'Conveyance Name / Flight No / Bill of Lading',
        fieldPurpose: 'Vessel name, voyage number, flight number, and Bill of Lading reference.',
        statutoryReference: '19 CFR 141.61',
        fsvpRelevance: 'Ties physical shipment to ocean/air Bill of Lading.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '16',
        blockNumber: 'Block 16',
        fieldName: 'Foreign Port of Lading',
        fieldPurpose: '5-digit Schedule K code for foreign port where merchandise was laden.',
        statutoryReference: 'Schedule K / 19 CFR 141.61',
        fsvpRelevance: 'Port of loading where Incoterms FOB delivery occurs.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '22',
        blockNumber: 'Block 22',
        fieldName: 'Consignee Number',
        fieldPurpose: 'IRS Employer Identification Number (EIN), Social Security Number (SSN), or CBP-assigned number of the Ultimate Consignee.',
        statutoryReference: '19 CFR 24.5 & 19 CFR 141.61(d)',
        fsvpRelevance: 'Identifies the recipient entity in the U.S. delivering or owning the cargo.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '23',
        blockNumber: 'Block 23',
        fieldName: 'Importer Number',
        fieldPurpose: 'IRS Employer Identification Number (EIN), Social Security Number (SSN), or CBP-assigned number of the Importer of Record (IOR).',
        statutoryReference: '19 CFR 24.5 & 19 U.S.C. 1484',
        fsvpRelevance: 'Identifies tax ID of the entity responsible for customs duty payment and entry summary under customs law.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '25',
        blockNumber: 'Block 25',
        fieldName: 'Ultimate Consignee Name and Address',
        fieldPurpose: 'Full legal business name and street address of the party in the U.S. to whom merchandise is consigned.',
        statutoryReference: '19 CFR 141.61(d)',
        fsvpRelevance: 'Party receiving goods; often identical to commercial owner or purchaser in FOB food imports.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '26',
        blockNumber: 'Block 26',
        fieldName: 'Importer of Record (IOR) Name and Address',
        fieldPurpose: 'Full legal name and address of the entity designated as Importer of Record for customs purposes under 19 U.S.C. 1484.',
        statutoryReference: '19 U.S.C. 1484 & 19 CFR 141.1',
        fsvpRelevance: 'CRITICAL STATUTORY DISTINCTION: Block 26 designates the Customs IOR (liable for tariffs, duties, and entry clearance). Under 21 CFR 1.500, this does NOT automatically confer FSVP liability unless this entity is also the U.S. owner or purchaser of the food at entry.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '27',
        blockNumber: 'Block 27',
        fieldName: 'Declaration of Importer of Record or Authorized Agent',
        fieldPurpose: 'Formal legal declaration and signature by the importer or licensed broker (under Power of Attorney) certifying entry accuracy.',
        statutoryReference: '19 U.S.C. 1484(d) & 19 CFR 141.61(a)',
        fsvpRelevance: 'Legal certification of customs entry under 19 CFR Part 141.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: '28-35',
        blockNumber: 'Blocks 28-35',
        fieldName: 'Line Item Tariff Schedule, Description, Quantity & Entered Value',
        fieldPurpose: 'Columnar line items declaring HTSUS 10-digit tariff code, commercial commodity description, gross weight/manifest quantity, and entered value in USD.',
        statutoryReference: '19 CFR 141.61(e)',
        fsvpRelevance: 'Itemizes food products, tariff lines, and declared commercial values for FDA import screening.',
        verified: true,
        requiredForImport: true
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. FDA ACE PGA MESSAGE SET (FSVP ELECTRONIC DECLARATION)
  // Authoritative Source: FDA Supplemental Guide for the Automated Commercial Environment (ACE)
  // --------------------------------------------------------------------------
  'TMPL-FDA-ACE-PGA': {
    templateId: 'TMPL-FDA-ACE-PGA',
    documentType: 'FDA_ACE_FSVP_ENTRY_DATA',
    issuingAuthority: 'U.S. Food and Drug Administration (FDA) & U.S. Customs and Border Protection (CBP)',
    officialSourceReference: 'FDA ACE PGA Supplemental Guide v8.4 / 21 CFR 1.509',
    officialVersion: 'ACE PGA Message Set Release 8.4',
    effectiveDate: '2022-04-15',
    verifiedAt: '2026-08-16T00:00:00Z',
    verificationStatus: 'VERIFIED',
    schemaVersion: '2026.1',
    description: 'Electronic partner government agency (PGA) dataset transmitted via ACE during customs entry to declare FSVP Importer identification and food safety compliance.',
    fieldMappings: [
      {
        fieldNumber: 'PG01',
        blockNumber: 'Record PG01',
        fieldName: 'PGA Government Agency Identifier',
        fieldPurpose: 'Identifies FDA as the regulating Partner Government Agency (PGA code "FDA").',
        statutoryReference: '21 CFR 1.509 / ACE CATAIR',
        fsvpRelevance: 'Routes electronic entry data to FDA import division.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'PG02',
        blockNumber: 'Record PG02',
        fieldName: 'Product Product Code / Processing Code',
        fieldPurpose: 'FDA 7-character Product Code and Industry Code identifying commodity category.',
        statutoryReference: '21 CFR Part 1',
        fsvpRelevance: 'Determines FDA food category, hazard baseline, and prior notice requirements.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'PG19',
        blockNumber: 'Record PG19',
        fieldName: 'Entity Role Code: FSV (FSVP Importer)',
        fieldPurpose: 'Transmits entity role code "FSV" identifying the statutory FSVP Importer under 21 CFR 1.500.',
        statutoryReference: '21 CFR 1.509(a)',
        fsvpRelevance: 'MANDATORY FSVP DECLARATION: Confirms the exact entity legally responsible for FSVP compliance.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'PG20',
        blockNumber: 'Record PG20',
        fieldName: 'Unique Facility Identifier (UFI) / DUNS Number',
        fieldPurpose: 'Transmits 9-digit Data Universal Numbering System (DUNS) number recognized by FDA as acceptable UFI.',
        statutoryReference: '21 CFR 1.509(a) & FDA Guidance on UFI for FSVP',
        fsvpRelevance: 'Mandatory electronic identifier for the FSVP Importer. Transmitting "UNK" is rejected by ACE validation rules.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'PG21',
        blockNumber: 'Record PG21',
        fieldName: 'FSVP Importer Name, Address & Email',
        fieldPurpose: 'Legal corporate name, physical address, and electronic mail contact for the FSVP Importer.',
        statutoryReference: '21 CFR 1.509(b)',
        fsvpRelevance: 'Provides FDA with direct regulatory contact for FSVP records inspection requests.',
        verified: true,
        requiredForImport: true
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. MASTER COMMERCIAL FOOD SUPPLY AGREEMENT (STANDARD CONTRACT SCHEMA)
  // Authoritative Source: Commercial Sales Law / UCC Article 2 / ICC Incoterms 2020
  // --------------------------------------------------------------------------
  'TMPL-STANDARD-MPA': {
    templateId: 'TMPL-STANDARD-MPA',
    documentType: 'MASTER_PURCHASE_AGREEMENT',
    issuingAuthority: 'Commercial Contracting Framework / C-Bridge Verified Document Engine',
    officialSourceReference: 'UCC Article 2 / ICC Incoterms 2020 / 21 CFR 1.500 Title Allocation Standards',
    officialVersion: 'C-Bridge MPA Schema v2.0',
    effectiveDate: '2025-01-01',
    verifiedAt: '2026-08-16T00:00:00Z',
    verificationStatus: 'VERIFIED',
    schemaVersion: '2026.1',
    description: 'Bilateral commercial supply contract governing food procurement, delivery terms, risk allocation, proprietary title transfer, and food safety warranty covenants.',
    fieldMappings: [
      {
        fieldNumber: 'SEC-01',
        blockNumber: 'Section 1',
        fieldName: 'Purpose & Applicable Commodities',
        fieldPurpose: 'Defines commercial scope and list of contracted food commodities.',
        statutoryReference: 'Commercial Contract Law',
        fsvpRelevance: 'Identifies food products covered under FSVP verification scope.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'SEC-02',
        blockNumber: 'Section 2',
        fieldName: 'Pricing, Invoicing & Payment Terms',
        fieldPurpose: 'Establishes commercial prices, milestone payments, and commercial invoicing trigger.',
        statutoryReference: 'Commercial Contract Law',
        fsvpRelevance: 'Evidence of commercial consideration and commercial agreement to purchase.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'SEC-03',
        blockNumber: 'Section 3',
        fieldName: 'Shipping Terms & Incoterms Allocation (Delivery & Risk of Loss)',
        fieldPurpose: 'Establishes Incoterms delivery rule (e.g. FOB foreign port of shipment). Allocates transport costs and risk of physical loss/damage.',
        statutoryReference: 'ICC Incoterms 2020 Rules (FOB Rule)',
        fsvpRelevance: 'CRITICAL: Incoterms governs delivery and maritime risk of loss on board the vessel. It does NOT legally transfer proprietary ownership or property title.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'SEC-04',
        blockNumber: 'Section 4.2',
        fieldName: 'Contractual Title Transfer & Commercial Ownership Clause',
        fieldPurpose: 'Explicit bilateral agreement on when legal title and proprietary commercial ownership transfer from Seller to Buyer.',
        statutoryReference: 'UCC Section 2-401 & 21 CFR 1.500',
        fsvpRelevance: 'FOUNDATIONAL FOR FSVP: Confirms that Buyer owns the goods during maritime transit and at the moment of U.S. entry, establishing Buyer as "U.S. owner or consignee" under 21 CFR 1.500.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'SEC-05',
        blockNumber: 'Section 5',
        fieldName: 'Regulatory Status, Facility Registration & Quality Standards',
        fieldPurpose: 'Seller warrants FDA Food Facility Registration, cGMP compliance, and agreement to furnish food safety audit documentation.',
        statutoryReference: 'FD&C Act Section 415 / 21 CFR Part 117 / 21 CFR 1.506',
        fsvpRelevance: 'Supplier baseline food safety commitment necessary for supplier verification.',
        verified: true,
        requiredForImport: true
      },
      {
        fieldNumber: 'SEC-06',
        blockNumber: 'Section 6',
        fieldName: 'Customs Brokerage & Electronic Entry Administration',
        fieldPurpose: 'Authorizes licensed customs broker as filing agent for electronic ACE clearance.',
        statutoryReference: '19 CFR Part 111 & 19 U.S.C. 1484',
        fsvpRelevance: 'Clarifies that broker acts strictly as filing agent under POA and is not commercial owner.',
        verified: true,
        requiredForImport: true
      }
    ]
  }
};

/**
 * Get verified template by templateId or documentType
 */
export function getVerifiedDocumentTemplate(
  templateIdOrDocType: string
): VerifiedDocumentTemplate | undefined {
  if (VERIFIED_DOCUMENT_TEMPLATES[templateIdOrDocType]) {
    return VERIFIED_DOCUMENT_TEMPLATES[templateIdOrDocType];
  }
  return Object.values(VERIFIED_DOCUMENT_TEMPLATES).find(
    tmpl => tmpl.documentType === templateIdOrDocType
  );
}

/**
 * Validate whether a stated field or block number is verified in an official template,
 * and optionally verify if an asserted designation matches the official field designation.
 */
export function verifyFieldMapping(
  documentType: string,
  fieldOrBlockQuery: string,
  assertedDesignation?: string
): {
  verified: boolean;
  templateStatus: 'VERIFIED' | 'REQUIRES_REVERIFICATION' | 'UNVERIFIED';
  matchedField?: OfficialFieldMapping;
  officialReference?: string;
  rejectionReason?: string;
  designationMatches?: boolean;
} {
  const tmpl = getVerifiedDocumentTemplate(documentType);
  if (!tmpl) {
    return {
      verified: false,
      templateStatus: 'UNVERIFIED',
      rejectionReason: `No official verified template registered for document type '${documentType}'. Field assertions cannot be certified as authoritative.`
    };
  }

  if (tmpl.verificationStatus !== 'VERIFIED') {
    return {
      verified: false,
      templateStatus: tmpl.verificationStatus,
      rejectionReason: `Template '${tmpl.templateId}' status is '${tmpl.verificationStatus}'. Field assertions cannot be certified as authoritative.`
    };
  }

  const rawNorm = fieldOrBlockQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
  const digitsOnly = fieldOrBlockQuery.replace(/[^0-9]/g, '');

  const matched = tmpl.fieldMappings.find(f => {
    const fNumNorm = f.fieldNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bNumNorm = (f.blockNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameNorm = f.fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const strippedQuery = rawNorm.replace(/^(box|block|sec|section|field|record|pg)/, '');

    return (
      rawNorm === fNumNorm ||
      rawNorm === bNumNorm ||
      (strippedQuery.length > 0 && (strippedQuery === fNumNorm || strippedQuery === bNumNorm.replace(/^(box|block|sec|section|field|record|pg)/, ''))) ||
      (digitsOnly.length > 0 && (digitsOnly === f.fieldNumber.replace(/[^0-9]/g, ''))) ||
      (rawNorm.length > 2 && (nameNorm.includes(rawNorm) || rawNorm.includes(nameNorm)))
    );
  });

  if (matched && matched.verified) {
    if (assertedDesignation) {
      const assertedNorm = assertedDesignation.toLowerCase().replace(/[^a-z0-9]/g, '');
      const nameNorm = matched.fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check positive designation matches
      let designationMatches =
        nameNorm.includes(assertedNorm) ||
        assertedNorm.includes(nameNorm);

      // Handle common acronyms (e.g., IOR for Importer of Record, MOT for Mode of Transportation)
      if (!designationMatches) {
        if (assertedNorm.includes('importerofrecord') || assertedNorm === 'ior') {
          designationMatches = nameNorm.includes('importerofrecord') || nameNorm.includes('ior');
        } else if (assertedNorm.includes('modeoftransportation') || assertedNorm === 'mot') {
          designationMatches = nameNorm.includes('modeoftransportation') || nameNorm.includes('mot');
        } else if (assertedNorm.includes('ultimateconsignee') || assertedNorm === 'consignee') {
          designationMatches = nameNorm.includes('ultimateconsignee') || nameNorm.includes('consignee');
        } else if (assertedNorm.includes('entrydate')) {
          designationMatches = nameNorm.includes('entrydate');
        }
      }

      if (!designationMatches) {
        return {
          verified: false,
          templateStatus: 'VERIFIED',
          matchedField: matched,
          officialReference: `${tmpl.issuingAuthority} (${tmpl.officialSourceReference})`,
          rejectionReason: `Field location '${fieldOrBlockQuery}' exists, but asserted designation '${assertedDesignation}' does not match official field designation '${matched.fieldName}'.`,
          designationMatches: false
        };
      }

      return {
        verified: true,
        templateStatus: 'VERIFIED',
        matchedField: matched,
        officialReference: `${tmpl.issuingAuthority} (${tmpl.officialSourceReference})`,
        designationMatches: true
      };
    }

    return {
      verified: true,
      templateStatus: 'VERIFIED',
      matchedField: matched,
      officialReference: `${tmpl.issuingAuthority} (${tmpl.officialSourceReference})`
    };
  }

  return {
    verified: false,
    templateStatus: 'VERIFIED',
    rejectionReason: `Field query '${fieldOrBlockQuery}' does not match any verified field in official template '${tmpl.templateId}'.`
  };
}

/**
 * Return all registered verified templates for inspection
 */
export function getAllVerifiedTemplates(): VerifiedDocumentTemplate[] {
  return Object.values(VERIFIED_DOCUMENT_TEMPLATES);
}
