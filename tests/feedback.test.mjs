import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createFeedbackHandler } from '../feedback-api.js'

const valid = { requestId: 'abf45a30-126c-45f1-9012-9480c998e1ab', solution: 'edumax', department: 'Білім беру', rating: 5, name: '', message: 'Тіркеу үдерісі ыңғайлы болды.' }
const env = { SUPABASE_URL: 'https://example.supabase.co', PINE_USAGE_SUPABASE_SERVICE_ROLE_KEY: 'test-key' }
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v }, end(v) { this.body=JSON.parse(v) } } }
function request(body = valid) { return { method: 'POST', headers: { host: 'pine.test', origin: 'https://pine.test', 'content-type': 'application/json' }, body } }
const client = error => () => ({ from(table) { assert.equal(table, 'employee_feedback'); return { async insert(row) { assert.equal(row.employee_name, null); assert.equal(row.rating, 5); return { error } } } } })
test('saves valid feedback and does not echo employee data', async () => { const res=response(); await createFeedbackHandler(env,client(null))(request(),res); assert.equal(res.statusCode,201); assert.deepEqual(res.body,{ok:true}) })
test('accepts retry of an already saved request', async () => { const res=response(); await createFeedbackHandler(env,client({code:'23505'}))(request(),res); assert.equal(res.statusCode,200) })
test('does not claim success when the database rejects a write', async () => { const res=response(); await createFeedbackHandler(env,client({message:'secret DB detail'}))(request(),res); assert.equal(res.statusCode,503); assert.ok(!JSON.stringify(res.body).includes('secret')) })
test('does not send feedback without a configured database', async () => { const res=response(); await createFeedbackHandler({})(request(),res); assert.equal(res.statusCode,503) })
test('rejects ratings, IDs and solution IDs outside the contract', async () => { for(const change of [{rating:6},{solution:'unknown'},{requestId:'invalid'},{message:'short'}]) {const res=response(); await createFeedbackHandler(env)(request({...valid,...change}),res); assert.equal(res.statusCode,400)} })
test('rejects cross origin submissions', async () => { const req=request(); req.headers.origin='https://other.test'; const res=response(); await createFeedbackHandler(env)(req,res); assert.equal(res.statusCode,403) })
test('supports raw Vite request bodies', async () => {const req=Readable.from([JSON.stringify(valid)]); Object.assign(req,{method:'POST',headers:request().headers}); const res=response(); await createFeedbackHandler(env,client(null))(req,res); assert.equal(res.statusCode,201) })
test('reports unconfigured state and restricts methods', async () => { for(const [method,expected] of [['GET',200],['DELETE',405]]) {const res=response(); await createFeedbackHandler({})({method,headers:{}},res); assert.equal(res.statusCode,expected)} })
