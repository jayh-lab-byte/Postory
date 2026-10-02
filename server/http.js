const MAX_BODY = 8_000_000

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        const error = new Error('payload')
        error.code = 'PAYLOAD_TOO_LARGE'
        reject(error)
        req.destroy()
      } else {
        chunks.push(chunk)
      }
    })
    req.on('end', () => {
      if (!chunks.length) {
        resolve(null)
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        const error = new Error('json')
        error.code = 'VALIDATION_ERROR'
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(payload)
}

export function serviceFlags(env) {
  return {
    openai: Boolean(env.OPENAI_API_KEY),
    pexels: Boolean(env.PEXELS_API_KEY),
    naver: Boolean(env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET),
  }
}
