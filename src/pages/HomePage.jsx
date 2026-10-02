import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentCard, PhotoGrid, PurposeChips, useQuickCreate } from '../components/create'
import { PlatformIcon } from '../components/PlatformIcon'
import { Icon } from '../components/shell'
import { useProjects } from '../context/ProjectContext'
import { PLATFORM_MAP, PLATFORMS } from '../data/catalog'
import { blogToHtml, contentToPlain, copyPlain, copyRich } from '../lib/media'

export default function HomePage() {
  const navigate = useNavigate()
  const { projects, profile, loaded, showToast, deleteProject } = useProjects()
  const quick = useQuickCreate()
  const [filter, setFilter] = useState('all')

  const weekCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return projects.filter((project) => project.createdAt >= cutoff).length
  }, [projects])

  const readyProjects = projects.filter((project) => project.status === 'ready')
  const untouched = readyProjects.filter((project) => !project.editedAfterGenerate).length
  const readyRate = readyProjects.length ? Math.round((untouched / readyProjects.length) * 100) : null

  const channelCounts = {}
  projects.forEach((project) => {
    Object.keys(project.contents || {}).forEach((platform) => {
      channelCounts[platform] = (channelCounts[platform] || 0) + 1
    })
  })
  const topChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]

  const visible = projects.filter((project) => {
    if (filter === 'ready') return project.status === 'ready'
    if (filter === 'draft') return project.status !== 'ready'
    return true
  })

  const attention = projects.find((project) => {
    if (project.status === 'ready') return false
    const unknown = (project.facts || []).some((fact) => fact.verificationStatus === 'UNKNOWN')
    const risk = (project.qualityChecks || []).some((issue) => issue.status === 'open' && ['UNSUPPORTED', 'POLICY', 'AD', 'PRICE', 'CLICHE'].includes(issue.checkType))
    return unknown || risk
  })

  async function copyBlog(project) {
    const blog = project.contents?.BLOG
    if (!blog) return
    try {
      const narrow = window.matchMedia('(max-width: 767px)').matches
      if (narrow) {
        await copyPlain(contentToPlain(blog))
        showToast('텍스트를 복사했습니다.')
        return
      }
      const mode = await copyRich(blogToHtml(blog), contentToPlain(blog))
      showToast(mode === 'rich' ? '서식과 텍스트를 복사했습니다.' : '텍스트를 복사했습니다.')
    } catch {
      showToast('복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <section className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-state-observed-bg px-3 py-1 text-[11px] font-bold text-state-observed">
            <Icon name="auto_awesome" className="text-[15px]" />
            사실부터 만드는 멀티채널 스튜디오
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-display sm:text-4xl">
            사진과 몇 줄의 메모로
            <br />
            <span className="bg-[linear-gradient(to_right,#2563eb_0%,#F43F5E_100%)] bg-clip-text text-transparent">
              채널별 게시 글
            </span>
            을 만듭니다.
          </h1>
          <p className="text-base leading-relaxed text-text-secondary">
            블로그, 인스타그램, 페이스북, X, 스레드, 쇼츠 패키지를 한 이야기로 다시 씁니다. 입력하지 않은 경험은 넣지 않습니다.
          </p>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(to_right,#2563eb_0%,#F43F5E_100%)] px-5 py-3 text-base font-semibold text-white"
          >
            <Icon name="add_circle" className="text-[20px]" />
            새 콘텐츠 만들기
          </button>
        </div>
        <div className="grid w-full gap-3 lg:w-80">
          <Summary label="이번 주 만든 콘텐츠" value={`${weekCount}건`} icon="post_add" />
          <Summary
            label="가장 많이 준비한 채널"
            value={topChannel ? PLATFORM_MAP[topChannel[0]]?.label : '아직 없음'}
            icon="hub"
          />
          {readyRate !== null ? (
            <Summary label="큰 수정 없이 Ready로 둔 비율" value={`${readyRate}%`} icon="verified_user" />
          ) : null}
        </div>
      </section>

      <section className="mb-10 rounded-2xl bg-white p-5 shadow-card lg:p-7">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-white">
            <Icon name="bolt" className="text-[20px]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-display">퀵 크리에이트</h2>
            <p className="text-sm text-text-secondary">목적을 고르고 사진이나 메모를 남기면 사실 확인 화면으로 이동합니다.</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-text-secondary">콘텐츠 목적</p>
          <PurposeChips value={quick.purpose} onChange={quick.setPurpose} />
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-text-secondary">만들 채널</p>
          {PLATFORMS.map((platform) => (
            <span key={platform.id} title={platform.label} className="flex h-7 w-7 items-center justify-center">
              <PlatformIcon id={platform.id} />
            </span>
          ))}
        </div>
        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          <div className="h-full lg:col-span-4">
            <PhotoGrid fill assets={quick.assets} onAdd={quick.onFiles} onRemove={(id) => quick.setAssets((current) => current.filter((asset) => asset.id !== id))} />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-8">
            <label className="sr-only" htmlFor="quick-memo">짧은 메모</label>
            <textarea
              id="quick-memo"
              rows={5}
              value={quick.sourceText}
              onChange={(event) => quick.setSourceText(event.target.value)}
              placeholder="어떤 이야기를 남기고 싶나요? 장소, 메뉴, 가격, 느낀 점을 있는 그대로 적어 주세요."
              className="min-h-32 w-full scroll-mb-28 rounded-xl bg-canvas-subtle p-4 text-sm outline-none focus:bg-canvas-subtle focus:ring-2 focus:ring-primary-container/30"
            />
            {quick.formError ? <p className="text-sm font-semibold text-state-unknown" role="alert">{quick.formError}</p> : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">입력한 사실과 첨부 사진만 사용합니다.</p>
              <button
                type="button"
                onClick={quick.submit}
                disabled={quick.busy || !loaded}
                className="inline-flex items-center gap-1 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {quick.busy ? '확인하는 중' : '사실 확인하고 이어가기'}
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {attention ? (
        <section className="mb-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-surface-container p-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-text-display">확인이 남은 초안</h2>
            <p className="text-sm text-text-secondary">입력에 없는 표현이 본문에 있으면 Ready로 넘기기 전에 고쳐 주세요.</p>
          </div>
          <button type="button" onClick={() => navigate(`/projects/${attention.id}`)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            바로 보완하기
          </button>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-text-display">최근 작업</h2>
          <div className="flex rounded-xl bg-white p-1 shadow-card" role="tablist" aria-label="상태 필터">
            {[
              ['all', `전체 (${projects.length})`],
              ['ready', `Ready (${readyProjects.length})`],
              ['draft', `초안 (${projects.length - readyProjects.length})`],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === id ? 'bg-surface-container text-primary' : 'text-text-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {!loaded ? <p className="text-sm text-text-secondary">작업을 불러오는 중입니다.</p> : null}
        {loaded && visible.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="font-semibold text-text-display">아직 저장된 콘텐츠가 없습니다.</p>
            <p className="mt-1 text-sm text-text-secondary">사진과 짧은 메모로 첫 초안을 만들어 보세요.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((project) => (
              <ContentCard
                key={project.id}
                project={project}
                onEdit={() => navigate(project.contents ? `/projects/${project.id}` : `/create/${project.id}`)}
                onCopy={() => copyBlog(project)}
                onDelete={() => deleteProject(project.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-text-display">브랜드 프로필</h2>
            <p className="mt-1 font-semibold text-text-display">{profile.name || '표시 이름이 없습니다'}</p>
            <p className="text-sm text-text-secondary">{profile.bio || '한 줄 소개를 적으면 여기 표시됩니다.'}</p>
          </div>
          <button type="button" onClick={() => navigate('/brand')} className="rounded-xl bg-canvas-surface px-4 py-2 text-sm font-semibold">
            프로필 수정
          </button>
        </div>
      </section>
    </div>
  )
}

function Summary({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-card">
      <div>
        <p className="text-xs font-semibold text-text-tertiary">{label}</p>
        <p className="text-2xl font-bold text-text-display">{value}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary-container">
        <Icon name={icon} className="text-[22px]" />
      </div>
    </div>
  )
}
