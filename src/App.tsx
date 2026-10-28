import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { extOf, searchIndexedFiles, type IndexedFile } from './search';
import { extractFileText } from './extract';
import { Search, Globe2, FolderSearch, Files, Settings2, Languages, ArrowUpRight, FileText, FileImage, File, Plus, Trash2, Download, ShieldCheck, Sparkles, ExternalLink, X, Menu, HardDrive, CircleHelp, Palette, Monitor, WandSparkles } from 'lucide-react';

type Lang = 'en' | 'hy' | 'ru';
type WebProvider = 'duckduckgo' | 'google' | 'bing';
const labels: Record<Lang, Record<string, string>> = {
  en: { tagline: 'Find anything. Anywhere.', sub: 'Your files and the web, in one place.', placeholder: 'Search files, folders, documents, or the web…', all: 'All', local: 'Local files', web: 'Web', folders: 'Indexed files', add: 'Add files or folder', indexed: 'Indexed items', privacy: 'Local-first privacy', privacyText: 'Files stay on this device. Nothing is uploaded by local search.', emptyTitle: 'Your search starts here', emptyText: 'Add files to build a private local index, or switch to Web to search online.', recent: 'Recently indexed', clear: 'Clear index', webNotice: 'Web search provider is not configured yet. Local search works now; connect a provider in Settings to enable online results.', localEmpty: 'No local matches', settings: 'Search settings', lang: 'Language', fileTypes: 'Supported now', typeText: 'Text, Markdown, HTML, JSON, CSV, source code, DOCX, and selectable-text PDFs. Scanned PDF OCR and legacy .doc extraction are not included yet.', results: 'results', noText: 'Filename match', source: 'Local index', open: 'Open', choose: 'Choose files', drop: 'Choose files or drop them here', localOnly: 'Your browser only grants access to files you explicitly select.', about: 'About AWESEARCH', indexHelp: 'Index only folders you trust. You can clear this index any time.' },
  hy: { tagline: 'Գտիր ամեն ինչ։ Ամենուր։', sub: 'Քո ֆայլերն ու համացանցը՝ մեկ տեղում։', placeholder: 'Որոնիր ֆայլեր, թղթապանակներ կամ համացանցում…', all: 'Բոլորը', local: 'Տեղային ֆայլեր', web: 'Համացանց', folders: 'Ինդեքսավորված ֆայլեր', add: 'Ավելացնել ֆայլեր կամ պանակ', indexed: 'Ինդեքսավորված տարրեր', privacy: 'Գաղտնիություն՝ առաջին տեղում', privacyText: 'Ֆայլերը մնում են այս սարքում։ Տեղային որոնումը ոչինչ չի վերբեռնում։', emptyTitle: 'Սկսիր որոնումը', emptyText: 'Ավելացրու ֆայլեր՝ անձնական ինդեքս ստեղծելու համար, կամ ընտրիր Համացանց։', recent: 'Վերջին ինդեքսավորվածները', clear: 'Մաքրել ինդեքսը', webNotice: 'Համացանցային որոնման ծառայությունը դեռ կարգավորված չէ։ Տեղային որոնումն աշխատում է։', localEmpty: 'Տեղային արդյունքներ չկան', settings: 'Որոնման կարգավորումներ', lang: 'Լեզու', fileTypes: 'Աջակցվող ձևաչափեր', typeText: 'Տեքստ, Markdown, HTML, JSON, CSV, ծրագրային կոդ, DOCX և ընտրելի տեքստով PDF։ Սկանավորված PDF-ի OCR-ն ու հին .doc ձևաչափը դեռ հասանելի չեն։', results: 'արդյունք', noText: 'Համընկնում է անվան մեջ', source: 'Տեղային ինդեքս', open: 'Բացել', choose: 'Ընտրել ֆայլեր', drop: 'Ընտրիր ֆայլեր կամ գցիր այստեղ', localOnly: 'Բրաուզերը հասանելիություն է տալիս միայն քո ընտրած ֆայլերին։', about: 'AWESEARCH-ի մասին', indexHelp: 'Ինդեքսավորիր միայն վստահելի պանակները։ Կարող ես ցանկացած պահի մաքրել ինդեքսը։' },
  ru: { tagline: 'Найди что угодно. Где угодно.', sub: 'Ваши файлы и интернет — в одном месте.', placeholder: 'Поиск файлов, папок, документов или в интернете…', all: 'Все', local: 'Локальные файлы', web: 'Интернет', folders: 'Проиндексированные файлы', add: 'Добавить файлы или папку', indexed: 'Элементов в индексе', privacy: 'Конфиденциальность прежде всего', privacyText: 'Файлы остаются на устройстве. Локальный поиск ничего не загружает.', emptyTitle: 'Начните поиск', emptyText: 'Добавьте файлы для создания локального индекса или выберите Интернет.', recent: 'Недавно проиндексировано', clear: 'Очистить индекс', webNotice: 'Провайдер веб-поиска ещё не настроен. Локальный поиск уже работает.', localEmpty: 'Совпадений не найдено', settings: 'Настройки поиска', lang: 'Язык', fileTypes: 'Поддерживается сейчас', typeText: 'Текст, Markdown, HTML, JSON, CSV, исходный код, DOCX и PDF с выделяемым текстом. OCR сканов и старый формат .doc пока не поддерживаются.', results: 'результатов', noText: 'Совпадение по имени', source: 'Локальный индекс', open: 'Открыть', choose: 'Выбрать файлы', drop: 'Выберите файлы или перетащите их сюда', localOnly: 'Браузер получает доступ только к выбранным вами файлам.', about: 'О AWESEARCH', indexHelp: 'Индексируйте только доверенные папки. Индекс можно очистить в любой момент.' }
};
const fmtSize = (n: number) => n < 1024 ? n + ' B' : n < 1048576 ? (n/1024).toFixed(1) + ' KB' : (n/1048576).toFixed(1) + ' MB';
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

