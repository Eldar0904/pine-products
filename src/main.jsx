import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowRight, Bell, Boxes, ChevronDown, CircleAlert, Clock3,
  Cog, FileText, LayoutDashboard, Menu, Plus, Server, ShieldCheck,
  Pencil, Sparkles, Users, X
} from 'lucide-react';
import './styles.css';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { loadSolutions, saveRemoteSolution } from './lib/hub-data';

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

const developmentMode = import.meta.env.VITE_APP_MODE !== 'production';
const ruTranslations = {
  'WORKING VIEW': 'РАБОЧИЙ ВИД', 'EXECUTIVE VIEW': 'ВИД ДЛЯ РУКОВОДСТВА', 'Workspace': 'Рабочая область', 'Portfolio': 'Портфель',
  'Overview': 'Обзор', 'Executive overview': 'Обзор для руководства', 'Solutions': 'Решения', 'Roadmap': 'Дорожная карта',
  'Operations': 'Операции', 'Subscriptions': 'Подписки', 'Department impact': 'Влияние на отделы', 'Risks & decisions': 'Риски и решения',
  'Switch to Executive View': 'Перейти к виду руководства', 'Switch to Working View': 'Перейти к рабочему виду',
  'Executive access': 'Доступ руководства', 'Administrator': 'Администратор', 'Good morning, Eldar.': 'Доброе утро, Элдар.',
  'A clear view of product value.': 'Понятный обзор ценности продуктов.', 'A concise view of the internal solutions serving PINE teams.': 'Краткий обзор внутренних решений для команд PINE.',
  'Your automation portfolio is stable. Two items need attention this week.': 'Портфель автоматизации стабилен. На этой неделе требуют внимания два пункта.',
  'Portfolio health · July 2026': 'Состояние портфеля · июль 2026', 'Monday, 30 July': 'Понедельник, 30 июля',
  'Active solutions': 'Активные решения', 'Validated value delivered': 'Подтверждённая ценность', 'Solutions healthy': 'Решения в хорошем состоянии',
  'Successful runs': 'Успешные запуски', 'Decision needed': 'Требуется решение', 'Needs attention': 'Требует внимания',
  'Live products': 'Рабочие продукты', 'Renewal watch': 'Контроль продления', 'Department impact': 'Влияние на отделы',
  'Value by department': 'Ценность по отделам', 'Measured time saved': 'Измеренная экономия времени', 'Portfolio signal': 'Сигнал портфеля',
  'Leadership attention': 'Внимание руководства', 'Decisions & risks': 'Решения и риски', 'Forward view': 'Следующие шаги',
  'Next milestones': 'Ближайшие этапы', 'Solution portfolio': 'Портфель решений', 'Current product health': 'Текущее состояние продуктов',
  'Products at a glance': 'Продукты одним взглядом', 'This week': 'На этой неделе', 'Priority work': 'Приоритетная работа',
  'System pulse': 'Состояние систем', 'Live tool health': 'Состояние рабочих инструментов', 'Usage events recorded': 'Записей об использовании',
  'Open operational risks': 'Открытые операционные риски', 'Open operations': 'Открыть операции', 'Add solution': 'Добавить решение',
  'All solutions': 'Все решения', 'Admin workspace': 'Рабочая область администратора', 'Admin only': 'Только для администратора',
  'Save solution': 'Сохранить решение', 'Cancel': 'Отмена', 'Purpose': 'Назначение', 'Business case': 'Бизнес-обоснование',
  'Current status': 'Текущий статус', 'Outcome': 'Результат', 'Next step': 'Следующий шаг', 'Product facts': 'Факты о продукте',
  'Department': 'Отдел', 'Product owner': 'Владелец продукта', 'Health': 'Состояние', 'Validated value': 'Подтверждённая ценность',
  'Building': 'Разработка', 'Live': 'Работает', 'Testing': 'Тестирование', 'Discovery': 'Исследование', 'Measuring outcome': 'Измерение результата',
  'Healthy': 'Хорошее', 'Attention': 'Внимание', 'At risk': 'Риск', 'In progress': 'В работе', 'Planned': 'Запланировано', 'Needs review': 'Требует проверки',
  'Technical profiles': 'Технические профили', 'Healthy products': 'Продукты в хорошем состоянии', 'Open risks': 'Открытые риски',
  'Technical profile': 'Технический профиль', 'Hosting': 'Хостинг', 'Repository': 'Репозиторий', 'Database': 'База данных',
  'Support owner': 'Ответственный за поддержку', 'Operational risk': 'Операционный риск', 'Save profile': 'Сохранить профиль',
  'Subscriptions & hosting': 'Подписки и хостинг', 'Tracked services': 'Отслеживаемые сервисы', 'Review due': 'Требует проверки',
  'Products supported': 'Поддерживаемые продукты', 'Account owners': 'Ответственные за аккаунты', 'Service register': 'Реестр сервисов',
  'Operational dependencies': 'Операционные зависимости', 'Provider': 'Провайдер', 'Category': 'Категория', 'Renewal / billing': 'Продление / оплата',
  'Add service': 'Добавить сервис', 'Save service': 'Сохранить сервис', 'No open product decisions are recorded.': 'Открытые продуктовые решения не зафиксированы.',
  '86 completed offers this month': '86 предложений выполнено в этом месяце', '41 agreements generated this month': '41 договор подготовлен в этом месяце',
  'Matching rules being validated': 'Правила сопоставления проходят проверку', 'Outcome baseline due in August': 'Базовый показатель результата — в августе',
  'Validate matching rules with Procurement.': 'Проверить правила сопоставления с отделом закупок.',
  'Review the latest Legal template update.': 'Проверить последнее обновление юридического шаблона.',
  'Record the manual baseline and schedule an outcome review.': 'Зафиксировать ручной базовый показатель и назначить проверку результата.',
  'Validate the monthly time-saving baseline with Procurement.': 'Проверить месячный базовый показатель экономии времени с отделом закупок.',
  'Representative supplier catalogues are still being validated.': 'Эталонные каталоги поставщиков ещё проходят проверку.',
  'Waiting for the latest approved Legal template.': 'Ожидается последний утверждённый юридический шаблон.',
  'Template approval dependency': 'Зависимость от утверждения шаблона', 'Supplier catalogue format variations': 'Различия в форматах каталогов поставщиков',
  'No current risk': 'Текущих рисков нет', 'Document generation support notes pending': 'Заметки по поддержке генерации документов ещё не готовы',
  'Legal template update process': 'Процесс обновления юридических шаблонов', 'Supplier catalogue validation guide': 'Инструкция по проверке каталогов поставщиков',
  'Academic administration support notes': 'Заметки по поддержке академического администрирования', 'Not linked': 'Не привязан', 'Not recorded': 'Не зафиксировано'
};
const enTranslations = Object.fromEntries(Object.entries(ruTranslations).map(([english, russian]) => [russian, english]));
const canonicalLabel = (value) => (value && enTranslations[value]) || value;
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
function localisePage(language) {
  const dictionary = language === 'ru' ? ruTranslations : enTranslations;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (node.parentElement?.closest('script, style')) return;
    const value = node.nodeValue;
    const trimmed = value.trim();
    if (dictionary[trimmed]) node.nodeValue = value.replace(trimmed, dictionary[trimmed]);
  });
}

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
    localisePage(language);
    const observer = new MutationObserver(() => localisePage(language));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
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

  if (auth.state === 'loading') return <LoadingScreen/>;
  if (auth.state === 'signed_out') return <SignInScreen/>;
  if (auth.state === 'waiting') return <AccessWaitingScreen email={auth.email}/>;
  if (auth.state === 'error') return <MessageScreen title="Unable to verify access" message={auth.message}/>;
  return <div className="app-shell">
    <aside className={mobileOpen ? 'sidebar sidebar--open' : 'sidebar'}>
      <div className="brand">
        <div className="brand-mark">P</div>
        <div><strong>PINE</strong><span>Product Hub</span></div>
        <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button>
      </div>
      <nav>
        <p className="nav-label">{isExecutive ? 'Portfolio' : 'Workspace'}</p>
        {nav.map(item => <button key={item} onClick={() => { setSelectedSolution(null); setSection(item); setMobileOpen(false); }} className={activeName === (item === 'Executive overview' ? 'Overview' : item) ? 'nav-item active' : 'nav-item'}>
          {item.includes('overview') || item === 'Overview' ? <LayoutDashboard size={18}/> : item === 'Solutions' ? <Boxes size={18}/> : item === 'Roadmap' ? <Sparkles size={18}/> : item === 'Operations' ? <Activity size={18}/> : item === 'Subscriptions' ? <Server size={18}/> : item === 'Department impact' ? <Users size={18}/> : <CircleAlert size={18}/>}<span>{item}</span>
        </button>)}
      </nav>
      <div className="sidebar-footer">
        <div className="user-avatar">EP</div>
        <div><strong>Eldar Pine</strong><span>{isExecutive ? 'Executive access' : 'Administrator'}</span></div>
        <ChevronDown size={16}/>
      </div>
    </aside>
    {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}

    <main>
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20}/></button>
        <div className="breadcrumb"><span>PINE / PRODUCT HUB</span><b>/</b><strong>{selectedSolution ? selectedSolution.name.toUpperCase() : isExecutive ? 'EXECUTIVE VIEW' : 'WORKING VIEW'}</strong></div>
        <div className="topbar-actions">
          {auth.role === 'admin' && <button className="view-switch" onClick={() => { setView(isExecutive ? 'admin' : 'executive'); setSection(isExecutive ? 'Overview' : 'Executive overview'); }}><span className="switch-dot"></span>{isExecutive ? 'Switch to Working View' : 'Switch to Executive View'}</button>}
          <button className="language-switch" onClick={() => setLanguage((current) => current === 'ru' ? 'en' : 'ru')} aria-label={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}>{language === 'ru' ? 'EN' : 'RU'}</button><button className="icon-button"><Bell size={18}/><i></i></button>
        </div>
      </header>

      <div className="page-content">
        {selectedSolution ? <SolutionDetail solution={selectedSolution} onBack={() => setSelectedSolution(null)} onEdit={setEditingSolution} /> : <>
        {!['Subscriptions', 'Roadmap', 'Operations'].includes(section) && <section className="page-intro">
          <div>
            <p className="eyebrow">{isExecutive ? 'Portfolio health · July 2026' : 'Monday, 30 July'}</p>
            <h1>{isExecutive ? 'A clear view of product value.' : 'Good morning, Eldar.'}</h1>
            <p>{isExecutive ? 'A concise view of the internal solutions serving PINE teams.' : 'Your automation portfolio is stable. Two items need attention this week.'}</p>
          </div>
          {!isExecutive && <button className="primary-button" onClick={createSolution}><Plus size={18}/> Add solution</button>}
        </section>}

        {!['Subscriptions', 'Roadmap', 'Operations'].includes(section) && <section className="metrics-grid">
          <Metric label={isExecutive ? 'Validated value delivered' : 'Active solutions'} value={isExecutive ? (solutions.reduce((total, item) => total + (Number.parseInt(item.value, 10) || 0), 0) + ' hrs') : '4'} sub={isExecutive ? 'measured time saved per month' : '2 live · 1 building · 1 needs baseline'} icon={<Clock3 size={19}/>} />
          <Metric label={isExecutive ? 'Solutions healthy' : 'Successful runs'} value={isExecutive ? (solutions.filter((item) => item.health === 'Healthy').length + ' / ' + solutions.length) : '127'} sub={isExecutive ? 'portfolio health signal' : '98% success rate this month'} icon={<ShieldCheck size={19}/>} />
          <Metric label={isExecutive ? 'Decision needed' : 'Needs attention'} value={isExecutive ? solutions.filter((item) => item.health !== 'Healthy').length : '2'} sub={isExecutive ? 'products require a decision or baseline' : 'Catalog Matcher · EduMax baseline'} icon={<CircleAlert size={19}/>} tone="attention" />
          <Metric label={isExecutive ? 'Live products' : 'Renewal watch'} value={isExecutive ? solutions.filter((item) => item.stage === 'Live').length : '1'} sub={isExecutive ? 'currently serving departments' : 'Operational review due in 16 days'} icon={<Server size={19}/>} />
        </section>}

        {saveError && <div className="error-banner"><CircleAlert size={16}/>{saveError}</div>}
        {isExecutive ? <ExecutiveContent solutions={solutions} onEdit={setEditingSolution} onOpen={setSelectedSolution} /> : <AdminContent section={section} solutions={solutions} subscriptions={subscriptions} technicalProfiles={technicalProfiles} onEdit={setEditingSolution} onCreate={createSolution} onOpen={setSelectedSolution} onEditSubscription={setEditingSubscription} onCreateSubscription={createSubscription} onEditProfile={setEditingProfile}/>} 
        </>}
      </div>
    </main>
    {editingSolution && <SolutionEditor solution={editingSolution} onClose={() => setEditingSolution(null)} onSave={saveSolution}/>} 
    {editingSubscription && <SubscriptionEditor subscription={editingSubscription} onClose={() => setEditingSubscription(null)} onSave={saveSubscription}/>} 
    {editingProfile && <TechnicalProfileEditor profile={editingProfile} solutions={solutions} onClose={() => setEditingProfile(null)} onSave={saveProfile}/>} 
  </div>;
}

