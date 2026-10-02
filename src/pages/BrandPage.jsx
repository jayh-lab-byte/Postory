import { useEffect, useState } from 'react'
import { useProjects } from '../context/ProjectContext'

export default function BrandPage() {
  const { profile, saveUserProfile } = useProjects()
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio)
  const [tone, setTone] = useState(profile.tone)

  useEffect(() => {
    setName(profile.name || '')
    setBio(profile.bio || '')
    setTone(profile.tone || '')
  }, [profile.name, profile.bio, profile.tone])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-display">브랜드 프로필</h1>
      <p className="mt-2 text-sm text-text-secondary">
        이름과 한 줄 소개, 톤 메모를 저장합니다. 금지어와 과거 글 학습은 다음 단계에서 다룹니다.
      </p>
      <form
        className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-card"
        onSubmit={(event) => {
          event.preventDefault()
          saveUserProfile({ name, bio, tone })
        }}
      >
        <label className="block text-sm font-semibold">
          표시 이름
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          한 줄 소개
          <input value={bio} onChange={(event) => setBio(event.target.value)} className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          톤 메모
          <textarea value={tone} onChange={(event) => setTone(event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 font-normal" placeholder="예: 짧은 문장, 존댓말" />
        </label>
        <button type="submit" className="rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white">저장</button>
      </form>
    </div>
  )
}