const INDEX_DB_NAME = 'awesearch-index-db';
function openIndexDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB is unavailable')); return; }
    const request = window.indexedDB.open(INDEX_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('state')) request.result.createObjectStore('state');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local index'));
  });
}
async function writeIndexDb(files: IndexedFile[]): Promise<void> {
  const db = await openIndexDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('state', 'readwrite');
    transaction.objectStore('state').put(files, 'files');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save local index'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Local index save was cancelled'));
  }).finally(() => db.close());
}
async function readSavedIndex(): Promise<IndexedFile[]> {
  try {
    const db = await openIndexDb();
    const saved = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction('state', 'readonly').objectStore('state').get('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not read local index'));
    }).finally(() => db.close());
    if (Array.isArray(saved)) return saved as IndexedFile[];
  } catch { /* Fall back to the previous localStorage index or an empty index. */ }
  const raw = localStorage.getItem('awesearch-index-v1');
  if (!raw) return [];
  const migrated = JSON.parse(raw) as IndexedFile[];
  try { await writeIndexDb(migrated); } catch { /* The fallback remains usable. */ }
  return migrated;
}
async function saveIndex(files: IndexedFile[]): Promise<void> {
  try {
    await writeIndexDb(files);
    try { localStorage.removeItem('awesearch-index-v1'); } catch { /* Optional cleanup only. */ }
  } catch {
    localStorage.setItem('awesearch-index-v1', JSON.stringify(files));
  }
}


