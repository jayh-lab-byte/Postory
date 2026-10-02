import { currentEnv } from './env.js'
import { readBody, sendJson } from './http.js'
import { dispatch } from './router.js'

export function postoryApi() {
  const handle = async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    if (!url.pathname.startsWith('/api/')) {
      next()
      return
    }
    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? null : await readBody(req)
      const result = await dispatch({
        method: req.method,
        pathname: url.pathname,
        searchParams: url.searchParams,
        body,
        env: currentEnv(),
      })
      sendJson(res, result.status, result.body)
    } catch (error) {
      const code = error.code || 'INTERNAL'
      const status = code === 'VALIDATION_ERROR' ? 400 : code === 'PAYLOAD_TOO_LARGE' ? 413 : 500
      sendJson(res, status, { error: { code, message: '요청을 처리하지 못했습니다.' } })
    }
  }

  return {
    name: 'postory-api',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}
