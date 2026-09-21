import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type FactProvenance = 
  | 'CANONICAL_CASE_FACT'
  | 'LEARNER_DISCOVERED_FACT'
  | 'INTENTIONAL_SYNTHETIC_EVIDENCE'
  | 'UNKNOWN_TO_BE_DISCOVERED';

export interface SyntheticCaseFacts {
  companyName: string;
  headquarters: string;
  facilityLocations: string[];
  commodities: string[];
  ein?: string;
  duns?: string;
  supplierName?: string;
  supplierCountry?: string;
  supplierCityOrRegion?: string;
  portOfEntry?: string;
  portOfEntryCode?: string;
  brokerName?: string;
  brokerFilerCode?: string;
  entryNumber?: string;
  incotermsRule?: string; // e.g. "FOB"
  namedPortOfLoading?: string; // If not established in case, rendered as "[FOREIGN PORT — TO BE VERIFIED]"
  contractRef?: string;
  totalInvoiceAmount?: string;
}

export interface SyntheticDocRequest {
  projectId: string;
  moduleId: string;
  caseId: string;
  sessionId: string;
  channelId?: string;
  documentType: 
    | 'MASTER_PURCHASE_AGREEMENT'
    | 'CBP_ENTRY_SUMMARY_7501'
    | 'FDA_ACE_FSVP_ENTRY_DATA'
    | 'COMMERCIAL_INVOICE'
    | 'BILL_OF_LADING'
    | 'CUSTOMS_BROKER_AUTHORIZATION'
    | 'FDA_INQUIRY_NOTICE'
    | 'OTHER';
  customTitle?: string;
  generatedByPersonaId?: string;
  actingRole?: string;
  purpose?: string;
  caseFacts?: Partial<SyntheticCaseFacts>;
}

export interface SyntheticDocResult {
  attachmentId: string;
  originalFileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  fileSize: number;
  formattedSize: string;
  fileCategory: 'DOCUMENT' | 'SPREADSHEET' | 'IMAGE' | 'TEXT' | 'OTHER';
  extractedTextSummary: string;
  extractedTextSnippet: string;
  structuredData: any;
  metadata: {
    documentId: string;
    projectId: string;
    moduleId: string;
    caseId: string;
    sessionId: string;
    channelId: string;
    documentType: string;
    title: string;
    generatedByPersonaId: string;
    generatedAt: string;
    synthetic: boolean;
    trainingOnly: boolean;
    isHumanUploaded: boolean;
    version: string;
    schemaVersion?: string;
    templateId?: string;
    mimeType: string;
    storageReference: string;
    visibilityScope: 'CLIENT_FACING' | 'INTERNAL_CBRIDGE';
    processingStatus: 'READY';
  };
}

const WATERMARK_TEXT = "SIMULATED TRAINING DOCUMENT — NOT FOR REGULATORY OR COMMERCIAL SUBMISSION";

function formatAttachmentSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ---------------------------------------------------------------------------
// PDF Helper: Draw standard training headers, footers & watermarks
// ---------------------------------------------------------------------------
function applyTrainingDecorations(
  page: any,
  font: any,
  boldFont: any,
  title: string,
  docNumber: string,
  pageIndex: number,
  totalPages: number
) {
  const { width, height } = page.getSize();

  // Top header banner
  page.drawRectangle({
    x: 36,
    y: height - 42,
    width: width - 72,
    height: 24,
    color: rgb(0.95, 0.95, 0.96),
    borderColor: rgb(0.78, 0.82, 0.88),
    borderWidth: 1
  });

  page.drawText("C-BRIDGE SIMULATED CASE EVIDENCE", {
    x: 44,
    y: height - 34,
    size: 8,
    font: boldFont,
    color: rgb(0.18, 0.31, 0.47)
  });

  page.drawText(`DOC ID: ${docNumber} | FOR TRAINING USE ONLY`, {
    x: width - 240,
    y: height - 34,
    size: 7.5,
    font,
    color: rgb(0.38, 0.44, 0.52)
  });

  // Top Title
  page.drawText(title.toUpperCase(), {
    x: 36,
    y: height - 68,
    size: 12.5,
    font: boldFont,
    color: rgb(0.08, 0.12, 0.18)
  });

  // Watermark bar in footer
  page.drawRectangle({
    x: 36,
    y: 24,
    width: width - 72,
    height: 18,
    color: rgb(0.98, 0.92, 0.92),
    borderColor: rgb(0.9, 0.7, 0.7),
    borderWidth: 0.8
  });

  page.drawText(WATERMARK_TEXT, {
    x: 44,
    y: 29,
    size: 7,
    font: boldFont,
    color: rgb(0.72, 0.12, 0.12)
  });

  page.drawText(`Page ${pageIndex + 1} of ${totalPages}`, {
    x: width - 96,
    y: 29,
    size: 7,
    font,
    color: rgb(0.4, 0.4, 0.4)
  });
}

