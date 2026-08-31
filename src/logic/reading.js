/*
 * reading.js — 점등된 영역 집계로부터 해석 스켈레톤(프리셋)을 조립한다.
 * 결과는 타로 카드(ReadingCard)와 LLM 개인화 프롬프트의 입력이 된다.
 */
import constellation from '../../data/constellation.json'
import { ARCANA, ARCANA_FALLBACK, DOMAIN_STRENGTH, DOMAIN_DARK, verdictOf } from '../data/readingPresets.js'

const KO = {}
constellation.spheres.forEach((s) => (KO[s.id] = s.ko))
const ALL_DOMAINS = constellation.spheres.filter((s) => !s.alwaysLit).map((s) => s.id)
const TIER_NAME = ['', 'Silver', 'Diamond', 'Gold']

// domains: [{id, tier, score, matched:[{label, evidence}]}]
export function buildReading(domains) {
  const lit = (domains || []).filter((d) => d.id !== 'malkhut' && d.tier > 0)
  const dominant = [...lit].sort((a, b) => b.tier - a.tier || b.score - a.score)[0]
  const arcana = (dominant && ARCANA[dominant.id]) || ARCANA_FALLBACK

  const strengths = [...lit]
    .sort((a, b) => b.score - a.score)
    .map((d) => ({
      id: d.id,
      ko: KO[d.id],
      tier: d.tier,
      tierName: TIER_NAME[d.tier],
      line: DOMAIN_STRENGTH[d.id] || '',
      evidence: (d.matched || []).flatMap((m) => m.evidence || []).slice(0, 3),
    }))

  const litIds = new Set(lit.map((d) => d.id))
  const dark = ALL_DOMAINS.filter((id) => !litIds.has(id))
    .slice(0, 3)
    .map((id) => ({ id, ko: KO[id], line: DOMAIN_DARK[id] || '' }))

  return { arcana, verdict: verdictOf(lit), strengths, dark, litCount: lit.length }
}
