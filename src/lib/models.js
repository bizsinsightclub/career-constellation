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

// id에서 세대 버전 숫자 추출 ('gemini-3.5-flash-lite' → 3.5, '...-latest' → 최신 취급)
function versionOf(id = '') {
  if (/latest/i.test(id)) return 999
  const m = id.match(/gemini-(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : 0
}

/*
 * 사용자가 고르기 쉽게 가성비·최신 위주로 최대 3종만 추린다.
 * flash/flash-lite 계열(저가·범용)만 후보로 삼고, lite(가성비)를 앞세우되 최신 버전 우선.
 * 3개가 안 되면 pro가 아닌 나머지로 채운다. (전부 listModels 실측 기반이라 실제 되는 것만)
 */
export function curateModels(models = []) {
  const isNoise = (id) =>
    /pro|preview|exp|thinking|vision|image|audio|tts|native|embedding|learnlm/i.test(id)
  const budget = models.filter((m) => /flash/i.test(m.id) && !isNoise(m.id))
  const rank = (m) => (/lite/i.test(m.id) ? 0 : 1) // lite(가성비) 우선
  budget.sort((a, b) => {
    const r = rank(a) - rank(b)
    if (r !== 0) return r
    return versionOf(b.id) - versionOf(a.id) // 같은 등급이면 최신 우선
  })
  let picked = budget.slice(0, 3)
  if (picked.length < 3) {
    const rest = models.filter(
      (m) => !picked.includes(m) && !/pro|embedding|image|tts|audio|vision|learnlm/i.test(m.id),
    )
    picked = picked.concat(rest.slice(0, 3 - picked.length))
  }
  return picked
}

// 목록에서 기본으로 고를 모델 — 안정·가성비 우선(작동 확인된 flash-lite 계열)
export function pickDefaultModel(models = []) {
  const lite = models.find((m) => /flash-lite/i.test(m.id))
  if (lite) return lite.id
  const flash = models.find((m) => /flash/i.test(m.id))
  if (flash) return flash.id
  return models[0]?.id || ''
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
