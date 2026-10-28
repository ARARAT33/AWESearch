import { describe, expect, it } from 'vitest';
import { extOf, searchIndexedFiles, TEXT_EXT, type IndexedFile } from './search';

const file = (id: string, name: string, path: string, text: string, modified = 1): IndexedFile => ({
  id, name, path, text, modified, size: text.length, type: extOf(name) || 'file'
});

describe('local search', () => {
  const files = [
    file('1', 'notes.md', 'docs/notes.md', 'Armenian history and ancient maps', 2),
    file('2', 'history.txt', 'archive/history.txt', 'A note about ancient Armenian history', 3),
    file('3', 'todo.txt', 'work/todo.txt', 'buy groceries', 1)
  ];

  it('returns no results for an empty query', () => {
    expect(searchIndexedFiles(files, '   ')).toEqual([]);
  });

  it('finds words in file content and path, ignoring case', () => {
    const results = searchIndexedFiles(files, 'ARMENIAN');
    expect(results.map(result => result.id).sort()).toEqual(['1', '2']);
  });

  it('ranks exact filename matches above content-only matches', () => {
    const results = searchIndexedFiles(files, 'history');
    expect(results[0].name).toBe('history.txt');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('requires every query term to match somewhere in each result', () => {
    const results = searchIndexedFiles(files, 'ancient maps');
    expect(results.map(result => result.id)).toEqual(['1']);
  });

  it('creates a useful content excerpt', () => {
    const result = searchIndexedFiles(files, 'maps')[0];
    expect(result.excerpt.toLowerCase()).toContain('maps');
  });
});

describe('file types', () => {
  it('normalizes extensions and handles extensionless files', () => {
    expect(extOf('REPORT.PDF')).toBe('pdf');
    expect(extOf('README')).toBe('');
  });

  it('includes common text and source formats', () => {
    expect(TEXT_EXT.has('md')).toBe(true);
    expect(TEXT_EXT.has('tsx')).toBe(true);
    expect(TEXT_EXT.has('pdf')).toBe(false);
  });
});
