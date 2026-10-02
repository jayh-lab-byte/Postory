import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentCard } from '../components/create'
import { useProjects } from '../context/ProjectContext'
import { PURPOSES } from '../data/catalog'
import { blogToHtml, contentToPlain, copyRich } from '../lib/media'

export default function ContentsPage() {
  const navigate = useNavigate()
  const { projects, deleteProject, showToast } = useProjects()
  const [status, setStatus] = useState('all')
  const [purpose, setPurpose] = useState('all')
  const [query, setQuery] = useState('')

  const visible = projects.filter((project) => {
    if (status === 'ready' && project.status !== 'ready') return false
    if (status === 'draft' && project.status === 'ready') return false
    if (purpose !== 'all' && project.contentPurpose !== purpose) return false
    const haystack = `${project.sourceText} ${project.story?.subject || ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="text-2xl font-bold text-text-display">내 콘텐츠</h1>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <label className="flex-1 text-sm font-semibold">
          검색
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          상태
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block rounded-xl border border-border-subtle px-3 py-2 font-normal">
            <option value="all">전체</option>
            <option value="draft">초안</option>
            <option value="ready">Ready</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          목적
          <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="mt-1 block rounded-xl border border-border-subtle px-3 py-2 font-normal">
            <option value="all">전체</option>
            {PURPOSES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-8 text-center text-sm text-text-secondary shadow-card">조건에 맞는 콘텐츠가 없습니다.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ContentCard
              key={project.id}
              project={project}
              onEdit={() => navigate(project.contents ? `/projects/${project.id}` : `/create/${project.id}`)}
              onCopy={async () => {
                const blog = project.contents?.BLOG
                if (!blog) return
                try {
                  const mode = await copyRich(blogToHtml(blog), contentToPlain(blog))
                  showToast(mode === 'rich' ? '서식과 텍스트를 복사했습니다.' : '텍스트를 복사했습니다.')
                } catch {
                  showToast('복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
                }
              }}
              onDelete={() => deleteProject(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
