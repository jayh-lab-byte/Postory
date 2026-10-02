export const PURPOSES = [
  { id: 'travel', label: '여행', icon: 'flight' },
  { id: 'daily', label: '일상', icon: 'wb_sunny' },
  { id: 'cafe', label: '카페', icon: 'local_cafe' },
  { id: 'restaurant', label: '맛집', icon: 'restaurant' },
  { id: 'product', label: '제품', icon: 'inventory_2' },
  { id: 'service', label: '서비스', icon: 'handshake' },
]

export const PURPOSE_MAP = Object.fromEntries(PURPOSES.map((item) => [item.id, item]))

export const PLATFORMS = [
  { id: 'BLOG', label: '네이버 블로그', short: 'N', color: 'text-platform-blog', bg: 'bg-emerald-50' },
  { id: 'INSTAGRAM', label: 'Instagram', short: 'IG', color: 'text-platform-instagram', bg: 'bg-pink-50' },
  { id: 'X', label: 'X', short: 'X', color: 'text-text-display', bg: 'bg-canvas-surface' },
  { id: 'THREADS', label: 'Threads', short: '@', color: 'text-text-display', bg: 'bg-zinc-100' },
  { id: 'FACEBOOK', label: 'Facebook', short: 'FB', color: 'text-platform-facebook', bg: 'bg-blue-50' },
  { id: 'YOUTUBE_SHORTS', label: 'YouTube Shorts', short: 'YT', color: 'text-platform-youtube', bg: 'bg-red-50' },
]

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((item) => [item.id, item]))

export const BLOG_MODES = [
  { id: 'search', label: '검색 중심' },
  { id: 'story', label: '스토리 중심' },
  { id: 'review', label: '리뷰 중심' },
]

export const PLATFORM_LINKS = {
  BLOG: 'https://blog.naver.com',
  INSTAGRAM: 'https://www.instagram.com/',
  FACEBOOK: 'https://www.facebook.com/',
  X: 'https://x.com/compose/post',
  THREADS: 'https://www.threads.net/',
  YOUTUBE_SHORTS: 'https://www.youtube.com/upload',
}

export const MAX_PHOTOS = 10
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
