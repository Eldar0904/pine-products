/**
 * Public executive portfolio snapshot for Pineapple (and other readers).
 * Served at GET /api/executive by the Vite preview/dev middleware.
 */

const SEED_SOLUTIONS = [
  {
    id: 'offer-generator',
    name: 'Commercial Offer Generator',
    department: 'Procurement',
    stage: 'Live',
    health: 'Healthy',
    value: '28 hrs',
    detail: '86 completed offers this month',
    nextStep: 'Validate the monthly time-saving baseline with Procurement.',
    targetDate: '2026-08-09',
    blocker: '',
  },
  {
    id: 'agreement-generator',
    name: 'Agreement Generator',
    department: 'Legal',
    stage: 'Live',
    health: 'Healthy',
    value: '14 hrs',
    detail: '41 agreements generated this month',
    nextStep: 'Review the latest Legal template update.',
    targetDate: '2026-08-02',
    blocker: 'Waiting for the latest approved Legal template.',
  },
  {
    id: 'catalog-matcher',
    name: 'Catalog Matcher',
    department: 'Procurement',
    stage: 'Building',
    health: 'Attention',
    value: 'Pilot',
    detail: 'Matching rules being validated',
    nextStep: 'Validate matching rules with Procurement.',
    targetDate: '2026-08-16',
    blocker: 'Representative supplier catalogues are still being validated.',
  },
  {
    id: 'edumax-administration',
    name: 'EduMax Administration',
    department: 'Academic',
    stage: 'Live',
    health: 'Healthy',
    value: '—',
    detail: 'Outcome baseline due in August',
    nextStep: 'Record the manual baseline and schedule an outcome review.',
    targetDate: '2026-08-23',
    blocker: '',
  },
]

function titleCase(value) {
  if (!value) return value
  return value[0].toUpperCase() + value.slice(1)
}

function normalizeHealth(health) {
  if (!health) return 'Attention'
  if (health === 'at_risk') return 'At risk'
  const text = String(health).replace(/_/g, ' ')
  return text[0].toUpperCase() + text.slice(1)
}

function normalizeStage(stage) {
  if (!stage) return 'Building'
  return titleCase(String(stage))
}

function fromRecord(record) {
  const seed = SEED_SOLUTIONS.find((item) => item.id === record.id || item.name === record.name)
  return {
    id: record.id,
    name: record.name,
    department: record.departments?.name || seed?.department || 'Unassigned',
    stage: normalizeStage(record.stage),
    health: normalizeHealth(record.health),
    value: record.validated_value ?? seed?.value ?? '—',
    detail: record.current_status ?? seed?.detail ?? '',
    nextStep: seed?.nextStep ?? '',
    targetDate: seed?.targetDate ?? '',
    blocker: seed?.blocker ?? '',
  }
}

function hoursFromValue(value) {
  const match = String(value ?? '').match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

function buildExecutivePreview(solutions, source) {
  const attention = solutions.filter((item) => item.health !== 'Healthy')
  const live = solutions.filter((item) => item.stage === 'Live')
  const healthy = solutions.filter((item) => item.health === 'Healthy')
  const validatedHours = solutions.reduce((sum, item) => sum + hoursFromValue(item.value), 0)

  const byDepartmentMap = new Map()
  for (const item of solutions) {
    const bucket = byDepartmentMap.get(item.department) ?? { department: item.department, solutions: 0, hours: 0 }
    bucket.solutions += 1
    bucket.hours += hoursFromValue(item.value)
    byDepartmentMap.set(item.department, bucket)
  }

  const milestones = [...solutions]
    .filter((item) => item.targetDate)
    .sort((a, b) => String(a.targetDate).localeCompare(String(b.targetDate)))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.name,
      targetDate: item.targetDate,
      nextStep: item.nextStep || item.detail,
    }))

  return {
    view: 'executive',
    source,
    hubUrl: process.env.PRODUCTS_HUB_PUBLIC_URL || '',
    fetchedAt: new Date().toISOString(),
    productCount: solutions.length,
    validatedHours,
    healthyCount: healthy.length,
    attentionCount: attention.length,
    liveCount: live.length,
    byDepartment: [...byDepartmentMap.values()].sort((a, b) => b.hours - a.hours),
    attention: attention.map((item) => ({
      id: item.id,
      name: item.name,
      health: item.health,
      detail: item.blocker || item.nextStep || item.detail,
      department: item.department,
      stage: item.stage,
    })),
    milestones,
    products: solutions.map((item) => ({
      id: item.id,
      name: item.name,
      department: item.department,
      stage: item.stage,
      health: item.health,
      value: item.value,
      detail: item.detail,
    })),
  }
}

export async function loadExecutiveSnapshot(env = process.env) {
  const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').trim().replace(/\/$/, '')
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '').trim()

  if (url && key) {
    const endpoint =
      `${url}/rest/v1/solutions` +
      '?select=id,name,stage,health,validated_value,current_status,accent,departments(name)' +
      '&order=name'
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (res.ok) {
      const rows = await res.json()
      if (Array.isArray(rows) && rows.length > 0) {
        return buildExecutivePreview(rows.map(fromRecord), 'supabase')
      }
    }
  }

  return buildExecutivePreview(SEED_SOLUTIONS, 'seed')
}

export function createExecutiveApiMiddleware(env = process.env) {
  return async function executiveApiMiddleware(req, res, next) {
    const path = req.url?.split('?')[0]
    if (path !== '/api/executive' && path !== '/api/executive.json') {
      next()
      return
    }

    try {
      const snapshot = await loadExecutiveSnapshot(env)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=60')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.end(JSON.stringify(snapshot))
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Executive snapshot failed',
        })
      )
    }
  }
}
