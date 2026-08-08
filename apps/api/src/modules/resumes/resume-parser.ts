import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractResumeText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const parsed = await parser.getText();
      return normalizeExtractedText(parsed.text);
    } finally {
      await parser.destroy();
    }
  }

  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeExtractedText(parsed.value);
  }

  if (file.mimetype === "text/plain") {
    return normalizeExtractedText(file.buffer.toString("utf8"));
  }

  throw new Error("Unsupported resume file type.");
}

function normalizeExtractedText(value: string): string {
  return value.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
