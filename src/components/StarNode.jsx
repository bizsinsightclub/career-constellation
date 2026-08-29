/*
 * StarNode — 노드(경력 슬롯) 하나. tier에 따라 별의 크기·색·빛살·글로우가 달라진다 (design.md §5).
 *   tier 0: 미점등 소켓 (빈 원)
 *   tier 1: 촛불빛 호박색 점광 (candle)
 *   tier 2: 금박 + 4갈래 빛살 (gilt)
 *   tier 3: 달빛 중심 + 금빛 이중 광륜 + 8갈래 빛살, 느린 맥동 (moon)
 * 글로우는 CSS drop-shadow, 맥동은 CSS 애니메이션(무작위 위상)으로 표현.
 */

// id → [0,1) 결정적 난수 (맥동 위상을 노드마다 다르게)
function hash01(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 1000 / 1000
}

// 중심에서 뻗는 빛살 좌표
function rays(count, len) {
  const arr = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2
    arr.push({ x2: Math.cos(a) * len, y2: Math.sin(a) * len, key: i })
  }
  return arr
}

function StarVisual({ tier, id }) {
  if (tier === 1) {
    return (
      <g className="star star--1">
        <circle className="star__core star__core--candle" r="2.6" />
      </g>
    )
  }
  if (tier === 2) {
    return (
      <g className="star star--2">
        {rays(4, 9).map((r) => (
          <line className="star__ray" key={r.key} x1="0" y1="0" x2={r.x2} y2={r.y2} />
        ))}
        <circle className="star__core star__core--gilt" r="3.4" />
      </g>
    )
  }
  if (tier === 3) {
    // 맥동 위상을 노드마다 다르게
    const delay = `${(hash01(id) * -3).toFixed(2)}s`
    return (
      <g className="star star--3" style={{ animationDelay: delay }}>
        <circle className="star__halo" r="10" />
        <circle className="star__halo" r="7" />
        {rays(8, 15).map((r) => (
          <line className="star__ray" key={r.key} x1="0" y1="0" x2={r.x2} y2={r.y2} />
        ))}
        <circle className="star__core star__core--moon" r="4.4" />
      </g>
    )
  }
  // tier 0 — 미점등 소켓
  return <circle className="node__socket" r="5" />
}

export default function StarNode({ node, tier = 0, onClick }) {
  const { x, y, label } = node
  return (
    <g
      className={`node node--tier${tier}`}
      data-node-id={node.id}
      transform={`translate(${x} ${y})`}
      onClick={onClick ? () => onClick(node.id) : undefined}
    >
      <StarVisual tier={tier} id={node.id} />
      {/* 넉넉한 투명 히트영역 (호버·클릭용) */}
      <circle className="node__hit" r="12" fill="transparent" />
      {/* 접근성/네이티브 툴팁 */}
      <title>{label}</title>
    </g>
  )
}
