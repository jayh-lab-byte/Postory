import { serviceFlags } from './http.js'
import { completeJson, factBrief, generationSchema, observationSchema, rewriteSchema, storySystem } from './openai.js'
import { importPexelsImage, searchNaverKeywords, searchPexels } from './research.js'

const IMAGE_PREFIX = /^data:image\/(jpeg|png|webp);base64,/

function local(reason) {
  return { provider: 'local', fallbackReason: reason || '' }
}

export async function dispatch({ method, pathname, searchParams, body, env }) {
  if (method === 'GET' && pathname === '/api/health') {
    return { status: 200, body: { ok: true, services: serviceFlags(env) } }
  }

  if (method === 'GET' && pathname === '/api/research/naver-blog') {
    try {
      return { status: 200, body: await searchNaverKeywords(env, searchParams.get('q')) }
    } catch (error) {
      return { status: error.code === 'RATE_LIMIT' ? 429 : 502, body: { error: { code: error.code || 'UPSTREAM', message: '검색 키워드를 가져오지 못했습니다.' } } }
    }
  }

  if (method === 'GET' && pathname === '/api/assets/search') {
    try {
      return { status: 200, body: await searchPexels(env, searchParams.get('q')) }
    } catch (error) {
      return { status: error.code === 'RATE_LIMIT' ? 429 : 502, body: { error: { code: error.code || 'UPSTREAM', message: '보조 사진을 가져오지 못했습니다.' } } }
    }
  }

  if (method === 'POST' && pathname === '/api/assets/import') {
    const imported = await importPexelsImage(body?.url)
    return { status: 200, body: imported }
  }

  if (method === 'POST' && pathname === '/api/ai/analyze') {
    if (!env.OPENAI_API_KEY) return { status: 200, body: { ...local('NO_KEY'), observations: [] } }
    const images = (Array.isArray(body?.images) ? body.images : [])
      .filter((url) => IMAGE_PREFIX.test(url) && url.length < 1_200_000)
      .slice(0, 4)
    if (!images.length) return { status: 200, body: { ...local('NO_IMAGE'), observations: [] } }
    try {
      const result = await completeJson(env, {
        system: '사진에서 눈에 보이는 사물, 색, 배치만 한국어 한 문장으로 적는다. 가격, 맛, 대기, 원산지, 사람 성격은 추정하지 않는다. 각 문장은 "사진에서"로 시작한다.',
        user: '첨부 사진에서 확인되는 관찰만 JSON으로 돌려 주세요.',
        schemaName: 'observations',
        schema: observationSchema,
        images,
      })
      const observations = (result.observations || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
      return { status: 200, body: { provider: 'openai', observations } }
    } catch {
      return { status: 200, body: { ...local('UPSTREAM'), observations: [] } }
    }
  }

  if (method === 'POST' && pathname === '/api/ai/generate') {
    if (!env.OPENAI_API_KEY) return { status: 200, body: local('NO_KEY') }
    try {
      const result = await completeJson(env, {
        system: storySystem(),
        user: `${factBrief(body || {})}\n\n메모와 키워드로 스토리를 먼저 쓰고, 그 이야기로 여섯 채널을 각각 다시 작성하세요. narrative는 빈 줄로 나뉜 3~5문단입니다. 블로그는 모드에 맞게 소제목과 문단으로 나누고, 사진이 있으면 첫 문단 뒤에 photo 블록을 넣으세요. assetIndex는 0부터 사진 장수 미만입니다. 사진이 없으면 photo 블록을 넣지 마세요.`,
        schemaName: 'generation',
        schema: generationSchema,
      })
      return { status: 200, body: { provider: 'openai', ...result } }
    } catch (error) {
      return { status: 200, body: local(error.reason || 'UPSTREAM') }
    }
  }

  if (method === 'POST' && pathname === '/api/ai/rewrite') {
    const source = String(body?.text || '').slice(0, 2000)
    if (!source.trim()) {
      return { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: '다시 쓸 문단이 없습니다.' } } }
    }
    if (!env.OPENAI_API_KEY) return { status: 200, body: local('NO_KEY') }
    try {
      const result = await completeJson(env, {
        system: `${storySystem()}\n주어진 문단만 더 자연스러운 이야기로 다시 쓴다. 사실과 숫자를 추가하거나 빼지 않는다.`,
        user: `${factBrief(body || {})}\n\n다시 쓸 문단:\n${source}`,
        schemaName: 'rewrite',
        schema: rewriteSchema,
      })
      return { status: 200, body: { provider: 'openai', text: String(result.text || '').trim() } }
    } catch (error) {
      return { status: 200, body: local(error.reason || 'UPSTREAM') }
    }
  }

  return { status: 404, body: { error: { code: 'NOT_FOUND', message: '요청한 주소를 찾을 수 없습니다.' } } }
}
