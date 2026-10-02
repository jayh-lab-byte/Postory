import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssistTools } from '../components/AssistTools'
import { filesToAssets } from '../components/create'
import { Icon } from '../components/shell'
import { useProjects } from '../context/ProjectContext'
import { BLOG_MODES, PLATFORM_LINKS, PLATFORM_MAP, PLATFORMS } from '../data/catalog'
import { reconcileChecks, riskChecklist, searchChecklist } from '../lib/engine'
import { blogBodyText, blogTagText, blogTitleText, blogToHtml, contentToPlain, copyPlain, copyRich, downloadAssets, platformPlain } from '../lib/media'

const TABS = [
  { id: 'STORY', label: 'Master Story' },
  { id: 'BLOG', label: '네이버 블로그' },
  { id: 'INSTAGRAM', label: 'Instagram' },
  { id: 'THREADS', label: 'Threads / X' },
  { id: 'FACEBOOK', label: 'Facebook' },
  { id: 'YOUTUBE_SHORTS', label: 'YouTube Shorts' },
]

export default function StudioPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, loaded, writing, savePhase, updateContent, regenerate, regenerateAll, rewriteBlock, addBlogTag, resolveIssue, markReady, showToast, updateProject, generateProject } = useProjects()
  const project = projects.find((item) => item.id === id)
  const [tab, setTab] = useState('BLOG')
  const [view, setView] = useState('edit')
  const [mobilePanel, setMobilePanel] = useState('edit')
  const [factDraft, setFactDraft] = useState('')
  const [activeIssue, setActiveIssue] = useState(null)

  useEffect(() => {
    if (!project?.contents) return
    const nextChecks = reconcileChecks(project)
    if (JSON.stringify(nextChecks) === JSON.stringify(project.qualityChecks || [])) return
    updateProject(project.id, { qualityChecks: nextChecks })
  }, [project, updateProject])

  if (!loaded) {
    return <p className="px-4 py-16 text-center text-sm text-text-secondary">작업을 불러오는 중입니다.</p>
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-semibold">작업을 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 text-sm font-semibold text-primary">홈으로</button>
      </div>
    )
  }

  if (!project.contents) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-semibold">아직 채널별 글이 없습니다.</p>
        <button type="button" onClick={() => navigate(`/create/${project.id}`)} className="mt-4 rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white">
          사실 확인으로 돌아가기
        </button>
      </div>
    )
  }

  const blog = project.contents.BLOG
  const checks = searchChecklist(project)
  const risks = riskChecklist(project)
  const riskTypes = new Set(['POLICY', 'AD', 'PRICE'])
  const issues = (project.qualityChecks || []).filter((issue) => issue.status === 'open' && issue.checkType !== 'SEARCH' && !riskTypes.has(issue.checkType))
  const riskIssues = (project.qualityChecks || []).filter((issue) => issue.status === 'open' && riskTypes.has(issue.checkType))

  async function copyBlog(rich) {
    try {
      if (rich) {
        const mode = await copyRich(blogToHtml(blog), contentToPlain(blog))
        showToast(mode === 'rich' ? '서식과 텍스트를 복사했습니다. 일부 서식은 네이버 에디터에 따라 다르게 적용될 수 있습니다.' : '텍스트를 복사했습니다.')
        return
      }
      await copyPlain(contentToPlain(blog))
      showToast('텍스트를 복사했습니다.')
    } catch {
      showToast('복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    }
  }

  async function copySnippet(text, success) {
    const value = String(text || '').trim()
    if (!value) {
      showToast('복사할 내용이 없습니다.')
      return
    }
    try {
      await copyPlain(value)
      showToast(success)
    } catch {
      showToast('복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    }
  }

  async function copyChannel(platform) {
    try {
      await copyPlain(platformPlain(project.contents[platform]))
      showToast(`${PLATFORM_MAP[platform]?.label || '채널'} 글을 복사했습니다.`)
    } catch {
      showToast('복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    }
  }

  async function addPhotos(event) {
    const { accepted, errors } = await filesToAssets(event.target.files, project.assets.length)
    if (errors.length) showToast(errors[0])
    if (accepted.length) await updateProject(project.id, { assets: [...project.assets, ...accepted] })
    event.target.value = ''
  }

  function movePhoto(index, direction) {
    const patch = moveAsset(project, index, direction)
    if (patch) updateProject(project.id, patch)
  }

  const platformLink = tab === 'THREADS' ? PLATFORM_LINKS.THREADS : PLATFORM_LINKS[tab] || PLATFORM_LINKS.BLOG

  return (
    <div className="min-h-screen bg-canvas-subtle pb-36 xl:pb-8">
      <div className="sticky top-16 z-30 border-b border-border-subtle bg-white">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${tab === item.id ? 'bg-emerald-50 text-platform-blog' : 'text-text-secondary'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className="hidden text-xs text-text-secondary sm:block" aria-live="polite">{statusText(writing, savePhase, project.updatedAt)}</p>
            <div className="flex rounded-xl bg-canvas-surface p-1" role="group" aria-label="보기 방식">
              {[
                ['edit', '편집'],
                ['preview', '미리보기'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${view === id ? 'bg-white text-text-display shadow-card' : 'text-text-secondary'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => markReady(project.id)} className="shrink-0 rounded-xl bg-text-display px-3 py-2 text-sm font-semibold text-white">
              {project.status === 'ready' ? 'Ready' : 'Ready로 표시'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1720px] gap-4 px-4 py-4 xl:grid-cols-12">
        <aside className={`${mobilePanel === 'story' ? 'block' : 'hidden'} xl:col-span-3 xl:block`}>
          <div className="space-y-4">
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="font-semibold text-text-display">Master Story</h2>
              {project.generator === 'openai' ? <p className="mt-1 text-xs text-text-secondary">OpenAI가 메모를 이야기로 작성했습니다.</p> : null}
              {project.generator === 'local' ? <p className="mt-1 text-xs text-text-secondary">OpenAI 키를 읽지 못해 이 기기 문장으로 작성했습니다.</p> : null}
              {project.story?.narrative ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-primary">{project.story.narrative}</p>
              ) : null}
              <Field label="대상" value={project.story?.subject} />
              <Field label="핵심 메시지" value={project.story?.coreMessage} />
              <Field label="각도" value={project.story?.narrativeAngle} />
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary">맥락과 사실</summary>
                <Field label="맥락" value={project.story?.context} />
                <Field label="확인한 사실" value={(project.story?.verifiedFacts || []).join(' · ')} />
                <Field label="사진 관찰" value={(project.story?.observedFacts || []).join(' · ')} />
                <Field label="안내 방향" value={project.story?.ctaDirection} />
              </details>
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <p className="mb-2 text-sm font-semibold text-text-secondary">블로그 작성 모드</p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-canvas-surface p-1">
                {BLOG_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => regenerate(project.id, 'BLOG', mode.id)}
                    className={`rounded-lg py-1.5 text-xs font-semibold ${blog.mode === mode.id ? 'bg-white shadow-card' : 'text-text-secondary'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">사진 {project.assets.length}장</h2>
                <label className="cursor-pointer text-xs font-semibold text-primary">
                  추가
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {project.assets.map((asset, index) => (
                  <figure key={asset.id} className="overflow-hidden rounded-xl bg-canvas-surface">
                    <img src={asset.dataUrl} alt={asset.name} className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="flex items-center justify-between gap-1 px-2 py-1 text-[11px]">
                      <span className="truncate">{String(index + 1).padStart(2, '0')} {asset.name}</span>
                      <span className="flex shrink-0 gap-1">
                        <button type="button" aria-label="앞으로" disabled={index === 0} onClick={() => movePhoto(index, -1)} className="font-semibold disabled:opacity-30">↑</button>
                        <button type="button" aria-label="뒤로" disabled={index === project.assets.length - 1} onClick={() => movePhoto(index, 1)} className="font-semibold disabled:opacity-30">↓</button>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
            <AssistTools
              query={project.story?.subject || project.sourceText || ''}
              assets={project.assets}
              onAddAsset={(asset) => updateProject(project.id, { assets: [...project.assets, asset] })}
              onAddTag={(tag) => addBlogTag(project.id, tag)}
            />
          </div>
        </aside>

        <main className={`${mobilePanel === 'edit' ? 'block' : 'hidden'} min-w-0 xl:col-span-6 xl:block`}>
          {view === 'preview' ? <ChannelPreview project={project} tab={tab} /> : null}
          {view === 'edit' && tab === 'STORY' ? (
            <StoryEditor
              key={project.story?.version || 1}
              project={project}
              onSave={(story) => updateProject(project.id, { story })}
              onRewrite={() => generateProject(project.id, blog.mode)}
            />
          ) : null}
          {view === 'edit' && tab === 'BLOG' ? (
            <BlogEditor
              key={blog.id}
              content={blog}
              assets={project.assets}
              facts={project.facts || []}
              onChange={(content) => updateContent(project.id, 'BLOG', content)}
              onRewrite={(blockId) => rewriteBlock(project.id, blockId)}
            />
          ) : null}
          {view === 'edit' && tab === 'INSTAGRAM' ? (
            <ChannelFields
              key={project.contents.INSTAGRAM.id}
              content={project.contents.INSTAGRAM}
              fields={[['hook', 'Hook'], ['caption', 'Caption'], ['story', 'Story'], ['cta', 'CTA']]}
              onChange={(content) => updateContent(project.id, 'INSTAGRAM', content)}
              extra={
                <label className="block text-sm font-semibold">
                  해시태그
                  <input
                    className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 font-normal"
                    defaultValue={(project.contents.INSTAGRAM.hashtags || []).map((tag) => `#${tag}`).join(' ')}
                    onBlur={(event) => updateContent(project.id, 'INSTAGRAM', {
                      ...project.contents.INSTAGRAM,
                      hashtags: event.target.value.split(/[\s#]+/).filter(Boolean),
                    })}
                  />
                </label>
              }
            />
          ) : null}
          {view === 'edit' && tab === 'FACEBOOK' ? (
            <ChannelFields
              key={project.contents.FACEBOOK.id}
              content={project.contents.FACEBOOK}
              fields={[['headline', 'Headline'], ['context', 'Context'], ['story', 'Story'], ['information', 'Information'], ['cta', 'CTA'], ['linkNote', '링크 안내']]}
              onChange={(content) => updateContent(project.id, 'FACEBOOK', content)}
            />
          ) : null}
          {view === 'edit' && tab === 'THREADS' ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => copyChannel('THREADS')} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-card">Threads 복사</button>
                <button type="button" onClick={() => copyChannel('X')} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-card">X 복사</button>
              </div>
              <ChannelFields
                key={project.contents.X.id}
                content={project.contents.X}
                fields={[['single', 'X 단일 포스트']]}
                onChange={(content) => updateContent(project.id, 'X', content)}
                extra={(project.contents.X.thread || []).map((line, index) => (
                  <label key={`thread-${index}`} className="block text-sm">
                    스레드 {index + 1}
                    <textarea
                      className="mt-1 w-full rounded-xl border border-border-subtle p-3"
                      rows={3}
                      defaultValue={line}
                      onBlur={(event) => {
                        const thread = [...project.contents.X.thread]
                        thread[index] = event.target.value
                        updateContent(project.id, 'X', { ...project.contents.X, thread })
                      }}
                    />
                  </label>
                ))}
              />
              <div key={project.contents.THREADS.id} className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
                <h2 className="font-semibold">Threads</h2>
                {(project.contents.THREADS.parts || []).map((part, index) => (
                  <label key={part.label} className="block text-sm">
                    {part.label}
                    <textarea
                      className="mt-1 w-full rounded-xl border border-border-subtle p-3"
                      rows={3}
                      defaultValue={part.text}
                      onBlur={(event) => {
                        const parts = project.contents.THREADS.parts.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, text: event.target.value } : item,
                        )
                        updateContent(project.id, 'THREADS', { ...project.contents.THREADS, parts })
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {view === 'edit' && tab === 'YOUTUBE_SHORTS' ? (
            <ChannelFields
              key={project.contents.YOUTUBE_SHORTS.id}
              content={project.contents.YOUTUBE_SHORTS}
              fields={[['hook', 'Hook'], ['script', '스크립트'], ['captions', '자막'], ['title', '제목'], ['description', '설명'], ['thumbnailCopy', '썸네일 문구']]}
              onChange={(content) => updateContent(project.id, 'YOUTUBE_SHORTS', content)}
              extra={
                <div className="space-y-2">
                  {(project.contents.YOUTUBE_SHORTS.shots || []).map((shot, index) => (
                    <label key={`${shot.assetIndex}-${index}`} className="block text-sm font-semibold">
                      사진 {shot.assetIndex + 1} 컷
                      <input
                        className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 font-normal"
                        defaultValue={shot.note}
                        onBlur={(event) => {
                          const shots = project.contents.YOUTUBE_SHORTS.shots.map((item, itemIndex) => (
                            itemIndex === index ? { ...item, note: event.target.value } : item
                          ))
                          updateContent(project.id, 'YOUTUBE_SHORTS', { ...project.contents.YOUTUBE_SHORTS, shots })
                        }}
                      />
                    </label>
                  ))}
                </div>
              }
            />
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => regenerateAll(project.id)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-card">
              채널 글 다시 만들기
            </button>
            {tab !== 'STORY' && tab !== 'THREADS' ? (
              <button type="button" onClick={() => regenerate(project.id, tab)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-card">
                이 채널 다시 만들기
              </button>
            ) : null}
            {tab !== 'STORY' && tab !== 'THREADS' ? (
              <button type="button" onClick={() => copyChannel(tab)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-card">
                이 채널 복사
              </button>
            ) : null}
            <a className="rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-card" href={platformLink} target="_blank" rel="noreferrer">
              플랫폼 열기
            </a>
          </div>
        </main>

        <aside className={`${mobilePanel === 'audit' ? 'block' : 'hidden'} xl:col-span-3 xl:block`}>
          <div className="space-y-4">
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="font-semibold">검색 품질 점검</h2>
              <p className="mt-1 text-xs text-text-secondary">검색 의도에 맞는지 살펴봅니다. 상위 노출을 보장하지 않습니다.</p>
              <ul className="mt-3 space-y-2">
                {checks.map((item) => (
                  <li key={item.label} className="flex items-center justify-between rounded-xl bg-canvas-subtle px-3 py-2 text-sm">
                    <span>{item.label}</span>
                    <span className={item.ok ? 'font-semibold text-state-verified' : 'font-semibold text-state-unknown'}>{item.ok ? '확인' : '살펴보기'}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="font-semibold">리스크 점검</h2>
              <p className="mt-1 text-xs text-text-secondary">정책에 걸릴 표현, 광고성 과장, 메모에 없는 가격을 살펴봅니다.</p>
              <ul className="mt-3 space-y-2">
                {risks.map((item) => (
                  <li key={item.label} className="flex items-center justify-between rounded-xl bg-canvas-subtle px-3 py-2 text-sm">
                    <span>{item.label}</span>
                    <span className={item.ok ? 'font-semibold text-state-verified' : 'font-semibold text-state-unknown'}>{item.ok ? '확인' : '살펴보기'}</span>
                  </li>
                ))}
              </ul>
              {riskIssues.length ? (
                <ul className="mt-3 space-y-3">
                  {riskIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      active={activeIssue === issue.id}
                      factDraft={factDraft}
                      onFactDraft={setFactDraft}
                      onOpen={() => setActiveIssue(issue.id)}
                      onResolve={(action, value) => {
                        resolveIssue(project.id, issue.id, action, value)
                        if (action === 'fact') {
                          setFactDraft('')
                          setActiveIssue(null)
                        }
                      }}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="font-semibold">고칠 내용</h2>
              {issues.length === 0 ? <p className="mt-2 text-sm text-text-secondary">열린 문제가 없습니다.</p> : null}
              <ul className="mt-2 space-y-3">
                {issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    active={activeIssue === issue.id}
                    factDraft={factDraft}
                    onFactDraft={setFactDraft}
                    onOpen={() => setActiveIssue(issue.id)}
                    onResolve={(action, value) => {
                      resolveIssue(project.id, issue.id, action, value)
                      if (action === 'fact') {
                        setFactDraft('')
                        setActiveIssue(null)
                      }
                    }}
                  />
                ))}
              </ul>
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="font-semibold">채널 준비</h2>
              <ul className="mt-3 space-y-2">
                {PLATFORMS.map((platform) => {
                  const ready = channelHasBody(project.contents[platform.id])
                  return (
                    <li key={platform.id} className="flex items-center justify-between rounded-xl bg-canvas-subtle px-3 py-2 text-sm">
                      <span>{platform.label}</span>
                      <span className={ready ? 'font-semibold text-state-verified' : 'font-semibold text-state-unknown'}>{ready ? '본문 있음' : '비어 있음'}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="font-semibold">Publish Assist</h2>
              <p className="mt-1 text-sm text-text-secondary">일부 서식은 네이버 에디터 환경에 따라 다르게 적용될 수 있습니다.</p>
              <div className="mt-3 space-y-2">
                <button type="button" onClick={() => copyBlog(true)} className="w-full rounded-xl bg-gradient-to-r from-platform-blog to-state-verified py-3 text-sm font-bold text-white">
                  서식 포함 복사
                </button>
                <button type="button" onClick={() => copyBlog(false)} className="w-full rounded-xl bg-canvas-surface py-3 text-sm font-semibold">텍스트만 복사</button>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => copySnippet(blogTitleText(blog), '제목을 복사했습니다.')} className="rounded-xl bg-canvas-surface py-3 text-sm font-semibold">제목</button>
                  <button type="button" onClick={() => copySnippet(blogBodyText(blog), '본문을 복사했습니다.')} className="rounded-xl bg-canvas-surface py-3 text-sm font-semibold">본문</button>
                  <button type="button" onClick={() => copySnippet(blogTagText(blog), '태그를 복사했습니다.')} className="rounded-xl bg-canvas-surface py-3 text-sm font-semibold">태그</button>
                </div>
                <button type="button" onClick={() => downloadAssets(project.assets)} disabled={!project.assets.length} className="w-full rounded-xl bg-canvas-surface py-3 text-sm font-semibold disabled:opacity-50">
                  사진 순서대로 다운로드
                </button>
                <a href={PLATFORM_LINKS.BLOG} target="_blank" rel="noreferrer" className="block rounded-xl bg-emerald-50 py-3 text-center text-sm font-semibold text-platform-blog">
                  네이버 블로그 열기
                </a>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-12 z-40 grid grid-cols-3 border-t border-border-subtle bg-white xl:hidden">
        <button type="button" onClick={() => downloadAssets(project.assets)} disabled={!project.assets.length} className="py-3 text-sm font-semibold text-text-secondary disabled:opacity-40">
          사진
        </button>
        <a href={platformLink} target="_blank" rel="noreferrer" className="py-3 text-center text-sm font-semibold text-text-secondary">
          열기
        </a>
        <button type="button" onClick={() => (tab === 'BLOG' || tab === 'STORY' ? copyBlog(true) : copyChannel(tab === 'THREADS' ? 'THREADS' : tab))} className="py-3 text-sm font-semibold text-primary">
          복사
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border-subtle bg-white xl:hidden">
        {[
          ['story', 'Story'],
          ['edit', '편집'],
          ['audit', '점검'],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMobilePanel(id)} className={`py-3 text-sm font-semibold ${mobilePanel === id ? 'text-primary' : 'text-text-secondary'}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function IssueCard({ issue, active, factDraft, onFactDraft, onOpen, onResolve }) {
  return (
    <li className="rounded-xl bg-state-unknown-bg p-3 text-sm">
      <p className="font-semibold text-text-display">{PLATFORM_MAP[issue.platform]?.label}</p>
      <p className="mt-1">{issue.message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => onResolve('delete')} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold">삭제</button>
        <button type="button" onClick={onOpen} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold">사실 입력</button>
        <button type="button" onClick={() => onResolve('keep')} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold">이대로 두기</button>
      </div>
      {active ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onResolve('fact', factDraft)
          }}
        >
          <label className="sr-only" htmlFor={`fact-${issue.id}`}>사실</label>
          <input id={`fact-${issue.id}`} value={factDraft} onChange={(event) => onFactDraft(event.target.value)} className="flex-1 rounded-lg border px-2 py-1" />
          <button type="submit" className="rounded-lg bg-primary px-2 text-xs font-semibold text-white">저장</button>
        </form>
      ) : null}
    </li>
  )
}

function Field({ label, value }) {
  return (
    <div className="mt-3 rounded-xl bg-canvas-subtle p-3">
      <p className="text-[11px] font-semibold text-text-secondary">{label}</p>
      <p className="text-sm text-text-display">{value}</p>
    </div>
  )
}

function StoryEditor({ project, onSave, onRewrite }) {
  const story = project.story || {}
  const fields = [
    ['narrative', '스토리', 8],
    ['subject', '대상', 2],
    ['context', '맥락', 3],
    ['coreMessage', '핵심 메시지', 3],
    ['narrativeAngle', '각도', 3],
    ['ctaDirection', '안내 방향', 2],
  ]
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">기준 스토리 수정</h2>
        <button type="button" onClick={onRewrite} className="rounded-lg bg-canvas-surface px-3 py-2 text-xs font-semibold">
          스토리 다시 쓰기
        </button>
      </div>
      {fields.map(([key, label, rows]) => (
        <label key={key} className="block text-sm font-semibold">
          {label}
          <textarea
            className="mt-1 w-full rounded-xl border border-border-subtle p-3 font-normal leading-6"
            rows={rows}
            defaultValue={story[key]}
            onBlur={(event) => onSave({ ...story, [key]: event.target.value })}
          />
        </label>
      ))}
    </section>
  )
}

function BlogEditor({ content, assets, facts, onChange, onRewrite }) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-card">
      <h2 className="font-semibold">제목 후보</h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar md:block md:space-y-2">
        {content.titleCandidates.map((title, index) => (
          <label key={`${index}-${title}`} className={`flex min-w-[220px] shrink-0 items-start gap-2 rounded-xl p-3 text-sm md:min-w-0 ${content.title === title ? 'bg-state-observed-bg' : 'bg-canvas-subtle'}`}>
            <input type="radio" name="title" checked={content.title === title} onChange={() => onChange({ ...content, title })} />
            <span>{title}</span>
          </label>
        ))}
      </div>
      <label className="block text-sm font-semibold">
        제목
        <input
          className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 font-normal"
          defaultValue={content.title}
          onBlur={(event) => onChange({ ...content, title: event.target.value })}
        />
      </label>
      <div className="space-y-3">
        {content.blocks.map((block) => {
          if (block.type === 'photo') {
            const asset = assets[block.assetIndex]
            return (
              <figure key={block.id} className="overflow-hidden rounded-xl bg-canvas-surface">
                {asset ? <img src={asset.dataUrl} alt={asset.name} className="max-h-72 w-full object-cover" /> : <p className="p-4 text-sm">사진 {block.assetIndex + 1}</p>}
                <figcaption className="px-3 py-2 text-xs text-text-secondary">삽입 위치 · {block.caption}</figcaption>
              </figure>
            )
          }
          return (
            <div key={block.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={block.id}>{block.type === 'heading' ? '소제목' : '본문'}</label>
                <span className="flex gap-1">
                  {block.type === 'paragraph' ? (
                    <button type="button" onClick={() => onRewrite(block.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary">
                      다시 쓰기
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onChange({ ...content, blocks: content.blocks.filter((item) => item.id !== block.id) })}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-text-secondary"
                  >
                    삭제
                  </button>
                </span>
              </div>
              {block.type === 'paragraph' ? <FactTags text={block.text} facts={facts} /> : null}
              <textarea
                id={block.id}
                className={`mt-1 w-full rounded-xl border border-border-subtle p-3 ${block.type === 'heading' ? 'font-semibold' : ''}`}
                rows={block.type === 'heading' ? 2 : 4}
                defaultValue={block.text}
                onBlur={(event) => {
                  onChange({
                    ...content,
                    blocks: content.blocks.map((item) => (item.id === block.id ? { ...item, text: event.target.value } : item)),
                  })
                }}
              />
            </div>
          )
        })}
      </div>
      <p className="text-sm text-text-secondary">태그: {content.tags.map((tag) => `#${tag}`).join(' ')}</p>
    </section>
  )
}

function FactTags({ text, facts }) {
  const matched = (facts || []).filter((fact) => fact.verificationStatus !== 'UNKNOWN' && fact.value && String(text || '').includes(fact.value.slice(0, Math.min(12, fact.value.length))))
  if (!matched.length) return null
  return (
    <p className="mt-1 text-[11px] text-text-secondary">
      사실 {matched.map((fact) => fact.verificationStatus === 'OBSERVED' ? '관찰' : '확인').filter((label, index, list) => list.indexOf(label) === index).join(' · ')}
    </p>
  )
}

function ChannelPreview({ project, tab }) {
  if (tab === 'STORY') {
    return (
      <article className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-xs font-semibold text-text-secondary">Master Story</p>
        <h2 className="mt-2 text-2xl font-bold text-text-display">{project.story?.subject}</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text-primary">{project.story?.narrative}</p>
      </article>
    )
  }
  if (tab === 'BLOG') {
    const blog = project.contents.BLOG
    return (
      <article className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="text-2xl font-bold text-text-display">{blog.title}</h2>
        <div className="mt-4 space-y-4">
          {blog.blocks.map((block) => {
            if (block.type === 'photo') {
              const asset = project.assets[block.assetIndex]
              return asset ? <img key={block.id} src={asset.dataUrl} alt={asset.name} className="max-h-80 w-full rounded-xl object-cover" /> : null
            }
            if (block.type === 'heading') return <h3 key={block.id} className="text-lg font-bold text-text-display">{block.text}</h3>
            return <p key={block.id} className="whitespace-pre-wrap text-sm leading-7 text-text-primary">{block.text}</p>
          })}
        </div>
        <p className="mt-6 text-sm text-text-secondary">{blog.tags.map((tag) => `#${tag}`).join(' ')}</p>
      </article>
    )
  }
  const platform = tab === 'THREADS' ? null : tab
  const text = platform
    ? platformPlain(project.contents[platform])
    : `${platformPlain(project.contents.X)}\n\n${platformPlain(project.contents.THREADS)}`
  return <pre className="whitespace-pre-wrap rounded-2xl bg-white p-5 font-sans text-sm leading-7 text-text-primary shadow-card">{text}</pre>
}

function moveAsset(project, index, direction) {
  const next = index + direction
  if (next < 0 || next >= project.assets.length) return null
  const assets = [...project.assets]
  ;[assets[index], assets[next]] = [assets[next], assets[index]]
  const ordered = assets.map((asset, order) => ({ ...asset, sortOrder: order }))
  const swap = (assetIndex) => {
    if (assetIndex === index) return next
    if (assetIndex === next) return index
    return assetIndex
  }
  const contents = { ...project.contents }
  if (contents.BLOG) {
    contents.BLOG = {
      ...contents.BLOG,
      blocks: contents.BLOG.blocks.map((block) => (block.type === 'photo' ? { ...block, assetIndex: swap(block.assetIndex) } : block)),
    }
  }
  if (contents.INSTAGRAM?.photoOrder) {
    contents.INSTAGRAM = { ...contents.INSTAGRAM, photoOrder: contents.INSTAGRAM.photoOrder.map(swap) }
  }
  if (contents.YOUTUBE_SHORTS?.shots) {
    contents.YOUTUBE_SHORTS = {
      ...contents.YOUTUBE_SHORTS,
      shots: contents.YOUTUBE_SHORTS.shots.map((shot) => ({ ...shot, assetIndex: swap(shot.assetIndex) })),
    }
  }
  return { assets: ordered, contents }
}

function channelHasBody(content) {
  if (!content) return false
  if (content.platform === 'BLOG') return content.blocks?.some((block) => block.text)
  if (content.platform === 'THREADS') return content.parts?.some((part) => part.text)
  if (content.platform === 'X') return Boolean(content.single)
  return Boolean(content.caption || content.script || content.story || content.headline)
}

function statusText(writing, savePhase, timestamp) {
  if (writing) return '스토리를 작성하는 중'
  if (savePhase === 'saving') return '저장하는 중'
  if (savePhase === 'failed') return '저장에 실패해 이 브라우저에 임시로 남겼습니다'
  return savedLabel(timestamp)
}

function savedLabel(timestamp) {
  if (!timestamp) return ''
  const time = new Date(timestamp)
  const hour = String(time.getHours()).padStart(2, '0')
  const minute = String(time.getMinutes()).padStart(2, '0')
  return `저장됨 ${hour}:${minute}`
}

function ChannelFields({ content, fields, onChange, extra }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
      {fields.map(([key, label]) => (
        <label key={key} className="block text-sm font-semibold">
          {label}
          <textarea
            className="mt-1 w-full rounded-xl border border-border-subtle p-3 font-normal"
            rows={key === 'caption' || key === 'script' || key === 'information' ? 6 : 3}
            defaultValue={content[key]}
            onBlur={(event) => onChange({ ...content, [key]: event.target.value })}
          />
        </label>
      ))}
      {extra}
    </section>
  )
}
