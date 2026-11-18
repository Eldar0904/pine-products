import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, Search, FileText, Scale, GraduationCap, Check, Plus, Star, MessageSquare, ChevronDown, X } from 'lucide-react';
import logo from './assets/pine-logo.png';
import { portalSolutions } from './lib/portal-data';
import './landing.css';

const icons = { search: Search, file: FileText, scale: Scale, school: GraduationCap };
const filters = ['Барлығы', 'Сатып алу', 'Коммерция', 'Заң бөлімі', 'Білім беру'];
const draftKey = 'pine-employee-feedback-draft';
const blank = { name: '', department: '', solution: '', rating: 0, message: '' };
function initialDraft() { try { return { ...blank, ...JSON.parse(localStorage.getItem(draftKey) || '{}') }; } catch { return blank; } }

function FeedbackForm() {
  const [draft, setDraft] = useState(initialDraft);
  const [availability, setAvailability] = useState('loading');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/feedback', { signal: controller.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(data => setAvailability(data.configured ? 'ready' : 'offline')).catch(() => { if (!controller.signal.aborted) setAvailability('offline'); });
    return () => controller.abort();
  }, []);
  const update = (field, value) => { setDraft(current => ({ ...current, [field]: value })); setStatus('idle'); };
  const saveDraft = () => { try { localStorage.setItem(draftKey, JSON.stringify(draft)); setStatus('saved'); setError(''); } catch { setError('Осы браузерде сақтау мүмкін болмады.'); } };
  const submit = async event => {
    event.preventDefault(); setError('');
    if (!draft.rating) { setError('Бағаңызды таңдаңыз.'); return; }
    setStatus('sending');
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, requestId }) });
      if (!response.ok) throw new Error('Пікір жіберілмеді. Кейінірек қайталап көріңіз немесе мәтінді осы браузерде сақтаңыз.');
      setStatus('sent'); setDraft(blank); setRequestId(crypto.randomUUID());
      try { localStorage.removeItem(draftKey); } catch { /* The server already saved the feedback. */ }
    } catch (e) { setError(e.message); setStatus('idle'); }
  };
  return <form className="lp-feedback-form" onSubmit={submit}>
    {status === 'sent' ? <div className="lp-thanks" role="status"><Check size={34}/><h3>Пікіріңізге рақмет!</h3><p>Пікіріңіз командаға жіберілді. Ол бұл бетте жарияланбайды.</p><button type="button" onClick={() => setStatus('idle')}>Тағы пікір қалдыру <ArrowRight size={17}/></button></div> : <>
      <div className="lp-form-head"><MessageSquare size={22}/><h3>Тәжірибеңізбен бөлісіңіз</h3></div>
      <div className="lp-form-pair"><label>Атыңыз <span>(міндетті емес)</span><input maxLength={80} value={draft.name} onChange={e => update('name', e.target.value)} autoComplete="name" placeholder="Атыңыз"/></label><label>Бөлім<select value={draft.department} onChange={e => update('department', e.target.value)} required><option value="">Бөлімді таңдаңыз</option>{['B2B', 'Коммерция', 'Оперблок', 'Заң бөлімі', 'Білім беру', 'Басқа'].map(x => <option key={x}>{x}</option>)}</select></label></div>
      <label>Қай құрал туралы?<select required value={draft.solution} onChange={e => update('solution', e.target.value)}><option value="">Құралды таңдаңыз</option>{portalSolutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}<option value="documents">Құжаттар мен презентациялар</option></select></label>
      <fieldset className="lp-rating"><legend>Жұмысыңызға қаншалықты пайдалы?</legend><div role="radiogroup" aria-label="Пайдалылық бағасы">{[1,2,3,4,5].map(n => <button key={n} type="button" role="radio" aria-checked={draft.rating === n} aria-label={`${n} / 5`} onClick={() => update('rating', n)} className={n <= draft.rating ? 'selected' : ''}><Star size={26} fill={n <= draft.rating ? 'currentColor' : 'none'}/></button>)}<span>{draft.rating ? `${draft.rating} / 5` : 'Баға таңдаңыз'}</span></div></fieldset>
      <label>Не көмектесті? Нені жақсартуға болады?<textarea value={draft.message} onChange={e => update('message', e.target.value)} required minLength={10} maxLength={2000} rows={4} placeholder="Нақты мысал немесе ұсыныс жазыңыз…"/></label>
      <p className="lp-form-note">Пікіріңіз құралдарды жақсарту үшін командаға жіберіледі. Жеке немесе құпия құжаттарды қоспаңыз.</p>
      {availability === 'offline' && <p className="lp-form-notice" role="status">Пікір жіберу әзірге қолжетімсіз. Мәтінді осы браузерде сақтап, кейін жіберуге болады.</p>}
      {error && <p className="lp-form-error" role="alert">{error}</p>}
      {status === 'saved' && <p role="status" className="lp-saved">Мәтін тек осы браузерде сақталды. Командаға жіберілген жоқ.</p>}
      <div className="lp-form-actions"><button className="lp-button" disabled={availability !== 'ready' || status === 'sending'} type="submit">{status === 'sending' ? 'Жіберілуде…' : 'Пікірді жіберу'}<ArrowUpRight size={18}/></button><button className="lp-save" type="button" onClick={saveDraft}>Мәтінді сақтау</button></div>
    </>}
  </form>;
}