export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  type Theme = 'auto' | 'glass' | 'aurora' | 'midnight' | 'light' | 'minimal';
  const [theme, setTheme] = useState<Theme>('auto');
  const [motion, setMotion] = useState(true);
  const [glow, setGlow] = useState(true);
  const [webProvider, setWebProvider] = useState<WebProvider>('duckduckgo');
  const [previewFile, setPreviewFile] = useState<IndexedFile | null>(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'all'|'local'|'web'>('all');
  const [files, setFiles] = useState<IndexedFile[]>([]);
  const [indexReady, setIndexReady] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const t = labels[lang];

  useEffect(() => {
    let active = true;
    void readSavedIndex().then(saved => { if (active) setFiles(saved); }).catch(() => {
      if (active) setNotice('Could not restore the local index. You can start a new one.');
    }).finally(() => { if (active) setIndexReady(true); });
    try {
      const savedProvider = localStorage.getItem('awesearch-web-provider');
      if (savedProvider === 'duckduckgo' || savedProvider === 'google' || savedProvider === 'bing') setWebProvider(savedProvider);
      const savedLang = localStorage.getItem('awesearch-lang');
      if (savedLang === 'en' || savedLang === 'hy' || savedLang === 'ru') setLang(savedLang);
      const savedTheme = localStorage.getItem('awesearch-theme');
      if (savedTheme === 'auto' || savedTheme === 'glass' || savedTheme === 'aurora' || savedTheme === 'midnight' || savedTheme === 'light' || savedTheme === 'minimal') setTheme(savedTheme);
      const savedMotion = localStorage.getItem('awesearch-motion');
      if (savedMotion !== null) setMotion(savedMotion === 'true');
      const savedGlow = localStorage.getItem('awesearch-glow');
      if (savedGlow !== null) setGlow(savedGlow === 'true');
    } catch { /* Corrupt browser storage is safely ignored. */ }
    setSettingsReady(true);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!indexReady) return;
    void saveIndex(files).catch(() => setNotice('Browser storage is unavailable. Export the index to avoid losing this session.'));
  }, [files, indexReady]);
  useEffect(() => { document.documentElement.lang = lang; if (!settingsReady) return; try { localStorage.setItem('awesearch-lang', lang); } catch { /* Session-only fallback. */ } }, [lang, settingsReady]);
  useEffect(() => { if (!settingsReady) return; try { localStorage.setItem('awesearch-web-provider', webProvider); } catch { /* Session-only fallback. */ } }, [webProvider, settingsReady]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    document.documentElement.dataset.glow = glow ? 'on' : 'off';
    if (!settingsReady) return;
    try { localStorage.setItem('awesearch-theme', theme); localStorage.setItem('awesearch-motion', String(motion)); localStorage.setItem('awesearch-glow', String(glow)); } catch { /* Preferences remain usable for this session. */ }
  }, [theme, motion, glow, settingsReady]);

  const results = useMemo(() => searchIndexedFiles(files, query), [files, query]);
  const shownResults = mode === 'web' ? [] : results;
  const addFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    if (!chosen.length) return;
    setBusy(true); setNotice('');
    const indexed: IndexedFile[] = [];
    const extractionWarnings: string[] = [];
    for (const file of chosen) {
      const path = (file as File & {webkitRelativePath?: string}).webkitRelativePath || file.name;
      const extracted = await extractFileText(file);
      if (extracted.warning) extractionWarnings.push(file.name + ': ' + extracted.warning);
      indexed.push({ id: path + ':' + file.size + ':' + file.lastModified, name: file.name, path, size: file.size, modified: file.lastModified, type: extOf(file.name) || 'file', text: extracted.text });
    }
    setFiles(old => {
      const byId = new Map(old.map(f => [f.id, f]));
      indexed.forEach(f => byId.set(f.id, f));
      return [...byId.values()].sort((a,b) => b.modified-a.modified);
    });
    setBusy(false);
    setNotice('Indexed ' + indexed.length + ' file(s). Selectable-text PDFs and DOCX text are supported; scanned PDFs and legacy .doc files may only be indexed by name. ' + t.localOnly + (extractionWarnings.length ? ' Notes: ' + extractionWarnings.join(' ') : ''));
    event.target.value = '';
  };
  const clearIndex = () => { setFiles([]); setNotice('Local index cleared.'); };
  const openFolderPicker = () => { if (!folderRef.current) return; folderRef.current.setAttribute('webkitdirectory', ''); folderRef.current.click(); };
  const runWebSearch = () => {
    const term = query.trim();
    if (!term) { setNotice('Enter a search phrase first.'); return; }
    const destinations: Record<WebProvider, string> = { duckduckgo: 'https://duckduckgo.com/?q=', google: 'https://www.google.com/search?q=', bing: 'https://www.bing.com/search?q=' };
    window.open(destinations[webProvider] + encodeURIComponent(term), '_blank', 'noopener,noreferrer');
    setNotice('Web search opened in a new tab. Your local file index was not sent.');
  };
  const exportIndex = () => {
    const blob = new Blob([JSON.stringify(files.map(({text, ...rest}) => rest), null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='awesearch-index.json'; a.click(); URL.revokeObjectURL(url);
  };
  const openFile = (f: IndexedFile) => { setPreviewFile(f); };

  return <div className="app-shell">
    <aside className={'sidebar ' + (sidebarOpen ? 'sidebar-open' : '')}>
      <div className="brand"><div className="brand-mark"><Search size={21}/></div><div><b>AWESEARCH</b><span>SEARCH WORKSPACE</span></div><button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <button className={'nav-item '+(mode==='all'?'active':'')} onClick={()=>{setMode('all');setSidebarOpen(false)}}><Search size={18}/>{t.all}<span className="nav-count">{files.length}</span></button>
      <button className={'nav-item '+(mode==='local'?'active':'')} onClick={()=>{setMode('local');setSidebarOpen(false)}}><HardDrive size={18}/>{t.local}</button>
      <button className={'nav-item '+(mode==='web'?'active':'')} onClick={()=>{setMode('web');setSidebarOpen(false)}}><Globe2 size={18}/>{t.web}<span className="soon">SETUP</span></button>
      <div className="side-divider"/>
      <div className="side-label">YOUR WORKSPACE</div>
      <button className="nav-item" onClick={()=>fileRef.current?.click()}><Files size={18}/>Add files</button>
      <button className="nav-item" onClick={openFolderPicker}><FolderSearch size={18}/>Index a folder</button>
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
        <div className="search-wrap"><Search size={21} className="search-icon"/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && mode==='web')runWebSearch();if(e.key==='Escape')setQuery('')}} placeholder={t.placeholder} aria-label="Search"/>{query && <button className="clear-query" onClick={()=>setQuery('')} aria-label="Clear search"><X size={16}/></button>}<kbd>ENTER</kbd></div>
        <div className="search-modes"><button className={mode==='all'?'selected':''} onClick={()=>setMode('all')}><Search size={15}/>{t.all}</button><button className={mode==='local'?'selected':''} onClick={()=>setMode('local')}><Files size={15}/>{t.local}</button><button className={mode==='web'?'selected':''} onClick={()=>{setMode('web');setNotice('Choose a provider in Settings, then search the open web.')}}><Globe2 size={15}/>{t.web}</button></div>
      </section>
      <section className="content-area">
        {notice && <div className="notice"><ShieldCheck size={17}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
        {mode !== 'web' && !query.trim() ? <div className="welcome-grid">
          <div className="welcome-card primary-card"><div className="card-icon"><FolderSearch size={23}/></div><div className="card-tag">PRIVATE BY DESIGN</div><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><div className="hero-buttons"><button className="primary-button" onClick={()=>fileRef.current?.click()}><Plus size={17}/>Add files</button><button className="secondary-button" onClick={openFolderPicker}><FolderSearch size={15}/>Index folder</button></div><div className="card-decoration"><Search size={92}/></div></div>
          <div className="stat-card"><div className="stat-icon"><Files size={19}/></div><span>{t.indexed}</span><strong>{files.length.toLocaleString()}</strong><small>Saved in this browser</small><div className="stat-bottom"><span className="status-dot"/>{files.length ? 'INDEX ACTIVE' : 'READY TO INDEX'}</div></div>
          <div className="feature-card"><div className="feature-head"><div className="feature-icon"><ShieldCheck size={19}/></div><span>LOCAL-FIRST</span></div><h3>{t.privacy}</h3><p>{t.privacyText}</p><div className="feature-line"/><p className="muted">{t.indexHelp}</p></div>
          <div className="feature-card"><div className="feature-head"><div className="feature-icon blue"><Globe2 size={19}/></div><span>WEB DISCOVERY</span></div><h3>Local + global</h3><p>{t.webNotice}</p><button className="text-button" onClick={()=>setShowSettings(true)}>Configure search <ArrowUpRight size={15}/></button></div>
          <div className="recent-card"><div className="section-heading"><div><h3>{t.recent}</h3><p>Your local index at a glance</p></div>{files.length>0&&<button className="text-button" onClick={exportIndex}><Download size={15}/> Export</button>}</div>
            {files.slice(0,5).map(f=><div className="recent-row" key={f.id}><div className="file-icon">{iconFor(f.type)}</div><div className="file-details"><b>{f.name}</b><span>{f.path}</span></div><small>{fmtSize(f.size)}</small></div>)}
            {files.length===0&&<div className="empty-recent"><Files size={22}/><span>No files indexed yet</span><button onClick={()=>fileRef.current?.click()}>{t.choose}</button></div>}
          </div>
        </div> : <div className="results-panel">
          <div className="results-heading"><div><h2>{mode==='web'?'Web discovery':t.local}</h2><p>{mode==='web' ? t.webNotice : shownResults.length+' '+t.results}</p></div>{mode!=='web'&&<button className="text-button" onClick={()=>fileRef.current?.click()}><Plus size={15}/>{t.add}</button>}</div>
          {mode==='web' ? <div className="web-placeholder"><Globe2 size={30}/><h3>Search the open web</h3><p>Search with your chosen provider. Results open in a new tab; your local files are never sent.</p><div className="web-provider-badge">Selected provider: <b>{webProvider==='duckduckgo'?'DuckDuckGo':webProvider==='google'?'Google':'Bing'}</b></div><button className="primary-button" onClick={runWebSearch} disabled={!query.trim()}><Search size={16}/> Search the web</button><button className="secondary-button" onClick={()=>setShowSettings(true)}><Settings2 size={16}/> Change provider</button></div> : shownResults.length===0 ? <div className="empty-results"><Search size={28}/><h3>{t.localEmpty}</h3><p>{files.length===0?'Add files first to build your local search index.':'Try different words or a shorter phrase.'}</p><button className="primary-button" onClick={()=>fileRef.current?.click()}><Plus size={16}/>{t.add}</button></div> : shownResults.map(f=><article className="result-row" key={f.id}><div className="file-icon large">{iconFor(f.type)}</div><div className="result-main"><div className="result-meta"><span>{t.source}</span><span>·</span><span>{f.type.toUpperCase()}</span><span>·</span><span>{fmtSize(f.size)}</span></div><h3>{f.name}</h3><p className="result-path">{f.path}</p><p className="result-excerpt">{f.excerpt || t.noText}</p><button className="text-button" onClick={()=>openFile(f)}>{t.open}<ExternalLink size={14}/></button></div></article>)}
        </div>}
      </section>
      <footer><span>© AWESEARCH · AWE ECOSYSTEM</span><span><ShieldCheck size={13}/> PRIVATE BY DEFAULT</span><button onClick={()=>setShowSettings(true)}><CircleHelp size={14}/> Help & settings</button></footer>
    </main>
    <input ref={fileRef} className="hidden-input" type="file" multiple onChange={addFiles} />
    <input ref={folderRef} className="hidden-input" type="file" multiple onChange={addFiles} />
    {showSettings&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowSettings(false)}}><section className="settings-modal"><div className="modal-title"><div><span className="eyebrow">AWESEARCH</span><h2>{t.settings}</h2></div><button className="icon-button" onClick={()=>setShowSettings(false)} aria-label="Close"><X size={19}/></button></div><label className="setting-label">{t.lang}</label><div className="language-options">{(['en','hy','ru'] as Lang[]).map(l=><button className={lang===l?'chosen':''} key={l} onClick={()=>setLang(l)}>{l==='en'?'English':l==='hy'?'Հայերեն':'Русский'}{lang===l&&<span>✓</span>}</button>)}</div><div className="setting-block appearance-block"><div className="appearance-heading"><div><h3><Palette size={15}/> Appearance & effects</h3><p>Choose your own look. Auto adapts to your device and prefers a comfortable, responsive layout.</p></div></div><div className="theme-grid">{([['auto','Device adaptive','Smart default'],['glass','Glass','Frosted panels'],['aurora','Aurora','Colorful glow'],['midnight','Midnight','Deep dark'],['light','Light','Bright & clean'],['minimal','Minimal','Quiet & fast']] as [Theme,string,string][]).map(([value,title,description])=><button key={value} className={'theme-option theme-'+value+(theme===value?' chosen':'')} onClick={()=>setTheme(value)} aria-pressed={theme===value}><span className="theme-preview"><i/><i/><i/></span><span className="theme-copy"><b>{title}</b><small>{description}</small></span>{theme===value&&<span className="theme-check">✓</span>}</button>)}</div><div className="effect-toggles"><label className="toggle-row"><span><WandSparkles size={16}/><span><b>Motion & transitions</b><small>Subtle, smooth interface animations</small></span></span><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/></label><label className="toggle-row"><span><Sparkles size={16}/><span><b>Glow & ambient effects</b><small>Soft light, gradients and glass highlights</small></span></span><input type="checkbox" checked={glow} onChange={e=>setGlow(e.target.checked)}/></label></div><div className="appearance-foot"><Monitor size={14}/> Saved on this device · You can change this any time</div></div><div className="setting-block"><h3>{t.fileTypes}</h3><p>{t.typeText}</p></div><div className="setting-block"><h3>Web search provider</h3><p>Choose where web searches open. Search terms are sent to the provider only when you choose to search.</p><div className="provider-options">{([['duckduckgo','DuckDuckGo','Privacy-focused'],['google','Google','Broad web index'],['bing','Bing','Microsoft search']] as [WebProvider,string,string][]).map(([value,title,description])=><button key={value} className={webProvider===value?'chosen':''} onClick={()=>setWebProvider(value)} aria-pressed={webProvider===value}><b>{title}</b><small>{description}</small>{webProvider===value&&<span>✓</span>}</button>)}</div></div><div className="setting-block"><h3>Privacy & index</h3><p>{t.indexHelp} {t.localOnly}</p><div className="setting-actions"><button className="secondary-button" onClick={exportIndex} disabled={!files.length}><Download size={15}/> Export metadata</button><button className="danger-button" onClick={()=>{clearIndex();setShowSettings(false)}} disabled={!files.length}><Trash2 size={15}/> {t.clear}</button></div></div><div className="modal-bottom"><ShieldCheck size={15}/> Local index is stored in this browser only.</div></section></div>}
    {previewFile&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPreviewFile(null)}}><section className="settings-modal preview-modal"><div className="modal-title"><div><span className="eyebrow">LOCAL FILE PREVIEW</span><h2>{previewFile.name}</h2></div><button className="icon-button" onClick={()=>setPreviewFile(null)} aria-label="Close preview"><X size={19}/></button></div><p className="result-path">{previewFile.path} · {fmtSize(previewFile.size)} · {previewFile.type.toUpperCase()}</p>{previewFile.text?<pre className="file-preview-content">{previewFile.text}</pre>:<div className="web-placeholder"><FileText size={28}/><h3>Preview unavailable</h3><p>This file has no extracted text in the local index. It may be a scanned PDF, an unsupported format, or a file that exceeded the extraction limits.</p><button className="secondary-button" onClick={()=>{setPreviewFile(null);fileRef.current?.click()}}>Select the file again</button></div>}<div className="setting-actions"><button className="danger-button" onClick={()=>{setFiles(old=>old.filter(f=>f.id!==previewFile.id));setPreviewFile(null);setNotice('Removed from the local index.')}}><Trash2 size={15}/> Remove from index</button><button className="secondary-button" onClick={()=>setPreviewFile(null)}>Close</button></div></section></div>}
    {busy&&<div className="busy-pill"><span className="spinner"/> Indexing files…</div>}
  </div>;
}

function iconFor(type: string) {
  if (['png','jpg','jpeg','gif','webp','svg','bmp'].includes(type)) return <FileImage size={18}/>;
  if (['txt','md','markdown','html','htm','pdf','doc','docx'].includes(type)) return <FileText size={18}/>;
  return <File size={18}/>;
}
