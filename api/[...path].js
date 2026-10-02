import { readBody, sendJson } from '../server/http.js'
import { dispatch } from '../server/router.js'

export default async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost')
  try {
    const body = req.method === 'GET' || req.method === 'HEAD' ? null : req.body ?? (await readBody(req))
    const result = await dispatch({
      method: req.method,
      pathname: url.pathname,
      searchParams: url.searchParams,
      body,
      env: process.env,
    })
    sendJson(res, result.status, result.body)
  } catch (error) {
    const code = error.code || 'INTERNAL'
    const status = code === 'VALIDATION_ERROR' ? 400 : code === 'PAYLOAD_TOO_LARGE' ? 413 : 500
    sendJson(res, status, { error: { code, message: '요청을 처리하지 못했습니다.' } })
  }
}
