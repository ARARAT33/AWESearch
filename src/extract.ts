import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { extOf, TEXT_EXT } from './search';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_TEXT_FILE_BYTES = 2_000_000;
export const MAX_PDF_BYTES = 20_000_000;
export const MAX_PDF_PAGES = 200;
export const MAX_EXTRACTED_CHARS = 500_000;

export function normalizeExtractedText(value: string, maxChars = MAX_EXTRACTED_CHARS): string {
  return value.replace(/\u0000/g, ' ').replace(/\r\n?/g, '\n').replace(/[\t ]+\n/g, '\n').slice(0, maxChars);
}

export async function extractFileText(file: File): Promise<{ text: string; warning?: string }> {
  const extension = extOf(file.name);
  if (TEXT_EXT.has(extension)) {
    if (file.size > MAX_TEXT_FILE_BYTES) return { text: '', warning: 'Text file is larger than the 2 MB extraction limit; filename and metadata were indexed.' };
    try { return { text: normalizeExtractedText(await file.text(), 300_000) }; }
    catch { return { text: '', warning: 'Could not read this text file; filename and metadata were indexed.' }; }
  }
  if (extension === 'pdf') {
    if (file.size > MAX_PDF_BYTES) return { text: '', warning: 'PDF exceeds the 20 MB extraction limit; filename and metadata were indexed.' };
    type ExtractedPdf = { numPages: number; getPage: (page: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }>; cleanup?: () => void }>; destroy: () => Promise<void> };
    let document: ExtractedPdf | undefined;
    try {
      document = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise as unknown as ExtractedPdf;
      const pages = Math.min(document.numPages, MAX_PDF_PAGES);
      const chunks: string[] = [];
      let charCount = 0;
      for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items.map(item => item.str ?? '').filter(Boolean).join(' ');
        chunks.push(text);
        charCount += text.length;
        if (charCount >= MAX_EXTRACTED_CHARS) break;
      }
      const text = normalizeExtractedText(chunks.join('\n'), MAX_EXTRACTED_CHARS);
      const warnings: string[] = [];
      if (document.numPages > MAX_PDF_PAGES) warnings.push('Only the first 200 PDF pages were extracted.');
      if (!text.trim()) warnings.push('No selectable text was found. Scanned PDFs need OCR, which is not included yet.');
      return { text, warning: warnings.join(' ') || undefined };
    } catch {
      return { text: '', warning: 'Could not extract this PDF. It may be damaged, encrypted, or unsupported.' };
    } finally {
      await document?.destroy().catch(() => undefined);
    }
  }
  if (extension === 'docx') {
    if (file.size > MAX_PDF_BYTES) return { text: '', warning: 'DOCX exceeds the 20 MB extraction limit; filename and metadata were indexed.' };
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      const text = normalizeExtractedText(result.value, MAX_EXTRACTED_CHARS);
      return {
        text,
        warning: text.trim() ? undefined : 'No readable text was found in this DOCX file.'
      };
    } catch {
      return { text: '', warning: 'Could not extract this DOCX. The file may be damaged, encrypted, or unsupported.' };
    }
  }
  if (extension === 'doc') return { text: '', warning: 'Legacy .doc files are not supported yet; filename and metadata were indexed.' };
  return { text: '', warning: undefined };
}
