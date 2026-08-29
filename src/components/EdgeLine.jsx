/*
 * EdgeLine — 별자리 선(간선) 하나를 완만한 곡선으로 그린다 (design.md §6).
 * M1(미점등)에서는 전부 socket-dim 계열의 조용한 선.
 * (양끝 점등 시 은빛 발광 + 흐름 애니메이션은 M2에서 추가)
 */
export default function EdgeLine({ edge }) {
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

  return <path className={`edge edge--${kind}`} d={d} />
}
