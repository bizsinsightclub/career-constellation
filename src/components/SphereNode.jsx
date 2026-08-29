import ClusterSymbol from './ClusterSymbol.jsx'

/*
 * SphereNode — 생명나무의 구(sephira) 하나.
 * 미점등: 어두운 소켓 + 심볼(socket-dim)
 * 점등(tier 1~3): 촛불/금박/달빛 발광 + 빛살/광륜 + 심볼 발광 (design.md §5 재활용)
 * malkhut(현재의 나): 항상 금빛 점등.
 */

function rays(count, len) {
  const arr = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2
    arr.push({ x2: Math.cos(a) * len, y2: Math.sin(a) * len, key: i })
  }
  return arr
}

const R = 17 // 구 반지름

export default function SphereNode({ sphere, tier = 0, onClick }) {
  const { x, y, ko, hebrew, symbol, alwaysLit } = sphere
  const self = !!alwaysLit
  const t = self ? 3 : tier // malkhut은 항상 최고 광도로
  const lit = t > 0

  const cls = self
    ? 'sphere sphere--self'
    : `sphere ${lit ? `sphere--lit sphere--t${t}` : 'sphere--dim'}`

  return (
    <g
      className={cls}
      data-sphere-id={sphere.id}
      transform={`translate(${x} ${y})`}
      onClick={onClick ? () => onClick(sphere.id) : undefined}
    >
      {/* tier3 광륜 */}
      {t === 3 && (
        <>
          <circle className="sphere__halo" r={R + 12} />
          <circle className="sphere__halo" r={R + 5} />
        </>
      )}
      {/* 빛살 (tier2: 4갈래, tier3: 8갈래) */}
      {t >= 2 &&
        rays(t === 3 ? 8 : 4, R + (t === 3 ? 16 : 10)).map((r) => (
          <line className="sphere__ray" key={r.key} x1="0" y1="0" x2={r.x2} y2={r.y2} />
        ))}

      {/* 구 본체 */}
      <circle className="sphere__disc" r={R} />
      {/* 중심 심볼 */}
      <ClusterSymbol name={symbol} cx={0} cy={0} size={26} />

      {/* 라벨 */}
      <text className="sphere__label" x="0" y={R + 18}>
        {ko}
      </text>
      {hebrew && (
        <text className="sphere__hebrew" x="0" y={R + 32}>
          {hebrew}
        </text>
      )}

      {/* 히트영역 */}
      <circle className="sphere__hit" r={R + 8} fill="transparent" />
      <title>{ko}</title>
    </g>
  )
}
