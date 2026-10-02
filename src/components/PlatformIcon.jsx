import { useId } from 'react'

export function PlatformIcon({ id, className = 'h-6 w-6' }) {
  const rawId = useId().replace(/:/g, '')
  if (id === 'BLOG') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="#03C75A" />
        <path fill="#fff" d="M7 6.5h2.6l2.4 4.6V6.5H17v11h-2.7l-2.3-4.4v4.4H7v-11z" />
      </svg>
    )
  }
  if (id === 'INSTAGRAM') {
    const gradientId = `ig-${rawId}`
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="2" y1="22" x2="22" y2="2">
            <stop stopColor="#f9ce34" />
            <stop offset="0.45" stopColor="#ee2a7b" />
            <stop offset="1" stopColor="#6228d7" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill={`url(#${gradientId})`} />
        <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="3.4" fill="none" stroke="#fff" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.7" fill="none" stroke="#fff" strokeWidth="1.6" />
        <circle cx="16.3" cy="7.8" r="0.8" fill="#fff" />
      </svg>
    )
  }
  if (id === 'FACEBOOK') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="#1877F2" />
        <path fill="#fff" d="M13.4 18.5v-5.2h1.8l.3-2h-2.1V10c0-.6.2-1 1.1-1h1.1V7.1c-.2 0-1-.2-1.9-.2-1.9 0-3.2 1.2-3.2 3.3v1.1H8.8v2h1.7v5.2h2.9z" />
      </svg>
    )
  }
  if (id === 'X') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="#111111" />
        <path fill="#fff" d="M6.6 6.8h2.2l2.6 3.5 2.9-3.5h2.2l-3.9 4.6 4.2 5.8h-2.2l-2.9-4-3.2 4H6.3l4.2-5.2L6.6 6.8z" />
      </svg>
    )
  }
  if (id === 'THREADS') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="#111111" />
        <path
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          d="M9.2 10.2c.5-2 2-3.2 3.8-3.2 2.4 0 3.8 1.5 3.8 3.7 0 3.4-2.6 5.2-5.4 5.2-2.2 0-3.6-1.1-3.6-2.6 0-1.2.8-2 2.1-2.1 1.6-.1 2.7.6 2.9 1.8"
        />
        <path fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" d="M12.8 7.2v4.4" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path fill="#fff" d="M10 8.2v7.6l6.4-3.8L10 8.2z" />
    </svg>
  )
}
