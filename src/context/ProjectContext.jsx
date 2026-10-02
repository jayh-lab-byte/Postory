import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadProfile, loadProjects, removeProject, saveProfile, saveProject } from '../lib/db'
import { apiRequest, generationPayload } from '../lib/api'
import {
  addVerifiedFact,
  analyzeInput,
  applyAnswer,
  checkProject,
  mergeObservations,
  regenerateAllPlatforms,
  regeneratePlatform,
  removeExcerpt,
  rewriteBlockText,
} from '../lib/engine'
import { uid } from '../lib/media'
import { applyRemoteGeneration } from '../lib/remote'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [profile, setProfile] = useState({ id: 'profile', name: '', bio: '', tone: '' })
  const [loaded, setLoaded] = useState(false)
  const [toast, setToast] = useState(null)
  const [writing, setWriting] = useState(false)
  const [savePhase, setSavePhase] = useState('idle')
  const projectsRef = useRef([])
  const saveTimer = useRef(null)
  const saveSeq = useRef(0)
  const pendingWrite = useRef(null)

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    let alive = true
    Promise.all([loadProjects(), loadProfile()])
      .then(([items, storedProfile]) => {
        if (!alive) return
        const drafts = readDrafts()
        const merged = [...items]
        drafts.forEach((draft) => {
          const index = merged.findIndex((item) => item.id === draft.id)
          if (index === -1) merged.unshift(draft)
          else if ((draft.updatedAt || 0) > (merged[index].updatedAt || 0)) merged[index] = draft
        })
        merged.sort((a, b) => b.updatedAt - a.updatedAt)
        projectsRef.current = merged
        setProjects(merged)
        setProfile(storedProfile)
        setLoaded(true)
      })
      .catch(() => {
        if (!alive) return
        setLoaded(true)
        showToast('저장된 작업을 불러오지 못했습니다.')
      })
    return () => {
      alive = false
    }
  }, [])

  function showToast(message) {
    setToast(message)
    window.clearTimeout(showToast.timer)
    showToast.timer = window.setTimeout(() => setToast(null), 2400)
  }

  function remember(list) {
    projectsRef.current = list
    setProjects(list)
  }

  async function commitProject(project, seq) {
    try {
      await saveProject(project)
      if (seq !== saveSeq.current) return
      localStorage.removeItem(`postory:draft:${project.id}`)
      setSavePhase('saved')
    } catch {
      if (seq !== saveSeq.current) return
      try {
        localStorage.setItem(`postory:draft:${project.id}`, JSON.stringify(project))
        setSavePhase('failed')
        showToast('저장에 실패해 이 브라우저에 임시로 남겨 두었습니다.')
      } catch {
        setSavePhase('failed')
        showToast('저장에 실패했습니다. 화면에 입력한 내용은 남아 있습니다.')
      }
    }
  }

  function persist(project, { delay = 0 } = {}) {
    const next = { ...project, updatedAt: Date.now() }
    const current = projectsRef.current
    const exists = current.some((item) => item.id === next.id)
    const list = (exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current]).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    )
    remember(list)
    const seq = saveSeq.current + 1
    saveSeq.current = seq
    window.clearTimeout(saveTimer.current)
    if (delay > 0) {
      pendingWrite.current = next
      setSavePhase('saving')
      saveTimer.current = window.setTimeout(() => {
        pendingWrite.current = null
        commitProject(next, seq)
      }, delay)
      return next
    }
    pendingWrite.current = null
    setSavePhase('saving')
    return commitProject(next, seq).then(() => next)
  }

  useEffect(() => {
    function flushPending() {
      const pending = pendingWrite.current
      if (!pending) return
      window.clearTimeout(saveTimer.current)
      pendingWrite.current = null
      try {
        localStorage.setItem(`postory:draft:${pending.id}`, JSON.stringify(pending))
      } catch {
        // 화면의 입력은 메모리에 남아 있다.
      }
      saveProject(pending).then(() => {
        localStorage.removeItem(`postory:draft:${pending.id}`)
      }).catch(() => {})
    }
    window.addEventListener('pagehide', flushPending)
    return () => window.removeEventListener('pagehide', flushPending)
  }, [])

  function readProject(id) {
    return projectsRef.current.find((item) => item.id === id) || null
  }

  async function createProject({ contentPurpose, sourceText, assets }) {
    const project = {
      id: uid('ps'),
      contentPurpose,
      sourceText: sourceText || '',
      assets: assets || [],
      facts: [],
      questions: [],
      story: null,
      contents: null,
      qualityChecks: [],
      status: 'draft',
      editedAfterGenerate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    return persist(project)
  }

  async function updateProject(id, patch) {
    const current = readProject(id)
    if (!current) return null
    return persist({ ...current, ...patch, id }, { delay: 1500 })
  }

  async function deleteProject(id) {
    remember(projectsRef.current.filter((item) => item.id !== id))
    await removeProject(id)
  }

  async function analyzeProject(id) {
    const current = readProject(id)
    if (!current) return null
    let next = { ...current, ...analyzeInput(current), status: 'needs_info' }
    const images = (current.assets || [])
      .map((asset) => asset.dataUrl)
      .filter((url) => typeof url === 'string' && url.startsWith('data:image/') && url.length < 1_200_000)
      .slice(0, 4)
    if (images.length) {
      try {
        const remote = await apiRequest('/api/ai/analyze', { method: 'POST', body: { images } })
        if (remote.provider === 'openai') {
          const before = next.facts.length
          next = mergeObservations(next, remote.observations)
          if (next.facts.length > before) showToast('사진에서 보인 내용을 관찰 정보로 추가했습니다.')
        }
      } catch {
        showToast('사진 관찰은 건너뛰고, 메모 기준으로 사실을 나눴습니다.')
      }
    }
    return persist(next)
  }

  async function answerQuestion(id, questionId, answer, skipped) {
    const current = readProject(id)
    if (!current) return null
    return persist(applyAnswer(current, questionId, answer, skipped))
  }

  async function supplementFact(id, value) {
    const current = readProject(id)
    if (!current) return null
    return persist(addVerifiedFact(current, value))
  }

  function noticeFor(provider, reason) {
    if (provider === 'openai') return '메모를 바탕으로 스토리를 작성했습니다.'
    if (reason === 'NO_KEY') return 'OpenAI 키가 비어 있습니다. .env.local의 OPENAI_API_KEY를 저장한 뒤 다시 만들어 주세요.'
    if (reason === 'invalid_api_key') return 'OpenAI 키를 확인한 뒤 다시 시도해 주세요. 입력은 그대로입니다.'
    if (reason === 'credit_balance_exhausted') return 'OpenAI 크레딧이 없어 이 기기의 문장으로 만들었습니다. 크레딧을 채운 뒤 다시 써 주세요.'
    if (reason === 'rate_limit_exceeded') return '요청이 많아 잠시 뒤 다시 시도해 주세요. 입력은 그대로입니다.'
    if (reason) return 'AI 작성에 실패해 이 기기의 문장으로 만들었습니다. 입력은 그대로입니다.'
    return ''
  }

  async function requestGeneration(current, mode) {
    const remote = await apiRequest('/api/ai/generate', {
      method: 'POST',
      body: generationPayload(current, profile, mode),
    })
    return { remote, generated: applyRemoteGeneration(current, remote, mode) }
  }

  async function generateProject(id, mode) {
    const current = readProject(id)
    if (!current) return null
    setWriting(true)
    let generated
    try {
      const result = await requestGeneration(current, mode)
      generated = result.generated
      const notice = noticeFor(generated.provider, result.remote.fallbackReason)
      if (notice) showToast(notice)
    } catch {
      generated = applyRemoteGeneration(current, { provider: 'local', fallbackReason: 'UPSTREAM' }, mode)
      showToast('AI 작성에 실패해 이 기기의 문장으로 만들었습니다. 입력은 그대로입니다.')
    } finally {
      setWriting(false)
    }
    const { provider, fallbackReason, ...rest } = generated
    return persist({ ...current, ...rest, generator: provider, status: 'draft' })
  }

  async function updateContent(id, platform, content, { edited = true } = {}) {
    const current = readProject(id)
    if (!current) return null
    const contents = { ...current.contents, [platform]: content }
    return persist({
      ...current,
      contents,
      qualityChecks: checkProject({ ...current, sourceText: current.sourceText, facts: current.facts }, contents),
      editedAfterGenerate: edited ? true : current.editedAfterGenerate,
      status: current.status === 'ready' ? 'draft' : current.status,
    }, { delay: 1500 })
  }

  async function regenerate(id, platform, mode) {
    const current = readProject(id)
    if (!current) return null
    setWriting(true)
    try {
      const { remote, generated } = await requestGeneration(current, mode || current.contents?.BLOG?.mode)
      if (generated.provider === 'openai') {
        const notice = noticeFor('openai')
        if (notice) showToast(notice)
        return persist({
          ...current,
          story: generated.story,
          contents: {
            ...current.contents,
            [platform]: generated.contents[platform],
          },
          qualityChecks: checkProject(current, {
            ...current.contents,
            [platform]: generated.contents[platform],
          }),
          generator: 'openai',
          editedAfterGenerate: true,
        })
      }
      const notice = noticeFor('local', remote.fallbackReason)
      if (notice) showToast(notice)
    } catch {
      showToast('AI 작성에 실패해 이 기기의 문장으로 만들었습니다. 입력은 그대로입니다.')
    } finally {
      setWriting(false)
    }
    return persist({ ...regeneratePlatform(current, platform, mode), generator: 'local' })
  }

  async function regenerateAll(id) {
    const current = readProject(id)
    if (!current) return null
    setWriting(true)
    try {
      const { generated, remote } = await requestGeneration(current, current.contents?.BLOG?.mode)
      if (generated.provider === 'openai') {
        showToast('메모를 바탕으로 스토리를 작성했습니다.')
        return persist({
          ...current,
          story: generated.story,
          contents: generated.contents,
          qualityChecks: generated.qualityChecks,
          generator: 'openai',
          editedAfterGenerate: true,
        })
      }
      const notice = noticeFor('local', remote.fallbackReason)
      if (notice) showToast(notice)
    } catch {
      showToast('채널 글을 다시 만들지 못했습니다. 기존 글은 그대로입니다.')
      return current
    } finally {
      setWriting(false)
    }
    return persist({ ...regenerateAllPlatforms(current), generator: 'local' })
  }

  async function rewriteBlock(id, blockId) {
    const current = readProject(id)
    const blog = current?.contents?.BLOG
    const block = blog?.blocks?.find((item) => item.id === blockId)
    if (!block?.text) return current
    let text = ''
    try {
      const remote = await apiRequest('/api/ai/rewrite', {
        method: 'POST',
        body: { ...generationPayload(current, profile), text: block.text },
      })
      text = remote.provider === 'openai' && remote.text ? remote.text : rewriteBlockText(block.text)
      if (remote.fallbackReason === 'UPSTREAM') showToast('다시 쓰기에 실패해 문장만 다듬었습니다.')
    } catch {
      text = rewriteBlockText(block.text)
      showToast('다시 쓰기에 실패해 문장만 다듬었습니다.')
    }
    if (!text || text === block.text) {
      showToast('사실 추가 없이 유지한 문장입니다.')
      return current
    }
    return updateContent(id, 'BLOG', {
      ...blog,
      blocks: blog.blocks.map((item) => (item.id === blockId ? { ...item, text } : item)),
    })
  }

  async function addBlogTag(id, tag) {
    const current = readProject(id)
    const blog = current?.contents?.BLOG
    const clean = String(tag || '').replace(/^#/, '').trim()
    if (!blog || !clean || (blog.tags || []).includes(clean)) return current
    return updateContent(id, 'BLOG', { ...blog, tags: [...blog.tags, clean] })
  }

  async function resolveIssue(id, issueId, action, factText) {
    const current = readProject(id)
    if (!current) return null
    const issue = (current.qualityChecks || []).find((item) => item.id === issueId)
    if (!issue) return current
    let contents = current.contents
    let nextProject = current
    if (action === 'delete' && issue.excerpt) {
      contents = {
        ...contents,
        [issue.platform]: removeExcerpt(contents[issue.platform], issue.excerpt),
      }
    }
    if (action === 'fact' && factText) {
      nextProject = addVerifiedFact(current, factText)
      const blog = contents.BLOG
      if (blog) {
        contents = {
          ...contents,
          BLOG: {
            ...blog,
            blocks: [
              ...blog.blocks,
              { id: uid('block'), type: 'paragraph', text: factText.endsWith('.') ? factText : `${factText}.` },
            ],
          },
        }
      }
    }
    if (action === 'keep') {
      const marked = current.qualityChecks.map((item) => (item.id === issueId ? { ...item, status: 'dismissed' } : item))
      return persist({ ...current, qualityChecks: marked })
    }
    return persist({
      ...nextProject,
      contents,
      qualityChecks: checkProject(nextProject, contents),
      editedAfterGenerate: true,
    })
  }

  async function markReady(id) {
    const current = readProject(id)
    if (!current) return null
    const blocking = (current.qualityChecks || []).some(
      (issue) => issue.checkType === 'UNSUPPORTED' && issue.status === 'open',
    )
    if (blocking) {
      showToast('확인되지 않은 문장을 먼저 지우거나 사실을 입력해 주세요.')
      return current
    }
    return persist({ ...current, status: 'ready' })
  }

  async function saveUserProfile(next) {
    const profileNext = { ...profile, ...next, id: 'profile' }
    setProfile(profileNext)
    await saveProfile(profileNext)
    showToast('프로필을 저장했습니다.')
  }

  const value = useMemo(
    () => ({
      projects,
      profile,
      loaded,
      writing,
      savePhase,
      toast,
      showToast,
      createProject,
      updateProject,
      deleteProject,
      analyzeProject,
      answerQuestion,
      supplementFact,
      generateProject,
      updateContent,
      regenerate,
      regenerateAll,
      rewriteBlock,
      addBlogTag,
      resolveIssue,
      markReady,
      saveUserProfile,
    }),
    [projects, profile, loaded, writing, savePhase, toast],
  )

  return (
    <ProjectContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 md:bottom-8" role="status" aria-live="polite">
          <div className="flex items-center gap-2 rounded-2xl bg-text-display px-5 py-3 text-sm text-white shadow-float">
            <span className="material-symbols-outlined text-[20px] text-state-verified">check_circle</span>
            {toast}
          </div>
        </div>
      ) : null}
    </ProjectContext.Provider>
  )
}

function readDrafts() {
  const drafts = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key?.startsWith('postory:draft:')) continue
    try {
      const project = JSON.parse(localStorage.getItem(key) || '')
      if (project?.id) drafts.push(project)
    } catch {
      localStorage.removeItem(key)
    }
  }
  return drafts
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('ProjectProvider가 필요합니다.')
  return context
}
