/*
 * StarNode — 노드(경력 슬롯) 하나를 그린다.
 * M1에서는 '미점등 소켓'만: 지름 10px의 빈 원(내부 점 없음) — 빛이 깃들 자리 (design.md §5).
 * tier별 점등(촛불·금박·달빛)은 M2에서 이 컴포넌트에 얹는다.
 */
export default function StarNode({ node, onHover }) {
  const { x, y, label } = node
  return (
    <g
      className="node node--dim"
      transform={`translate(${x} ${y})`}
      onPointerEnter={onHover ? () => onHover(node) : undefined}
      onPointerLeave={onHover ? () => onHover(null) : undefined}
    >
      {/* 미점등 소켓: 빈 원 */}
      <circle className="node__socket" r="5" />
      {/* 넉넉한 투명 히트영역 (호버·클릭용) */}
      <circle className="node__hit" r="12" fill="transparent" />
      {/* 접근성/네이티브 툴팁 */}
      <title>{label}</title>
    </g>
  )
}
