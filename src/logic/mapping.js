/*
 * mapping.js — 점수화된 결과를 실제 지도 노드에 결속하고 IlluminationResult를 만든다.
 * LLM이 목록에 없는 id를 반환하면 여기서 걸러낸다. 같은 id 중복은 높은 점수로 병합.
 */
import constellation from '../../data/constellation.json'

const NODE_IDS = new Set(constellation.nodes.map((n) => n.id))

// scored: [{id, score, tier, evidence}] → { nodes: [...] }
export function toIlluminationResult(scored) {
  const byId = new Map()
  ;(scored || []).forEach((s) => {
    if (!NODE_IDS.has(s.id)) return // 존재하지 않는 노드 무시
    const prev = byId.get(s.id)
    if (!prev || s.score > prev.score) byId.set(s.id, s)
  })
  return { nodes: [...byId.values()] }
}

// IlluminationResult → { [id]: tier } (렌더용)
export function resultToTiers(result) {
  const tiers = {}
  result.nodes.forEach((n) => {
    tiers[n.id] = n.tier
  })
  return tiers
}
