import { describe, expect, it } from 'vitest';
import { MAX_EXTRACTED_CHARS, MAX_PDF_BYTES, MAX_PDF_PAGES, MAX_TEXT_FILE_BYTES, normalizeExtractedText } from './extract';

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
