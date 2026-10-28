import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Globe2, FolderSearch, Files, Settings2, Languages, ArrowUpRight, FileText, FileImage, File, Plus, Trash2, Download, ShieldCheck, Sparkles, ExternalLink, X, Menu, HardDrive, CircleHelp } from 'lucide-react';

type IndexedFile = { id: string; name: string; path: string; size: number; modified: number; type: string; text: string };
type Lang = 'en' | 'hy' | 'ru';
const labels: Record<Lang, Record<string, string>> = {
  en: { tagline: 'Find anything. Anywhere.', sub: 'Your files and the web, in one place.', placeholder: 'Search files, folders, documents, or the web…', all: 'All', local: 'Local files', web: 'Web', folders: 'Indexed files', add: 'Add files or folder', indexed: 'Indexed items', privacy: 'Local-first privacy', privacyText: 'Files stay on this device. Nothing is uploaded by local search.', emptyTitle: 'Your search starts here', emptyText: 'Add files to build a private local index, or switch to Web to search online.', recent: 'Recently indexed', clear: 'Clear index', webNotice: 'Web search provider is not configured yet. Local search works now; connect a provider in Settings to enable online results.', localEmpty: 'No local matches', settings: 'Search settings', lang: 'Language', fileTypes: 'Supported now', typeText: 'Text, Markdown, HTML, JSON, CSV, and source code. Other formats can be added through extractors.', results: 'results', noText: 'Filename match', source: 'Local index', open: 'Open', choose: 'Choose files', drop: 'Choose files or drop them here', localOnly: 'Your browser only grants access to files you explicitly select.', about: 'About AWESEARCH', indexHelp: 'Index only folders you trust. You can clear this index any time.' },
  hy: { tagline: 'Գտիր ամեն ինչ։ Ամենուր։', sub: 'Քո ֆայլերն ու համացանցը՝ մեկ տեղում։', placeholder: 'Որոնիր ֆայլեր, թղթապանակներ կամ համացանցում…', all: 'Բոլորը', local: 'Տեղային ֆայլեր', web: 'Համացանց', folders: 'Ինդեքսավորված ֆայլեր', add: 'Ավելացնել ֆայլեր կամ պանակ', indexed: 'Ինդեքսավորված տարրեր', privacy: 'Գաղտնիություն՝ առաջին տեղում', privacyText: 'Ֆայլերը մնում են այս սարքում։ Տեղային որոնումը ոչինչ չի վերբեռնում։', emptyTitle: 'Սկսիր որոնումը', emptyText: 'Ավելացրու ֆայլեր՝ անձնական ինդեքս ստեղծելու համար, կամ ընտրիր Համացանց։', recent: 'Վերջին ինդեքսավորվածները', clear: 'Մաքրել ինդեքսը', webNotice: 'Համացանցային որոնման ծառայությունը դեռ կարգավորված չէ։ Տեղային որոնումն աշխատում է։', localEmpty: 'Տեղային արդյունքներ չկան', settings: 'Որոնման կարգավորումներ', lang: 'Լեզու', fileTypes: 'Աջակցվող ձևաչափեր', typeText: 'Տեքստ, Markdown, HTML, JSON, CSV և ծրագրային կոդ։', results: 'արդյունք', noText: 'Համընկնում է անվան մեջ', source: 'Տեղային ինդեքս', open: 'Բացել', choose: 'Ընտրել ֆայլեր', drop: 'Ընտրիր ֆայլեր կամ գցիր այստեղ', localOnly: 'Բրաուզերը հասանելիություն է տալիս միայն քո ընտրած ֆայլերին։', about: 'AWESEARCH-ի մասին', indexHelp: 'Ինդեքսավորիր միայն վստահելի պանակները։ Կարող ես ցանկացած պահի մաքրել ինդեքսը։' },
  ru: { tagline: 'Найди что угодно. Где угодно.', sub: 'Ваши файлы и интернет — в одном месте.', placeholder: 'Поиск файлов, папок, документов или в интернете…', all: 'Все', local: 'Локальные файлы', web: 'Интернет', folders: 'Проиндексированные файлы', add: 'Добавить файлы или папку', indexed: 'Элементов в индексе', privacy: 'Конфиденциальность прежде всего', privacyText: 'Файлы остаются на устройстве. Локальный поиск ничего не загружает.', emptyTitle: 'Начните поиск', emptyText: 'Добавьте файлы для создания локального индекса или выберите Интернет.', recent: 'Недавно проиндексировано', clear: 'Очистить индекс', webNotice: 'Провайдер веб-поиска ещё не настроен. Локальный поиск уже работает.', localEmpty: 'Совпадений не найдено', settings: 'Настройки поиска', lang: 'Язык', fileTypes: 'Поддерживается сейчас', typeText: 'Текст, Markdown, HTML, JSON, CSV и исходный код.', results: 'результатов', noText: 'Совпадение по имени', source: 'Локальный индекс', open: 'Открыть', choose: 'Выбрать файлы', drop: 'Выберите файлы или перетащите их сюда', localOnly: 'Браузер получает доступ только к выбранным вами файлам.', about: 'О AWESEARCH', indexHelp: 'Индексируйте только доверенные папки. Индекс можно очистить в любой момент.' }
};
const TEXT_EXT = new Set(['txt','md','markdown','html','htm','json','csv','xml','yaml','yml','log','ts','tsx','js','jsx','css','scss','py','rs','go','java','kt','c','h','cpp','sh','toml','ini','sql','svg']);
const extOf = (name: string) => name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
const fmtSize = (n: number) => n < 1024 ? n + ' B' : n < 1048576 ? (n/1024).toFixed(1) + ' KB' : (n/1048576).toFixed(1) + ' MB';
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'all'|'local'|'web'>('all');
  const [files, setFiles] = useState<IndexedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);\n  const folderRef = useRef<HTMLInputElement>(null);
  const t = labels[lang];

  useEffect(() => {
    try {
      const raw = localStorage.getItem('awesearch-index-v1');
      if (raw) setFiles(JSON.parse(raw) as IndexedFile[]);
      const savedLang = localStorage.getItem('awesearch-lang');
      if (savedLang === 'en' || savedLang === 'hy' || savedLang === 'ru') setLang(savedLang);
    } catch { /* Corrupt browser storage is safely ignored. */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('awesearch-index-v1', JSON.stringify(files)); } catch {
      setNotice('Browser storage is full. Try indexing fewer or smaller files.');
    }
  }, [files]);
  useEffect(() => { localStorage.setItem('awesearch-lang', lang); document.documentElement.lang = lang; }, [lang]);

  const results = useMemo(() => {
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return files.map(f => {
      const name = f.name.toLocaleLowerCase();
      const path = f.path.toLocaleLowerCase();
      const body = f.text.toLocaleLowerCase();
      const matched = terms.filter(term => name.includes(term) || path.includes(term) || body.includes(term));
      const score = matched.length * 10 + (terms.every(term => name.includes(term)) ? 20 : 0) + (terms.every(term => body.includes(term)) ? 5 : 0);
      return { ...f, score, matched: matched.length, excerpt: excerpt(f.text, terms) };
    }).filter(f => f.matched > 0).sort((a,b) => b.score-a.score || b.modified-a.modified);
  }, [files, query]);
  const shownResults = mode === 'web' ? [] : results;
  const addFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    if (!chosen.length) return;
    setBusy(true); setNotice('');
    const indexed: IndexedFile[] = [];
    for (const file of chosen) {
      const path = (file as File & {webkitRelativePath?: string}).webkitRelativePath || file.name;
      let text = '';
      if (TEXT_EXT.has(extOf(file.name)) && file.size <= 2_000_000) {
        try { text = (await file.text()).replace(/\u0000/g, ' ').slice(0, 300_000); } catch { text = ''; }
      }
      indexed.push({ id: path + ':' + file.size + ':' + file.lastModified, name: file.name, path, size: file.size, modified: file.lastModified, type: extOf(file.name) || 'file', text });
    }
    setFiles(old => {
      const byId = new Map(old.map(f => [f.id, f]));
      indexed.forEach(f => byId.set(f.id, f));
      return [...byId.values()].sort((a,b) => b.modified-a.modified);
    });
    setBusy(false);
    setNotice('Indexed ' + indexed.length + ' file(s). ' + t.localOnly);
    event.target.value = '';
  };
  const clearIndex = () => { setFiles([]); setNotice('Local index cleared.'); };
  const exportIndex = () => {
    const blob = new Blob([JSON.stringify(files.map(({text, ...rest}) => rest), null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='awesearch-index.json'; a.click(); URL.revokeObjectURL(url);
  };
  const openFile = (f: IndexedFile) => {
    setNotice('Browsers cannot reopen a local file from its path automatically. Select the file again, or use the native AWESEARCH app when available.');
  };

  return <div className="app-shell">
    <aside className={'sidebar ' + (sidebarOpen ? 'sidebar-open' : '')}>
      <div className="brand"><div className="brand-mark"><Search size={21}/></div><div><b>AWESEARCH</b><span>SEARCH WORKSPACE</span></div><button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <button className={'nav-item '+(mode==='all'?'active':'')} onClick={()=>{setMode('all');setSidebarOpen(false)}}><Search size={18}/>{t.all}<span className="nav-count">{files.length}</span></button>
      <button className={'nav-item '+(mode==='local'?'active':'')} onClick={()=>{setMode('local');setSidebarOpen(false)}}><HardDrive size={18}/>{t.local}</button>
      <button className={'nav-item '+(mode==='web'?'active':'')} onClick={()=>{setMode('web');setSidebarOpen(false)}}><Globe2 size={18}/>{t.web}<span className="soon">SETUP</span></button>
      <div className="side-divider"/>
      <div className="side-label">YOUR WORKSPACE</div>
      <button className="nav-item" onClick={()=>fileRef.current?.click()}><Files size={18}/>Add files</button>\n      <button className="nav-item" onClick={()=>folderRef.current?.click()}><FolderSearch size={18}/>Index a folder</button>
      <button className="nav-item" onClick={()=>setShowSettings(true)}><Settings2 size={18}/>{t.settings}</button>
      <div className="sidebar-bottom">
        <div className="privacy-card"><ShieldCheck size={18}/><div><b>{t.privacy}</b><p>{t.privacyText}</p></div></div>
        <div className="sidebar-foot"><span className="status-dot"/> LOCAL INDEX READY <span>v0.1</span></div>
      </div>
    </aside>
    {sidebarOpen && <button className="scrim" aria-label="Close menu" onClick={()=>setSidebarOpen(false)}/>}
    <main className="main">
      <header className="topbar"><button className="icon-button menu-button" onClick={()=>setSidebarOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{mode==='web'?t.web:mode==='local'?t.local:t.all}</b></div><div className="top-actions"><button className="language-button" onClick={()=>setLang(lang==='en'?'hy':lang==='hy'?'ru':'en')} title="Change language"><Languages size={16}/><span>{lang.toUpperCase()}</span></button><button className="icon-button" onClick={()=>setShowSettings(true)} aria-label={t.settings}><Settings2 size={18}/></button></div></header>
      <section className="hero">
        <div className="eyebrow"><Sparkles size={14}/> ONE SEARCH. YOUR WHOLE WORLD.</div>
        <h1>{t.tagline}</h1><p>{t.sub}</p>
        <div className="search-wrap"><Search size={21} className="search-icon"/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && mode==='web')setNotice(t.webNotice)}} placeholder={t.placeholder} aria-label="Search"/>{query && <button className="clear-query" onClick={()=>setQuery('')} aria-label="Clear search"><X size={16}/></button>}<kbd>ENTER</kbd></div>
        <div className="search-modes"><button className={mode==='all'?'selected':''} onClick={()=>setMode('all')}><Search size={15}/>{t.all}</button><button className={mode==='local'?'selected':''} onClick={()=>setMode('local')}><Files size={15}/>{t.local}</button><button className={mode==='web'?'selected':''} onClick={()=>{setMode('web');setNotice(t.webNotice)}}><Globe2 size={15}/>{t.web}</button></div>
      </section>
      <section className="content-area">
        {notice && <div className="notice"><ShieldCheck size={17}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
        {!query.trim() ? <div className="welcome-grid">
          <div className="welcome-card primary-card"><div className="card-icon"><FolderSearch size={23}/></div><div className="card-tag">PRIVATE BY DESIGN</div><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><div className="hero-buttons"><button className="primary-button" onClick={()=>fileRef.current?.click()}><Plus size={17}/>Add files</button><button className="secondary-button" onClick={()=>folderRef.current?.click()}><FolderSearch size={15}/>Index folder</button></div><div className="card-decoration"><Search size={92}/></div></div>
          <div className="stat-card"><div className="stat-icon"><Files size={19}/></div><span>{t.indexed}</span><strong>{files.length.toLocaleString()}</strong><small>Saved in this browser</small><div className="stat-bottom"><span className="status-dot"/>{files.length ? 'INDEX ACTIVE' : 'READY TO INDEX'}</div></div>
          <div className="feature-card"><div className="feature-head"><div className="feature-icon"><ShieldCheck size={19}/></div><span>LOCAL-FIRST</span></div><h3>{t.privacy}</h3><p>{t.privacyText}</p><div className="feature-line"/><p className="muted">{t.indexHelp}</p></div>
          <div className="feature-card"><div className="feature-head"><div className="feature-icon blue"><Globe2 size={19}/></div><span>WEB DISCOVERY</span></div><h3>Local + global</h3><p>{t.webNotice}</p><button className="text-button" onClick={()=>setShowSettings(true)}>Configure search <ArrowUpRight size={15}/></button></div>
          <div className="recent-card"><div className="section-heading"><div><h3>{t.recent}</h3><p>Your local index at a glance</p></div>{files.length>0&&<button className="text-button" onClick={exportIndex}><Download size={15}/> Export</button>}</div>
            {files.slice(0,5).map(f=><div className="recent-row" key={f.id}><div className="file-icon">{iconFor(f.type)}</div><div className="file-details"><b>{f.name}</b><span>{f.path}</span></div><small>{fmtSize(f.size)}</small></div>)}
            {files.length===0&&<div className="empty-recent"><Files size={22}/><span>No files indexed yet</span><button onClick={()=>fileRef.current?.click()}>{t.choose}</button></div>}
          </div>
        </div> : <div className="results-panel">
          <div className="results-heading"><div><h2>{mode==='web'?'Web discovery':t.local}</h2><p>{mode==='web' ? t.webNotice : shownResults.length+' '+t.results}</p></div>{mode!=='web'&&<button className="text-button" onClick={()=>fileRef.current?.click()}><Plus size={15}/>{t.add}</button>}</div>
          {mode==='web' ? <div className="web-placeholder"><Globe2 size={30}/><h3>Search the open web</h3><p>{t.webNotice}</p><button className="primary-button" onClick={()=>setShowSettings(true)}><Settings2 size={16}/> {t.settings}</button></div> : shownResults.length===0 ? <div className="empty-results"><Search size={28}/><h3>{t.localEmpty}</h3><p>{files.length===0?'Add files first to build your local search index.':'Try different words or a shorter phrase.'}</p><button className="primary-button" onClick={()=>fileRef.current?.click()}><Plus size={16}/>{t.add}</button></div> : shownResults.map(f=><article className="result-row" key={f.id}><div className="file-icon large">{iconFor(f.type)}</div><div className="result-main"><div className="result-meta"><span>{t.source}</span><span>·</span><span>{f.type.toUpperCase()}</span><span>·</span><span>{fmtSize(f.size)}</span></div><h3>{f.name}</h3><p className="result-path">{f.path}</p><p className="result-excerpt">{f.excerpt || t.noText}</p><button className="text-button" onClick={()=>openFile(f)}>{t.open}<ExternalLink size={14}/></button></div></article>)}
        </div>}
      </section>
      <footer><span>© AWESEARCH · AWE ECOSYSTEM</span><span><ShieldCheck size={13}/> PRIVATE BY DEFAULT</span><button onClick={()=>setShowSettings(true)}><CircleHelp size={14}/> Help & settings</button></footer>
    </main>
    <input ref={fileRef} className="hidden-input" type="file" multiple onChange={addFiles} />\n    <input ref={folderRef} className="hidden-input" type="file" multiple onChange={addFiles} />
    {showSettings&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowSettings(false)}}><section className="settings-modal"><div className="modal-title"><div><span className="eyebrow">AWESEARCH</span><h2>{t.settings}</h2></div><button className="icon-button" onClick={()=>setShowSettings(false)} aria-label="Close"><X size={19}/></button></div><label className="setting-label">{t.lang}</label><div className="language-options">{(['en','hy','ru'] as Lang[]).map(l=><button className={lang===l?'chosen':''} key={l} onClick={()=>setLang(l)}>{l==='en'?'English':l==='hy'?'Հայերեն':'Русский'}{lang===l&&<span>✓</span>}</button>)}</div><div className="setting-block"><h3>{t.fileTypes}</h3><p>{t.typeText}</p></div><div className="setting-block"><h3>Web search provider</h3><p>{t.webNotice} Provider integration will be enabled in a later milestone; no fake online results are shown.</p></div><div className="setting-block"><h3>Privacy & index</h3><p>{t.indexHelp} {t.localOnly}</p><div className="setting-actions"><button className="secondary-button" onClick={exportIndex} disabled={!files.length}><Download size={15}/> Export metadata</button><button className="danger-button" onClick={()=>{clearIndex();setShowSettings(false)}} disabled={!files.length}><Trash2 size={15}/> {t.clear}</button></div></div><div className="modal-bottom"><ShieldCheck size={15}/> Local index is stored in this browser only.</div></section></div>}
    {busy&&<div className="busy-pill"><span className="spinner"/> Indexing files…</div>}
  </div>;
}

function excerpt(text: string, terms: string[]) {
  if (!text) return '';
  const lower = text.toLocaleLowerCase();
  let at = -1;
  for (const term of terms) { const i = lower.indexOf(term); if (i>=0 && (at<0 || i<at)) at=i; }
  if (at<0) at=0;
  const start=Math.max(0,at-65), end=Math.min(text.length,at+190);
  return (start>0?'…':'')+text.slice(start,end).replace(/\s+/g,' ').trim()+(end<text.length?'…':'');
}
function iconFor(type: string) {
  if (['png','jpg','jpeg','gif','webp','svg','bmp'].includes(type)) return <FileImage size={18}/>;
  if (['txt','md','markdown','html','htm','pdf','doc','docx'].includes(type)) return <FileText size={18}/>;
  return <File size={18}/>;
}
