import { describe, expect, it } from 'vitest';
import { MAX_EXTRACTED_CHARS, MAX_PDF_BYTES, MAX_PDF_PAGES, MAX_TEXT_FILE_BYTES, extractFileText, normalizeExtractedText } from './extract';

describe('file extraction limits and normalization', () => {
  it('normalizes line endings, tabs and null bytes', () => {
    expect(normalizeExtractedText('a\r\nb\t\t\nc\u0000d')).toBe('a\nb\nc d');
  });
  it('caps extracted text length', () => {
    expect(normalizeExtractedText('abcdefgh', 4)).toBe('abcd');
    expect(MAX_EXTRACTED_CHARS).toBe(500_000);
  });
  it('sets bounded extraction limits for user-selected files', () => {
    expect(MAX_TEXT_FILE_BYTES).toBe(2_000_000);
    expect(MAX_PDF_BYTES).toBe(20_000_000);
    expect(MAX_PDF_PAGES).toBe(200);
  });
});

describe('DOCX extraction', () => {
  it('reports a clear warning for a damaged DOCX instead of crashing', async () => {
    const file = Object.assign(new Blob(['not a real document']), { name: 'broken.docx' }) as File;
    const result = await extractFileText(file);
    expect(result.text).toBe('');
    expect(result.warning).toMatch(/Could not extract this DOCX/);
  });
});
