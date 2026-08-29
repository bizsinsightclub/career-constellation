/*
 * scoring.js — 추출 결과(matches)로부터 점수와 tier를 계산한다 (로컬 로직, CLAUDE.md §5).
 *   기본: 매핑된 언급 1회당 +1
 *   가중치: 연차 명시 +2, 정량 성과·수상 +2, 리더 역할 +1
 *   tier: 1~3점 → 1, 4~7점 → 2, 8점 이상 → 3
 */

export function scoreMatch(m) {
  const mentions = Math.max(1, Number(m.mentions) || (m.evidence?.length ?? 1))
  let score = mentions
  if (m.yearsMentioned) score += 2
  if (m.quantifiedResult) score += 2
  if (m.leadershipRole) score += 1
  const tier = score >= 8 ? 3 : score >= 4 ? 2 : 1
  return {
    id: m.id,
    score,
    tier,
    evidence: Array.isArray(m.evidence) ? m.evidence : [],
  }
}

export function scoreMatches(matches) {
  return (matches || []).map(scoreMatch)
}
