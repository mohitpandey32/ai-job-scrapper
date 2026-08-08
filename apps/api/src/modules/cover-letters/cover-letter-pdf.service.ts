import PDFDocument from "pdfkit";

export interface CoverLetterPdfInput {
  readonly subjectLine: string;
  readonly coverLetter: string;
  readonly candidateName?: string | null;
  readonly candidateEmail: string;
  readonly companyName: string;
  readonly jobTitle: string;
  readonly location: string;
}

export class CoverLetterPdfService {
  async generate(input: CoverLetterPdfInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const document = new PDFDocument({
        size: "A4",
        margins: {
          top: 46,
          right: 58,
          bottom: 46,
          left: 58,
        },
        info: {
          Title: input.subjectLine,
          Author: input.candidateName ?? input.candidateEmail,
          Subject: `Cover letter for ${input.jobTitle} at ${input.companyName}`,
        },
      });

      document.on("data", (chunk: Buffer) => chunks.push(chunk));
      document.on("error", reject);
      document.on("end", () => resolve(Buffer.concat(chunks)));

      renderTemplate(document, input);
      document.end();
    });
  }
}

function renderTemplate(document: PDFKit.PDFDocument, input: CoverLetterPdfInput) {
  const pageWidth = document.page.width;
  const pageHeight = document.page.height;
  const marginX = 58;
  const contentWidth = pageWidth - 116;
  const candidateName = input.candidateName?.trim() || input.candidateEmail;
  const body = removeTrailingClosing(normalizeCoverLetter(input.coverLetter));
  const bodyWordCount = body.split(/\s+/).filter(Boolean).length;
  const bodyFontSize = bodyWordCount > 320 ? 9.2 : bodyWordCount > 260 ? 9.6 : 10;
  const bodyLineGap = bodyWordCount > 300 ? 2 : 2.5;

  document.rect(marginX, 34, contentWidth, 4).fill("#0f766e");

  const headerY = 54;
  document
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#111827")
    .text(candidateName, marginX, headerY, { width: contentWidth * 0.64, align: "left" });

  document
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#4b5563")
    .text(input.candidateEmail, marginX, document.y + 4, { width: contentWidth * 0.64 });

  document
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#374151")
    .text(formatDate(new Date()), marginX + contentWidth * 0.68, headerY + 3, {
      width: contentWidth * 0.32,
      align: "right",
    });

  document.strokeColor("#d1d5db").lineWidth(1).moveTo(marginX, 100).lineTo(pageWidth - marginX, 100).stroke();

  const recipientY = 122;
  document.font("Helvetica-Bold").fontSize(8).fillColor("#0f766e").text("TO", marginX, recipientY, { width: 70 });
  document.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Hiring Team", marginX + 86, recipientY - 2, { width: contentWidth - 86 });
  document.font("Helvetica").fontSize(10).fillColor("#374151").text(input.companyName, marginX + 86, document.y + 2, { width: contentWidth - 86 });
  document.text(input.location || "India", marginX + 86, document.y + 2, { width: contentWidth - 86 });

  const subjectY = Math.max(document.y + 18, 176);
  document.roundedRect(marginX, subjectY, contentWidth, 44, 4).fillAndStroke("#f8fafc", "#e5e7eb");
  document.rect(marginX, subjectY, 4, 44).fill("#0f766e");
  document.font("Helvetica-Bold").fontSize(8).fillColor("#64748b").text("SUBJECT", marginX + 18, subjectY + 9, { width: contentWidth - 36 });
  document.font("Helvetica-Bold").fontSize(10.5).fillColor("#111827").text(input.subjectLine, marginX + 18, subjectY + 23, {
    width: contentWidth - 36,
    ellipsis: true,
  });

  document.y = subjectY + 64;
  body.split("\n\n").forEach((paragraph) => {
    document.font("Helvetica").fontSize(bodyFontSize).fillColor("#1f2937").text(paragraph, marginX, document.y, {
      width: contentWidth,
      align: "left",
      lineGap: bodyLineGap,
    });
    document.moveDown(bodyWordCount > 300 ? 0.42 : 0.55);
  });

  document.moveDown(bodyWordCount > 300 ? 0.25 : 0.35);
  document.font("Helvetica").fontSize(bodyFontSize).fillColor("#1f2937").text("Sincerely,", marginX, document.y, { width: contentWidth });
  document.moveDown(0.8);
  document.font("Helvetica-Bold").fontSize(bodyFontSize).fillColor("#111827").text(candidateName, marginX, document.y, { width: contentWidth });

  const footerY = pageHeight - 32;
  document.strokeColor("#e5e7eb").lineWidth(0.6).moveTo(marginX, footerY - 8).lineTo(pageWidth - marginX, footerY - 8).stroke();
}

function normalizeCoverLetter(value: string) {
  return value
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
  }).format(value);
}

function removeTrailingClosing(value: string) {
  const closingPattern =
    /\n{0,2}(sincerely|best regards|kind regards|regards|thank you|yours faithfully|yours sincerely),?\s*(\n+[^\n]{1,90})?\s*$/i;

  return value.replace(closingPattern, "").trim();
}
