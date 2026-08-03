import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowRight, Bell, Boxes, ChevronDown, CircleAlert, Clock3,
  FileText, LayoutDashboard, Menu, Plus, Server, ShieldCheck,
  Pencil, Sparkles, Users, X
} from 'lucide-react';
import './styles.css';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { loadSolutions, saveRemoteSolution } from './lib/hub-data';
import {
  LanguageContext,
  canonicalLabel,
  createTranslator,
  formatCountLabel,
  formatDisplayValue,
  useLang,
} from './lib/i18n';

const seedSolutions = [
  { id: 'offer-generator', name: 'Commercial Offer Generator', department: 'Procurement', stage: 'Live', health: 'Healthy', value: '28 hrs', detail: '86 completed offers this month', accent: 'teal', owner: 'Eldar Pine', purpose: 'Generate consistent commercial offers from approved procurement data.', businessCase: 'Reduce repeated formatting work and improve offer turnaround time.', nextStep: 'Validate the monthly time-saving baseline with Procurement.', roadmapStage: 'Measuring outcome', targetDate: '2026-08-09', blocker: '', aiOpportunity: 'Draft offer summary from structured data after human review.' },
  { id: 'agreement-generator', name: 'Agreement Generator', department: 'Legal', stage: 'Live', health: 'Healthy', value: '14 hrs', detail: '41 agreements generated this month', accent: 'blue', owner: 'Eldar Pine', purpose: 'Create agreements from approved templates and structured inputs.', businessCase: 'Reduce manual document preparation while preserving legal review.', nextStep: 'Review the latest Legal template update.', roadmapStage: 'Live', targetDate: '2026-08-02', blocker: 'Waiting for the latest approved Legal template.', aiOpportunity: 'Assist with clause comparison; keep final legal approval human-led.' },
  { id: 'catalog-matcher', name: 'Catalog Matcher', department: 'Procurement', stage: 'Building', health: 'Attention', value: 'Pilot', detail: 'Matching rules being validated', accent: 'amber', owner: 'Eldar Pine', purpose: 'Match fitout item lists against supplier catalogues and identify the best available options.', businessCase: 'Reduce the time spent searching, comparing and validating supplier products.', nextStep: 'Validate matching rules with Procurement.', roadmapStage: 'Building', targetDate: '2026-08-16', blocker: 'Representative supplier catalogues are still being validated.', aiOpportunity: 'Recommend candidate matches after sufficient reviewed examples exist.' },
  { id: 'edumax-administration', name: 'EduMax Administration', department: 'Academic', stage: 'Live', health: 'Healthy', value: '—', detail: 'Outcome baseline due in August', accent: 'violet', owner: 'Eldar Pine', purpose: 'Support academic administration workflows in one focused workspace.', businessCase: 'Reduce fragmented manual coordination for the Academic team.', nextStep: 'Record the manual baseline and schedule an outcome review.', roadmapStage: 'Measuring outcome', targetDate: '2026-08-23', blocker: '', aiOpportunity: 'No AI scope planned until the baseline is measured.' }
];

const workItems = [
  { title: 'Validate matching rules with Procurement', solution: 'Catalog Matcher', status: 'In progress', due: '02 Aug', tone: 'amber' },
  { title: 'Record manual baseline for EduMax', solution: 'EduMax Administration', status: 'Planned', due: '05 Aug', tone: 'slate' },
  { title: 'Review Legal template update', solution: 'Agreement Generator', status: 'Needs review', due: 'Today', tone: 'teal' }
];

const seedSubscriptions = [
  { id: 'vercel', provider: 'Vercel', category: 'Hosting', renewal: '2026-08-15', owner: 'Eldar Pine', status: 'Review due', solutions: 'PINE Workflows, PINE Orbit', detail: 'Production hosting and deployment.' },
  { id: 'supabase', provider: 'Supabase', category: 'Database & Auth', renewal: 'Free plan', owner: 'Eldar Pine', status: 'Healthy', solutions: 'PINE Product Hub', detail: 'PostgreSQL database and future authentication.' },
  { id: 'railway', provider: 'Railway', category: 'Hosting', renewal: 'Monthly', owner: 'Eldar Pine', status: 'Healthy', solutions: 'OperBlock', detail: 'Application hosting for OperBlock.' },
  { id: 'openai', provider: 'OpenAI', category: 'AI services', renewal: 'Usage based', owner: 'Eldar Pine', status: 'Healthy', solutions: 'Future AI products', detail: 'AI capability for approved PINE automation products.' }
];

const seedTechnicalProfiles = [
  { id: 'ops-offer', solutionId: 'offer-generator', hosting: 'Vercel', repository: 'Not linked', database: 'Supabase', supportOwner: 'Eldar Pine', runbook: 'Document generation support notes pending', risk: 'No current risk', health: 'Healthy' },
  { id: 'ops-agreement', solutionId: 'agreement-generator', hosting: 'Netlify', repository: 'Not linked', database: 'Supabase', supportOwner: 'Eldar Pine', runbook: 'Legal template update process', risk: 'Template approval dependency', health: 'Attention' },
  { id: 'ops-catalog', solutionId: 'catalog-matcher', hosting: 'Vercel', repository: 'Not linked', database: 'Supabase', supportOwner: 'Eldar Pine', runbook: 'Supplier catalogue validation guide', risk: 'Supplier catalogue format variations', health: 'Attention' },
  { id: 'ops-edumax', solutionId: 'edumax-administration', hosting: 'Netlify', repository: 'Not linked', database: 'Not recorded', supportOwner: 'Eldar Pine', runbook: 'Academic administration support notes', risk: 'No current risk', health: 'Healthy' }
];

