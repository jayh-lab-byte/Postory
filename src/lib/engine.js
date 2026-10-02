import { PURPOSE_MAP } from '../data/catalog'
import { trimTitle, uid } from './media'

const QUESTION_BANK = {
  cafe: [
    {
      prompt: '음료나 메뉴에서 가장 인상 깊었던 점은?',
      options: ['고소함', '진한 커피 맛', '부드러움'],
    },
    {
      prompt: '공간에서 기억에 남는 점이 있나요?',
      options: ['좌석', '채광', '조용함'],
    },
  ],
  restaurant: [
    {
      prompt: '음식에서 가장 기억에 남는 점은?',
      options: ['맛', '양', '가격'],
    },
    {
      prompt: '다시 떠오르는 메뉴가 있나요?',
      options: ['있다', '없다', '아직 모르겠다'],
    },
  ],
  travel: [
    {
      prompt: '이번 기록에서 꼭 남기고 싶은 포인트는?',
      options: ['장소', '이동', '시간'],
    },
    {
      prompt: '직접 해본 일이 더 있나요?',
      options: ['있다', '없다'],
    },
  ],
  daily: [
    {
      prompt: '이 장면에 남은 감정은?',
      options: ['기쁨', '차분함', '아쉬움'],
    },
  ],
  product: [
    {
      prompt: '어떤 상황에서 사용했나요?',
      options: ['업무', '일상', '여행'],
    },
    {
      prompt: '직접 느낀 점은 무엇에 가깝나요?',
      options: ['사용감', '크기', '가격'],
    },
  ],
  service: [
    {
      prompt: '어떤 점을 해결하려고 했나요?',
      options: ['시간', '비용', '불편'],
    },
    {
      prompt: '이용 후 남은 느낌은?',
      options: ['편해졌다', '그대로다'],
    },
  ],
}

const GAP_RULES = [
  { pattern: /웨이팅|대기/, label: '웨이팅 소요 시간', detail: '방문 시점의 대기 여부는 입력에 없습니다.' },
  { pattern: /원산지|로스팅/, label: '재료 원산지나 로스팅 정보', detail: '입력과 사진만으로는 확인하지 않습니다.' },
  { pattern: /직원|친절/, label: '직원 응대', detail: '응대에 대한 직접 입력이 없습니다.' },
  { pattern: /재방문/, label: '재방문 의사', detail: '다시 갈지에 대한 입력이 없습니다.' },
  { pattern: /가격|비용|\d[\d,]*\s*원/, label: '가격', detail: '가격이 메모에 없습니다.', missing: true },
]

const PURPOSE_GAPS = {
  cafe: [GAP_RULES[0], GAP_RULES[1], GAP_RULES[4]],
  restaurant: [GAP_RULES[0], GAP_RULES[3], GAP_RULES[4]],
  travel: [GAP_RULES[0]],
  daily: [],
  product: [GAP_RULES[4]],
  service: [GAP_RULES[4]],
}

const PURPOSE_TAGS = {
  travel: ['여행', '여행기록'],
  daily: ['일상', '기록'],
  cafe: ['카페', '카페기록'],
  restaurant: ['맛집', '음식기록'],
  product: ['제품', '사용기록'],
  service: ['서비스', '이용기록'],
}

const CLICHES = ['최고의', '무조건', '인생 맛집', '강추', '필수 코스', '역대급', '완전 추천']

const POLICY_RULES = [
  { pattern: /상위\s*노출|C-?Rank|노출\s*보장|1위\s*보장/, label: '노출이나 순위를 보장하는 표현' },
  { pattern: /완치|치료\s*효과|의학적\s*효과/, label: '효과를 단정하는 표현' },
  { pattern: /수익\s*보장|원금\s*보장/, label: '수익을 보장하는 표현' },
]

const AD_RULES = [
  { pattern: /품절\s*임박|한정\s*수량|놓치면\s*후회|지금\s*바로\s*사/, label: '구매를 서두르게 하는 표현' },
  { pattern: /충격|경악|실화냐|아무도\s*모르는/, label: '클릭을 유도하는 표현' },
]

