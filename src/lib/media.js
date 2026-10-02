export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`
}

export function toSentence(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return /[.!?。]$/.test(text) ? text : `${text}.`
}

export function trimTitle(value, max = 42) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

export async function readImageFile(file) {
  const dataUrl = await resizeImage(file, 1600, 0.82)
  return dataUrl
}

function resizeImage(file, maxEdge, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(type, quality))
      }
      image.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function downloadAssets(assets) {
  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index]
    const ext = asset.dataUrl.includes('image/png') ? 'png' : 'jpg'
    const safeName = asset.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w가-힣-]+/g, '_')
      .slice(0, 24) || 'photo'
    downloadDataUrl(asset.dataUrl, `${String(index + 1).padStart(2, '0')}_${safeName}.${ext}`)
    await new Promise((resolve) => setTimeout(resolve, 280))
  }
}

export function blogTitleText(content) {
  return String(content?.title || '').trim()
}

export function blogBodyText(content) {
  return (content?.blocks || [])
    .filter((block) => block.type === 'heading' || block.type === 'paragraph')
    .map((block) => String(block.text || '').trim())
    .filter(Boolean)
    .join('\n\n')
}

export function blogTagText(content) {
  return (content?.tags || []).map((tag) => `#${tag}`).join(' ')
}

export function contentToPlain(content) {
  if (!content) return ''
  if (content.platform === 'BLOG') {
    const lines = [content.title, '']
    content.blocks.forEach((block) => {
      if (block.type === 'heading') lines.push('', block.text, '')
      if (block.type === 'paragraph') lines.push(block.text, '')
      if (block.type === 'photo') lines.push(`[사진 ${block.assetIndex + 1}]`, '')
    })
    if (content.tags?.length) lines.push(content.tags.map((tag) => `#${tag}`).join(' '))
    return lines.join('\n').trim()
  }
  return JSON.stringify(content, null, 2)
    .replace(/[{}[\]"]/g, '')
    .replace(/,\n/g, '\n')
}

export function blogToHtml(content) {
  const body = content.blocks
    .map((block) => {
      if (block.type === 'heading') return `<h2><strong>${escapeHtml(block.text)}</strong></h2>`
      if (block.type === 'paragraph') return `<p>${escapeHtml(block.text)}</p>`
      if (block.type === 'photo') return `<p>[사진 ${block.assetIndex + 1} 삽입]</p>`
      return ''
    })
    .join('')
  const tags = content.tags?.length
    ? `<p>${content.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}</p>`
    : ''
  return `<h1>${escapeHtml(content.title)}</h1>${body}${tags}`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export async function copyRich(html, plain) {
  try {
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ])
      return 'rich'
    }
  } catch {
    // 서식 복사가 막히면 텍스트 복사로 이어간다.
  }
  await navigator.clipboard.writeText(plain)
  return 'plain'
}

export async function copyPlain(text) {
  await navigator.clipboard.writeText(text)
}

export function platformPlain(content) {
  if (!content) return ''
  if (content.platform === 'BLOG') return contentToPlain(content)
  if (content.platform === 'INSTAGRAM') {
    return [content.hook, '', content.caption, '', content.story, '', content.cta, '', (content.hashtags || []).map((tag) => `#${tag}`).join(' ')].join('\n').trim()
  }
  if (content.platform === 'FACEBOOK') {
    return [content.headline, '', content.context, '', content.story, '', content.information, '', content.cta, '', content.linkNote].filter(Boolean).join('\n').trim()
  }
  if (content.platform === 'X') {
    return [content.single, '', ...(content.thread || [])].join('\n\n').trim()
  }
  if (content.platform === 'THREADS') {
    return (content.parts || []).map((part) => `${part.label}\n${part.text}`).join('\n\n')
  }
  if (content.platform === 'YOUTUBE_SHORTS') {
    const shots = (content.shots || []).map((shot) => `- 사진 ${shot.assetIndex + 1}: ${shot.note}`).join('\n')
    return [content.title, '', content.hook, '', content.script, '', '샷 리스트', shots, '', content.captions, '', content.description, '', content.thumbnailCopy].join('\n').trim()
  }
  return ''
}
