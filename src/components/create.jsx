import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALLOWED_TYPES, MAX_PHOTO_BYTES, MAX_PHOTOS, PLATFORM_MAP, PURPOSE_MAP, PURPOSES } from '../data/catalog'
import { PlatformIcon } from './PlatformIcon'
import { useProjects } from '../context/ProjectContext'
import { readImageFile, uid } from '../lib/media'
import { Icon } from './shell'

export function PurposeChips({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="콘텐츠 목적">
      {PURPOSES.map((purpose) => {
        const selected = value === purpose.id
        return (
          <button
            key={purpose.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(purpose.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold ${
              selected ? 'bg-surface-container text-primary-container shadow-card' : 'bg-canvas-subtle text-text-secondary'
            }`}
          >
            <Icon name={purpose.icon} className="text-[16px]" />
            {purpose.label}
          </button>
        )
      })}
    </div>
  )
}

export async function filesToAssets(fileList, existingCount = 0) {
  const files = [...fileList]
  const accepted = []
  const errors = []
  for (const file of files) {
    if (existingCount + accepted.length >= MAX_PHOTOS) {
      errors.push('사진은 최대 10장까지 올릴 수 있습니다.')
      break
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}은 지원하지 않는 형식입니다.`)
      continue
    }
    if (file.size > MAX_PHOTO_BYTES) {
      errors.push(`${file.name}이 10MB를 넘습니다.`)
      continue
    }
    try {
      const dataUrl = await readImageFile(file)
      accepted.push({
        id: uid('asset'),
        name: file.name,
        dataUrl,
        sortOrder: existingCount + accepted.length,
        status: 'ready',
      })
    } catch {
      errors.push(`${file.name}을 읽지 못했습니다.`)
    }
  }
  return { accepted, errors }
}

function PhotoAddButton({ onAdd, large = false }) {
  return (
    <label
      className={
        large
          ? 'flex h-full min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-canvas-surface text-text-secondary'
          : 'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-canvas-surface text-text-secondary'
      }
    >
      <Icon name="add_photo_alternate" className={large ? 'text-[28px]' : 'text-[22px]'} />
      <span className={large ? 'text-sm font-semibold' : 'text-[11px] font-semibold'}>사진 추가</span>
      <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onAdd} />
    </label>
  )
}

export function PhotoGrid({ assets, onAdd, onRemove, fill = false }) {
  if (fill && assets.length === 0) {
    return (
      <div className="h-full">
        <PhotoAddButton onAdd={onAdd} large />
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-5">
      {assets.map((asset, index) => (
        <div key={asset.id} className="relative aspect-square overflow-hidden rounded-xl bg-canvas-surface">
          <img src={asset.dataUrl} alt={asset.name} className="h-full w-full object-cover" />
          <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 font-mono text-[11px] font-semibold">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="absolute bottom-2 left-2 right-2 truncate text-[11px] text-white">{asset.name}</span>
          <button
            type="button"
            onClick={() => onRemove(asset.id)}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-text-display/70 text-white"
            aria-label={`${asset.name} 삭제`}
          >
            <Icon name="close" className="text-[14px]" />
          </button>
        </div>
      ))}
      {assets.length < MAX_PHOTOS ? <PhotoAddButton onAdd={onAdd} /> : null}
    </div>
  )
}

export function FactLedger({ facts, onSupplement }) {
  const groups = [
    ['VERIFIED', '작성한 사실', 'check_circle', 'text-state-verified', 'bg-state-verified-bg'],
    ['OBSERVED', '사진에서 확인', 'visibility', 'text-state-observed', 'bg-state-observed-bg'],
    ['UNKNOWN', '아직 없는 정보', 'warning', 'text-state-unknown', 'bg-state-unknown-bg'],
  ]
  return (
    <div className="space-y-5">
      {groups.map(([status, label, icon, text, bg]) => {
        const items = facts.filter((fact) => fact.verificationStatus === status)
        return (
          <section key={status}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${bg} ${text}`}>
                <Icon name={icon} className="text-[14px]" />
                {status}
              </span>
              <span className="text-sm text-text-secondary">{label} {items.length}건</span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? <p className="rounded-xl bg-canvas-subtle px-3 py-2 text-sm text-text-tertiary">없음</p> : null}
              {items.map((fact) => (
                <div key={fact.id} className="flex items-start justify-between gap-3 rounded-xl bg-canvas-subtle px-3 py-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-text-tertiary">{fact.factType}</p>
                    <p className="text-sm text-text-display">{fact.value}</p>
                    {fact.detail ? <p className="text-xs text-text-secondary">{fact.detail}</p> : null}
                  </div>
                  {status === 'UNKNOWN' ? (
                    <button type="button" onClick={() => onSupplement(fact)} className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-state-unknown shadow-card">
                      직접 보충
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function QuestionCard({ question, onAnswer, onSkip }) {
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wide text-state-unknown">글 품질을 높이는 질문</p>
      <h3 className="mt-1 text-base font-bold text-text-display">{question.prompt}</h3>
      <p className="mt-1 text-sm text-text-secondary">몰라도 건너뛸 수 있습니다. 고른 답만 사실로 저장됩니다.</p>
      <div className="mt-3 space-y-2">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onAnswer(option)}
            className="flex w-full items-center justify-between rounded-xl bg-canvas-subtle px-3 py-3 text-left text-sm hover:bg-surface-container-low"
          >
            {option}
          </button>
        ))}
        <button type="button" onClick={() => setShowCustom((value) => !value)} className="text-sm font-semibold text-primary">
          직접 입력
        </button>
        {showCustom ? (
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`custom-${question.id}`}>직접 입력</label>
            <input
              id={`custom-${question.id}`}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              className="flex-1 rounded-lg border border-border-strong px-3 py-2 text-sm outline-none focus:border-primary-container"
            />
            <button type="button" onClick={() => custom.trim() && onAnswer(custom.trim())} className="rounded-lg bg-primary-container px-3 text-sm font-semibold text-white">
              반영
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={onSkip} className="text-sm text-text-tertiary">건너뛰기</button>
        <span className="font-mono text-xs text-text-tertiary">{question.index + 1}번째 질문</span>
      </div>
    </section>
  )
}

export function ContentCard({ project, onEdit, onCopy, onDelete }) {
  const purpose = PURPOSE_MAP[project.contentPurpose]
  const cover = project.assets?.[0]
  const ready = project.status === 'ready'
  const unknown = (project.facts || []).filter((fact) => fact.verificationStatus === 'UNKNOWN').length
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="relative h-40 bg-canvas-surface">
        {cover ? <img src={cover.dataUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-text-tertiary">사진 없음</div>}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold">{purpose?.label || '기록'}</span>
          {unknown > 0 ? (
            <span className="rounded-full bg-state-unknown-bg px-2 py-1 text-[11px] font-semibold text-state-unknown">확인 필요 {unknown}</span>
          ) : (
            <span className="rounded-full bg-state-verified-bg px-2 py-1 text-[11px] font-semibold text-state-verified">사실 구분됨</span>
          )}
        </div>
        <span className={`absolute right-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-bold text-white ${ready ? 'bg-emerald-600' : 'bg-amber-500'}`}>
          {ready ? 'READY' : 'DRAFT'}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs text-text-tertiary">{new Date(project.updatedAt).toLocaleString('ko-KR')} · 사진 {project.assets?.length || 0}장</p>
          <h3 className="mt-1 line-clamp-1 font-semibold text-text-display">{project.story?.subject || project.sourceText || '제목 없는 초안'}</h3>
        </div>
        <div className="flex gap-1">
          {Object.keys(project.contents || {}).map((platform) => {
            const meta = PLATFORM_MAP[platform]
            return (
              <span key={platform} title={meta?.label} className="flex h-6 w-6 items-center justify-center">
                <PlatformIcon id={platform} />
              </span>
            )
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="flex-1 rounded-lg bg-surface-container py-2 text-sm font-semibold text-primary">
            편집
          </button>
          {project.contents?.BLOG ? (
            <button type="button" onClick={onCopy} className="rounded-lg bg-canvas-subtle px-3 text-sm font-semibold text-text-secondary">
              복사
            </button>
          ) : null}
          <button type="button" onClick={onDelete} className="rounded-lg bg-canvas-subtle px-3 text-text-secondary" aria-label="삭제">
            <Icon name="delete" className="text-[18px]" />
          </button>
        </div>
      </div>
    </article>
  )
}

export function useQuickCreate() {
  const navigate = useNavigate()
  const { createProject, analyzeProject, showToast } = useProjects()
  const [purpose, setPurpose] = useState('travel')
  const [sourceText, setSourceText] = useState('')
  const [assets, setAssets] = useState([])
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  async function onFiles(event) {
    const { accepted, errors } = await filesToAssets(event.target.files, assets.length)
    if (errors.length) showToast(errors[0])
    setAssets((current) => [...current, ...accepted])
    event.target.value = ''
  }

  async function submit() {
    if (!purpose) {
      setFormError('콘텐츠 목적을 선택해 주세요.')
      showToast('콘텐츠 목적을 선택해 주세요.')
      return
    }
    if (!sourceText.trim() && assets.length === 0) {
      setFormError('사진 또는 짧은 메모가 필요합니다.')
      showToast('사진 또는 짧은 메모가 필요합니다.')
      return
    }
    setFormError('')
    setBusy(true)
    try {
      const project = await createProject({ contentPurpose: purpose, sourceText, assets })
      await analyzeProject(project.id)
      navigate(`/create/${project.id}`)
    } finally {
      setBusy(false)
    }
  }

  return { purpose, setPurpose, sourceText, setSourceText, assets, setAssets, onFiles, submit, busy, formError }
}
