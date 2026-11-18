import { createClient } from '@supabase/supabase-js'

const solutionIds = new Set(['goszakup', 'offers', 'agreements', 'edumax', 'documents'])
const departments = new Set(['B2B', 'Коммерция', 'Оперблок', 'Заң бөлімі', 'Білім беру', 'Басқа'])
export function validateFeedback(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid feedback')
  if (!solutionIds.has(body.solution) || !departments.has(body.department)) throw new Error('Select a solution and department')
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw new Error('Rating must be from 1 to 5')
  if (typeof body.message !== 'string' || body.message.trim().length < 10 || body.message.length > 2000) throw new Error('Feedback must be 10–2000 characters')
  if (body.name != null && (typeof body.name !== 'string' || body.name.length > 80)) throw new Error('Name is too long')
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)) throw new Error('Invalid request ID')
  return { id: body.requestId, solution_id: body.solution, department: body.department, rating: body.rating, message: body.message.trim(), employee_name: body.name?.trim() || null }
}

export function createFeedbackHandler(env = process.env, makeClient = createClient) {
  return async function feedback(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    const send = (code, body) => { res.statusCode = code; res.end(JSON.stringify(body)) }
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
    const key = env.PINE_USAGE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
    const configured = Boolean(url && key)
    if (req.method === 'GET') return send(200, { configured })
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, { error: 'Method not allowed' }) }
    const host = req.headers['x-forwarded-host'] || req.headers.host
    if (req.headers.origin) {
      try { if (new URL(req.headers.origin).host !== host) return send(403, { error: 'Origin not allowed' }) }
      catch { return send(403, { error: 'Origin not allowed' }) }
    }
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(415, { error: 'JSON required' })
    if (Number(req.headers['content-length']) > 16000) return send(413, { error: 'Feedback is too large' })
    let row
    try {
      let body = req.body
      if (body === undefined) {
        const chunks = []; let size = 0
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk)
          if (size > 16000) return send(413, { error: 'Feedback is too large' })
          chunks.push(Buffer.from(chunk))
        }
        body = JSON.parse(Buffer.concat(chunks).toString())
      } else if (typeof body === 'string' || Buffer.isBuffer(body)) body = JSON.parse(body.toString())
      if (Buffer.byteLength(JSON.stringify(body)) > 16000) return send(413, { error: 'Feedback is too large' })
      row = validateFeedback(body)
    } catch { return send(400, { error: 'Check your feedback fields' }) }
    if (!configured) return send(503, { error: 'Feedback collection is not configured' })
    try {
      const db = makeClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      const { error } = await db.from('employee_feedback').insert(row)
      if (error?.code === '23505') return send(200, { ok: true })
      if (error) return send(503, { error: 'Feedback could not be saved. Please retry.' })
      return send(201, { ok: true })
    } catch { return send(503, { error: 'Feedback could not be saved. Please retry.' }) }
  }
}

export function createFeedbackMiddleware(env = process.env) {
  const handler = createFeedbackHandler(env)
  return (req, res, next) => req.url?.split('?')[0] === '/api/feedback' ? handler(req, res) : next()
}
