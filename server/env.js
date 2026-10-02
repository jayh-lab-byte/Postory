import { loadEnv } from 'vite'

const KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'DATABASE_URL',
  'BLOB_READ_WRITE_TOKEN',
  'PEXELS_API_KEY',
  'NAVER_CLIENT_ID',
  'NAVER_CLIENT_SECRET',
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
]

export function currentEnv() {
  const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'
  const fromFile = loadEnv(mode, process.cwd(), '')
  const env = {}
  KEYS.forEach((key) => {
    const value = process.env[key] || fromFile[key] || ''
    if (value) env[key] = value
  })
  return env
}
