/*
 * gemini.js — Gemini API 호출 공통 함수 (브라우저 직접 호출, SDK 없이 fetch).
 * 엔드포인트: POST v1beta/models/{model}:generateContent?key=...
 * 본문: contents + systemInstruction + generationConfig(responseMimeType/responseSchema)
 * 응답 텍스트: candidates[0].content.parts[].text
 *
 * 오류는 원인을 구분해 GeminiError.kind 로 전달:
 *   key    — 잘못된/권한 없는 키
 *   quota  — 무료 할당량 초과(429)
 *   network— 네트워크 실패
 *   blocked— 안전 필터 차단
 *   parse  — 응답 JSON 파싱 실패
 *   unknown— 그 외
 */

const ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

export class GeminiError extends Error {
  constructor(kind, message) {
    super(message)
    this.name = 'GeminiError'
    this.kind = kind
  }
}

// 한 번 호출 (재시도 없음)
async function callOnce({ apiKey, model, systemInstruction, userText, responseSchema }) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  }
  if (responseSchema) body.generationConfig.responseSchema = responseSchema
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }

  let res
  try {
    res = await fetch(`${ENDPOINT(model)}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new GeminiError('network', '네트워크 오류입니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.')
  }

  if (!res.ok) {
    let msg = ''
    try {
      const j = await res.json()
      msg = j?.error?.message || ''
    } catch {
      /* 무시 */
    }
    if (res.status === 400 && /API key not valid|API_KEY_INVALID|invalid.*key/i.test(msg)) {
      throw new GeminiError('key', 'API 키가 올바르지 않습니다. 키를 다시 확인해 주세요.')
    }
    if (res.status === 403) {
      throw new GeminiError('key', 'API 키 권한 오류입니다. 키가 유효한지, 사용 설정이 되어 있는지 확인해 주세요.')
    }
    if (res.status === 429) {
      throw new GeminiError('quota', '무료 사용 할당량을 초과했습니다. 잠시 후 다시 시도하거나, 가성비 모델로 바꿔 보세요.')
    }
    if (res.status === 404) {
      throw new GeminiError('model', `선택한 모델(${model})을 사용할 수 없습니다. ‘키·모델 설정’에서 다른 모델을 선택해 주세요.`)
    }
    if (res.status === 503 || res.status === 500) {
      throw new GeminiError('overload', `모델이 일시적으로 혼잡합니다 (오류 ${res.status}). 잠시 후 다시 시도하거나 다른 모델을 선택해 주세요.`)
    }
    throw new GeminiError('unknown', `요청이 실패했습니다 (오류 ${res.status}). ${msg}`.trim())
  }

  const data = await res.json()
  const cand = data?.candidates?.[0]
  const text = cand?.content?.parts?.map((p) => p.text || '').join('') ?? ''

  if (!text) {
    if (data?.promptFeedback?.blockReason || cand?.finishReason === 'SAFETY') {
      throw new GeminiError('blocked', '입력이 안전 필터에 의해 차단되었습니다. 내용을 바꿔 다시 시도해 주세요.')
    }
    throw new GeminiError('parse', '응답이 비어 있습니다. 다시 시도해 주세요.')
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new GeminiError('parse', '응답 형식(JSON) 해석에 실패했습니다.')
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/*
 * JSON 응답을 반환.
 *  - 파싱 실패(parse): 1회 재시도 (design.md/CLAUDE.md §6)
 *  - 과부하(overload, 503/500): 짧은 대기 후 최대 2회 재시도
 */
export async function generateJSON(opts) {
  let parseRetried = false
  let overloadTries = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await callOnce(opts)
    } catch (e) {
      if (e instanceof GeminiError && e.kind === 'parse' && !parseRetried) {
        parseRetried = true
        continue
      }
      if (e instanceof GeminiError && e.kind === 'overload' && overloadTries < 2) {
        overloadTries += 1
        await sleep(1200 * overloadTries)
        continue
      }
      throw e
    }
  }
}

/*
 * 이 키로 실제 사용 가능한 모델 목록을 조회한다 (generateContent 지원 모델만).
 * 하드코딩된 모델 id 추측을 없애기 위한 것 — 드롭다운을 이 결과로 채운다.
 */
export async function listModels(apiKey) {
  let res
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1000`,
    )
  } catch {
    throw new GeminiError('network', '네트워크 오류입니다. 인터넷 연결을 확인해 주세요.')
  }
  if (!res.ok) {
    let msg = ''
    try {
      const j = await res.json()
      msg = j?.error?.message || ''
    } catch {
      /* 무시 */
    }
    if (res.status === 400 && /API key not valid|API_KEY_INVALID|invalid.*key/i.test(msg)) {
      throw new GeminiError('key', 'API 키가 올바르지 않습니다. 키를 다시 확인해 주세요.')
    }
    if (res.status === 403) {
      throw new GeminiError('key', 'API 키 권한 오류입니다. 키가 유효한지 확인해 주세요.')
    }
    throw new GeminiError('unknown', `모델 목록을 불러오지 못했습니다 (오류 ${res.status}). ${msg}`.trim())
  }
  const data = await res.json()
  return (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .filter((m) => !/embedding|aqa|imagen|veo|-tts|image-generation/i.test(m.name || ''))
    .map((m) => ({
      id: (m.name || '').replace(/^models\//, ''),
      displayName: m.displayName || '',
      description: m.description || '',
    }))
}
