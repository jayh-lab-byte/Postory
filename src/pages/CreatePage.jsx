import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssistTools } from '../components/AssistTools'
import { FactLedger, filesToAssets, PhotoGrid, PurposeChips, QuestionCard } from '../components/create'
import { Icon } from '../components/shell'
import { useProjects } from '../context/ProjectContext'
import { PlatformIcon } from '../components/PlatformIcon'
import { PLATFORMS } from '../data/catalog'

export default function CreatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, loaded, createProject, updateProject, analyzeProject, answerQuestion, supplementFact, generateProject, showToast } = useProjects()
  const existing = projects.find((item) => item.id === id)
  const [purpose, setPurpose] = useState(existing?.contentPurpose || 'cafe')
  const [sourceText, setSourceText] = useState(existing?.sourceText || '')
  const [assets, setAssets] = useState(existing?.assets || [])
  const [busy, setBusy] = useState('')
  const [customFact, setCustomFact] = useState('')
  const [supplementTarget, setSupplementTarget] = useState(null)
  const [panel, setPanel] = useState(1)

  useEffect(() => {
    if (!existing) return
    setPurpose(existing.contentPurpose)
    setSourceText(existing.sourceText || '')
    setAssets(existing.assets || [])
  }, [existing?.id])

  async function onFiles(event) {
    const { accepted, errors } = await filesToAssets(event.target.files, assets.length)
    if (errors.length) showToast(errors[0])
    const nextAssets = [...assets, ...accepted]
    setAssets(nextAssets)
    if (existing) await updateProject(existing.id, { assets: nextAssets })
    event.target.value = ''
  }

  async function removeAsset(assetId) {
    const nextAssets = assets.filter((asset) => asset.id !== assetId)
    setAssets(nextAssets)
    if (existing) await updateProject(existing.id, { assets: nextAssets })
  }

  async function ensureProject() {
    if (!purpose) {
      showToast('콘텐츠 목적을 선택해 주세요.')
      return null
    }
    if (!sourceText.trim() && assets.length === 0) {
      showToast('사진 또는 짧은 메모가 필요합니다.')
      return null
    }
    if (existing) {
      return updateProject(existing.id, { contentPurpose: purpose, sourceText, assets })
    }
    const created = await createProject({ contentPurpose: purpose, sourceText, assets })
    navigate(`/create/${created.id}`, { replace: true })
    return created
  }

  async function runAnalyze() {
    setBusy('analyze')
    try {
      const project = await ensureProject()
      if (!project) return
      await analyzeProject(project.id)
      showToast('입력한 내용과 아직 없는 정보를 나눴습니다.')
    } finally {
      setBusy('')
    }
  }

  async function runGenerate() {
    setBusy('generate')
    try {
      let project = await ensureProject()
      if (!project) return
      if (!project.facts?.length) project = await analyzeProject(project.id)
      await generateProject(project.id)
      navigate(`/projects/${project.id}`)
    } finally {
      setBusy('')
    }
  }

  if (loaded && id && !existing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-semibold">작업을 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate('/create')} className="mt-4 text-sm font-semibold text-primary">새로 만들기</button>
      </div>
    )
  }

  const openQuestion = existing?.questions?.find((question) => !question.resolved)

  return (
    <div className="min-h-screen bg-canvas-subtle pb-28">
      <div className="border-b border-border-subtle bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/')} className="rounded-xl p-2 text-text-secondary" aria-label="뒤로">
              <Icon name="arrow_back" className="text-[20px]" />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">사실 확인</p>
              <h1 className="text-lg font-bold text-text-display">새 스토리 만들기</h1>
            </div>
          </div>
          <p className="text-sm text-text-secondary" aria-live="polite">
            {busy === 'analyze' ? '사실을 나누는 중' : busy === 'generate' ? '채널별 글을 만드는 중' : '입력은 이 기기에 저장됩니다'}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-12 lg:px-8">
        <div className="space-y-5 lg:col-span-7">
          <Stepper step={panel} onSelect={setPanel} />
          <div className="flex justify-between lg:hidden">
            <button type="button" onClick={() => setPanel((current) => Math.max(1, current - 1))} disabled={panel === 1} className="rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary disabled:opacity-40">이전</button>
            <button type="button" onClick={() => setPanel((current) => Math.min(3, current + 1))} disabled={panel === 3} className="rounded-xl bg-canvas-surface px-3 py-2 text-sm font-semibold disabled:opacity-40">다음</button>
          </div>
          <section className={`${panel === 1 ? 'block' : 'hidden'} rounded-2xl bg-white p-5 shadow-card lg:block`}>
            <h2 className="mb-3 font-bold text-text-display">1. 콘텐츠 목적</h2>
            <PurposeChips
              value={purpose}
              onChange={async (next) => {
                setPurpose(next)
                if (existing) await updateProject(existing.id, { contentPurpose: next })
              }}
            />
          </section>
          <section className={`${panel === 2 ? 'block' : 'hidden'} rounded-2xl bg-white p-5 shadow-card lg:block`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-text-display">2. 사진</h2>
              <p className="text-sm text-text-secondary">{assets.length} / 10장</p>
            </div>
            <PhotoGrid assets={assets} onAdd={onFiles} onRemove={removeAsset} />
            {assets.length < 2 ? (
              <div className="mt-4">
                <AssistTools
                  query={sourceText || purpose}
                  assets={assets}
                  onAddAsset={async (asset) => {
                    const nextAssets = [...assets, asset]
                    setAssets(nextAssets)
                    if (existing) await updateProject(existing.id, { assets: nextAssets })
                  }}
                />
              </div>
            ) : null}
          </section>
          <section className={`${panel === 2 ? 'block' : 'hidden'} rounded-2xl bg-white p-5 shadow-card lg:block`}>
            <h2 className="mb-2 font-bold text-text-display">3. 직접 경험한 메모</h2>
            <p className="mb-3 text-sm text-text-secondary">가격, 이름, 감상처럼 직접 아는 내용만 적어 주세요.</p>
            <label className="sr-only" htmlFor="memo">짧은 메모</label>
            <textarea
              id="memo"
              rows={6}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              onBlur={() => existing && updateProject(existing.id, { sourceText })}
              className="w-full scroll-mb-28 rounded-xl bg-canvas-surface p-4 text-sm outline-none focus:bg-canvas-surface focus:ring-2 focus:ring-primary-container/30"
            />
            <p className="mt-2 text-xs text-text-tertiary">
              <span className="font-mono">{sourceText.trim().length}자</span>
              {sourceText.trim().length < 40 ? ' · 40자 이상이면 사실 구분이 더 안정적입니다. 짧아도 만들 수 있습니다.' : ''}
            </p>
          </section>
        </div>

        <div className={`${panel === 3 ? 'block' : 'hidden'} space-y-5 lg:col-span-5 lg:block`}>
          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="font-bold text-text-display">소스 우선 사실 구분</h2>
            <p className="mt-1 text-sm text-text-secondary">적은 내용, 사진 첨부, 아직 모르는 정보를 나눠 둡니다. 모르는 정보는 글에 쓰지 않습니다.</p>
            {!existing?.facts?.length ? (
              <button type="button" onClick={runAnalyze} disabled={!loaded || busy !== ''} className="mt-4 w-full rounded-xl bg-primary-container py-3 text-sm font-semibold text-white disabled:opacity-60">
                {busy === 'analyze' ? '확인 중…' : '사실 나누기'}
              </button>
            ) : (
              <div className="mt-4">
                <FactLedger
                  facts={existing.facts}
                  onSupplement={(fact) => {
                    setSupplementTarget(fact)
                    setCustomFact('')
                  }}
                />
              </div>
            )}
            {supplementTarget ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (event) => {
                  event.preventDefault()
                  if (!customFact.trim()) return
                  await supplementFact(existing.id, customFact.trim())
                  setSupplementTarget(null)
                  setCustomFact('')
                  showToast('입력한 내용을 확인된 사실로 저장했습니다.')
                }}
              >
                <label className="sr-only" htmlFor="supplement">사실 입력</label>
                <input
                  id="supplement"
                  value={customFact}
                  onChange={(event) => setCustomFact(event.target.value)}
                  placeholder={`${supplementTarget.value}에 대해 아는 내용`}
                  className="flex-1 rounded-lg border border-border-strong px-3 py-2 text-sm outline-none focus:border-primary-container"
                />
                <button type="submit" className="rounded-lg bg-primary px-3 text-sm font-semibold text-white">저장</button>
              </form>
            ) : null}
          </section>
          {openQuestion ? (
            <QuestionCard
              question={openQuestion}
              onAnswer={(answer) => answerQuestion(existing.id, openQuestion.id, answer, false)}
              onSkip={() => answerQuestion(existing.id, openQuestion.id, '', true)}
            />
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-white/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            {PLATFORMS.map((platform) => (
              <span key={platform.id} title={platform.label} className="flex h-7 w-7 items-center justify-center">
                <PlatformIcon id={platform.id} className="h-7 w-7" />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={runAnalyze} disabled={busy !== ''} className="rounded-xl bg-canvas-surface px-4 py-3 text-sm font-semibold">
              초안 저장
            </button>
            <button
              type="button"
              onClick={runGenerate}
              disabled={busy !== '' || !loaded}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(to_right,#2563eb_0%,#F43F5E_100%)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              <Icon name="auto_awesome" className="text-[18px]" />
              {busy === 'generate' ? '만드는 중…' : 'Master Story와 채널별 글 만들기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stepper({ step, onSelect }) {
  const items = ['목적', '사진/메모', '사실 검증']
  return (
    <ol className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-card lg:hidden">
      {items.map((label, index) => (
        <li key={label}>
          <button type="button" onClick={() => onSelect(index + 1)} className="flex items-center gap-2 text-xs font-semibold">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${index + 1 <= step ? 'bg-primary-container text-white' : 'bg-canvas-surface text-text-tertiary'}`}>
              {index + 1}
            </span>
            <span className={index + 1 === step ? 'text-primary' : 'text-text-tertiary'}>{label}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
