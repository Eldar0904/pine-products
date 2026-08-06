import { loadExecutiveSnapshot } from '../executive-api.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const snapshot = await loadExecutiveSnapshot(process.env)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
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
