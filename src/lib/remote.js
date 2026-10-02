import { checkProject, generateContents } from './engine'
import { uid } from './media'

function cleanTag(value) {
  return String(value || '').replace(/^#/, '').trim()
}

function mapBlog(blog, project, mode, fallback) {
  const assetCount = project.assets?.length || 0
  const blocks = (blog.blocks || [])
    .map((block) => {
      if (block.type === 'photo') {
        const assetIndex = Number(block.assetIndex)
        if (!Number.isInteger(assetIndex) || assetIndex < 0 || assetIndex >= assetCount) return null
        return {
          id: uid('block'),
          type: 'photo',
          assetIndex,
          caption: block.caption || project.assets[assetIndex]?.name || '',
        }
      }
      const text = String(block.text || '').trim()
      if (!text || (block.type !== 'heading' && block.type !== 'paragraph')) return null
      return { id: uid('block'), type: block.type, text }
    })
    .filter(Boolean)
  const titleCandidates = [...new Set((blog.titleCandidates || []).map((title) => String(title).trim()).filter(Boolean))].slice(0, 3)
  const title = String(blog.title || titleCandidates[0] || fallback.title).trim()
  if (!blocks.length) return fallback
  if (!titleCandidates.includes(title)) titleCandidates.unshift(title)
  return {
    id: uid('content'),
    platform: 'BLOG',
    title,
    titleCandidates: titleCandidates.slice(0, 3),
    mode,
    tags: (blog.tags || []).map(cleanTag).filter(Boolean).slice(0, 8),
    blocks,
    status: 'draft',
  }
}

function channel(platform, fields) {
  return { id: uid('content'), platform, status: 'draft', ...fields }
}

export function applyRemoteGeneration(project, remote, mode) {
  const blogMode = mode || project.contents?.BLOG?.mode || 'search'
  const local = generateContents(project, { mode: blogMode })
  if (!remote || remote.provider !== 'openai' || !remote.story?.narrative) {
    return { ...local, provider: remote?.provider || 'local', fallbackReason: remote?.fallbackReason || '' }
  }

  const story = {
    ...local.story,
    subject: remote.story.subject || local.story.subject,
    context: remote.story.context || local.story.context,
    coreMessage: remote.story.coreMessage || local.story.coreMessage,
    narrativeAngle: remote.story.narrativeAngle || local.story.narrativeAngle,
    narrative: remote.story.narrative,
    ctaDirection: remote.story.ctaDirection || local.story.ctaDirection,
    version: (project.story?.version || 0) + 1,
  }
  const blog = mapBlog(remote.blog || {}, project, blogMode, local.contents.BLOG)
  const instagram = remote.instagram?.caption
    ? channel('INSTAGRAM', {
        hook: remote.instagram.hook || blog.title,
        caption: remote.instagram.caption,
        story: remote.instagram.story || '',
        cta: remote.instagram.cta || '',
        hashtags: (remote.instagram.hashtags || []).map(cleanTag).filter(Boolean),
        photoOrder: (project.assets || []).map((_, index) => index),
        carousel: local.contents.INSTAGRAM.carousel,
      })
    : local.contents.INSTAGRAM
  const facebook = remote.facebook?.story
    ? channel('FACEBOOK', {
        headline: remote.facebook.headline || blog.title,
        context: remote.facebook.context || '',
        story: remote.facebook.story,
        information: remote.facebook.information || '',
        cta: remote.facebook.cta || '',
        linkNote: remote.facebook.linkNote || local.contents.FACEBOOK.linkNote,
      })
    : local.contents.FACEBOOK
  const x = remote.x?.single
    ? channel('X', {
        single: remote.x.single,
        thread: (remote.x.thread || []).map((line) => String(line).trim()).filter(Boolean),
      })
    : local.contents.X
  const threads = remote.threads?.parts?.length
    ? channel('THREADS', {
        parts: remote.threads.parts
          .map((part, index) => ({
            label: part.label || `${index + 1}/${remote.threads.parts.length}`,
            text: String(part.text || '').trim(),
          }))
          .filter((part) => part.text),
      })
    : local.contents.THREADS
  const shorts = remote.shorts?.script
    ? channel('YOUTUBE_SHORTS', {
        hook: remote.shorts.hook || blog.title,
        script: remote.shorts.script,
        shots: local.contents.YOUTUBE_SHORTS.shots,
        captions: remote.shorts.captions || remote.shorts.script,
        title: remote.shorts.title || blog.title,
        description: remote.shorts.description || '',
        hashtags: (remote.shorts.hashtags || []).map(cleanTag).filter(Boolean),
        thumbnailCopy: remote.shorts.thumbnailCopy || blog.title,
      })
    : local.contents.YOUTUBE_SHORTS

  const contents = {
    BLOG: blog,
    INSTAGRAM: instagram,
    FACEBOOK: facebook,
    X: x,
    THREADS: threads,
    YOUTUBE_SHORTS: shorts,
  }
  return {
    story,
    contents,
    qualityChecks: checkProject(project, contents),
    status: 'draft',
    editedAfterGenerate: false,
    generatedAt: Date.now(),
    provider: 'openai',
  }
}