function splitMemo(text) {
  return String(text || '')
    .split(/\n+|(?<=[.!?。])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
}

function classifyFactType(value) {
  if (/가격|비용|\d[\d,]*\s*원/.test(value)) return '가격'
  if (/맛|메뉴|라떼|커피|음식/.test(value)) return '메뉴·경험'
  if (/방문|오늘|어제|주말|평일/.test(value)) return '방문'
  return '메모'
}

export function analyzeInput(project) {
  const source = project.sourceText || ''
  const parts = splitMemo(source)
  const facts = parts.map((value) => ({
    id: uid('fact'),
    factType: classifyFactType(value),
    value,
    sourceType: 'USER',
    verificationStatus: 'VERIFIED',
  }))

  if (project.assets?.length) {
    facts.push({
      id: uid('fact'),
      factType: '사진',
      value: `사진 ${project.assets.length}장이 첨부되었다.`,
      sourceType: 'IMAGE',
      verificationStatus: 'OBSERVED',
    })
  }

  const gaps = (PURPOSE_GAPS[project.contentPurpose] || []).filter((rule) => !rule.pattern.test(source))
  gaps.slice(0, 3).forEach((rule) => {
    facts.push({
      id: uid('fact'),
      factType: '미확인',
      value: rule.label,
      detail: rule.detail,
      sourceType: 'AI_INFERENCE',
      verificationStatus: 'UNKNOWN',
    })
  })

  const questions = (QUESTION_BANK[project.contentPurpose] || [])
    .filter((item) => !source.includes(item.prompt.slice(0, 6)))
    .slice(0, 3)
    .map((item, index) => ({
      id: uid('q'),
      prompt: item.prompt,
      options: item.options,
      index,
      total: Math.min(3, (QUESTION_BANK[project.contentPurpose] || []).length),
      answer: '',
      skipped: false,
      resolved: false,
    }))

  return {
    facts,
    questions,
    status: 'needs_info',
  }
}

export function applyAnswer(project, questionId, answer, skipped) {
  const questions = project.questions.map((question) => {
    if (question.id !== questionId) return question
    return {
      ...question,
      answer: skipped ? '' : answer,
      skipped,
      resolved: true,
    }
  })

  let facts = project.facts
  if (!skipped && answer) {
    const question = project.questions.find((item) => item.id === questionId)
    facts = [
      ...facts,
      {
        id: uid('fact'),
        factType: '추가 답변',
        value: `${question.prompt} ${answer}`,
        sourceType: 'USER',
        verificationStatus: 'VERIFIED',
      },
    ]
  }

  return { ...project, questions, facts, updatedAt: Date.now() }
}

export function addVerifiedFact(project, value) {
  const text = value.trim()
  if (!text) return project
  return {
    ...project,
    sourceText: project.sourceText ? `${project.sourceText}\n${text}` : text,
    facts: [
      ...project.facts,
      {
        id: uid('fact'),
        factType: '추가 사실',
        value: text,
        sourceType: 'USER',
        verificationStatus: 'VERIFIED',
      },
    ],
    updatedAt: Date.now(),
  }
}

function verifiedValues(project) {
  return (project.facts || [])
    .filter((fact) => fact.verificationStatus === 'VERIFIED')
    .map((fact) => fact.value)
}

function observedValues(project) {
  return (project.facts || [])
    .filter((fact) => fact.verificationStatus === 'OBSERVED')
    .map((fact) => fact.value)
}

function tagsFor(project) {
  const purposeTags = PURPOSE_TAGS[project.contentPurpose] || ['기록']
  const words = (project.sourceText || '').match(/[가-힣A-Za-z0-9]{2,12}/g) || []
  const extra = []
  words.forEach((word) => {
    if (extra.length >= 3) return
    if (purposeTags.includes(word) || extra.includes(word)) return
    if (/그리고|하지만|오늘|정말|너무|그냥|이번|저는/.test(word)) return
    extra.push(word)
  })
  return [...purposeTags, ...extra].slice(0, 6)
}

function hasBatchim(word) {
  const last = [...String(word || '').trim()].pop()
  if (!last) return false
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

function withParticle(word, batchimForm, plainForm) {
  const clean = String(word || '').trim()
  if (!clean) return ''
  return `${clean}${hasBatchim(clean) ? batchimForm : plainForm}`
}

function ensurePeriod(text) {
  const value = String(text || '').trim()
  if (!value) return ''
  return /[.!?。]$/.test(value) ? value : `${value}.`
}

function toProse(raw) {
  let text = String(raw || '').trim().replace(/[.!?。]+$/g, '').replace(/\s+/g, ' ')
  if (!text) return ''
  ;[
    [/하지 않았음/g, '하지 않았다'],
    [/되었음/g, '되었다'],
    [/됐음/g, '됐다'],
    [/했음/g, '했다'],
    [/였음/g, '였다'],
    [/았음/g, '았다'],
    [/었음/g, '었다'],
    [/있음/g, '있다'],
    [/없음/g, '없다'],
    [/좋음/g, '좋다'],
  ].forEach(([pattern, next]) => {
    text = text.replace(pattern, next)
  })
  if (/[^다]임$/.test(text)) text = text.replace(/임$/, '이다')
  if (/방문$/.test(text)) {
    const place = text.replace(/\s*방문$/, '').replace(/에$/, '').trim()
    text = `${place}에 다녀왔다`
  }
  const priced = text.match(/^(.+?)\s+(\d[\d,]*\s*원)$/)
  if (priced) text = `${withParticle(priced[1], '은', '는')} ${priced[2]}이었다`
  text = text.replace(/방문했는데(?!,)/, '방문했는데,')
  text = text.replace(/인테리어가 차분/, '인테리어는 차분')
  return text
}

function clauseKind(text) {
  if (/\d[\d,]*\s*원/.test(text)) return 'item'
  if (/채광|인테리어|분위기|조용|맛|좋|차분|아쉽|편안|좌석/.test(text)) return 'sense'
  if (/방문|다녀|들렀/.test(text)) return 'visit'
  return 'note'
}

function storyPieces(project) {
  const clauses = verifiedValues(project).filter((value) => !/^사진 \d+장/.test(value))
  const prose = clauses
    .map((clause) => ({
      source: clause,
      text: toProse(clause),
      kind: clauseKind(toProse(clause)),
    }))
    .filter((item) => item.text)
  const visit = prose.filter((item) => item.kind === 'visit')
  const items = prose.filter((item) => item.kind === 'item')
  const sense = prose.filter((item) => item.kind === 'sense')
  const notes = prose.filter((item) => item.kind === 'note')
  const openingSource = visit.find((item) => /주말|평일|오전|오후|아침|점심|저녁|밤/.test(item.text)) || visit[0] || prose[0]
  const used = new Set(openingSource ? [openingSource.source] : [])
  const body = [...items, ...notes, ...visit]
    .filter((item) => !used.has(item.source))
    .map((item) => ensurePeriod(item.text))
    .join(' ')
  const feeling = sense
    .filter((item) => !used.has(item.source))
    .map((item) => ensurePeriod(item.text))
    .join(' ')
  const place = (visit[0]?.text || '').replace(/에 다녀왔다$/, '').trim()
  const itemName = (items[0]?.source || '')
    .replace(/\d[\d,]*\s*원/g, '')
    .replace(/[.,!\s]+$/g, '')
    .trim()
  const purpose = PURPOSE_MAP[project.contentPurpose]?.label || '기록'
  const price = (project.sourceText || '').match(/\d[\d,]*\s*원/)?.[0] || ''
  return {
    opening: openingSource ? ensurePeriod(openingSource.text) : '',
    body,
    feeling,
    place,
    itemName,
    purpose,
    price,
  }
}

export function buildStory(project) {
  const piece = storyPieces(project)
  const narrative = [piece.opening, piece.body, piece.feeling].filter(Boolean).join('\n\n')
  return {
    subject: piece.place || trimTitle(piece.opening, 48) || `${piece.purpose} 기록`,
    context: `${withParticle(piece.purpose, '으로', '로')} 남긴 장면`,
    verifiedFacts: verifiedValues(project),
    observedFacts: observedValues(project),
    userExperience: [piece.feeling, piece.body].filter(Boolean),
    coreMessage: piece.feeling || piece.body || piece.opening,
    narrativeAngle: piece.feeling || '메모에 적힌 장면을 이야기로 엮음',
    narrative,
    ctaDirection: piece.itemName ? `${piece.itemName}처럼 확인된 정보만 안내` : '확인된 내용만 안내',
    version: (project.story?.version || 0) + 1,
  }
}

function pushText(blocks, type, text) {
  if (!text) return
  blocks.push({ id: uid('block'), type, text })
}

function blogContent(project, mode = 'search') {
  const piece = storyPieces(project)
  const titles = []
  if (piece.place && piece.itemName) titles.push(trimTitle(`${piece.place}, ${piece.itemName}`, 46))
  if (piece.place) titles.push(trimTitle(`${piece.place} ${piece.purpose} 기록`, 46))
  if (piece.feeling) titles.push(trimTitle(piece.feeling.replace(/\.$/, ''), 46))
  if (!titles.length) titles.push(trimTitle(piece.opening || `${piece.purpose} 기록`, 46))
  const titleCandidates = [...new Set(titles)].slice(0, 3)
  const blocks = []
  pushText(blocks, 'paragraph', piece.opening)
  const photos = project.assets || []
  if (photos[0]) blocks.push({ id: uid('block'), type: 'photo', assetIndex: 0, caption: photos[0].name })

  if (mode === 'story') {
    pushText(blocks, 'heading', '그날의 장면')
    pushText(blocks, 'paragraph', [piece.body, piece.feeling].filter(Boolean).join(' '))
  } else if (mode === 'review') {
    pushText(blocks, 'heading', '이용한 내용')
    pushText(blocks, 'paragraph', piece.body)
    pushText(blocks, 'heading', '남긴 감상')
    pushText(blocks, 'paragraph', piece.feeling)
  } else {
    pushText(blocks, 'heading', '확인한 내용')
    pushText(blocks, 'paragraph', piece.body)
    pushText(blocks, 'heading', '공간과 감상')
    pushText(blocks, 'paragraph', piece.feeling)
  }

  photos.slice(1).forEach((asset, index) => {
    blocks.push({ id: uid('block'), type: 'photo', assetIndex: index + 1, caption: asset.name })
  })

  const observed = observedValues(project).filter((value) => !/^사진 \d+장/.test(value))
  if (observed.length) {
    pushText(blocks, 'heading', '사진에서 보인 것')
    observed.forEach((value) => pushText(blocks, 'paragraph', ensurePeriod(toProse(value))))
  }

  return {
    id: uid('content'),
    platform: 'BLOG',
    title: titleCandidates[0],
    titleCandidates,
    mode,
    tags: tagsFor(project),
    blocks,
    status: 'draft',
  }
}

function instagramContent(project, blog) {
  const piece = storyPieces(project)
  const lines = [piece.opening, piece.body, piece.feeling].filter(Boolean)
  return {
    id: uid('content'),
    platform: 'INSTAGRAM',
    hook: trimTitle(piece.opening || blog.title, 52),
    caption: lines.join('\n\n'),
    story: piece.feeling || piece.opening,
    cta: piece.price ? `적어 둔 가격은 ${piece.price}이다.` : '메모에 남은 장면만 적어 두었다.',
    hashtags: tagsFor(project),
    photoOrder: (project.assets || []).map((_, index) => index),
    carousel: ['Cover', 'Context', 'Detail', 'Experience', 'Summary'].slice(0, Math.max(1, Math.min(5, project.assets?.length || 1))),
    status: 'draft',
  }
}

function facebookContent(project, blog) {
  const piece = storyPieces(project)
  return {
    id: uid('content'),
    platform: 'FACEBOOK',
    headline: blog.title,
    context: piece.feeling || piece.opening,
    story: piece.opening,
    information: piece.body,
    cta: piece.price ? `가격은 ${piece.price}이었다.` : piece.itemName,
    linkNote: '주소를 붙일 때는 직접 확인한 페이지만 넣으면 된다.',
    status: 'draft',
  }
}

function xContent(project) {
  const piece = storyPieces(project)
  const thread = [piece.opening, piece.body, piece.feeling].filter(Boolean).map((line) => trimTitle(line, 140))
  if (!thread.length) thread.push('아직 이야기로 엮을 메모가 없다.')
  return {
    id: uid('content'),
    platform: 'X',
    single: trimTitle(piece.opening || thread[0], 140),
    thread,
    status: 'draft',
  }
}

function threadsContent(project) {
  const piece = storyPieces(project)
  const lines = [piece.opening, piece.body, piece.feeling].filter(Boolean)
  const parts = lines.map((text, index) => ({
    label: `${index + 1}/${lines.length + 1}`,
    text,
  }))
  parts.push({
    label: `${parts.length + 1}/${lines.length + 1}`,
    text: piece.place ? `${piece.place}, 기억에 남는 점이 더 있나요?` : '이 장면에서 더 적어 두고 싶은 부분이 있나요?',
  })
  return {
    id: uid('content'),
    platform: 'THREADS',
    parts,
    status: 'draft',
  }
}

function shortsContent(project, blog) {
  const piece = storyPieces(project)
  const lines = [piece.opening, piece.body, piece.feeling].filter(Boolean)
  const shots = (project.assets || []).map((asset, index) => ({
    assetIndex: index,
    note: asset.name || `첨부 사진 ${index + 1}`,
  }))
  if (!shots.length) shots.push({ assetIndex: 0, note: '자막으로 이야기만 보여 준다.' })
  return {
    id: uid('content'),
    platform: 'YOUTUBE_SHORTS',
    hook: trimTitle(piece.opening || blog.title, 42),
    script: lines.join('\n'),
    shots,
    captions: lines.join('\n'),
    title: blog.title,
    description: lines.join(' '),
    hashtags: tagsFor(project),
    thumbnailCopy: trimTitle(piece.place || blog.title, 22),
    status: 'draft',
  }
}

export function generateContents(project, { mode } = {}) {
  const story = buildStory(project)
  const blogMode = mode || project.contents?.BLOG?.mode || 'search'
  const blog = blogContent({ ...project, story }, blogMode)
  const contents = {
    BLOG: blog,
    INSTAGRAM: instagramContent(project, blog),
    FACEBOOK: facebookContent(project, blog),
    X: xContent(project),
    THREADS: threadsContent(project),
    YOUTUBE_SHORTS: shortsContent(project, blog),
  }
  const checks = checkProject(project, contents)
  return {
    story,
    contents,
    qualityChecks: checks,
    status: 'draft',
    editedAfterGenerate: false,
    generatedAt: Date.now(),
  }
}

export function regeneratePlatform(project, platform, mode) {
  const next = generateContents(project, { mode: mode || project.contents?.BLOG?.mode })
  const contents = {
    ...project.contents,
    [platform]: next.contents[platform],
  }
  return {
    ...project,
    story: project.story || next.story,
    contents,
    qualityChecks: checkProject(project, contents),
    editedAfterGenerate: true,
    updatedAt: Date.now(),
  }
}

export function regenerateAllPlatforms(project, mode) {
  const next = generateContents(project, { mode: mode || project.contents?.BLOG?.mode })
  return {
    ...project,
    story: project.story || next.story,
    contents: next.contents,
    qualityChecks: checkProject(project, next.contents),
    editedAfterGenerate: true,
    updatedAt: Date.now(),
  }
}

export function rewriteBlockText(text) {
  const source = String(text || '').trim()
  return ensurePeriod(toProse(source) || source)
}

export function mergeObservations(project, observations) {
  const known = new Set((project.facts || []).map((fact) => fact.value))
  const extra = (observations || [])
    .map((value) => String(value || '').trim())
    .filter((value) => value && !known.has(value))
    .slice(0, 6)
    .map((value) => ({
      id: uid('fact'),
      factType: '사진 관찰',
      value,
      sourceType: 'IMAGE',
      verificationStatus: 'OBSERVED',
    }))
  if (!extra.length) return project
  return { ...project, facts: [...project.facts, ...extra] }
}

export function collectText(content) {
  if (!content) return ''
  if (content.platform === 'BLOG') {
    return [content.title, ...content.blocks.map((block) => block.text || '')].join('\n')
  }
  return JSON.stringify(content)
}

export function checkProject(project, contents) {
  const source = `${project.sourceText || ''}\n${verifiedValues(project).join('\n')}`
  const issues = []
  Object.values(contents || {}).forEach((content) => {
    const text = collectText(content)
    ;[
      { pattern: /웨이팅|대기 시간|대기줄/, label: '웨이팅' },
      { pattern: /원산지/, label: '원산지' },
      { pattern: /직원이 친절|직원 친절도/, label: '직원 응대' },
    ].forEach((rule) => {
      if (rule.pattern.test(text) && !rule.pattern.test(source)) {
        issues.push({
          id: uid('issue'),
          contentId: content.id,
          platform: content.platform,
          checkType: 'UNSUPPORTED',
          status: 'open',
          message: `"${rule.label}"은 사용자가 제공하지 않은 정보입니다.`,
          excerpt: rule.label,
        })
      }
    })
    CLICHES.forEach((word) => {
      if (text.includes(word) && !source.includes(word)) {
        issues.push({
          id: uid('issue'),
          contentId: content.id,
          platform: content.platform,
          checkType: 'CLICHE',
          status: 'open',
          message: `"${word}"는 입력에 없는 상투 표현입니다.`,
          excerpt: word,
        })
      }
    })
    addPatternIssues(issues, content, text, source, POLICY_RULES, 'POLICY')
    addPatternIssues(issues, content, text, source, AD_RULES, 'AD')
    addPriceIssues(issues, content, text, source)
  })

  const blog = contents?.BLOG
  if (blog) {
    const body = collectText(blog)
    const firstFact = verifiedValues(project)[0]
    issues.push({
      id: uid('issue'),
      contentId: blog.id,
      platform: 'BLOG',
      checkType: 'SEARCH',
      status: firstFact && body.includes(firstFact.slice(0, 8)) ? 'pass' : 'open',
      message: firstFact && body.includes(firstFact.slice(0, 8))
        ? '제목과 본문에 확인한 핵심 문장이 들어 있습니다.'
        : '본문에서 사용자가 적은 핵심 문장을 찾기 어렵습니다.',
      excerpt: '',
    })
    const repeated = findRepeat(body)
    if (repeated) {
      issues.push({
        id: uid('issue'),
        contentId: blog.id,
        platform: 'BLOG',
        checkType: 'REPETITION',
        status: 'open',
        message: `"${repeated.word}"가 ${repeated.count}회 반복됩니다.`,
        excerpt: repeated.word,
      })
    }
  }
  return issues
}

function addPatternIssues(issues, content, text, source, rules, checkType) {
  rules.forEach((rule) => {
    const match = text.match(rule.pattern)
    if (match && !rule.pattern.test(source)) {
      issues.push({
        id: uid('issue'),
        contentId: content.id,
        platform: content.platform,
        checkType,
        status: 'open',
        message: `메모에 없는 ${rule.label}입니다.`,
        excerpt: match[0],
      })
    }
  })
}

export function reconcileChecks(project) {
  const fresh = checkProject(project, project.contents)
  const previous = new Map((project.qualityChecks || []).map((issue) => [issueKey(issue), issue]))
  return fresh.map((issue) => {
    const prior = previous.get(issueKey(issue))
    if (!prior) return issue
    return { ...issue, id: prior.id, status: prior.status }
  })
}

function issueKey(issue) {
  return `${issue.platform}|${issue.checkType}|${issue.excerpt}|${issue.message}`
}

function addPriceIssues(issues, content, text, source) {
  const sourceNorm = source.replace(/\s/g, '')
  const seen = new Set()
  const amounts = text.match(/\d[\d,]*\s*원/g) || []
  amounts.forEach((amount) => {
    const normalized = amount.replace(/\s/g, '')
    if (seen.has(normalized) || sourceNorm.includes(normalized)) return
    seen.add(normalized)
    issues.push({
      id: uid('issue'),
      contentId: content.id,
      platform: content.platform,
      checkType: 'PRICE',
      status: 'open',
      message: `"${amount}"은 메모에 없는 가격입니다.`,
      excerpt: amount.trim(),
    })
  })
}

function findRepeat(text) {
  const counts = {}
  const words = text.match(/[가-힣]{2,}/g) || []
  words.forEach((word) => {
    if (/확인|내용|기록|사진|입력|정리|메모|직접/.test(word)) return
    counts[word] = (counts[word] || 0) + 1
  })
  const found = Object.entries(counts).find(([, count]) => count >= 7)
  return found ? { word: found[0], count: found[1] } : null
}

export function removeExcerpt(content, excerpt) {
  if (!excerpt) return content
  const strip = (value) => String(value || '').split(excerpt).join('')
  if (content.platform === 'BLOG') {
    return {
      ...content,
      title: strip(content.title),
      blocks: content.blocks.map((block) => ({ ...block, text: strip(block.text) })),
    }
  }
  const next = { ...content }
  Object.keys(next).forEach((key) => {
    if (typeof next[key] === 'string') next[key] = strip(next[key])
  })
  return next
}

export function searchChecklist(project) {
  const blog = project.contents?.BLOG
  if (!blog) return []
  const body = collectText(blog)
  const source = project.sourceText || ''
  const openUnsupported = (project.qualityChecks || []).some(
    (issue) => issue.platform === 'BLOG' && issue.checkType === 'UNSUPPORTED' && issue.status === 'open',
  )
  const openType = (type) => (project.qualityChecks || []).some(
    (issue) => issue.platform === 'BLOG' && issue.checkType === type && issue.status === 'open',
  )
  const titleKey = String(blog.title || '').slice(0, 8)
  return [
    { label: '검색 의도와 제목', ok: Boolean(blog.title && source) },
    { label: '주제 명확성', ok: Boolean(blog.title && titleKey && body.includes(titleKey)) },
    { label: '실제 경험 정보', ok: verifiedValues(project).length > 0 && body.includes(verifiedValues(project)[0].slice(0, 6)) },
    { label: '사진과 본문', ok: (project.assets || []).length === blog.blocks.filter((block) => block.type === 'photo').length },
    { label: '키워드 반복', ok: !openType('REPETITION') },
    { label: '제목과 본문', ok: Boolean(titleKey && body.includes(titleKey)) },
    { label: '사실 확인', ok: !openUnsupported },
    { label: '과장·상투 표현', ok: !openType('CLICHE') && !openType('AD') },
  ]
}

export function riskChecklist(project) {
  const open = (type) => (project.qualityChecks || []).some((issue) => issue.checkType === type && issue.status === 'open')
  return [
    { label: '공식 정책 위험', ok: !open('POLICY') },
    { label: '광고·과장', ok: !open('AD') && !open('CLICHE') },
    { label: '사실 불일치', ok: !open('UNSUPPORTED') && !open('PRICE') },
  ]
}
