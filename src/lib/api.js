export async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error?.message || '요청에 실패했습니다.')
    error.code = data.error?.code || 'UPSTREAM'
    throw error
  }
  return data
}

export function generationPayload(project, profile, mode) {
  return {
    contentPurpose: project.contentPurpose,
    sourceText: project.sourceText,
    facts: (project.facts || []).map((fact) => ({
      value: fact.value,
      sourceType: fact.sourceType,
      verificationStatus: fact.verificationStatus,
    })),
    assetCount: project.assets?.length || 0,
    mode: mode || project.contents?.BLOG?.mode || 'search',
    profile: {
      name: profile?.name || '',
      bio: profile?.bio || '',
      tone: profile?.tone || '',
    },
    keepStory: false,
  }
}
