const normaliseBaseUrl = (value) => String(value || '').trim().replace(/\/$/, '')

export async function loadUsageFeed(env = process.env) {
  const baseUrl = normaliseBaseUrl(env.PINEGROUP_GZ_API_URL)
  const token = String(env.PRODUCT_HUB_USAGE_TOKEN || '').trim()
  if (!baseUrl || !token) return { rows: [], configured: false, fetchedAt: new Date().toISOString() }

  const response = await fetch(`${baseUrl}/api/integrations/product-hub/usage`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Goszakup output feed returned HTTP ${response.status}`)
  const usage = await response.json()

  return {
    configured: true,
    fetchedAt: new Date().toISOString(),
    rows: Array.isArray(usage.rows) ? usage.rows : [],
  }
}

export function createUsageApiMiddleware(env = process.env) {
  return async function usageApiMiddleware(req, res, next) {
    if (req.url?.split('?')[0] !== '/api/usage') return next()
    try {
      const feed = await loadUsageFeed(env)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'private, max-age=60')
      res.end(JSON.stringify(feed))
    } catch (error) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Usage feed failed' }))
    }
  }
}
