export type IndexedFile = { id: string; name: string; path: string; size: number; modified: number; type: string; text: string };
export type SearchResult = IndexedFile & { score: number; matched: number; excerpt: string };

export const TEXT_EXT = new Set([
  'txt', 'md', 'markdown', 'html', 'htm', 'json', 'csv', 'xml', 'yaml', 'yml', 'log',
  'ts', 'tsx', 'js', 'jsx', 'css', 'scss', 'py', 'rs', 'go', 'java', 'kt', 'c', 'h',
  'cpp', 'sh', 'toml', 'ini', 'sql', 'svg'
]);

export const extOf = (name: string): string => name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';

export function excerpt(text: string, terms: string[]): string {
  if (!text) return '';
  const lower = text.toLocaleLowerCase();
  let at = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) at = 0;
  const start = Math.max(0, at - 65);
  const end = Math.min(text.length, at + 190);
  return (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ').trim() + (end < text.length ? '…' : '');
}

export function searchIndexedFiles(files: IndexedFile[], query: string): SearchResult[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return files.map(file => {
    const name = file.name.toLocaleLowerCase();
    const path = file.path.toLocaleLowerCase();
    const body = file.text.toLocaleLowerCase();
    const matched = terms.filter(term => name.includes(term) || path.includes(term) || body.includes(term));
    const score = matched.length * 10
      + (terms.every(term => name.includes(term)) ? 20 : 0)
      + (terms.every(term => body.includes(term)) ? 5 : 0);
    return { ...file, score, matched: matched.length, excerpt: excerpt(file.text, terms) };
  }).filter(file => file.matched > 0)
    .sort((a, b) => b.score - a.score || b.modified - a.modified);
}
