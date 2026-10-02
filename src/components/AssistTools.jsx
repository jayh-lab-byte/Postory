import { useState } from 'react'
import { apiRequest } from '../lib/api'
import { uid } from '../lib/media'
import { MAX_PHOTOS } from '../data/catalog'

export function AssistTools({ query, assets, onAddAsset, onAddTag }) {
  const [open, setOpen] = useState('')
  const [keywords, setKeywords] = useState(null)
  const [photos, setPhotos] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadKeywords() {
    setOpen('keywords')
    setBusy(true)
    setNotice('')
    try {
      const data = await apiRequest(`/api/research/naver-blog?q=${encodeURIComponent(query || '')}`)
      setKeywords(data.keywords || [])
      if (data.provider === 'missing') setNotice('네이버 검색 키를 서버에 넣으면 보조 키워드를 불러옵니다.')
      else if (!data.keywords?.length) setNotice('같이 쓰이는 말을 찾지 못했습니다.')
    } catch (error) {
      setKeywords([])
      setNotice(error.code === 'RATE_LIMIT' ? '검색 요청이 잠시 많습니다. 잠시 뒤 다시 시도해 주세요.' : '검색 키워드를 가져오지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function loadPhotos() {
    setOpen('photos')
    setBusy(true)
    setNotice('')
    try {
      const data = await apiRequest(`/api/assets/search?q=${encodeURIComponent(query || '')}`)
      setPhotos(data.photos || [])
      if (data.provider === 'missing') setNotice('Pexels 키를 서버에 넣으면 보조 사진을 고를 수 있습니다. 고르기 전에는 글에 넣지 않습니다.')
      else if (!data.photos?.length) setNotice('맞는 사진을 찾지 못했습니다.')
    } catch (error) {
      setPhotos([])
      setNotice(error.code === 'RATE_LIMIT' ? '사진 검색이 잠시 많습니다. 잠시 뒤 다시 시도해 주세요.' : '보조 사진을 가져오지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function pickPhoto(photo) {
    if (assets.length >= MAX_PHOTOS) {
      setNotice('사진은 최대 10장까지 올릴 수 있습니다.')
      return
    }
    setBusy(true)
    try {
      const imported = await apiRequest('/api/assets/import', { method: 'POST', body: { url: photo.download } })
      onAddAsset({
        id: uid('asset'),
        name: `pexels-${photo.id}`,
        dataUrl: imported.dataUrl,
        sortOrder: assets.length,
        status: 'ready',
        credit: photo.photographer,
      })
      setNotice(`${photo.photographer} 사진을 추가했습니다.`)
    } catch {
      setNotice('선택한 사진을 가져오지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="font-semibold text-text-display">보조 자료</h2>
      <p className="mt-1 text-xs text-text-secondary">검색어와 사진은 고른 뒤에만 글이나 자산에 들어갑니다.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={loadKeywords} disabled={busy} className="rounded-lg bg-canvas-surface px-3 py-2 text-sm font-semibold disabled:opacity-60">
          검색 보조 키워드
        </button>
        {assets.length < 2 ? (
          <button type="button" onClick={loadPhotos} disabled={busy} className="rounded-lg bg-canvas-surface px-3 py-2 text-sm font-semibold disabled:opacity-60">
            보조 사진 찾기
          </button>
        ) : null}
      </div>
      {notice ? <p className="mt-3 text-sm text-text-secondary" aria-live="polite">{notice}</p> : null}
      {open === 'keywords' && keywords?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {keywords.map((word) => (
            <button key={word} type="button" onClick={() => onAddTag?.(word)} className="rounded-full bg-canvas-subtle px-3 py-1 text-sm">
              {word}
            </button>
          ))}
        </div>
      ) : null}
      {open === 'photos' && photos?.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <button key={photo.id} type="button" onClick={() => pickPhoto(photo)} className="overflow-hidden rounded-xl text-left" disabled={busy}>
              <img src={photo.preview} alt={photo.alt} className="aspect-[4/3] w-full object-cover" />
              <span className="block truncate px-1 py-1 text-[11px] text-text-secondary">{photo.photographer}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
