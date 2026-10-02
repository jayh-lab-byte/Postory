import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'

export default function SettingsPage() {
  const [services, setServices] = useState(null)

  useEffect(() => {
    let alive = true
    apiRequest('/api/health')
      .then((data) => {
        if (alive) setServices(data.services || {})
      })
      .catch(() => {
        if (alive) setServices(null)
      })
    return () => {
      alive = false
    }
  }, [])

  const rows = [
    ['openai', '스토리 작성'],
    ['pexels', '보조 사진'],
    ['naver', '검색 보조 키워드'],
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-display">설정</h1>
      <div className="mt-6 space-y-3 rounded-2xl bg-white p-5 text-sm leading-6 text-text-secondary shadow-card">
        <p>작업과 사진은 이 브라우저에 저장됩니다. 서버에는 글을 만들 때 메모와 사실, 사진 관찰이 필요한 경우에만 전달됩니다.</p>
        <p>OpenAI 키는 `.env` 또는 `.env.local`의 OPENAI_API_KEY에 저장합니다. 저장하면 다음 스토리 작성부터 서버가 읽습니다. 계정 로그인, 외부 발행, 결제 플랜은 아직 연결하지 않습니다.</p>
        <ul className="space-y-2 pt-2">
          {rows.map(([key, label]) => (
            <li key={key} className="flex items-center justify-between rounded-xl bg-canvas-subtle px-3 py-2">
              <span>{label}</span>
              <span className={services?.[key] ? 'font-semibold text-state-verified' : 'font-semibold text-text-tertiary'}>
                {services == null ? '확인 중' : services[key] ? '연결됨' : '키 없음'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
