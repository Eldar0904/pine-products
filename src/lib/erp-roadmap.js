export const ERP_ROADMAP_STORAGE_KEY = 'pine-product-hub-erp-roadmap-v1';

const phase = (number, title, goal, steps, exitCriteria) => ({
  id: `phase-${number}`,
  number,
  title,
  goal,
  exitCriteria,
  steps: steps.map((text, index) => ({
    id: `phase-${number}-step-${index + 1}`,
    text,
    status: 'Planned',
    notes: '',
  })),
});

export const seedErpRoadmap = [
  phase(0, 'Discovery and vocabulary', 'Turn process maps and interviews into a shared language.', [
    'Select one project archetype and two or three collaborating departments.',
    'Capture process maps using the intake template.',
    'Define the first role matrix, project lifecycle, handoff contract, approval policies, and document classifications.',
    'Identify the minimum audit and retention requirements.',
    'Validate the stack and choose the initial durable job runner and storage adapter.',
  ], 'One bounded pilot process is mapped end-to-end, including happy path, rework, rejection, timeout, and cancellation.'),
  phase(1, 'Foundation and project context', 'Make the project a trustworthy shared context.', [
    'Managed identity and organization membership.',
    'Departments, roles, project membership, and scoped authorization.',
    'Project create/read/update/archive.',
    'Project activity timeline and comments.',
    'Document metadata plus object storage upload intents.',
    'OpenAPI contracts, generated client, structured logging, audit foundation.',
  ], 'Pilot users can create a project, collaborate, attach evidence, and see a reliable history.'),
  phase(2, 'Work queue and explicit handoffs', 'Replace scattered follow-up with accountable work.', [
    'Task lifecycle, assignment, due dates, blockers, dependencies, and rework.',
    'Role-aware My Work queue.',
    'Handoff offer/accept/return/reject flow.',
    'Notifications and mentions, initially in-app plus one outbound channel.',
    'Responsive task completion for phone and tablet.',
  ], 'A cross-department project can move through handoffs without relying on a separate tracker or chat thread for ownership.'),
  phase(3, 'Configurable workflow runtime', 'Make the pilot process configurable and durable.', [
    'Workflow definitions and immutable published versions.',
    'Workflow instances, task/approval generation, rules, parallel paths, timers, and SLAs.',
    'Durable outbox and worker with retry/dead-letter visibility.',
    'Workflow validation and simulator.',
    'Activity and audit projections from events.',
  ], 'An authorized administrator can configure and publish the pilot workflow, and a running instance remains correct across worker/API restarts.'),
  phase(4, 'Approvals, deliverables, and project cockpit', 'Connect decisions and outcomes to the project.', [
    'Approval policies and separation of duties.',
    'Deliverables, acceptance evidence, and document version requirements.',
    'Project cockpit with work, risks, handoffs, deliverables, budget snapshot, and activity.',
    'SLA escalation and exception inbox.',
    'Basic budget and cost tracking.',
  ], 'Project leads can see the full operational picture and resolve overdue or blocked work from one place.'),
  phase(5, 'Integrations and reporting', 'Reduce duplicate entry without giving up ownership clarity.', [
    'Adapter framework with connection health and reconciliation.',
    'First calendar/collaboration integration based on validated demand.',
    'Finance import/export boundary with idempotency and approval controls.',
    'Search, saved views, operational reporting, and curated analytics export.',
    'Organization-level templates and workflow reuse.',
  ], 'Integrations are observable, replayable, and do not make external systems the hidden source of workflow truth.'),
  phase(6, 'Scale and selective extraction', 'Respond to proven constraints rather than hypothetical scale.', [
    'Load test queue, cockpit, event lag, and document flows.',
    'Partition/archive high-volume activity and audit data if needed.',
    'Add read-model workers or a dedicated search index where measurements justify them.',
    'Consider extracting a module only when its ownership, scale, deployment cadence, or failure isolation is materially different.',
    'Consider a dedicated workflow runtime only against the triggers in the system context document.',
  ], 'Scale changes are introduced only in response to measured constraints and preserve clear module ownership.'),
];

export function loadErpRoadmap() {
  try {
    const stored = JSON.parse(localStorage.getItem(ERP_ROADMAP_STORAGE_KEY));
    return Array.isArray(stored) && stored.length ? stored : seedErpRoadmap;
  } catch {
    return seedErpRoadmap;
  }
}