function LoadingScreen() { return <MessageScreen title="Connecting to PINE Product Hub" message="Checking your secure workspace access…"/>; }
function AccessWaitingScreen({ email }) { return <MessageScreen title="Access is awaiting approval" message={`${email || 'This account'} has signed in, but an Admin has not assigned it a Product Hub role yet.`}/>; }
function MessageScreen({ title, message }) { return <main className="access-screen"><div className="access-card"><div className="brand-mark">P</div><p className="eyebrow">PINE Product Hub</p><h1>{title}</h1><p>{message}</p></div></main>; }
function SignInScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); const { error: signInError } = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (signInError) setError(signInError.message); };
  return <main className="access-screen"><section className="access-card"><div className="brand-mark">P</div><p className="eyebrow">PINE Product Hub</p><h1>Sign in to your workspace.</h1><p>Use the Product Hub account created by your administrator.</p><form onSubmit={submit}><label>Work email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required/></label>{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form></section></main>;
}

function Metric({ label, value, sub, icon, tone }) { return <article className={`metric-card ${tone || ''}`}><div className="metric-icon">{icon}</div><p>{label}</p><strong>{value}</strong><span>{sub}</span></article>; }

function ExecutiveContent({ solutions, onEdit, onOpen }) {
  const byDepartment = solutions.reduce((groups, solution) => { groups[solution.department] = groups[solution.department] || []; groups[solution.department].push(solution); return groups; }, {});
  const attention = solutions.filter((solution) => solution.health !== 'Healthy');
  const decisions = attention.filter((solution) => solution.blocker || solution.stage !== 'Live');
  const milestones = solutions.filter((solution) => solution.targetDate).sort((a, b) => a.targetDate.localeCompare(b.targetDate)).slice(0, 3);
  return <>
  <section className="section-grid exec-grid">
    <article className="panel value-panel"><div className="panel-heading"><div><p className="eyebrow">Department impact</p><h2>Value by department</h2></div><span className="panel-note">Measured time saved</span></div>
      <div className="impact-list">{Object.entries(byDepartment).map(([department, items]) => { const hours = items.reduce((total, item) => total + (Number.parseInt(item.value, 10) || 0), 0); const width = Math.max(10, Math.round((hours / 42) * 100)); return <Impact key={department} department={department} value={hours ? (hours + ' hrs') : 'Baseline'} width={width} note={items.length + ' ' + (items.length === 1 ? 'solution' : 'solutions')}/>; })}</div>
    </article>
    <article className="panel dark-panel"><p className="eyebrow">Portfolio signal</p><h2>{attention.length ? (attention.length + ' decision' + (attention.length === 1 ? '' : 's') + ' need attention.') : 'Portfolio is on track.'}</h2><p>{attention.length ? 'Focus the next review on products with an unresolved health signal or delivery decision.' : 'All products currently have a healthy operating signal.'}</p><div className="dark-stat"><strong>{solutions.length}</strong><span>products in the portfolio</span></div></article>
  </section>
  <section className="section-grid exec-lower-grid">
    <article className="panel decision-panel"><div className="panel-heading"><div><p className="eyebrow">Leadership attention</p><h2>Decisions & risks</h2></div><span className="decision-count">{decisions.length}</span></div>{decisions.length ? <div className="decision-list">{decisions.map((solution) => <div className="decision-item" key={solution.id}><div><strong>{solution.name}</strong><span>{solution.blocker || solution.nextStep}</span></div><b>{solution.health}</b></div>)}</div> : <p className="empty-state">No open product decisions are recorded.</p>}</article>
    <article className="panel roadmap-summary"><div className="panel-heading"><div><p className="eyebrow">Forward view</p><h2>Next milestones</h2></div><Sparkles size={18}/></div><div className="milestone-list">{milestones.map((solution) => <div className="milestone-item" key={solution.id}><span>{new Date(solution.targetDate + 'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span><div><strong>{solution.name}</strong><small>{solution.nextStep}</small></div></div>)}</div></article>
  </section>
  <section className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">Solution portfolio</p><h2>Current product health</h2></div><button className="text-button">All solutions <ArrowRight size={15}/></button></div><SolutionTable solutions={solutions} onEdit={onEdit} onOpen={onOpen}/></section>
</> }

function AdminContent({ section, solutions, subscriptions, technicalProfiles, onEdit, onCreate, onOpen, onEditSubscription, onCreateSubscription, onEditProfile }) {
  if (section === 'Subscriptions') return <SubscriptionsRegister subscriptions={subscriptions} onEdit={onEditSubscription} onCreate={onCreateSubscription}/>;
  if (section === 'Roadmap') return <RoadmapBoard solutions={solutions} onOpen={onOpen} onEdit={onEdit}/>;
  if (section === 'Operations') return <OperationsWorkspace solutions={solutions} profiles={technicalProfiles} onEdit={onEditProfile}/>;
  return <>
  <section className="section-grid admin-grid">
    <article className="panel work-panel"><div className="panel-heading"><div><p className="eyebrow">This week</p><h2>Priority work</h2></div><button className="icon-button" onClick={onCreate} aria-label="Add solution"><Plus size={18}/></button></div>
      <div className="work-list">{workItems.map(item => <div className="work-item" key={item.title}><span className={`status-dot ${item.tone}`}></span><div><strong>{item.title}</strong><span>{item.solution} · Due {item.due}</span></div><em>{item.status}</em></div>)}</div>
    </article>
    <article className="panel operations-panel"><div className="panel-heading"><div><p className="eyebrow">Operations</p><h2>System pulse</h2></div><Activity size={19}/></div>
      <div className="pulse-row"><span>Live tool health</span><strong>Healthy</strong></div><div className="pulse-row"><span>Usage events recorded</span><strong>127</strong></div><div className="pulse-row"><span>Open operational risks</span><strong className="warning">2</strong></div><button className="text-button">Open operations <ArrowRight size={15}/></button>
    </article>
  </section>
  <section className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">{section === 'Overview' ? 'Solution portfolio' : section}</p><h2>{section === 'Overview' ? 'Products at a glance' : `${section} overview`}</h2></div><button className="text-button" onClick={onCreate}>Add solution <ArrowRight size={15}/></button></div><SolutionTable solutions={solutions} onEdit={onEdit} onOpen={onOpen}/></section>
</>}

function Impact({ department, value, width, note }) { return <div className="impact-row"><div><strong>{department}</strong><span>{note}</span></div><div className="impact-bar"><i style={{width:`${width}%`}}></i></div><b>{value}</b></div>; }
function SolutionTable({ solutions, onEdit, onOpen }) { return <div className="solution-table"><div className="table-head"><span>Solution</span><span>Stage</span><span>Health</span><span>Validated value</span><span></span></div>{solutions.map(s => <div className="table-row table-row--interactive" key={s.id || s.name} onClick={() => onOpen(s)}><div className="solution-name"><i className={s.accent}></i><div><strong>{s.name}</strong><span>{s.department} · {s.detail}</span></div></div><span><b className={`tag ${s.stage === 'Live' ? 'live' : 'building'}`}>{s.stage}</b></span><span className={`health ${s.health === 'Healthy' ? 'healthy' : 'attention'}`}><i></i>{s.health}</span><strong>{s.value}</strong><button className="row-action" onClick={(event) => { event.stopPropagation(); onEdit(s); }} aria-label={`Edit ${s.name}`}><Pencil size={15}/></button></div>)}</div>; }

function SubscriptionsRegister({ subscriptions, onEdit, onCreate }) { return <>
  <section className="registry-intro"><div><p className="eyebrow">Admin workspace</p><h1>Subscriptions & hosting</h1><p>One protected view of the services that keep PINE products running.</p></div><button className="primary-button" onClick={onCreate}><Plus size={17}/> Add service</button></section>
  <section className="metrics-grid registry-metrics"><Metric label="Tracked services" value={subscriptions.length} sub="Hosting, data and AI services" icon={<Server size={19}/>}/><Metric label="Review due" value={subscriptions.filter((item) => item.status === 'Review due').length} sub="Renewals or operational checks" icon={<CircleAlert size={19}/>} tone="attention"/><Metric label="Products supported" value="5" sub="Across the current portfolio" icon={<Boxes size={19}/>}/><Metric label="Account owners" value="1" sub="Ownership should always be named" icon={<Users size={19}/>}/></section>
  <section className="panel registry-panel"><div className="panel-heading"><div><p className="eyebrow">Service register</p><h2>Operational dependencies</h2></div><button className="text-button" onClick={onCreate}>Add service <ArrowRight size={15}/></button></div><div className="subscription-table"><div className="subscription-head"><span>Provider</span><span>Category</span><span>Renewal / billing</span><span>Used by</span><span>Owner</span><span></span></div>{subscriptions.map((item) => <div className="subscription-row" key={item.id}><div><strong>{item.provider}</strong><span>{item.detail || 'No operational note yet'}</span></div><span>{item.category}</span><span><b className={item.status === 'Review due' ? 'review-text' : ''}>{item.renewal || 'Not set'}</b><small>{item.status}</small></span><span>{item.solutions || 'Not linked yet'}</span><span>{item.owner || 'Not assigned'}</span><button className="row-action" onClick={() => onEdit(item)} aria-label={`Edit ${item.provider}`}><Pencil size={15}/></button></div>)}</div></section>
</>; }

function SubscriptionEditor({ subscription, onClose, onSave }) {
  const [draft, setDraft] = useState(subscription); const update = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => { event.preventDefault(); if (draft.provider.trim()) onSave({ ...draft, provider: draft.provider.trim(), detail: draft.detail.trim() }); };
  return <div className="modal-backdrop" role="presentation"><section className="solution-editor" role="dialog" aria-modal="true" aria-labelledby="service-editor-title"><div className="editor-heading"><div><p className="eyebrow">Admin only</p><h2 id="service-editor-title">{subscription.provider ? 'Edit service' : 'Add service'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close service editor"><X size={18}/></button></div><form onSubmit={submit}><label>Provider<input autoFocus value={draft.provider} onChange={update('provider')} placeholder="e.g. Vercel" required/></label><div className="form-grid"><label>Category<select value={draft.category} onChange={update('category')}><option value="Hosting">Hosting</option><option value="Database & Auth">Database & Auth</option><option value="AI services">AI services</option><option value="Domain & DNS">Domain & DNS</option><option value="Productivity">Productivity</option><option value="Other">Other</option></select></label><label>Status<select value={canonicalLabel(draft.status) || draft.status} onChange={update('status')}><option value="Healthy">Healthy</option><option value="Review due">Review due</option><option value="At risk">At risk</option></select></label></div><div className="form-grid"><label>Renewal / billing<input value={draft.renewal} onChange={update('renewal')} placeholder="e.g. 2026-08-15 or Monthly"/></label><label>Owner<input value={draft.owner} onChange={update('owner')} placeholder="e.g. Eldar Pine"/></label></div><label>Solutions supported<input value={draft.solutions} onChange={update('solutions')} placeholder="e.g. PINE Workflows, Catalog Matcher"/></label><label>Operational note<textarea value={draft.detail} onChange={update('detail')} rows="3" placeholder="What does this service provide, and what should the team know?"/></label><div className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><FileText size={16}/>Save service</button></div></form></section></div>;
}

function OperationsWorkspace({ solutions, profiles, onEdit }) {
  const solutionById = new Map(solutions.map((solution) => [solution.id, solution]));
  const healthy = profiles.filter((profile) => profile.health === 'Healthy').length;
  const needsAttention = profiles.filter((profile) => profile.health !== 'Healthy').length;
  const risks = profiles.filter((profile) => profile.risk && profile.risk !== 'No current risk').length;
  return <><section className="registry-intro"><div><p className="eyebrow">Admin workspace</p><h1>Operations</h1><p>Keep every product's technical home, support ownership, and risks visible.</p></div></section>
  <section className="metrics-grid registry-metrics"><Metric label="Technical profiles" value={profiles.length} sub="One profile for each solution" icon={<Server size={19}/>}/><Metric label="Healthy products" value={healthy} sub="No operational attention flagged" icon={<Activity size={19}/>}/><Metric label="Needs attention" value={needsAttention} sub="Review risk or ownership" icon={<CircleAlert size={19}/>} tone="attention"/><Metric label="Open risks" value={risks} sub="Known dependencies to manage" icon={<CircleAlert size={19}/>} tone={risks ? 'attention' : ''}/></section>
  <section className="operations-grid">{profiles.map((profile) => { const solution = solutionById.get(profile.solutionId); return <article className="operation-card" key={profile.id}><div className="operation-card-head"><div><p className="eyebrow">{solution?.department || 'Unlinked solution'}</p><h2>{solution?.name || 'Solution not found'}</h2></div><button className="row-action" onClick={() => onEdit(profile)} aria-label={`Edit technical profile for ${solution?.name || 'solution'}`}><Pencil size={15}/></button></div><div className="operation-meta"><span>Hosting</span><strong>{profile.hosting || 'Not recorded'}</strong><span>Repository</span><strong>{profile.repository || 'Not linked'}</strong><span>Database</span><strong>{profile.database || 'Not recorded'}</strong><span>Support owner</span><strong>{profile.supportOwner || 'Not assigned'}</strong></div><div className="operation-footer"><span className={profile.health === 'Healthy' ? 'healthy-text' : 'review-text'}>{profile.health}</span><span>{profile.runbook || 'No runbook linked'}</span></div>{profile.risk && profile.risk !== 'No current risk' && <p className="risk-callout"><CircleAlert size={15}/>{profile.risk}</p>}</article>; })}</section></>;
}

function TechnicalProfileEditor({ profile, solutions, onClose, onSave }) {
  const [draft, setDraft] = useState(profile); const update = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => { event.preventDefault(); onSave(draft); };
  return <div className="modal-backdrop" role="presentation"><section className="solution-editor" role="dialog" aria-modal="true" aria-labelledby="technical-editor-title"><div className="editor-heading"><div><p className="eyebrow">Admin only</p><h2 id="technical-editor-title">Technical profile</h2></div><button className="icon-button" onClick={onClose} aria-label="Close technical profile editor"><X size={18}/></button></div><form onSubmit={submit}><label>Solution<select value={draft.solutionId} onChange={update('solutionId')}>{solutions.map((solution) => <option key={solution.id} value={solution.id}>{solution.name}</option>)}</select></label><div className="form-grid"><label>Hosting<input value={draft.hosting || ''} onChange={update('hosting')} placeholder="e.g. Vercel"/></label><label>Database<input value={draft.database || ''} onChange={update('database')} placeholder="e.g. Supabase"/></label></div><label>Repository<input value={draft.repository || ''} onChange={update('repository')} placeholder="e.g. GitHub repository URL or name"/></label><label>Support owner<input value={draft.supportOwner || ''} onChange={update('supportOwner')} placeholder="e.g. Eldar Pine"/></label><div className="form-grid"><label>Health<select value={canonicalLabel(draft.health) || draft.health} onChange={update('health')}><option value="Healthy">Healthy</option><option value="Attention">Attention</option><option value="At risk">At risk</option></select></label><label>Runbook / support reference<input value={draft.runbook || ''} onChange={update('runbook')} placeholder="e.g. Deployment checklist"/></label></div><label>Operational risk<textarea value={draft.risk || ''} onChange={update('risk')} rows="3" placeholder="Leave as 'No current risk' when everything is stable."/></label><div className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><FileText size={16}/>Save profile</button></div></form></section></div>;
}

function RoadmapBoard({ solutions, onOpen, onEdit }) {
  const stages = ['Discovery', 'Building', 'Testing', 'Live', 'Measuring outcome'];
  return <><section className="registry-intro"><div><p className="eyebrow">Product direction</p><h1>Roadmap</h1><p>Move every solution forward through a visible, evidence-led lifecycle.</p></div><div className="roadmap-legend"><span><i className="healthy-dot"></i> Healthy</span><span><i className="attention-dot"></i> Needs attention</span></div></section><section className="roadmap-board">{stages.map((stage) => { const items = solutions.filter((solution) => (canonicalLabel(solution.roadmapStage) || solution.roadmapStage) === stage); return <article className="roadmap-column" key={stage}><div className="roadmap-column-head"><div><p>{stage}</p><span>{items.length} {items.length === 1 ? 'solution' : 'solutions'}</span></div></div><div className="roadmap-cards">{items.map((solution) => <article className="roadmap-card" key={solution.id} role="button" tabIndex="0" onClick={() => onOpen(solution)}><div><i className={solution.accent}></i><span>{solution.department}</span></div><strong>{solution.name}</strong><p>{solution.nextStep || 'Define the next step.'}</p><footer><span className={solution.health === 'Healthy' ? 'healthy-text' : 'review-text'}>{solution.health}</span><b>{solution.targetDate ? new Date(`${solution.targetDate}T00:00:00`).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : 'No date'}</b></footer><button className="roadmap-edit" onClick={(event) => { event.stopPropagation(); onEdit(solution); }} aria-label={`Edit ${solution.name}`}><Pencil size={13}/></button></article>)}</div></article>; })}</section></>;
}

function SolutionDetail({ solution, onBack, onEdit }) { return <>
  <section className="detail-hero">
    <button className="back-button" onClick={onBack}>← Back to solutions</button>
    <div className="detail-hero-row"><div><p className="eyebrow">{solution.department} · Product record</p><h1>{solution.name}</h1><p>{solution.detail}</p></div><button className="primary-button" onClick={() => onEdit(solution)}><Pencil size={16}/> Edit solution</button></div>
    <div className="detail-badges"><b className={`tag ${solution.stage === 'Live' ? 'live' : 'building'}`}>{solution.stage}</b><span className={`health ${solution.health === 'Healthy' ? 'healthy' : 'attention'}`}><i></i>{solution.health}</span><span>Owner: <strong>{solution.owner || 'Not assigned'}</strong></span></div>
  </section>
  <section className="detail-grid">
    <article className="panel detail-main"><DetailBlock label="Purpose" text={solution.purpose || 'Add the purpose this product serves.'}/><DetailBlock label="Business case" text={solution.businessCase || 'Add the measurable business problem or value hypothesis.'}/><DetailBlock label="Current status" text={solution.detail}/></article>
    <aside className="detail-aside"><article className="panel"><p className="eyebrow">Outcome</p><strong className="detail-value">{solution.value || 'Baseline'}</strong><p className="detail-note">Validated value per month</p></article><article className="panel"><p className="eyebrow">Next step</p><h2>{solution.nextStep || 'Define the next milestone.'}</h2><p className="detail-note">Update this after each review or delivery milestone.</p></article><article className="panel detail-facts"><p className="eyebrow">Product facts</p><div><span>Department</span><strong>{solution.department}</strong></div><div><span>Product owner</span><strong>{solution.owner || 'Not assigned'}</strong></div><div><span>Health</span><strong>{solution.health}</strong></div></article></aside>
  </section>
</>; }
function DetailBlock({ label, text }) { return <section className="detail-block"><p className="eyebrow">{label}</p><p>{text}</p></section>; }

function SolutionEditor({ solution, onClose, onSave }) {
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
    <div className="editor-heading"><div><p className="eyebrow">Admin only</p><h2 id="editor-title">{solution.name ? 'Edit solution' : 'Add solution'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close editor"><X size={18}/></button></div>
    <form onSubmit={submit}>
      <label>Solution name<input autoFocus value={draft.name} onChange={update('name')} placeholder="e.g. Supplier Catalog Matcher" required /></label>
      <label>Department<input value={draft.department} onChange={update('department')} placeholder="e.g. Procurement" required /></label>
      <div className="form-grid"><label>Stage<select value={canonicalLabel(draft.stage) || draft.stage} onChange={update('stage')}><option value="Building">Building</option><option value="Testing">Testing</option><option value="Live">Live</option><option value="Paused">Paused</option></select></label><label>Health<select value={canonicalLabel(draft.health) || draft.health} onChange={update('health')}><option value="Healthy">Healthy</option><option value="Attention">Attention</option><option value="At risk">At risk</option></select></label></div>
      <div className="form-grid"><label>Validated value<input value={draft.value} onChange={update('value')} placeholder="e.g. 12 hrs" /></label><label>Colour<select value={draft.accent} onChange={update('accent')}><option value="teal">Teal</option><option value="blue">Blue</option><option value="amber">Amber</option><option value="violet">Violet</option></select></label></div>
      <label>Product owner<input value={draft.owner || ''} onChange={update('owner')} placeholder="e.g. Eldar Pine" /></label>
      <label>Purpose<textarea value={draft.purpose || ''} onChange={update('purpose')} rows="3" placeholder="What does this solution help the department do?" /></label>
      <label>Business case<textarea value={draft.businessCase || ''} onChange={update('businessCase')} rows="3" placeholder="What time, cost, quality, or risk problem does it address?" /></label>
      <label>Current status<textarea value={draft.detail} onChange={update('detail')} rows="3" placeholder="Describe adoption, delivery progress or the next review." required /></label>
      <label>Next step<textarea value={draft.nextStep || ''} onChange={update('nextStep')} rows="2" placeholder="What must happen next?" /></label>
      <div className="form-grid"><label>Roadmap stage<select value={canonicalLabel(draft.roadmapStage) || draft.roadmapStage || 'Discovery'} onChange={update('roadmapStage')}><option value="Discovery">Discovery</option><option value="Building">Building</option><option value="Testing">Testing</option><option value="Live">Live</option><option value="Measuring outcome">Measuring outcome</option></select></label><label>Target date<input type="date" value={draft.targetDate || ''} onChange={update('targetDate')}/></label></div>
      <label>Blocker or decision needed<textarea value={draft.blocker || ''} onChange={update('blocker')} rows="2" placeholder="Leave empty if there is no current blocker."/></label>
      <label>Future AI opportunity<textarea value={draft.aiOpportunity || ''} onChange={update('aiOpportunity')} rows="2" placeholder="Describe a realistic future AI assist, or explain why none is planned."/></label>
      <div className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><FileText size={16}/>Save solution</button></div>
    </form>
  </section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