const normaliseSolutions = (items) => items.map((item, index) => {
  const id = item.id || `seed-${index}-${item.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
  const seed = seedSolutions.find((candidate) => candidate.id === id || candidate.name === item.name);
  const merged = { ...seed, ...item, id };
  return {
    ...merged,
    stage: canonicalLabel(merged.stage) || merged.stage,
    health: canonicalLabel(merged.health) || merged.health,
    roadmapStage: canonicalLabel(merged.roadmapStage) || merged.roadmapStage || 'Discovery',
  };
});
const normaliseSubscriptions = (items) => items.map((item, index) => ({
  ...item,
  id: item.id || `subscription-${index}-${item.provider.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
  status: canonicalLabel(item.status) || item.status,
  category: canonicalLabel(item.category) || item.category,
}));
const normaliseProfiles = (items) => items.map((item, index) => ({
  ...item,
  id: item.id || `profile-${index}-${item.solutionId}`,
  health: canonicalLabel(item.health) || item.health,
}));

const developmentMode = import.meta.env.VITE_APP_MODE !== 'production';

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('pine-product-hub-language') || 'ru');
  const [view, setView] = useState(() => localStorage.getItem('pine-product-hub-view') || 'executive');
  const [section, setSection] = useState('Overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auth, setAuth] = useState({ state: developmentMode || !isSupabaseConfigured ? 'demo' : 'loading', role: 'admin', email: '' });
  const [saveError, setSaveError] = useState('');
  const [solutions, setSolutions] = useState(() => {
    try { return normaliseSolutions(JSON.parse(localStorage.getItem('pine-product-hub-solutions')) || seedSolutions); }
    catch { return seedSolutions; }
  });
  const [editingSolution, setEditingSolution] = useState(null);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [subscriptions, setSubscriptions] = useState(() => {
    try { return normaliseSubscriptions(JSON.parse(localStorage.getItem('pine-product-hub-subscriptions')) || seedSubscriptions); }
    catch { return seedSubscriptions; }
  });
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [technicalProfiles, setTechnicalProfiles] = useState(() => {
    try { return normaliseProfiles(JSON.parse(localStorage.getItem('pine-product-hub-technical-profiles')) || seedTechnicalProfiles); }
    catch { return seedTechnicalProfiles; }
  });
  const [editingProfile, setEditingProfile] = useState(null);
  const t = useMemo(() => createTranslator(language), [language]);
  const isExecutive = view === 'executive' || auth.role === 'executive';
  const nav = isExecutive
    ? ['Executive overview', 'Roadmap']
    : ['Overview', 'Roadmap', 'Operations', 'Subscriptions'];
  const activeName = section === 'Executive overview' ? 'Overview' : section;

  useEffect(() => localStorage.setItem('pine-product-hub-solutions', JSON.stringify(solutions)), [solutions]);
  useEffect(() => localStorage.setItem('pine-product-hub-subscriptions', JSON.stringify(subscriptions)), [subscriptions]);
  useEffect(() => localStorage.setItem('pine-product-hub-technical-profiles', JSON.stringify(technicalProfiles)), [technicalProfiles]);
  useEffect(() => localStorage.setItem('pine-product-hub-view', view), [view]);
  useEffect(() => {
    localStorage.setItem('pine-product-hub-language', language);
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => { if (selectedSolution) window.scrollTo({ top: 0, behavior: 'smooth' }); }, [selectedSolution]);
  useEffect(() => {
    if (developmentMode || !isSupabaseConfigured) return undefined;
    const resolveSession = async (session) => {
      if (!session?.user) { setAuth({ state: 'signed_out', role: '', email: '' }); return; }
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).limit(1);
      if (error) { setAuth({ state: 'error', role: '', email: '', message: error.message }); return; }
      if (!data?.length) { setAuth({ state: 'waiting', role: '', email: session.user.email || '' }); return; }
      const role = data[0].role;
      setAuth({ state: 'ready', role, email: session.user.email || '' });
      setView(role === 'executive' ? 'executive' : 'admin');
      setSection(role === 'executive' ? 'Executive overview' : 'Overview');
      try { setSolutions(await loadSolutions()); } catch (loadError) { setSaveError(loadError.message); }
    };
    supabase.auth.getSession().then(({ data }) => resolveSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => resolveSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  const saveSolution = async (solution) => {
    setSaveError('');
    try {
      if (!developmentMode && isSupabaseConfigured) await saveRemoteSolution(solution);
      setSolutions(current => current.some(item => item.id === solution.id)
        ? current.map(item => item.id === solution.id ? solution : item)
        : [...current, solution]);
      setSelectedSolution(current => current?.id === solution.id ? solution : current);
      setEditingSolution(null);
    } catch (error) { setSaveError(error.message || 'The Solution could not be saved.'); }
  };
  const createSolution = () => setEditingSolution({
    id: crypto.randomUUID(), name: '', department: 'Procurement', stage: 'Building', health: 'Attention', value: 'Baseline', detail: 'Describe the current status', accent: 'teal', owner: 'Eldar Pine', purpose: '', businessCase: '', nextStep: '', roadmapStage: 'Discovery', targetDate: '', blocker: '', aiOpportunity: ''
  });
  const saveSubscription = (subscription) => {
    setSubscriptions(current => current.some(item => item.id === subscription.id)
      ? current.map(item => item.id === subscription.id ? subscription : item)
      : [...current, subscription]);
    setEditingSubscription(null);
  };
  const createSubscription = () => setEditingSubscription({
    id: crypto.randomUUID(), provider: '', category: 'Hosting', renewal: '', owner: 'Eldar Pine', status: 'Healthy', solutions: '', detail: ''
  });
  const saveProfile = (profile) => {
    setTechnicalProfiles(current => current.some(item => item.id === profile.id)
      ? current.map(item => item.id === profile.id ? profile : item)
      : [...current, profile]);
    setEditingProfile(null);
  };

  if (auth.state === 'loading') return <LanguageContext.Provider value={{ language, t }}><LoadingScreen/></LanguageContext.Provider>;
  if (auth.state === 'signed_out') return <LanguageContext.Provider value={{ language, t }}><SignInScreen/></LanguageContext.Provider>;
  if (auth.state === 'waiting') return <LanguageContext.Provider value={{ language, t }}><AccessWaitingScreen email={auth.email}/></LanguageContext.Provider>;
  if (auth.state === 'error') return <LanguageContext.Provider value={{ language, t }}><MessageScreen title={t('Unable to verify access')} message={auth.message}/></LanguageContext.Provider>;

  return <LanguageContext.Provider value={{ language, t }}>
    <div className="app-shell">
      <aside className={mobileOpen ? 'sidebar sidebar--open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">P</div>
          <div><strong>PINE</strong><span>Product Hub</span></div>
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label={t('Close navigation')}><X size={18}/></button>
        </div>
        <nav>
          <p className="nav-label">{t(isExecutive ? 'Portfolio' : 'Workspace')}</p>
          {nav.map(item => <button key={item} onClick={() => { setSelectedSolution(null); setSection(item); setMobileOpen(false); }} className={activeName === (item === 'Executive overview' ? 'Overview' : item) ? 'nav-item active' : 'nav-item'}>
            {item.includes('overview') || item === 'Overview' ? <LayoutDashboard size={18}/> : item === 'Solutions' ? <Boxes size={18}/> : item === 'Roadmap' ? <Sparkles size={18}/> : item === 'Operations' ? <Activity size={18}/> : item === 'Subscriptions' ? <Server size={18}/> : item === 'Department impact' ? <Users size={18}/> : <CircleAlert size={18}/>}<span>{t(item)}</span>
          </button>)}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar">EP</div>
          <div><strong>Eldar Pine</strong><span>{t(isExecutive ? 'Executive access' : 'Administrator')}</span></div>
          <ChevronDown size={16}/>
        </div>
      </aside>
      {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label={t('Close navigation')}/>}

      <main>
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label={t('Open navigation')}><Menu size={20}/></button>
          <div className="breadcrumb"><span>PINE / PRODUCT HUB</span><b>/</b><strong>{selectedSolution ? selectedSolution.name.toUpperCase() : t(isExecutive ? 'EXECUTIVE VIEW' : 'WORKING VIEW')}</strong></div>
          <div className="topbar-actions">
            {auth.role === 'admin' && <button className="view-switch" onClick={() => { setView(isExecutive ? 'admin' : 'executive'); setSection(isExecutive ? 'Overview' : 'Executive overview'); }}><span className="switch-dot"></span>{t(isExecutive ? 'Switch to Working View' : 'Switch to Executive View')}</button>}
            <button className="language-switch" onClick={() => setLanguage((current) => current === 'ru' ? 'en' : 'ru')} aria-label={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}>{language === 'ru' ? 'EN' : 'RU'}</button><button className="icon-button"><Bell size={18}/><i></i></button>
          </div>
        </header>

        <div className="page-content">
          {selectedSolution ? <SolutionDetail solution={selectedSolution} onBack={() => setSelectedSolution(null)} onEdit={setEditingSolution} /> : <>
          {!['Subscriptions', 'Roadmap', 'Operations'].includes(section) && <section className="page-intro">
            <div>
              <p className="eyebrow">{t(isExecutive ? 'Portfolio health · July 2026' : 'Monday, 30 July')}</p>
              <h1>{t(isExecutive ? 'A clear view of product value.' : 'Good morning, Eldar.')}</h1>
              <p>{t(isExecutive ? 'A concise view of the internal solutions serving PINE teams.' : 'Your automation portfolio is stable. Two items need attention this week.')}</p>
            </div>
            {!isExecutive && <button className="primary-button" onClick={createSolution}><Plus size={18}/> {t('Add solution')}</button>}
          </section>}

          {!['Subscriptions', 'Roadmap', 'Operations'].includes(section) && <section className="metrics-grid">
            <Metric label={t(isExecutive ? 'Validated value delivered' : 'Active solutions')} value={isExecutive ? formatDisplayValue(`${solutions.reduce((total, item) => total + (Number.parseInt(item.value, 10) || 0), 0)} hrs`, t) : '4'} sub={t(isExecutive ? 'measured time saved per month' : '2 live · 1 building · 1 needs baseline')} icon={<Clock3 size={19}/>} />
            <Metric label={t(isExecutive ? 'Solutions healthy' : 'Successful runs')} value={isExecutive ? (solutions.filter((item) => item.health === 'Healthy').length + ' / ' + solutions.length) : '127'} sub={t(isExecutive ? 'portfolio health signal' : '98% success rate this month')} icon={<ShieldCheck size={19}/>} />
            <Metric label={t(isExecutive ? 'Decision needed' : 'Needs attention')} value={isExecutive ? solutions.filter((item) => item.health !== 'Healthy').length : '2'} sub={t(isExecutive ? 'products require a decision or baseline' : 'Catalog Matcher · EduMax baseline')} icon={<CircleAlert size={19}/>} tone="attention" />
            <Metric label={t(isExecutive ? 'Live products' : 'Renewal watch')} value={isExecutive ? solutions.filter((item) => item.stage === 'Live').length : '1'} sub={t(isExecutive ? 'currently serving departments' : 'Operational review due in 16 days')} icon={<Server size={19}/>} />
          </section>}

          {saveError && <div className="error-banner"><CircleAlert size={16}/>{saveError}</div>}
          {section === 'Roadmap'
            ? <RoadmapBoard solutions={solutions} onOpen={setSelectedSolution} onEdit={setEditingSolution}/>
            : isExecutive
              ? <ExecutiveContent solutions={solutions} onEdit={setEditingSolution} onOpen={setSelectedSolution} />
              : <AdminContent section={section} solutions={solutions} subscriptions={subscriptions} technicalProfiles={technicalProfiles} onEdit={setEditingSolution} onCreate={createSolution} onOpen={setSelectedSolution} onEditSubscription={setEditingSubscription} onCreateSubscription={createSubscription} onEditProfile={setEditingProfile}/>}
          </>}
        </div>
      </main>
      {editingSolution && <SolutionEditor solution={editingSolution} onClose={() => setEditingSolution(null)} onSave={saveSolution}/>}
      {editingSubscription && <SubscriptionEditor subscription={editingSubscription} onClose={() => setEditingSubscription(null)} onSave={saveSubscription}/>}
      {editingProfile && <TechnicalProfileEditor profile={editingProfile} solutions={solutions} onClose={() => setEditingProfile(null)} onSave={saveProfile}/>}
    </div>
  </LanguageContext.Provider>;
}

function LoadingScreen() {
  const { t } = useLang();
  return <MessageScreen title={t('Connecting to PINE Product Hub')} message={t('Checking your secure workspace access…')}/>;
}
function AccessWaitingScreen({ email }) {
  const { t } = useLang();
  return <MessageScreen title={t('Access is awaiting approval')} message={`${email || 'This account'}: ${t('This account has signed in, but an Admin has not assigned it a Product Hub role yet.')}`}/>;
}
function MessageScreen({ title, message }) {
  return <main className="access-screen"><div className="access-card"><div className="brand-mark">P</div><p className="eyebrow">PINE Product Hub</p><h1>{title}</h1><p>{message}</p></div></main>;
}
function SignInScreen() {
  const { t } = useLang();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); const { error: signInError } = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (signInError) setError(signInError.message); };
  return <main className="access-screen"><section className="access-card"><div className="brand-mark">P</div><p className="eyebrow">PINE Product Hub</p><h1>{t('Sign in to your workspace.')}</h1><p>{t('Use the Product Hub account created by your administrator.')}</p><form onSubmit={submit}><label>{t('Work email')}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></label><label>{t('Password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required/></label>{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? t('Signing in…') : t('Sign in')}</button></form></section></main>;
}

function Metric({ label, value, sub, icon, tone }) { return <article className={`metric-card ${tone || ''}`}><div className="metric-icon">{icon}</div><p>{label}</p><strong>{value}</strong><span>{sub}</span></article>; }

function ExecutiveContent({ solutions, onEdit, onOpen }) {
  const { language, t } = useLang();
  const byDepartment = solutions.reduce((groups, solution) => { groups[solution.department] = groups[solution.department] || []; groups[solution.department].push(solution); return groups; }, {});
  const attention = solutions.filter((solution) => solution.health !== 'Healthy');
  const decisions = attention.filter((solution) => solution.blocker || solution.stage !== 'Live');
  const milestones = solutions.filter((solution) => solution.targetDate).sort((a, b) => a.targetDate.localeCompare(b.targetDate)).slice(0, 3);
  const attentionTitle = attention.length
    ? formatCountLabel(attention.length, '{count} decision need attention.', '{count} decisions need attention.', t)
    : t('Portfolio is on track.');
  return <>
  <section className="section-grid exec-grid">
    <article className="panel value-panel"><div className="panel-heading"><div><p className="eyebrow">{t('Department impact')}</p><h2>{t('Value by department')}</h2></div><span className="panel-note">{t('Measured time saved')}</span></div>
      <div className="impact-list">{Object.entries(byDepartment).map(([department, items]) => { const hours = items.reduce((total, item) => total + (Number.parseInt(item.value, 10) || 0), 0); const width = Math.max(10, Math.round((hours / 42) * 100)); return <Impact key={department} department={t(department)} value={hours ? formatDisplayValue(`${hours} hrs`, t) : t('Baseline')} width={width} note={formatCountLabel(items.length, '{count} solution', '{count} solutions', t)}/>; })}</div>
    </article>
    <article className="panel dark-panel"><p className="eyebrow">{t('Portfolio signal')}</p><h2>{attentionTitle}</h2><p>{t(attention.length ? 'Focus the next review on products with an unresolved health signal or delivery decision.' : 'All products currently have a healthy operating signal.')}</p><div className="dark-stat"><strong>{solutions.length}</strong><span>{t('products in the portfolio')}</span></div></article>
  </section>
  <section className="section-grid exec-lower-grid">
    <article className="panel decision-panel"><div className="panel-heading"><div><p className="eyebrow">{t('Leadership attention')}</p><h2>{t('Decisions & risks')}</h2></div><span className="decision-count">{decisions.length}</span></div>{decisions.length ? <div className="decision-list">{decisions.map((solution) => <div className="decision-item" key={solution.id}><div><strong>{t(solution.name)}</strong><span>{t(solution.blocker || solution.nextStep)}</span></div><b>{t(solution.health)}</b></div>)}</div> : <p className="empty-state">{t('No open product decisions are recorded.')}</p>}</article>
    <article className="panel roadmap-summary"><div className="panel-heading"><div><p className="eyebrow">{t('Forward view')}</p><h2>{t('Next milestones')}</h2></div><Sparkles size={18}/></div><div className="milestone-list">{milestones.map((solution) => <div className="milestone-item" key={solution.id}><span>{new Date(solution.targetDate + 'T00:00:00').toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB',{day:'2-digit',month:'short'})}</span><div><strong>{t(solution.name)}</strong><small>{t(solution.nextStep)}</small></div></div>)}</div></article>
  </section>
  <section className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">{t('Solution portfolio')}</p><h2>{t('Current product health')}</h2></div><button className="text-button">{t('All solutions')} <ArrowRight size={15}/></button></div><SolutionTable solutions={solutions} onEdit={onEdit} onOpen={onOpen}/></section>
</>; }

function AdminContent({ section, solutions, subscriptions, technicalProfiles, onEdit, onCreate, onOpen, onEditSubscription, onCreateSubscription, onEditProfile }) {
  const { t } = useLang();
  if (section === 'Subscriptions') return <SubscriptionsRegister subscriptions={subscriptions} onEdit={onEditSubscription} onCreate={onCreateSubscription}/>;
  if (section === 'Roadmap') return <RoadmapBoard solutions={solutions} onOpen={onOpen} onEdit={onEdit}/>;
  if (section === 'Operations') return <OperationsWorkspace solutions={solutions} profiles={technicalProfiles} onEdit={onEditProfile}/>;
  return <>
  <section className="section-grid admin-grid">
    <article className="panel work-panel"><div className="panel-heading"><div><p className="eyebrow">{t('This week')}</p><h2>{t('Priority work')}</h2></div><button className="icon-button" onClick={onCreate} aria-label={t('Add solution')}><Plus size={18}/></button></div>
      <div className="work-list">{workItems.map(item => <div className="work-item" key={item.title}><span className={`status-dot ${item.tone}`}></span><div><strong>{t(item.title)}</strong><span>{t(item.solution)} · {t('Due {date}').replace('{date}', t(item.due))}</span></div><em>{t(item.status)}</em></div>)}</div>
    </article>
    <article className="panel operations-panel"><div className="panel-heading"><div><p className="eyebrow">{t('Operations')}</p><h2>{t('System pulse')}</h2></div><Activity size={19}/></div>
      <div className="pulse-row"><span>{t('Live tool health')}</span><strong>{t('Healthy')}</strong></div><div className="pulse-row"><span>{t('Usage events recorded')}</span><strong>127</strong></div><div className="pulse-row"><span>{t('Open operational risks')}</span><strong className="warning">2</strong></div><button className="text-button">{t('Open operations')} <ArrowRight size={15}/></button>
    </article>
  </section>
  <section className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">{t(section === 'Overview' ? 'Solution portfolio' : section)}</p><h2>{t(section === 'Overview' ? 'Products at a glance' : `${section} overview`)}</h2></div><button className="text-button" onClick={onCreate}>{t('Add solution')} <ArrowRight size={15}/></button></div><SolutionTable solutions={solutions} onEdit={onEdit} onOpen={onOpen}/></section>
</>; }

function Impact({ department, value, width, note }) { return <div className="impact-row"><div><strong>{department}</strong><span>{note}</span></div><div className="impact-bar"><i style={{width:`${width}%`}}></i></div><b>{value}</b></div>; }

function SolutionTable({ solutions, onEdit, onOpen }) {
  const { t } = useLang();
  return <div className="solution-table"><div className="table-head"><span>{t('Solution')}</span><span>{t('Stage')}</span><span>{t('Health')}</span><span>{t('Validated value')}</span><span></span></div>{solutions.map(s => <div className="table-row table-row--interactive" key={s.id || s.name} onClick={() => onOpen(s)}><div className="solution-name"><i className={s.accent}></i><div><strong>{t(s.name)}</strong><span>{t(s.department)} · {t(s.detail)}</span></div></div><span><b className={`tag ${s.stage === 'Live' ? 'live' : 'building'}`}>{t(s.stage)}</b></span><span className={`health ${s.health === 'Healthy' ? 'healthy' : 'attention'}`}><i></i>{t(s.health)}</span><strong>{formatDisplayValue(s.value, t)}</strong><button className="row-action" onClick={(event) => { event.stopPropagation(); onEdit(s); }} aria-label={`${t('Edit solution')} ${s.name}`}><Pencil size={15}/></button></div>)}</div>;
}

function SubscriptionsRegister({ subscriptions, onEdit, onCreate }) {
  const { t } = useLang();
  return <>
  <section className="registry-intro"><div><p className="eyebrow">{t('Admin workspace')}</p><h1>{t('Subscriptions & hosting')}</h1><p>{t('One protected view of the services that keep PINE products running.')}</p></div><button className="primary-button" onClick={onCreate}><Plus size={17}/> {t('Add service')}</button></section>
  <section className="metrics-grid registry-metrics"><Metric label={t('Tracked services')} value={subscriptions.length} sub={t('Hosting, data and AI services')} icon={<Server size={19}/>}/><Metric label={t('Review due')} value={subscriptions.filter((item) => item.status === 'Review due').length} sub={t('Renewals or operational checks')} icon={<CircleAlert size={19}/>} tone="attention"/><Metric label={t('Products supported')} value="5" sub={t('Across the current portfolio')} icon={<Boxes size={19}/>}/><Metric label={t('Account owners')} value="1" sub={t('Ownership should always be named')} icon={<Users size={19}/>}/></section>
  <section className="panel registry-panel"><div className="panel-heading"><div><p className="eyebrow">{t('Service register')}</p><h2>{t('Operational dependencies')}</h2></div><button className="text-button" onClick={onCreate}>{t('Add service')} <ArrowRight size={15}/></button></div><div className="subscription-table"><div className="subscription-head"><span>{t('Provider')}</span><span>{t('Category')}</span><span>{t('Renewal / billing')}</span><span>{t('Used by')}</span><span>{t('Owner')}</span><span></span></div>{subscriptions.map((item) => <div className="subscription-row" key={item.id}><div><strong>{item.provider}</strong><span>{t(item.detail) || t('No operational note yet')}</span></div><span>{t(item.category)}</span><span><b className={item.status === 'Review due' ? 'review-text' : ''}>{t(item.renewal) || t('Not set')}</b><small>{t(item.status)}</small></span><span>{item.solutions || t('Not linked yet')}</span><span>{item.owner || t('Not assigned')}</span><button className="row-action" onClick={() => onEdit(item)} aria-label={`${t('Edit service')} ${item.provider}`}><Pencil size={15}/></button></div>)}</div></section>
</>; }

function SubscriptionEditor({ subscription, onClose, onSave }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(subscription); const update = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => { event.preventDefault(); if (draft.provider.trim()) onSave({ ...draft, provider: draft.provider.trim(), detail: draft.detail.trim() }); };
  return <div className="modal-backdrop" role="presentation"><section className="solution-editor" role="dialog" aria-modal="true" aria-labelledby="service-editor-title"><div className="editor-heading"><div><p className="eyebrow">{t('Admin only')}</p><h2 id="service-editor-title">{t(subscription.provider ? 'Edit service' : 'Add service')}</h2></div><button className="icon-button" onClick={onClose} aria-label={t('Close service editor')}><X size={18}/></button></div><form onSubmit={submit}><label>{t('Provider')}<input autoFocus value={draft.provider} onChange={update('provider')} placeholder={t('e.g. Vercel')} required/></label><div className="form-grid"><label>{t('Category')}<select value={draft.category} onChange={update('category')}><option value="Hosting">{t('Hosting')}</option><option value="Database & Auth">{t('Database & Auth')}</option><option value="AI services">{t('AI services')}</option><option value="Domain & DNS">{t('Domain & DNS')}</option><option value="Productivity">{t('Productivity')}</option><option value="Other">{t('Other')}</option></select></label><label>{t('Status')}<select value={canonicalLabel(draft.status) || draft.status} onChange={update('status')}><option value="Healthy">{t('Healthy')}</option><option value="Review due">{t('Review due')}</option><option value="At risk">{t('At risk')}</option></select></label></div><div className="form-grid"><label>{t('Renewal / billing')}<input value={draft.renewal} onChange={update('renewal')} placeholder={t('e.g. 2026-08-15 or Monthly')}/></label><label>{t('Owner')}<input value={draft.owner} onChange={update('owner')} placeholder={t('e.g. Eldar Pine')}/></label></div><label>{t('Solutions supported')}<input value={draft.solutions} onChange={update('solutions')} placeholder={t('e.g. PINE Workflows, Catalog Matcher')}/></label><label>{t('Operational note')}<textarea value={draft.detail} onChange={update('detail')} rows="3" placeholder={t('What does this service provide, and what should the team know?')}/></label><div className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('Cancel')}</button><button type="submit" className="primary-button"><FileText size={16}/>{t('Save service')}</button></div></form></section></div>;
}

function OperationsWorkspace({ solutions, profiles, onEdit }) {
  const { t } = useLang();
  const solutionById = new Map(solutions.map((solution) => [solution.id, solution]));
  const healthy = profiles.filter((profile) => profile.health === 'Healthy').length;
  const needsAttention = profiles.filter((profile) => profile.health !== 'Healthy').length;
  const risks = profiles.filter((profile) => profile.risk && profile.risk !== 'No current risk').length;
  return <><section className="registry-intro"><div><p className="eyebrow">{t('Admin workspace')}</p><h1>{t('Operations')}</h1><p>{t("Keep every product's technical home, support ownership, and risks visible.")}</p></div></section>
  <section className="metrics-grid registry-metrics"><Metric label={t('Technical profiles')} value={profiles.length} sub={t('One profile for each solution')} icon={<Server size={19}/>}/><Metric label={t('Healthy products')} value={healthy} sub={t('No operational attention flagged')} icon={<Activity size={19}/>}/><Metric label={t('Needs attention')} value={needsAttention} sub={t('Review risk or ownership')} icon={<CircleAlert size={19}/>} tone="attention"/><Metric label={t('Open risks')} value={risks} sub={t('Known dependencies to manage')} icon={<CircleAlert size={19}/>} tone={risks ? 'attention' : ''}/></section>
  <section className="operations-grid">{profiles.map((profile) => { const solution = solutionById.get(profile.solutionId); return <article className="operation-card" key={profile.id}><div className="operation-card-head"><div><p className="eyebrow">{t(solution?.department || 'Unlinked solution')}</p><h2>{solution ? t(solution.name) : t('Solution not found')}</h2></div><button className="row-action" onClick={() => onEdit(profile)} aria-label={`${t('Technical profile')} ${solution?.name || ''}`}><Pencil size={15}/></button></div><div className="operation-meta"><span>{t('Hosting')}</span><strong>{profile.hosting || t('Not recorded')}</strong><span>{t('Repository')}</span><strong>{t(profile.repository) || t('Not linked')}</strong><span>{t('Database')}</span><strong>{t(profile.database) || t('Not recorded')}</strong><span>{t('Support owner')}</span><strong>{profile.supportOwner || t('Not assigned')}</strong></div><div className="operation-footer"><span className={profile.health === 'Healthy' ? 'healthy-text' : 'review-text'}>{t(profile.health)}</span><span>{t(profile.runbook) || t('No runbook linked')}</span></div>{profile.risk && profile.risk !== 'No current risk' && <p className="risk-callout"><CircleAlert size={15}/>{t(profile.risk)}</p>}</article>; })}</section></>;
}

function TechnicalProfileEditor({ profile, solutions, onClose, onSave }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(profile); const update = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => { event.preventDefault(); onSave(draft); };
  return <div className="modal-backdrop" role="presentation"><section className="solution-editor" role="dialog" aria-modal="true" aria-labelledby="technical-editor-title"><div className="editor-heading"><div><p className="eyebrow">{t('Admin only')}</p><h2 id="technical-editor-title">{t('Technical profile')}</h2></div><button className="icon-button" onClick={onClose} aria-label={t('Close technical profile editor')}><X size={18}/></button></div><form onSubmit={submit}><label>{t('Solution')}<select value={draft.solutionId} onChange={update('solutionId')}>{solutions.map((solution) => <option key={solution.id} value={solution.id}>{t(solution.name)}</option>)}</select></label><div className="form-grid"><label>{t('Hosting')}<input value={draft.hosting || ''} onChange={update('hosting')} placeholder={t('e.g. Vercel')}/></label><label>{t('Database')}<input value={draft.database || ''} onChange={update('database')} placeholder={t('e.g. Supabase')}/></label></div><label>{t('Repository')}<input value={draft.repository || ''} onChange={update('repository')} placeholder={t('e.g. GitHub repository URL or name')}/></label><label>{t('Support owner')}<input value={draft.supportOwner || ''} onChange={update('supportOwner')} placeholder={t('e.g. Eldar Pine')}/></label><div className="form-grid"><label>{t('Health')}<select value={canonicalLabel(draft.health) || draft.health} onChange={update('health')}><option value="Healthy">{t('Healthy')}</option><option value="Attention">{t('Attention')}</option><option value="At risk">{t('At risk')}</option></select></label><label>{t('Runbook / support reference')}<input value={draft.runbook || ''} onChange={update('runbook')} placeholder={t('e.g. Deployment checklist')}/></label></div><label>{t('Operational risk')}<textarea value={draft.risk || ''} onChange={update('risk')} rows="3" placeholder={t("Leave as 'No current risk' when everything is stable.")}/></label><div className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('Cancel')}</button><button type="submit" className="primary-button"><FileText size={16}/>{t('Save profile')}</button></div></form></section></div>;
}

function RoadmapBoard({ solutions, onOpen, onEdit }) {
  const { language, t } = useLang();
  const stages = ['Discovery', 'Building', 'Testing', 'Live', 'Measuring outcome'];
  return <><section className="registry-intro"><div><p className="eyebrow">{t('Product direction')}</p><h1>{t('Roadmap')}</h1><p>{t('Move every solution forward through a visible, evidence-led lifecycle.')}</p></div><div className="roadmap-legend"><span><i className="healthy-dot"></i> {t('Healthy')}</span><span><i className="attention-dot"></i> {t('Needs attention')}</span></div></section><section className="roadmap-board">{stages.map((stage) => { const items = solutions.filter((solution) => (canonicalLabel(solution.roadmapStage) || solution.roadmapStage) === stage); return <article className="roadmap-column" key={stage}><div className="roadmap-column-head"><div><p>{t(stage)}</p><span>{formatCountLabel(items.length, '{count} solution', '{count} solutions', t)}</span></div></div><div className="roadmap-cards">{items.map((solution) => <article className="roadmap-card" key={solution.id} role="button" tabIndex="0" onClick={() => onOpen(solution)}><div><i className={solution.accent}></i><span>{t(solution.department)}</span></div><strong>{t(solution.name)}</strong><p>{t(solution.nextStep) || t('Define the next step.')}</p><footer><span className={solution.health === 'Healthy' ? 'healthy-text' : 'review-text'}>{t(solution.health)}</span><b>{solution.targetDate ? new Date(`${solution.targetDate}T00:00:00`).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB',{day:'2-digit',month:'short'}) : t('No date')}</b></footer><button className="roadmap-edit" onClick={(event) => { event.stopPropagation(); onEdit(solution); }} aria-label={`${t('Edit solution')} ${solution.name}`}><Pencil size={13}/></button></article>)}</div></article>; })}</section></>;
}

function SolutionDetail({ solution, onBack, onEdit }) {
  const { t } = useLang();
  return <>
  <section className="detail-hero">
    <button className="back-button" onClick={onBack}>{t('← Back to solutions')}</button>
    <div className="detail-hero-row"><div><p className="eyebrow">{t('{department} · Product record').replace('{department}', t(solution.department))}</p><h1>{t(solution.name)}</h1><p>{t(solution.detail)}</p></div><button className="primary-button" onClick={() => onEdit(solution)}><Pencil size={16}/> {t('Edit solution')}</button></div>
    <div className="detail-badges"><b className={`tag ${solution.stage === 'Live' ? 'live' : 'building'}`}>{t(solution.stage)}</b><span className={`health ${solution.health === 'Healthy' ? 'healthy' : 'attention'}`}><i></i>{t(solution.health)}</span><span>{t('Owner:')} <strong>{solution.owner || t('Not assigned')}</strong></span></div>
  </section>
  <section className="detail-grid">
    <article className="panel detail-main"><DetailBlock label={t('Purpose')} text={t(solution.purpose) || t('Add the purpose this product serves.')}/><DetailBlock label={t('Business case')} text={t(solution.businessCase) || t('Add the measurable business problem or value hypothesis.')}/><DetailBlock label={t('Current status')} text={t(solution.detail)}/></article>
    <aside className="detail-aside"><article className="panel"><p className="eyebrow">{t('Outcome')}</p><strong className="detail-value">{formatDisplayValue(solution.value, t)}</strong><p className="detail-note">{t('Validated value per month')}</p></article><article className="panel"><p className="eyebrow">{t('Next step')}</p><h2>{t(solution.nextStep) || t('Define the next milestone.')}</h2><p className="detail-note">{t('Update this after each review or delivery milestone.')}</p></article><article className="panel detail-facts"><p className="eyebrow">{t('Product facts')}</p><div><span>{t('Department')}</span><strong>{t(solution.department)}</strong></div><div><span>{t('Product owner')}</span><strong>{solution.owner || t('Not assigned')}</strong></div><div><span>{t('Health')}</span><strong>{t(solution.health)}</strong></div></article></aside>
  </section>
</>; }
function DetailBlock({ label, text }) { return <section className="detail-block"><p className="eyebrow">{label}</p><p>{text}</p></section>; }

function SolutionEditor({ solution, onClose, onSave }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(solution);
  const update = (field) => (event) => setDraft(current => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      detail: draft.detail.trim(),
      stage: canonicalLabel(draft.stage) || draft.stage,
      health: canonicalLabel(draft.health) || draft.health,
      roadmapStage: canonicalLabel(draft.roadmapStage) || draft.roadmapStage || 'Discovery',
    });
  };
  return <div className="modal-backdrop" role="presentation"><section className="solution-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
    <div className="editor-heading"><div><p className="eyebrow">{t('Admin only')}</p><h2 id="editor-title">{t(solution.name ? 'Edit solution' : 'Add solution')}</h2></div><button className="icon-button" onClick={onClose} aria-label={t('Close editor')}><X size={18}/></button></div>
    <form onSubmit={submit}>
      <label>{t('Solution name')}<input autoFocus value={draft.name} onChange={update('name')} placeholder={t('e.g. Supplier Catalog Matcher')} required /></label>
      <label>{t('Department')}<input value={draft.department} onChange={update('department')} placeholder={t('e.g. Procurement')} required /></label>
      <div className="form-grid"><label>{t('Stage')}<select value={canonicalLabel(draft.stage) || draft.stage} onChange={update('stage')}><option value="Building">{t('Building')}</option><option value="Testing">{t('Testing')}</option><option value="Live">{t('Live')}</option><option value="Paused">{t('Paused')}</option></select></label><label>{t('Health')}<select value={canonicalLabel(draft.health) || draft.health} onChange={update('health')}><option value="Healthy">{t('Healthy')}</option><option value="Attention">{t('Attention')}</option><option value="At risk">{t('At risk')}</option></select></label></div>
      <div className="form-grid"><label>{t('Validated value')}<input value={draft.value} onChange={update('value')} placeholder={t('e.g. 12 hrs')} /></label><label>{t('Colour')}<select value={draft.accent} onChange={update('accent')}><option value="teal">{t('Teal')}</option><option value="blue">{t('Blue')}</option><option value="amber">{t('Amber')}</option><option value="violet">{t('Violet')}</option></select></label></div>
      <label>{t('Product owner')}<input value={draft.owner || ''} onChange={update('owner')} placeholder={t('e.g. Eldar Pine')} /></label>
      <label>{t('Purpose')}<textarea value={draft.purpose || ''} onChange={update('purpose')} rows="3" placeholder={t('What does this solution help the department do?')} /></label>
      <label>{t('Business case')}<textarea value={draft.businessCase || ''} onChange={update('businessCase')} rows="3" placeholder={t('What time, cost, quality, or risk problem does it address?')} /></label>
      <label>{t('Current status')}<textarea value={draft.detail} onChange={update('detail')} rows="3" placeholder={t('Describe adoption, delivery progress or the next review.')} required /></label>
      <label>{t('Next step')}<textarea value={draft.nextStep || ''} onChange={update('nextStep')} rows="2" placeholder={t('What must happen next?')} /></label>
      <div className="form-grid"><label>{t('Roadmap stage')}<select value={canonicalLabel(draft.roadmapStage) || draft.roadmapStage || 'Discovery'} onChange={update('roadmapStage')}><option value="Discovery">{t('Discovery')}</option><option value="Building">{t('Building')}</option><option value="Testing">{t('Testing')}</option><option value="Live">{t('Live')}</option><option value="Measuring outcome">{t('Measuring outcome')}</option></select></label><label>{t('Target date')}<input type="date" value={draft.targetDate || ''} onChange={update('targetDate')}/></label></div>
      <label>{t('Blocker or decision needed')}<textarea value={draft.blocker || ''} onChange={update('blocker')} rows="2" placeholder={t('Leave empty if there is no current blocker.')}/></label>
      <label>{t('Future AI opportunity')}<textarea value={draft.aiOpportunity || ''} onChange={update('aiOpportunity')} rows="2" placeholder={t('Describe a realistic future AI assist, or explain why none is planned.')}/></label>
      <div className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('Cancel')}</button><button type="submit" className="primary-button"><FileText size={16}/>{t('Save solution')}</button></div>
    </form>
  </section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
