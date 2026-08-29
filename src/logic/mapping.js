/*
 * mapping.js — 추출된 스킬 매칭을 구(sephira)로 집계한다.
 * 화면은 구 중심이므로, 스킬 점수를 소속 구로 모아 구 tier를 정한다.
 * LLM이 목록에 없는 스킬 id를 반환하면 걸러낸다.
 */
import constellation from '../../data/constellation.json'

// 스킬 id → 구 id, 스킬 id → 라벨
const SKILL_TO_SPHERE = new Map()
const SKILL_LABEL = new Map()
constellation.spheres.forEach((s) => {
  ;(s.skills || []).forEach((k) => {
    SKILL_TO_SPHERE.set(k.id, s.id)
    SKILL_LABEL.set(k.id, k.label)
  })
})

// 추출 프롬프트에 넣을 전체 스킬 목록(union)
export function allSkills() {
  const list = []
  constellation.spheres.forEach((s) => (s.skills || []).forEach((k) => list.push(k)))
  return list
}

// 유효한 스킬 id 집합 (LLM 환각 필터용)
export const SKILL_IDS = new Set(allSkills().map((k) => k.id))

// 구 점수 → tier (집계 점수 기준, 필요시 튜닝)
function sphereTier(score) {
  if (score >= 10) return 3
  if (score >= 4) return 2
  return 1
}

/*
 * scored: [{id, score, tier, evidence}] (스킬 단위)
 * → { spheres: [{id, tier, score, matched:[{label, evidence}]}] } (구 단위)
 */
export function aggregateToSpheres(scored) {
  const bySphere = new Map()
  ;(scored || []).forEach((s) => {
    const sphereId = SKILL_TO_SPHERE.get(s.id)
    if (!sphereId) return // 존재하지 않는 스킬 무시
    if (!bySphere.has(sphereId)) bySphere.set(sphereId, { score: 0, matched: [] })
    const agg = bySphere.get(sphereId)
    agg.score += s.score
    agg.matched.push({ label: SKILL_LABEL.get(s.id) || s.id, evidence: s.evidence || [] })
  })

  const spheres = []
  bySphere.forEach((agg, id) => {
    spheres.push({ id, score: agg.score, tier: sphereTier(agg.score), matched: agg.matched })
  })
  return { spheres }
}

// 결과 → { [sphereId]: tier }
export function resultToTiers(result) {
  const tiers = {}
  result.spheres.forEach((s) => {
    tiers[s.id] = s.tier
  })
  return tiers
}
