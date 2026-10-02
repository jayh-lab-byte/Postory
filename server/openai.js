const STORY_RULES = `당신은 한국어 스토리 작가다. 사용자의 짧은 메모와 키워드를 게시할 수 있는 이야기로 다시 쓴다.
쓰는 법:
- narrative는 3~5문단이다. 문단 사이에는 빈 줄을 둔다.
- 키워드만 있어도 장소, 대상, 감상 순으로 장면이 이어지게 잇는다.
- 메모 문장을 그대로 복사하거나 줄마다 반복하지 않는다. 같은 사실은 이야기 속 문장으로 바꾼다.
- 첫 문단은 언제 어디에 있었는지, 가운데는 메모에 있는 메뉴·가격·공간, 마지막은 사용자가 적은 감상이다.
- VERIFIED만 사실로 쓴다. OBSERVED는 "사진에서 ~가 보인다"로만 쓴다.
- 메모에 없는 대기, 원산지, 직원 응대, 재방문, 별점, 가격, 맛 평가는 만들지 않는다.
- "확인한 내용입니다" 같은 작성 설명은 넣지 않는다.
- 브랜드 톤은 문체만 바꾼다. 새 사실이 되면 안 된다.
- 채널마다 문장을 다시 쓴다. 인스타 캡션을 다른 채널에 붙이지 않는다.`

export async function completeJson(env, { system, user, schemaName, schema, images = [] }) {
  const model = env.OPENAI_MODEL || 'gpt-4o-mini'
  const content = [{ type: 'text', text: user }]
  images.forEach((url) => {
    content.push({ type: 'image_url', image_url: { url, detail: 'low' } })
  })
  const body = {
    model,
    temperature: 0.6,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: images.length ? content : user },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: schemaName, strict: true, schema },
    },
  }

  let lastStatus = 0
  let lastReason = 'UPSTREAM'
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attempt === 0 ? body : { ...body, response_format: { type: 'json_object' } }),
    })
    if (response.ok) {
      const payload = await response.json()
      const text = payload.choices?.[0]?.message?.content || '{}'
      return JSON.parse(text)
    }
    lastStatus = response.status
    const detail = await response.json().catch(() => ({}))
    const reason = detail.error?.code || detail.error?.type
    if (reason) lastReason = String(reason).slice(0, 40)
    if (response.status !== 400 && response.status !== 429 && response.status < 500) break
  }
  const error = new Error('upstream')
  error.code = 'UPSTREAM'
  error.status = lastStatus
  error.reason = lastReason
  throw error
}

export function storySystem() {
  return STORY_RULES
}

const text = { type: 'string' }
const stringList = { type: 'array', items: text }

const blockSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'text', 'assetIndex', 'caption'],
  properties: {
    type: { type: 'string', enum: ['paragraph', 'heading', 'photo'] },
    text,
    assetIndex: { type: 'integer' },
    caption: text,
  },
}

export const generationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['story', 'blog', 'instagram', 'facebook', 'x', 'threads', 'shorts'],
  properties: {
    story: {
      type: 'object',
      additionalProperties: false,
      required: ['subject', 'narrative', 'coreMessage', 'narrativeAngle', 'context', 'ctaDirection'],
      properties: {
        subject: text,
        narrative: text,
        coreMessage: text,
        narrativeAngle: text,
        context: text,
        ctaDirection: text,
      },
    },
    blog: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'titleCandidates', 'tags', 'blocks'],
      properties: {
        title: text,
        titleCandidates: stringList,
        tags: stringList,
        blocks: { type: 'array', items: blockSchema },
      },
    },
    instagram: {
      type: 'object',
      additionalProperties: false,
      required: ['hook', 'caption', 'story', 'cta', 'hashtags'],
      properties: { hook: text, caption: text, story: text, cta: text, hashtags: stringList },
    },
    facebook: {
      type: 'object',
      additionalProperties: false,
      required: ['headline', 'context', 'story', 'information', 'cta', 'linkNote'],
      properties: {
        headline: text,
        context: text,
        story: text,
        information: text,
        cta: text,
        linkNote: text,
      },
    },
    x: {
      type: 'object',
      additionalProperties: false,
      required: ['single', 'thread'],
      properties: { single: text, thread: stringList },
    },
    threads: {
      type: 'object',
      additionalProperties: false,
      required: ['parts'],
      properties: {
        parts: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'text'],
            properties: { label: text, text },
          },
        },
      },
    },
    shorts: {
      type: 'object',
      additionalProperties: false,
      required: ['hook', 'script', 'captions', 'title', 'description', 'thumbnailCopy', 'hashtags'],
      properties: {
        hook: text,
        script: text,
        captions: text,
        title: text,
        description: text,
        thumbnailCopy: text,
        hashtags: stringList,
      },
    },
  },
}

export const observationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['observations'],
  properties: { observations: stringList },
}

export const rewriteSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: { text },
}

export function factBrief(body) {
  const facts = Array.isArray(body.facts) ? body.facts : []
  const known = facts
    .filter((fact) => fact.verificationStatus === 'VERIFIED' || fact.verificationStatus === 'OBSERVED')
    .map((fact) => `${fact.verificationStatus}/${fact.sourceType || 'USER'}: ${fact.value}`)
  const unknown = facts
    .filter((fact) => fact.verificationStatus === 'UNKNOWN')
    .map((fact) => fact.value)
  const profile = body.profile || {}
  return [
    `목적: ${body.contentPurpose || 'daily'}`,
    `블로그 모드: ${body.mode || 'search'}`,
    `사진 장수: ${Number(body.assetCount) || 0}`,
    `메모:\n${String(body.sourceText || '').slice(0, 4000)}`,
    `사용 가능한 사실:\n${known.join('\n') || '(없음)'}`,
    `글에 쓰면 안 되는 미확인 항목:\n${unknown.join('\n') || '(없음)'}`,
    `브랜드 이름: ${profile.name || ''}`,
    `소개: ${profile.bio || ''}`,
    `톤: ${profile.tone || ''}`,
    body.keepStory && body.story?.narrative ? `이미 확정한 이야기. 채널 문장만 이 이야기에 맞춘다:\n${String(body.story.narrative).slice(0, 2000)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}
