/*
 * EdgeLine — 별자리 선(간선) 하나를 완만한 곡선으로 그린다 (design.md §6).
 *   미점등: socket-dim 계열의 조용한 선
 *   양끝 점등(lit): 은빛(--lunar) 1px 발광 + 한쪽에서 다른 쪽으로 흘러가듯 그려지는 애니메이션
 */
export default function EdgeLine({ edge, lit = false }) {
  const { x1, y1, x2, y2, kind } = edge

  // 직선 대신 살짝 휜 곡선 — 중점에서 수직 방향으로 조금 밀어 유기적인 느낌
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const k = 0.1
  const cxp = mx + (-dy / len) * len * k
  const cyp = my + (dx / len) * len * k
  const d = `M${x1} ${y1} Q${cxp} ${cyp} ${x2} ${y2}`

  return (
    <path
      className={`edge edge--${kind}${lit ? ' edge--lit' : ''}`}
      d={d}
      // pathLength=1로 정규화해 stroke-dashoffset 그리기 애니메이션에 사용
      pathLength={lit ? 1 : undefined}
    />
  )
}
