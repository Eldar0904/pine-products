import { createUsageApiMiddleware } from '../../usage-api.js'

const middleware = createUsageApiMiddleware()

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }
  return middleware(req, res, () => {
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
  })
}
