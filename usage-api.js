import { createClient } from '@supabase/supabase-js'

const normaliseBaseUrl = (value) => String(value || '').trim().replace(/\/$/, '')
const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' }

function usageDatabase(env) {
  const url = normaliseBaseUrl(env.VITE_SUPABASE_URL || env.SUPABASE_URL)
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || env.PINE_USAGE_SUPABASE_SERVICE_ROLE_KEY || '').trim()
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null
}

function validateEvent(body) {
  const solutionId = String(body?.solutionId || body?.solution_id || '').trim()
  const eventName = String(body?.event || body?.eventName || 'output.generated').trim()
  const quantity = Number(body?.quantity ?? 1)
  if (!solutionId || solutionId.length > 120) throw new Error('solutionId is required')
  if (!eventName || eventName.length > 120) throw new Error('event is required')
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error('quantity must be an integer from 1 to 1000')
  const occurredAt = body?.occurredAt ? new Date(body.occurredAt) : new Date()
  if (Number.isNaN(occurredAt.getTime())) throw new Error('occurredAt must be a valid date')
  return {
    solution_id: solutionId, event_name: eventName, quantity,
    metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    occurred_at: occurredAt.toISOString(), source: String(body?.source || 'instrument').slice(0, 120),
    idempotency_key: body?.idempotencyKey ? String(body.idempotencyKey).slice(0, 180) : null,
  }
}

async function recordUsageEvent(env, event) {
  const db = usageDatabase(env)
  if (!db) throw new Error('Usage database is not configured')
  const { data, error } = await db.from('usage_events').insert(event).select('id').single()
  if (error?.code === '23505' && event.idempotency_key) return { duplicate: true, id: null }
  if (error) throw error
  return { duplicate: false, id: data.id }
}

async function loadDatabaseUsage(env) {
  const db = usageDatabase(env)
  if (!db) return null
  const { data, error } = await db.from('usage_events').select('solution_id, quantity, occurred_at')
  if (error) throw error
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0)
  const rows = new Map()
  for (const event of data || []) {
    const row = rows.get(event.solution_id) || { solution_id: event.solution_id, total: 0, this_month: 0 }
    row.total += Number(event.quantity) || 0
    if (new Date(event.occurred_at) >= monthStart) row.this_month += Number(event.quantity) || 0
    rows.set(event.solution_id, row)
  }
  return [...rows.values()].map((row) => ({ ...row, unit: 'outputs', short_unit: '' }))
}

export async function loadUsageFeed(env = process.env) {
  const databaseRows = await loadDatabaseUsage(env)
  if (databaseRows) return { rows: databaseRows, configured: true, source: 'supabase', fetchedAt: new Date().toISOString() }
  const baseUrl = normaliseBaseUrl(env.PINEGROUP_GZ_API_URL)
  const token = String(env.PRODUCT_HUB_USAGE_TOKEN || '').trim()
  if (!baseUrl || !token) return { rows: [], configured: false, fetchedAt: new Date().toISOString() }
  const response = await fetch(`${baseUrl}/api/integrations/product-hub/usage`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`Goszakup output feed returned HTTP ${response.status}`)
  const usage = await response.json()
  return { configured: true, source: 'external-feed', fetchedAt: new Date().toISOString(), rows: Array.isArray(usage.rows) ? usage.rows : [] }
}

export function createUsageApiMiddleware(env = process.env) {
  return async function usageApiMiddleware(req, res, next) {
    const path = req.url?.split('?')[0]
    if (path !== '/api/usage' && path !== '/api/usage/events') return next()
    if (req.method === 'POST' && path === '/api/usage/events') {
      try {
        const expected = String(env.PRODUCT_HUB_USAGE_TOKEN || '').trim()
        const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
        if (!expected || provided !== expected) { res.statusCode = 401; res.setHeader('Content-Type', jsonHeaders['Content-Type']); res.end(JSON.stringify({ error: 'Unauthorized' })); return }
        let raw = ''; for await (const chunk of req) raw += chunk
        const result = await recordUsageEvent(env, validateEvent(JSON.parse(raw)))
        res.statusCode = result.duplicate ? 200 : 201; Object.entries(jsonHeaders).forEach(([k, v]) => res.setHeader(k, v)); res.end(JSON.stringify({ ok: true, ...result })); return
      } catch (error) { res.statusCode = 400; Object.entries(jsonHeaders).forEach(([k, v]) => res.setHeader(k, v)); res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Usage event failed' })); return }
    }
    if (req.method !== 'GET' || path !== '/api/usage') return next()
    try { const feed = await loadUsageFeed(env); res.statusCode = 200; Object.entries(jsonHeaders).forEach(([k, v]) => res.setHeader(k, v)); res.setHeader('Cache-Control', 'private, max-age=60'); res.end(JSON.stringify(feed)) }
    catch (error) { res.statusCode = 502; Object.entries(jsonHeaders).forEach(([k, v]) => res.setHeader(k, v)); res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Usage feed failed' })) }
  }
}