// ---------------------------------------------------------------------------
// 1. BUILD MASTER PURCHASE AGREEMENT
// Generic & Case-Governed: Derives all facts strictly from Case Universe.
// If named port is not established, uses "[FOREIGN PORT — TO BE VERIFIED]".
// Objective commercial facts only (no embedded 21 CFR 1.500 conclusions).
// ---------------------------------------------------------------------------
export async function generateMasterPurchaseAgreement(
  req: SyntheticDocRequest
): Promise<SyntheticDocResult> {
  const cf = req.caseFacts || {};
  const company = cf.companyName || "Commercial Buyer";
  const supplier = cf.supplierName || "Foreign Producer & Packer";
  const supplierCountry = cf.supplierCountry || "Origin Country";
  const supplierLoc = cf.supplierCityOrRegion ? `${cf.supplierCityOrRegion}, ${supplierCountry}` : supplierCountry;
  const incoterm = cf.incotermsRule || "FOB";
  const portTerm = cf.namedPortOfLoading ? `${incoterm} ${cf.namedPortOfLoading}` : `${incoterm} [FOREIGN PORT — TO BE VERIFIED]`;
  const hq = cf.headquarters || "United States";
  const contractRef = cf.contractRef || `AGR-${Date.now().toString().slice(-4)}`;
  const commoditiesList = cf.commodities && cf.commodities.length > 0 
    ? cf.commodities.join(", ") 
    : "commercial food products and specialty food ingredients";

  const docId = `DOC-MPA-${Date.now().toString().slice(-6)}`;
  const attachmentId = `ATT-SYNTH-MPA-${Date.now().toString().slice(-6)}`;
  const nowIso = new Date().toISOString();

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1: Commercial Terms & Title Transfer Clause (§ 4.2)
  const page1 = pdfDoc.addPage([612, 792]);
  const { width, height } = page1.getSize();

  applyTrainingDecorations(
    page1,
    font,
    boldFont,
    "Master Commercial Food Supply Agreement",
    docId,
    0,
    2
  );

  let y = height - 90;

  // Metadata Box
  page1.drawRectangle({
    x: 36,
    y: y - 56,
    width: width - 72,
    height: 56,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.82, 0.86, 0.92),
    borderWidth: 1
  });

  page1.drawText(`BUYER: ${company} (Headquarters: ${hq})`, {
    x: 44,
    y: y - 16,
    size: 9,
    font: boldFont,
    color: rgb(0.12, 0.18, 0.28)
  });
  page1.drawText(`SELLER / FOREIGN SUPPLIER: ${supplier} (${supplierLoc})`, {
    x: 44,
    y: y - 30,
    size: 8.5,
    font,
    color: rgb(0.2, 0.25, 0.32)
  });
  page1.drawText(`EXECUTION DATE: January 15, 2025 | TERM: 36-Month Supply | CONTRACT REF: ${contractRef}`, {
    x: 44,
    y: y - 46,
    size: 8,
    font: italicFont,
    color: rgb(0.35, 0.4, 0.48)
  });

  y -= 75;

  const sectionsP1 = [
    {
      title: "1. PURPOSE & APPLICABLE COMMODITIES",
      body: `Buyer engages Seller to supply commercial food products, including: ${commoditiesList}. All food products shall be packaged, labeled, and prepared for commercial exportation to the United States.`
    },
    {
      title: "2. PRICING, INVOICING & PAYMENT STRUCTURE",
      body: `Prices are established per unit/metric ton according to Schedule A. Invoicing shall occur upon container loading at foreign terminal. Payment Terms: Fifty percent (50%) wire transfer payable against presentation of Clean On-Board Ocean Bill of Lading and commercial packing list; remaining fifty percent (50%) payable thirty (30) days following physical customs admission and container receipt in the United States.`
    },
    {
      title: "3. SHIPPING TERMS & INCOTERMS ALLOCATION (DELIVERY & RISK OF LOSS)",
      body: `Shipments are executed under Incoterms: ${portTerm}. In accordance with the governing delivery rule, risk of loss of the goods passes from Seller to Buyer when the goods are on board the vessel at the foreign port of shipment [PORT TO BE VERIFIED]. Seller is responsible for export packaging, domestic inland transport, export customs clearances, and loading the goods on board the designated vessel. Buyer is responsible for contracting and paying international ocean freight carriage, marine transit insurance, U.S. customs entry processing, import duties, and domestic inland transport.`
    },
    {
      title: "4. CONTRACTUAL TITLE TRANSFER & COMMERCIAL OWNERSHIP",
      body: `SECTION 4.2 (CONTRACTUAL TITLE CLAUSE): Commercial title and proprietary ownership of each food shipment transfer unconditionally from Seller to Buyer at the foreign port of shipment at the time the goods are placed on board the vessel and the corresponding Bill of Lading naming Buyer as consignee is issued.\n\nPursuant to this explicit contractual transfer, Buyer maintains full proprietary title and commercial ownership of the goods continuously during international maritime transit and at the moment the merchandise arrives within the customs territory of the United States.`
    }
  ];

  for (const sec of sectionsP1) {
    page1.drawText(sec.title, {
      x: 36,
      y,
      size: 9.5,
      font: boldFont,
      color: sec.title.includes("TITLE TRANSFER") ? rgb(0.65, 0.15, 0.15) : rgb(0.15, 0.22, 0.32)
    });
    y -= 14;

    const lines = sec.body.split('\n');
    for (const line of lines) {
      if (line.length === 0) {
        y -= 4;
        continue;
      }
      const words = line.split(' ');
      let currentLine = '';
      for (const w of words) {
        if ((currentLine + ' ' + w).length > 88) {
          page1.drawText(currentLine, { x: 36, y, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
          y -= 11.5;
          currentLine = w;
        } else {
          currentLine = currentLine ? `${currentLine} ${w}` : w;
        }
      }
      if (currentLine) {
        page1.drawText(currentLine, { x: 36, y, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 13;
      }
    }
    y -= 8;
  }

  // Page 2: Regulatory Obligations & Signatures
  const page2 = pdfDoc.addPage([612, 792]);
  applyTrainingDecorations(
    page2,
    font,
    boldFont,
    "Master Commercial Food Supply Agreement (Cont.)",
    docId,
    1,
    2
  );

  let y2 = height - 90;

  const sectionsP2 = [
    {
      title: "5. REGULATORY STATUS & SUPPLIER COMPLIANCE",
      body: `Seller warrants that its manufacturing and processing facilities maintain active U.S. FDA Food Facility Registrations in good standing and operate in accordance with applicable Current Good Manufacturing Practice (cGMP) standards. Seller agrees to furnish documentation upon request regarding facility certifications (ISO 22000, BRCGS, HACCP) and lot-specific certificates of analysis.`
    },
    {
      title: "6. CUSTOMS BROKERAGE & IMPORT ADMINISTRATION",
      body: `Buyer, as the owner of the merchandise arriving in the United States, engages an independent licensed Customs Broker to act as its electronic filing agent for customs entry clearance via CBP Automated Commercial Environment (ACE). Seller agrees to provide commercial invoices, packing lists, and transport documentation necessary for customs admission.`
    },
    {
      title: "7. GOVERNING LAW & JURISDICTION",
      body: `This Agreement shall be construed and governed in accordance with commercial contract laws and applicable United States federal laws.`
    }
  ];

  for (const sec of sectionsP2) {
    page2.drawText(sec.title, {
      x: 36,
      y: y2,
      size: 9.5,
      font: boldFont,
      color: rgb(0.15, 0.22, 0.32)
    });
    y2 -= 14;

    const words = sec.body.split(' ');
    let currentLine = '';
    for (const w of words) {
      if ((currentLine + ' ' + w).length > 88) {
        page2.drawText(currentLine, { x: 36, y: y2, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
        y2 -= 11.5;
        currentLine = w;
      } else {
        currentLine = currentLine ? `${currentLine} ${w}` : w;
      }
    }
    if (currentLine) {
      page2.drawText(currentLine, { x: 36, y: y2, size: 8.5, font, color: rgb(0.2, 0.2, 0.2) });
      y2 -= 18;
    }
  }

  y2 -= 20;

  // Signature Block
  page2.drawRectangle({
    x: 36,
    y: y2 - 90,
    width: width - 72,
    height: 90,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1
  });

  page2.drawText("EXECUTED AND AGREED BY AUTHORIZED CORPORATE SIGNATORIES:", {
    x: 44,
    y: y2 - 16,
    size: 8.5,
    font: boldFont,
    color: rgb(0.15, 0.25, 0.4)
  });

  page2.drawText(`FOR BUYER: ${company}`, {
    x: 44,
    y: y2 - 34,
    size: 8.5,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1)
  });
  page2.drawText("Signature: /s/ Authorized Officer", {
    x: 44,
    y: y2 - 48,
    size: 8,
    font: italicFont,
    color: rgb(0.1, 0.2, 0.5)
  });
  page2.drawText(`Corporate Representative, ${company}`, {
    x: 44,
    y: y2 - 60,
    size: 8,
    font,
    color: rgb(0.3, 0.3, 0.3)
  });
  page2.drawText("Date: January 15, 2025", {
    x: 44,
    y: y2 - 72,
    size: 7.5,
    font,
    color: rgb(0.4, 0.4, 0.4)
  });

  page2.drawText(`FOR SELLER: ${supplier}`, {
    x: width / 2 + 10,
    y: y2 - 34,
    size: 8.5,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1)
  });
  page2.drawText("Signature: /s/ Managing Director", {
    x: width / 2 + 10,
    y: y2 - 48,
    size: 8,
    font: italicFont,
    color: rgb(0.1, 0.2, 0.5)
  });
  page2.drawText(`Managing Director of Export Operations, ${supplier}`, {
    x: width / 2 + 10,
    y: y2 - 60,
    size: 8,
    font,
    color: rgb(0.3, 0.3, 0.3)
  });
  page2.drawText("Date: January 17, 2025", {
    x: width / 2 + 10,
    y: y2 - 72,
    size: 7.5,
    font,
    color: rgb(0.4, 0.4, 0.4)
  });

  const pdfBytes = await pdfDoc.save();
  const fileBuffer = Buffer.from(pdfBytes);

  const structuredData = {
    documentType: "MASTER_PURCHASE_AGREEMENT",
    contractRef,
    buyer: company,
    buyerHq: hq,
    seller: supplier,
    sellerCountry: supplierCountry,
    incoterms: portTerm,
    deliveryAndRiskTerm: "Section 3: FOB (Incoterms 2020) — Risk of loss passes when goods are on board the vessel at the foreign port of shipment [PORT TO BE VERIFIED].",
    titleTransferClause: `Section 4.2: Commercial title and proprietary ownership transfer contractually from Seller to Buyer at foreign port of shipment when goods are on board the vessel and Bill of Lading is issued; Buyer maintains continuous title during ocean transit and upon U.S. customs entry.`,
    paymentTerms: "50% wire transfer upon Bill of Lading, 50% net 30 days post U.S. customs admission",
    executionDate: "2025-01-15",
    signatories: [`Authorized Officer (${company})`, `Managing Director (${supplier})`],
    regulatorySection: "Section 5 warrants facility registration; Section 6 identifies Buyer's broker engagement for electronic ACE entry."
  };

  const fileName = `Master_Purchase_Agreement_Executed_${company.replace(/[^0-9a-zA-Z]/g, '_')}.pdf`;
  const summary = `Executed Master Commercial Food Supply Agreement between ${company} (Buyer) and ${supplier} (Seller). Section 3 establishes ${portTerm} risk-of-loss allocation. Section 4.2 contractually transfers commercial ownership to Buyer upon loading on board AND issuance of the corresponding Bill of Lading, establishing continuous title during maritime transit and at U.S. entry.`;
  const snippet = `Section 4.2 Contractual Title Transfer: "Commercial title and proprietary ownership of each food shipment transfer unconditionally from Seller to Buyer at the foreign port of shipment at the time the goods are placed on board the vessel and the corresponding Bill of Lading naming Buyer as consignee is issued. Pursuant to this explicit contractual transfer, Buyer maintains full proprietary title and commercial ownership of the goods continuously during international maritime transit and at the moment the merchandise arrives within the customs territory of the United States."`;

  return {
    attachmentId,
    originalFileName: fileName,
    mimeType: "application/pdf",
    fileBuffer,
    fileSize: fileBuffer.length,
    formattedSize: formatAttachmentSize(fileBuffer.length),
    fileCategory: "DOCUMENT",
    extractedTextSummary: summary,
    extractedTextSnippet: snippet,
    structuredData,
    metadata: {
      documentId: docId,
      projectId: req.projectId,
      moduleId: req.moduleId,
      caseId: req.caseId,
      sessionId: req.sessionId,
      channelId: req.channelId || "CLIENT_ENGAGEMENT",
      documentType: "MASTER_PURCHASE_AGREEMENT",
      title: `Master Purchase Agreement (Executed) — ${company}`,
      generatedByPersonaId: req.generatedByPersonaId || "PER-01",
      generatedAt: nowIso,
      synthetic: true,
      trainingOnly: true,
      isHumanUploaded: false,
      version: "1.0",
      mimeType: "application/pdf",
      storageReference: `storage://case_synthetic_documents/${attachmentId}`,
      visibilityScope: "CLIENT_FACING",
      processingStatus: "READY"
    }
  };
}

// ---------------------------------------------------------------------------
// 2. BUILD CBP ENTRY SUMMARY (FORM 7501 STYLE)
// Authentic Form 7501 fields: Importer of Record, Ultimate Consignee, Broker Filer,
// HTS lines, Port, Entry No.
// NO artificial "Box 14: FSVP Importer" or electronic ACE DUNS data in Form 7501.
// ---------------------------------------------------------------------------
export async function generateCbpEntrySummary7501(
  req: SyntheticDocRequest
): Promise<SyntheticDocResult> {
  const cf = req.caseFacts || {};
  const company = cf.companyName || "Commercial Importer";
  const hq = cf.headquarters || "United States";
  const ein = cf.ein || "XX-XXXXXXX";
  const broker = cf.brokerName || "Customs Clearance Broker LLC";
  const brokerCode = cf.brokerFilerCode || "FILER-001";
  const entryNo = cf.entryNumber || "000-0000000-0";
  const port = cf.portOfEntry || "U.S. Port of Entry";
  const countryOrigin = cf.supplierCountry || "Foreign";

  const docId = `DOC-CBP7501-${Date.now().toString().slice(-6)}`;
  const attachmentId = `ATT-SYNTH-CBP7501-${Date.now().toString().slice(-6)}`;
  const nowIso = new Date().toISOString();

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  applyTrainingDecorations(
    page,
    font,
    boldFont,
    "U.S. Customs and Border Protection — Entry Summary (Form 7501 Training Replica)",
    docId,
    0,
    1
  );

  let y = height - 90;

  // Header Entry Box Table (Blocks 1-13)
  page.drawRectangle({
    x: 36,
    y: y - 110,
    width: width - 72,
    height: 110,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.65, 0.72, 0.8),
    borderWidth: 1
  });

  // Table Grid Lines
  page.drawLine({ start: { x: 36, y: y - 28 }, end: { x: width - 36, y: y - 28 }, color: rgb(0.75, 0.8, 0.88), thickness: 0.8 });
  page.drawLine({ start: { x: 36, y: y - 56 }, end: { x: width - 36, y: y - 56 }, color: rgb(0.75, 0.8, 0.88), thickness: 0.8 });
  page.drawLine({ start: { x: 36, y: y - 84 }, end: { x: width - 36, y: y - 84 }, color: rgb(0.75, 0.8, 0.88), thickness: 0.8 });
  page.drawLine({ start: { x: 210, y }, end: { x: 210, y: y - 110 }, color: rgb(0.75, 0.8, 0.88), thickness: 0.8 });
  page.drawLine({ start: { x: 390, y }, end: { x: 390, y: y - 110 }, color: rgb(0.75, 0.8, 0.88), thickness: 0.8 });

  // Row 1 (Blocks 1, 2, 3)
  page.drawText("1. FILER CODE / ENTRY NUMBER", { x: 42, y: y - 12, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText(`${brokerCode} / ${entryNo}`, { x: 42, y: y - 23, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  page.drawText("2. ENTRY TYPE", { x: 216, y: y - 12, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("01 (Consumption Entry)", { x: 216, y: y - 23, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) });

  page.drawText("3. SUMMARY DATE", { x: 396, y: y - 12, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("08/08/2026", { x: 396, y: y - 23, size: 8, font, color: rgb(0.1, 0.1, 0.1) });

  // Row 2 (Blocks 5, 6, 8)
  page.drawText("5. PORT CODE / PORT OF ENTRY", { x: 42, y: y - 40, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText(port, { x: 42, y: y - 51, size: 7.5, font, color: rgb(0.1, 0.1, 0.1) });

  page.drawText("6. ENTRY DATE", { x: 216, y: y - 40, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("08/05/2026", { x: 216, y: y - 51, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) });

  page.drawText("8. COUNTRY OF ORIGIN", { x: 396, y: y - 40, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText(countryOrigin, { x: 396, y: y - 51, size: 8, font, color: rgb(0.1, 0.1, 0.1) });

  // Row 3 (Blocks 11, 14, 15) - Verified Schema Layout
  page.drawText("11. MODE OF TRANSPORTATION (MOT)", { x: 42, y: y - 68, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("11 (Vessel Containerized)", { x: 42, y: y - 79, size: 7.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  page.drawText("14. EXPORTING CARRIER", { x: 216, y: y - 68, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("OCEAN FREIGHT CARRIER / V. 842E", { x: 216, y: y - 79, size: 7.5, font, color: rgb(0.1, 0.1, 0.1) });

  page.drawText("15. CONVEYANCE / B/L NUMBER", { x: 396, y: y - 68, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("BL-INTL-98240182", { x: 396, y: y - 79, size: 8, font, color: rgb(0.1, 0.1, 0.1) });

  // Row 4 (Blocks 9, 10, 13)
  page.drawText("9. EXPORTING COUNTRY", { x: 42, y: y - 96, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText(countryOrigin, { x: 42, y: y - 106, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });

  page.drawText("10. EXPORTATION DATE", { x: 216, y: y - 96, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("07/28/2026", { x: 216, y: y - 106, size: 8, font, color: rgb(0.2, 0.2, 0.2) });

  page.drawText("13. MANUFACTURER ID (MID)", { x: 396, y: y - 96, size: 7, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("MFG-ID-84291", { x: 396, y: y - 106, size: 8, font, color: rgb(0.1, 0.1, 0.1) });

  y -= 124;

  // Importer & Consignee Parties Section (Official Blocks 22, 23, 25, 26)
  page.drawRectangle({
    x: 36,
    y: y - 78,
    width: width - 72,
    height: 78,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.75, 0.8, 0.88),
    borderWidth: 1
  });

  page.drawLine({ start: { x: 36, y: y - 39 }, end: { x: width - 36, y: y - 39 }, color: rgb(0.8, 0.85, 0.9), thickness: 0.8 });
  page.drawLine({ start: { x: width / 2, y }, end: { x: width / 2, y: y - 78 }, color: rgb(0.8, 0.85, 0.9), thickness: 0.8 });

  // Official Block 23 & 26: Importer of Record
  page.drawText("23. IMPORTER NUMBER (IRS / EIN / CBP ASSIGNED)", { x: 42, y: y - 12, size: 7, font: boldFont, color: rgb(0.25, 0.3, 0.4) });
  page.drawText(`EIN: ${ein}`, { x: 42, y: y - 22, size: 8, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("26. IMPORTER OF RECORD NAME & ADDRESS (19 U.S.C. 1484)", { x: 42, y: y - 50, size: 7, font: boldFont, color: rgb(0.25, 0.3, 0.4) });
  page.drawText(`${company}`, { x: 42, y: y - 60, size: 8, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`${hq}`, { x: 42, y: y - 71, size: 7.5, font, color: rgb(0.3, 0.3, 0.3) });

  // Official Block 22 & 25: Ultimate Consignee
  page.drawText("22. CONSIGNEE NUMBER (IRS / EIN / CBP ASSIGNED)", { x: width / 2 + 10, y: y - 12, size: 7, font: boldFont, color: rgb(0.25, 0.3, 0.4) });
  page.drawText(`EIN: ${ein}`, { x: width / 2 + 10, y: y - 22, size: 8, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("25. ULTIMATE CONSIGNEE NAME & ADDRESS", { x: width / 2 + 10, y: y - 50, size: 7, font: boldFont, color: rgb(0.25, 0.3, 0.4) });
  page.drawText(`${company}`, { x: width / 2 + 10, y: y - 60, size: 8, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`${hq}`, { x: width / 2 + 10, y: y - 71, size: 7.5, font, color: rgb(0.3, 0.3, 0.3) });

  y -= 94;

  // Broker Block (POA Authorized Agent)
  page.drawRectangle({
    x: 36,
    y: y - 36,
    width: width - 72,
    height: 36,
    color: rgb(0.99, 0.99, 1),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.8
  });

  page.drawText("CUSTOMS BROKER / FILING AGENT (19 CFR PART 111):", { x: 42, y: y - 12, size: 7, font: boldFont, color: rgb(0.25, 0.3, 0.4) });
  page.drawText(`${broker} (Filer Code: ${brokerCode}) | Entry filed under Power of Attorney as Filing Agent`, { x: 42, y: y - 24, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });

  y -= 48;

  // Commodity Line Items Table (Official Blocks 28-35)
  page.drawText("28-35. COMMODITY LINE ITEMS & TARIFF CLASSIFICATION (FORM 7501 BLOCKS):", {
    x: 36,
    y,
    size: 8.5,
    font: boldFont,
    color: rgb(0.15, 0.22, 0.35)
  });
  y -= 14;

  page.drawRectangle({
    x: 36,
    y: y - 110,
    width: width - 72,
    height: 110,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1
  });

  // Table header
  page.drawRectangle({
    x: 36,
    y: y - 20,
    width: width - 72,
    height: 20,
    color: rgb(0.93, 0.95, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.5
  });

  page.drawText("LINE", { x: 42, y: y - 14, size: 7.5, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("HTSUS NUMBER", { x: 74, y: y - 14, size: 7.5, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("COMMODITY DESCRIPTION", { x: 160, y: y - 14, size: 7.5, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("QUANTITY / GROSS WT", { x: 350, y: y - 14, size: 7.5, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("ENTERED VALUE (USD)", { x: 460, y: y - 14, size: 7.5, font: boldFont, color: rgb(0.2, 0.25, 0.35) });

  const lineItems = [
    { line: "001", hts: "1509.20.0030", desc: "Cold-Pressed Extra Virgin Olive Oil", qty: "8,400 Units / 4,200 KG", val: "$48,500.00" },
    { line: "002", hts: "2008.19.9050", desc: "Stone-Ground Sesame Tahini & Halva Paste", qty: "3,200 Units / 1,920 KG", val: "$32,200.00" },
    { line: "003", hts: "2103.90.8000", desc: "Artisanal Seasoning & Herb Blend", qty: "4,500 Units / 900 KG", val: "$18,400.00" }
  ];

  let itemY = y - 36;
  for (const item of lineItems) {
    page.drawText(item.line, { x: 42, y: itemY, size: 8, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(item.hts, { x: 74, y: itemY, size: 8, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
    page.drawText(item.desc, { x: 160, y: itemY, size: 8, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(item.qty, { x: 350, y: itemY, size: 7.5, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(item.val, { x: 460, y: itemY, size: 8, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    itemY -= 26;
  }

  y -= 124;

  // Official Block 27: Declaration Box
  page.drawRectangle({
    x: 36,
    y: y - 56,
    width: width - 72,
    height: 56,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.8
  });

  page.drawText("27. DECLARATION OF IMPORTER OF RECORD / AUTHORIZED AGENT (19 CFR 141.61):", {
    x: 44,
    y: y - 16,
    size: 7.5,
    font: boldFont,
    color: rgb(0.2, 0.25, 0.35)
  });

  page.drawText("I declare that I am the importer of record or authorized agent, and that the statements contained herein are true and correct to the best of my knowledge based on commercial shipping documents.", {
    x: 44,
    y: y - 28,
    size: 7,
    font: italicFont,
    color: rgb(0.35, 0.35, 0.35)
  });

  page.drawText(`Filer / Broker Signatory: /s/ Licensed Broker (${broker}) | Date: 08/08/2026`, {
    x: 44,
    y: y - 44,
    size: 7.5,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4)
  });

  const pdfBytes = await pdfDoc.save();
  const fileBuffer = Buffer.from(pdfBytes);

  const structuredData = {
    documentType: "CBP_ENTRY_SUMMARY_7501",
    entryNumber: entryNo,
    entryType: "01 (Consumption)",
    portOfEntry: port,
    entryDate: "2026-08-05",
    summaryDate: "2026-08-08",
    countryOfOrigin: countryOrigin,
    exportingCountry: countryOrigin,
    exportDate: "2026-07-28",
    importingCarrier: "OCEAN FREIGHT CARRIER / V. 842E",
    billOfLading: "BL-INTL-98240182",
    manufacturerId: "MFG-ID-84291",
    importerOfRecord: {
      name: company,
      ein,
      address: hq
    },
    ultimateConsignee: {
      name: company,
      ein,
      address: hq
    },
    customsBroker: {
      name: broker,
      filerCode: brokerCode,
      agencyCapacity: "Filing Agent under Power of Attorney"
    },
    lineItems,
    totalEnteredValue: "$99,100.00 USD"
  };

  const fileName = `CBP_Form_7501_Entry_${entryNo.replace(/[^0-9a-zA-Z]/g, '')}.pdf`;
  const summary = `CBP Entry Summary (Form 7501 official schema replica) for Entry #${entryNo} at ${port}. Documents ${company} as Importer of Record (Block 23/26, EIN: ${ein}) and Ultimate Consignee (Block 22/25), with customs filing administered by broker ${broker} (Filer Code ${brokerCode}).`;
  const snippet = `CBP Form 7501 Entry #${entryNo}: Block 1 Filer/Entry: ${brokerCode}/${entryNo}; Block 5 Port: ${port}; Block 11 Mode of Transportation: 11 (Vessel Containerized); Block 23/26 Importer of Record: ${company} (EIN: ${ein}); Block 22/25 Ultimate Consignee: ${company}; Block 27 Declaration: ${broker}; Total Entered Value: $99,100.00 USD.`;

  return {
    attachmentId,
    originalFileName: fileName,
    mimeType: "application/pdf",
    fileBuffer,
    fileSize: fileBuffer.length,
    formattedSize: formatAttachmentSize(fileBuffer.length),
    fileCategory: "DOCUMENT",
    extractedTextSummary: summary,
    extractedTextSnippet: snippet,
    structuredData,
    metadata: {
      documentId: docId,
      projectId: req.projectId,
      moduleId: req.moduleId,
      caseId: req.caseId,
      sessionId: req.sessionId,
      channelId: req.channelId || "CLIENT_ENGAGEMENT",
      documentType: "CBP_ENTRY_SUMMARY_7501",
      title: `CBP Form 7501 Entry Summary (Entry #${entryNo})`,
      generatedByPersonaId: req.generatedByPersonaId || "PER-01",
      generatedAt: nowIso,
      synthetic: true,
      trainingOnly: true,
      isHumanUploaded: false,
      version: "2.0 (Verified Schema)",
      schemaVersion: "2026.1",
      templateId: "TMPL-CBP-7501-OFFICIAL",
      mimeType: "application/pdf",
      storageReference: `storage://case_synthetic_documents/${attachmentId}`,
      visibilityScope: "CLIENT_FACING",
      processingStatus: "READY"
    }
  };
}

// ---------------------------------------------------------------------------
// 3. BUILD FDA ACE FSVP ELECTRONIC ENTRY DATA (SIMULATED RECORD)
// Dedicated simulated dataset for electronic Partner Government Agency (PGA)
// transmission into CBP ACE under 21 CFR 1.500 (Entity Role: FSV, UFI/DUNS).
// ---------------------------------------------------------------------------
export async function generateFdaAceFsvpEntryData(
  req: SyntheticDocRequest
): Promise<SyntheticDocResult> {
  const cf = req.caseFacts || {};
  const company = cf.companyName || "Commercial Importer";
  const hq = cf.headquarters || "United States";
  const duns = cf.duns || "XX-XXX-XXXX";
  const entryNo = cf.entryNumber || "000-0000000-0";
  const brokerCode = cf.brokerFilerCode || "FILER-001";
  const port = cf.portOfEntry || "U.S. Port of Entry";
  const docId = `DOC-ACE-FSVP-${Date.now().toString().slice(-6)}`;
  const attachmentId = `ATT-SYNTH-ACE-FSVP-${Date.now().toString().slice(-6)}`;
  const nowIso = new Date().toISOString();

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  applyTrainingDecorations(
    page,
    font,
    boldFont,
    "FDA ACE Supplemental Entry Data — PGA Message Set (Simulated Electronic Record)",
    docId,
    0,
    1
  );

  let y = height - 90;

  // Header Box
  page.drawRectangle({
    x: 36,
    y: y - 64,
    width: width - 72,
    height: 64,
    color: rgb(0.96, 0.98, 1),
    borderColor: rgb(0.65, 0.75, 0.9),
    borderWidth: 1
  });

  page.drawText("ELECTRONIC ENTRY SUMMARY & PGA TRANSMISSION AUDIT LOG", {
    x: 44,
    y: y - 16,
    size: 9,
    font: boldFont,
    color: rgb(0.1, 0.25, 0.5)
  });

  page.drawText(`ACE ENTRY IDENTIFIER: ${entryNo} | FILER CODE: ${brokerCode} | PORT OF ENTRY: ${port}`, {
    x: 44,
    y: y - 32,
    size: 8,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText(`GOVERNMENT AGENCY: FDA (Food and Drug Administration) | PROGRAM: FOO (Food Commercial) | PROCESSING: NSF`, {
    x: 44,
    y: y - 48,
    size: 7.5,
    font,
    color: rgb(0.3, 0.35, 0.45)
  });

  y -= 84;

  // PGA Entity Line Data Box (PG19 / PG20 / PG21)
  page.drawRectangle({
    x: 36,
    y: y - 140,
    width: width - 72,
    height: 140,
    color: rgb(0.99, 0.99, 0.99),
    borderColor: rgb(0.75, 0.8, 0.88),
    borderWidth: 1
  });

  page.drawText("PGA ENTITY ROLE DECLARATION (PG19 / PG20 / PG21 MESSAGE SET):", {
    x: 44,
    y: y - 16,
    size: 8.5,
    font: boldFont,
    color: rgb(0.15, 0.25, 0.4)
  });

  page.drawLine({ start: { x: 36, y: y - 24 }, end: { x: width - 36, y: y - 24 }, color: rgb(0.8, 0.85, 0.9), thickness: 0.8 });

  page.drawText("PGA RECORD", { x: 44, y: y - 38, size: 7.5, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("FIELD IDENTIFIER / VARIABLE", { x: 130, y: y - 38, size: 7.5, font: boldFont, color: rgb(0.3, 0.35, 0.45) });
  page.drawText("TRANSMITTED VALUE", { x: 320, y: y - 38, size: 7.5, font: boldFont, color: rgb(0.3, 0.35, 0.45) });

  const pgaRows = [
    { rec: "PG19", field: "Entity Role Code", val: "FSV (FSVP Importer under 21 CFR 1.500)" },
    { rec: "PG19", field: "Entity Legal Name", val: `${company}` },
    { rec: "PG19", field: "Unique Facility Identifier (UFI) Qualifier", val: "DUNS (Data Universal Numbering System)" },
    { rec: "PG19", field: "Entity UFI / DUNS Number", val: `${duns}` },
    { rec: "PG20", field: "Entity Electronic Address (Email)", val: "regulatory-desk@importingentity.com" },
    { rec: "PG20", field: "Entity Physical Address", val: `${hq} USA` }
  ];

  let pgaY = y - 54;
  for (const r of pgaRows) {
    page.drawText(r.rec, { x: 44, y: pgaY, size: 8, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
    page.drawText(r.field, { x: 130, y: pgaY, size: 7.5, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(r.val, { x: 320, y: pgaY, size: 7.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    pgaY -= 14;
  }

  y -= 158;

  // Electronic Filing Note
  page.drawRectangle({
    x: 36,
    y: y - 60,
    width: width - 72,
    height: 60,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.85, 0.85, 0.9),
    borderWidth: 0.8
  });

  page.drawText("ACE PGA TRANSMISSION AUDIT RECORD NOTATION:", {
    x: 44,
    y: y - 16,
    size: 7.5,
    font: boldFont,
    color: rgb(0.2, 0.25, 0.35)
  });

  page.drawText(`The above electronic message set was transmitted into the CBP Automated Commercial Environment (ACE) by filing agent under filer code ${brokerCode}. Transmission timestamp: 2026-08-05T14:22:09Z. Status: ACCEPTED_BY_FDA_SYSTEMS.`, {
    x: 44,
    y: y - 30,
    size: 7,
    font: italicFont,
    color: rgb(0.3, 0.3, 0.3)
  });

  const pdfBytes = await pdfDoc.save();
  const fileBuffer = Buffer.from(pdfBytes);

  const structuredData = {
    documentType: "FDA_ACE_FSVP_ENTRY_DATA",
    entryNumber: entryNo,
    filerCode: brokerCode,
    port,
    agency: "FDA",
    pgaEntityRole: "FSV",
    fsvpEntityName: company,
    fsvpDuns: duns,
    fsvpEmail: "regulatory-desk@importingentity.com",
    transmissionStatus: "ACCEPTED_BY_FDA_SYSTEMS"
  };

  const fileName = `FDA_ACE_FSVP_PGA_Transmission_${entryNo.replace(/[^0-9a-zA-Z]/g, '')}.pdf`;
  const summary = `Simulated electronic FDA ACE PGA entry transmission dataset for Entry #${entryNo}. Records entity role FSV declared as ${company} (DUNS ${duns}).`;
  const snippet = `FDA ACE PGA Record: Entry #${entryNo}; Role: FSV; Entity Name: ${company}; UFI/DUNS: ${duns}; Status: ACCEPTED_BY_FDA_SYSTEMS.`;

  return {
    attachmentId,
    originalFileName: fileName,
    mimeType: "application/pdf",
    fileBuffer,
    fileSize: fileBuffer.length,
    formattedSize: formatAttachmentSize(fileBuffer.length),
    fileCategory: "DOCUMENT",
    extractedTextSummary: summary,
    extractedTextSnippet: snippet,
    structuredData,
    metadata: {
      documentId: docId,
      projectId: req.projectId,
      moduleId: req.moduleId,
      caseId: req.caseId,
      sessionId: req.sessionId,
      channelId: req.channelId || "CLIENT_ENGAGEMENT",
      documentType: "FDA_ACE_FSVP_ENTRY_DATA",
      title: `FDA ACE PGA Entry Data Record (Entry #${entryNo})`,
      generatedByPersonaId: req.generatedByPersonaId || "PER-01",
      generatedAt: nowIso,
      synthetic: true,
      trainingOnly: true,
      isHumanUploaded: false,
      version: "1.0",
      mimeType: "application/pdf",
      storageReference: `storage://case_synthetic_documents/${attachmentId}`,
      visibilityScope: "CLIENT_FACING",
      processingStatus: "READY"
    }
  };
}

// ---------------------------------------------------------------------------
// 4. BUILD COMMERCIAL INVOICE
// ---------------------------------------------------------------------------
export async function generateCommercialInvoice(
  req: SyntheticDocRequest
): Promise<SyntheticDocResult> {
  const cf = req.caseFacts || {};
  const company = cf.companyName || "Commercial Importer";
  const supplier = cf.supplierName || "Foreign Supplier";
  const supplierCountry = cf.supplierCountry || "Origin Country";
  const supplierLoc = cf.supplierCityOrRegion ? `${cf.supplierCityOrRegion}, ${supplierCountry}` : supplierCountry;
  const incoterm = cf.incotermsRule || "FOB";
  const portTerm = cf.namedPortOfLoading ? `${incoterm} ${cf.namedPortOfLoading}` : `${incoterm} [FOREIGN PORT — TO BE VERIFIED]`;
  const invoiceNo = `INV-${Date.now().toString().slice(-4)}`;
  const totalAmount = cf.totalInvoiceAmount || "$99,100.00 USD";
  const docId = `DOC-INV-${Date.now().toString().slice(-6)}`;
  const attachmentId = `ATT-SYNTH-INV-${Date.now().toString().slice(-6)}`;
  const nowIso = new Date().toISOString();

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  applyTrainingDecorations(page, font, boldFont, "Commercial Export Invoice", docId, 0, 1);

  let y = height - 90;

  page.drawRectangle({
    x: 36,
    y: y - 80,
    width: width - 72,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1
  });

  page.drawText(`EXPORTER / SELLER: ${supplier}`, { x: 44, y: y - 18, size: 9, font: boldFont, color: rgb(0.15, 0.2, 0.3) });
  page.drawText(`${supplierLoc}`, { x: 44, y: y - 30, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`SOLD TO (BUYER): ${company}`, { x: 44, y: y - 48, size: 9, font: boldFont, color: rgb(0.15, 0.2, 0.3) });
  page.drawText(`${cf.headquarters || 'United States'}`, { x: 44, y: y - 60, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`INVOICE NO: ${invoiceNo} | DATE: July 28, 2026 | TERMS: ${portTerm} (50% BL / 50% Net 30)`, { x: 44, y: y - 74, size: 7.5, font: boldFont, color: rgb(0.3, 0.4, 0.5) });

  y -= 100;

  page.drawText("LINE ITEMS:", { x: 36, y, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
  y -= 16;

  page.drawRectangle({
    x: 36,
    y: y - 90,
    width: width - 72,
    height: 90,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1
  });

  page.drawText("1. Cold-Pressed Extra Virgin Olive Oil — 8,400 Units ($5.77/ea) = $48,500.00", { x: 44, y: y - 22, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("2. Sesame Tahini & Halva Paste — 3,200 Units ($10.06/ea) = $32,200.00", { x: 44, y: y - 44, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("3. Artisan Herb & Roasted Sesame Blend — 4,500 Units ($4.09/ea) = $18,400.00", { x: 44, y: y - 66, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`TOTAL COMMERCIAL INVOICE AMOUNT: ${totalAmount}`, { x: 44, y: y - 84, size: 8.5, font: boldFont, color: rgb(0.1, 0.4, 0.2) });

  const pdfBytes = await pdfDoc.save();
  const fileBuffer = Buffer.from(pdfBytes);

  return {
    attachmentId,
    originalFileName: `Commercial_Invoice_${invoiceNo}.pdf`,
    mimeType: "application/pdf",
    fileBuffer,
    fileSize: fileBuffer.length,
    formattedSize: formatAttachmentSize(fileBuffer.length),
    fileCategory: "DOCUMENT",
    extractedTextSummary: `Commercial Invoice #${invoiceNo} from ${supplier} to ${company} for ${totalAmount}. Terms: ${portTerm}.`,
    extractedTextSnippet: `Commercial Invoice #${invoiceNo}: Sold to ${company}; Total: ${totalAmount}; Terms: ${portTerm}; Payment: 50% Bill of Lading, 50% Net 30 Days post-customs admission.`,
    structuredData: { invoiceNo, buyer: company, seller: supplier, total: totalAmount, terms: portTerm },
    metadata: {
      documentId: docId,
      projectId: req.projectId,
      moduleId: req.moduleId,
      caseId: req.caseId,
      sessionId: req.sessionId,
      channelId: req.channelId || "CLIENT_ENGAGEMENT",
      documentType: "COMMERCIAL_INVOICE",
      title: `Commercial Invoice (${invoiceNo})`,
      generatedByPersonaId: req.generatedByPersonaId || "PER-01",
      generatedAt: nowIso,
      synthetic: true,
      trainingOnly: true,
      isHumanUploaded: false,
      version: "1.0",
      mimeType: "application/pdf",
      storageReference: `storage://case_synthetic_documents/${attachmentId}`,
      visibilityScope: "CLIENT_FACING",
      processingStatus: "READY"
    }
  };
}

// ---------------------------------------------------------------------------
// 5. MAIN SYNTHETIC DISPATCHER
// ---------------------------------------------------------------------------
export async function generateSyntheticDocument(
  req: SyntheticDocRequest
): Promise<SyntheticDocResult> {
  switch (req.documentType) {
    case 'MASTER_PURCHASE_AGREEMENT':
      return await generateMasterPurchaseAgreement(req);
    case 'CBP_ENTRY_SUMMARY_7501':
      return await generateCbpEntrySummary7501(req);
    case 'FDA_ACE_FSVP_ENTRY_DATA':
      return await generateFdaAceFsvpEntryData(req);
    case 'COMMERCIAL_INVOICE':
      return await generateCommercialInvoice(req);
    default:
      return await generateMasterPurchaseAgreement(req);
  }
}

// ---------------------------------------------------------------------------
// 6. HELPER: Clean false attachment claims if no file was actually produced
// ---------------------------------------------------------------------------
export function cleanFalseAttachmentClaims(text: string, createdAttachmentCount: number): string {
  if (createdAttachmentCount > 0) return text;

  let cleaned = text;
  cleaned = cleaned.replace(/I have attached our executed Master Purchase Agreement and CBP Form 7501/gi, "We have our executed Master Purchase Agreement and CBP Form 7501 on file for review");
  cleaned = cleaned.replace(/I have attached our/gi, "We have on file our");
  cleaned = cleaned.replace(/I have attached the/gi, "We have on file the");
  cleaned = cleaned.replace(/Please find attached/gi, "Regarding");
  cleaned = cleaned.replace(/Please see attached/gi, "Regarding");
  cleaned = cleaned.replace(/I attached/gi, "We have");
  cleaned = cleaned.replace(/I've attached/gi, "We have");
  cleaned = cleaned.replace(/as attached/gi, "as referenced");
  return cleaned;
}
