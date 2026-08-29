/*
 * 모델 도우미 — 모델 목록은 키로 실제 조회(listModels)해서 채운다(추측 id 사용 안 함).
 * 여기서는 id로부터 등급(가성비/표준/고품질)을 추정하고 기본 모델을 고르는 로직만 둔다.
 */

// 마지막 수단 기본값 (목록 조회 전/실패 시)
export const DEFAULT_MODEL = 'gemini-3.7-flash'

// id로 등급 라벨 추정
export function tierFromId(id = '') {
  if (/lite/i.test(id)) return '가성비'
  if (/pro/i.test(id)) return '고품질'
  return '표준'
}

// 사람이 읽기 좋은 등급 힌트
export function tierHint(id = '') {
  const t = tierFromId(id)
  if (t === '가성비') return '가성비 · 저렴하고 빠름 (추출에 적합)'
  if (t === '고품질') return '고품질 · 문장 품질 최상 (무료 티어 불가일 수 있음)'
  return '표준 · 품질과 비용의 균형'
}

// 사용 가능한 모델 목록에서 기본으로 고를 모델
export function pickDefaultModel(models = []) {
  const ids = models.map((m) => m.id)
  const pref = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash']
  for (const p of pref) if (ids.includes(p)) return p
  const flash = models.find((m) => /flash/i.test(m.id) && !/lite|preview|exp|thinking/i.test(m.id))
  if (flash) return flash.id
  const lite = models.find((m) => /flash-lite/i.test(m.id))
  if (lite) return lite.id
  return ids[0] || ''
}

// 드롭다운 정렬: flash → flash-lite → pro → 기타, 그 안에서는 이름 역순(최신 우선 경향)
export function sortModels(models = []) {
  const rank = (id) => {
    if (/flash-lite/i.test(id)) return 1
    if (/pro/i.test(id)) return 2
    if (/flash/i.test(id)) return 0
    return 3
  }
  return [...models].sort((a, b) => {
    const r = rank(a.id) - rank(b.id)
    return r !== 0 ? r : b.id.localeCompare(a.id)
  })
}
