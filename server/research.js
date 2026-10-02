const STOP = new Set(['블로그', '리뷰', '후기', '오늘', '그리고', '있는', '하는', '에서', '으로', '이번', '정말', '너무'])

export async function searchNaverKeywords(env, query) {
  const q = String(query || '').trim().slice(0, 80)
  if (!q) return { provider: 'naver', keywords: [] }
  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
    return { provider: 'missing', keywords: [] }
  }
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(q)}&display=8&sort=sim`
  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET,
    },
  })
  if (!response.ok) {
    const error = new Error('naver')
    error.code = response.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM'
    throw error
  }
  const payload = await response.json()
  const counts = {}
  ;(payload.items || []).forEach((item) => {
    const title = String(item.title || '').replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ')
    const words = title.match(/[가-힣A-Za-z0-9]{2,}/g) || []
    words.forEach((word) => {
      if (STOP.has(word) || q.includes(word)) return
      counts[word] = (counts[word] || 0) + 1
    })
  })
  const keywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word)
  return { provider: 'naver', keywords }
}

export async function searchPexels(env, query) {
  const q = String(query || '').trim().slice(0, 80)
  if (!env.PEXELS_API_KEY) return { provider: 'missing', photos: [] }
  if (!q) return { provider: 'pexels', photos: [] }
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=8&locale=ko-KR`
  const response = await fetch(url, { headers: { Authorization: env.PEXELS_API_KEY } })
  if (!response.ok) {
    const error = new Error('pexels')
    error.code = response.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM'
    throw error
  }
  const payload = await response.json()
  const photos = (payload.photos || []).map((photo) => ({
    id: photo.id,
    alt: photo.alt || '보조 사진',
    preview: photo.src?.medium || '',
    download: photo.src?.large || photo.src?.medium || '',
    photographer: photo.photographer || '',
  }))
  return { provider: 'pexels', photos }
}

export async function importPexelsImage(url) {
  const target = String(url || '')
  if (!/^https:\/\/images\.pexels\.com\//.test(target)) {
    const error = new Error('url')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  const response = await fetch(target)
  if (!response.ok) {
    const error = new Error('image')
    error.code = 'UPSTREAM'
    throw error
  }
  const type = response.headers.get('content-type') || 'image/jpeg'
  if (!/^image\/(jpeg|png|webp)/.test(type)) {
    const error = new Error('type')
    error.code = 'VALIDATION_ERROR'
    throw error
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > 8_000_000) {
    const error = new Error('size')
    error.code = 'PAYLOAD_TOO_LARGE'
    throw error
  }
  const mime = type.includes('png') ? 'image/png' : type.includes('webp') ? 'image/webp' : 'image/jpeg'
  return { dataUrl: `data:${mime};base64,${buffer.toString('base64')}`, mime }
}