export default function Landing() {
  const [filter, setFilter] = useState('Барлығы');
  const [query, setQuery] = useState('');
  const [mobile, setMobile] = useState(false);
  const visible = portalSolutions.filter(s => (filter === 'Барлығы' || s.category === filter) && `${s.name} ${s.description} ${s.tags.join(' ')}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  useEffect(() => { document.documentElement.lang = 'kk'; document.title = 'PINE — Күнделікті жұмысқа арналған құралдар'; }, []);
  return <div className="lp">
    <header className="lp-header"><a href="#" className="lp-logo" aria-label="PINE басты бет"><img src={logo} alt="PINE"/><span>digital workspace</span></a><nav className={mobile ? 'lp-nav open' : 'lp-nav'} aria-label="Басты мәзір"><a href="#solutions" onClick={() => setMobile(false)}>Құралдар</a><a href="#teams" onClick={() => setMobile(false)}>Командаларға</a><a href="#feedback" onClick={() => setMobile(false)}>Кері байланыс</a></nav><a className="lp-workspace" href="?workspace=1">ERP жол картасы <ArrowUpRight size={16}/></a><button className="lp-menu" aria-label={mobile ? 'Мәзірді жабу' : 'Мәзірді ашу'} aria-expanded={mobile} onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Plus/>}</button></header>
    <main className="lp-main">
      <section className="lp-hero"><div className="lp-hero-copy"><p className="lp-eyebrow"><span/> PINE КОМАНДАСЫНА АРНАЛҒАН</p><h1>Күнделікті жұмыс.<br/><em>Жаңа мүмкіндіктер.</em></h1><p className="lp-hero-description">Құжат дайындаудан оқытушыларды тіркеуге дейін. Жұмысыңызға қажет цифрлық құралдарды бір жерден табыңыз.</p><div className="lp-hero-actions"><a className="lp-button" href="#solutions">Құралды таңдау <ArrowUpRight size={20}/></a><a className="lp-text-link" href="#feedback">Пікір қалдыру <ArrowRight size={18}/></a></div><div className="lp-hero-bottom"><span>ЖИ көмегімен әзірленген</span><span>Адамның жұмысын қолдау үшін</span></div></div>
      <div className="lp-hero-art" aria-hidden="true"><div className="lp-orbit orbit-one"/><div className="lp-orbit orbit-two"/><div className="lp-art-label">PINE / TOOLS</div><div className="lp-paper"><span className="lp-paper-icon"><FileText size={25}/></span><small>КҮНДЕЛІКТІ ЖҰМЫС</small><h2>Бір міндет.<br/>Қолайлы құрал.</h2><div className="lp-paper-line"/><div className="lp-paper-line short"/><div className="lp-paper-foot"><span>Деректер & құжаттар</span><ArrowUpRight size={23}/></div></div><div className="lp-art-float"><Check size={18}/><span>Келесі іске уақыт</span></div><span className="lp-art-plus">✳</span></div>
    </section>
    <div className="lp-team-strip"><span>ӘР БАҒЫТТЫҢ ӨЗ МІНДЕТІ БАР</span><p>B2B</p><i/><p>Коммерция</p><i/><p>Заң бөлімі</p><i/><p>EduMax</p><i/><p>Оперблок</p></div>
    <section id="solutions" className="lp-solutions"><div className="lp-section-head"><div><p className="lp-eyebrow">ҚҰРАЛДАР КАТАЛОГЫ</p><h2>Бүгін не істейміз?</h2></div><p>Міндетке сай құралды таңдаңыз.<br/>Өз шешіміңізді табыңыз.</p></div><div className="lp-catalog-controls"><div className="lp-filters" aria-label="Бөлім бойынша сүзгі">{filters.map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div><label className="lp-search"><Search size={17}/><input aria-label="Құрал іздеу" value={query} onChange={e => setQuery(e.target.value)} placeholder="Құрал іздеу"/></label></div>
      <div className="lp-cards">{visible.map(s => {const Icon = icons[s.icon]; return <article className="lp-card" key={s.id}><div className={`lp-card-preview ${s.color}`} aria-hidden="true"><span className="lp-preview-number">{s.number}</span><div className="lp-mini-doc"><Icon size={25}/><strong>{s.preview[0]}</strong>{s.preview.slice(1).map(line => <div className="lp-mini-row" key={line}><span/>{line}<Check size={13}/></div>)}</div><span className="lp-preview-corner"><ArrowUpRight size={21}/></span></div><div className="lp-card-body"><p className="lp-card-category">{s.category}</p><h3>{s.name}</h3><p className="lp-card-description">{s.description}</p><div className="lp-tags">{s.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="lp-card-foot">{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">Құралды ашу <ArrowUpRight size={19}/></a> : <span className="lp-link-pending">Сілтеме қосылады <Plus size={16}/></span>}<a href="#feedback" onClick={() => {}} aria-label={`${s.name} туралы пікір`}>Пікір <MessageSquare size={15}/></a></div></div></article>; })}</div>{!visible.length && <div className="lp-empty"><Search/><h3>Құрал табылмады</h3><p>Басқа сөзбен іздеп көріңіз.</p><button onClick={() => {setFilter('Барлығы'); setQuery('');}}>Сүзгіні тазалау</button></div>}
    </section>
    <section id="teams" className="lp-teams"><div><p className="lp-eyebrow">КОМАНДАЛАРҒА ҚОЛДАУ</p><h2>Құралдардан бөлек,<br/><em>күнделікті көмек.</em></h2></div><div className="lp-team-content"><p>B2B, Коммерция және Оперблок үшін құжаттармен жұмыс істеу, материалдарды құрылымдау және презентациялар жасау.</p><a className="lp-text-link" href="#feedback">Қандай көмек қажет екенін жазыңыз <ArrowUpRight size={19}/></a><div className="lp-team-topics"><span>Құжаттар</span><span>Презентациялар</span><span>Материалдарды дайындау</span></div></div></section>
    <section id="feedback" className="lp-feedback"><div className="lp-feedback-copy"><p className="lp-eyebrow">ҚЫЗМЕТКЕРЛЕРДЕН КЕРІ БАЙЛАНЫС</p><h2>Сіздің тәжірибеңіз<br/><em>біз үшін маңызды.</em></h2><p>Қай құрал көмектесті? Қай жерде қиындық болды? Ұсынысыңыз келесі жақсартуға негіз бола алады.</p><div className="lp-feedback-points"><div><span>01</span><p>Қолданған құралды таңдаңыз</p></div><div><span>02</span><p>Тәжірибеңізді бағалаңыз</p></div><div><span>03</span><p>Мысал немесе ұсыныс қалдырыңыз</p></div></div><p className="lp-private"><MessageSquare size={16}/>Пікірлер командаға жеке жіберіледі.</p></div><FeedbackForm/></section>
    <section className="lp-faq"><h2>Қысқа жауаптар</h2>{[['Қай құралдан бастаймын?', 'Каталогтан өз бөліміңізді таңдаңыз немесе іздеу арқылы қажетті құралды табыңыз. Құрал сілтемесі қосылған кезде оны жаңа бетте аша аласыз.'],['Құжаттың соңғы нұсқасын кім тексереді?', 'Дайын құжатты жауапты маман тексереді. Заңдық мазмұнды заңгер мақұлдайды.'],['Пікірім осы бетте жариялана ма?', 'Жоқ. Бұл нысандағы пікір құралдарды жетілдіру үшін командаға арналған. Атыңызды көрсету міндетті емес.']].map(([q,a]) => <details key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}</section>
    </main><footer className="lp-footer"><a href="#" className="lp-footer-brand">PINE<span>Жұмысқа көмектесетін технология.</span></a><a href="?workspace=1">ERP жол картасы <ArrowUpRight size={16}/></a><span>Командамен бірге жақсарамыз.</span></footer>
  </div>;
}
