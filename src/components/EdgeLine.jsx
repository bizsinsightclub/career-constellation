/*
 * EdgeLine — 별자리 선 하나. 직선으로 그린다 (별자리답게).
 *   미점등: 조용한 선
 *   양끝 점등(lit): 은빛 발광 + 한쪽에서 흘러가듯 그려지는 애니메이션
 */
export default function EdgeLine({ edge, lit = false }) {
  const { x1, y1, x2, y2 } = edge
  const d = `M${x1} ${y1} L${x2} ${y2}`
  return (
    <path
      className={`edge${lit ? ' edge--lit' : ''}`}
      d={d}
      pathLength={lit ? 1 : undefined}
    />
  )
}
