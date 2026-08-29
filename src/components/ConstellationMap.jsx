import { useMemo, useRef, useState, useCallback } from 'react'
import './ConstellationMap.css'
import { computeLayout } from '../logic/layout.js'
import constellation from '../../data/constellation.json'
import EdgeLine from './EdgeLine.jsx'
import StarNode from './StarNode.jsx'
import ClusterSymbol from './ClusterSymbol.jsx'

// viewBox 한 변 (원점 중심). 지도 최대 반경(~420)에 여백을 더해 잡음
const VIEW = 1120
const HALF = VIEW / 2

// 배경 천구도: 동심원 + 방사 눈금
function CelestialChart() {
  const rings = [150, 300, 450]
  const ticks = []
  for (let deg = 0; deg < 360; deg += 30) {
    const a = (deg * Math.PI) / 180
    ticks.push({
      x1: 130 * Math.sin(a), y1: -130 * Math.cos(a),
      x2: 480 * Math.sin(a), y2: -480 * Math.cos(a),
      key: deg,
    })
  }
  return (
    <g aria-hidden="true">
      {rings.map((r) => (
        <circle key={r} className="chart-ring" cx="0" cy="0" r={r} />
      ))}
      {ticks.map((t) => (
        <line className="chart-tick" key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
    </g>
  )
}

export default function ConstellationMap({ tiers = {}, evidence = {}, onNodeClick }) {
  const layout = useMemo(() => computeLayout(constellation), [])
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [panning, setPanning] = useState(false)
  const drag = useRef(null)
  const moved = useRef(false) // 이번 제스처가 '드래그'였는지 (클릭과 구분)

  // 점등 상태에서 파생: 점등 노드 집합 + 활성 클러스터 집합
  const { activeClusters } = useMemo(() => {
    const active = new Set()
    layout.nodes.forEach((n) => {
      if (tiers[n.id] > 0) active.add(n.cluster)
    })
    return { activeClusters: active }
  }, [tiers, layout])

  // 어떤 점(허브·클러스터중심·노드)이 '켜진' 상태인가
  const isPointLit = useCallback(
    (id) => {
      if (id === layout.hub.id) return true // 허브는 항상 점등
      if (activeClusters.has(id)) return true // 활성 클러스터 중심
      return tiers[id] > 0 // 점등 노드
    },
    [activeClusters, tiers, layout.hub.id],
  )

  // 휠: 확대/축소 (0.5~4배)
  const onWheel = useCallback((e) => {
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    setView((v) => ({ ...v, scale: Math.min(4, Math.max(0.5, v.scale * factor)) }))
  }, [])

  // 드래그: 이동
  const onPointerDown = useCallback((e) => {
    drag.current = { x: e.clientX, y: e.clientY }
    moved.current = false
    setPanning(true)
  }, [])
  const onPointerMove = useCallback((e) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true
    drag.current = { x: e.clientX, y: e.clientY }
    setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }))
  }, [])
  const endPan = useCallback(() => {
    drag.current = null
    setPanning(false)
  }, [])

  // 노드 클릭 — 단, 이번 제스처가 드래그였다면 무시
  const handleNodeClick = useCallback(
    (id) => {
      if (moved.current) return
      onNodeClick?.(id)
    },
    [onNodeClick],
  )

  return (
    <svg
      className={`map-svg${panning ? ' is-panning' : ''}`}
      viewBox={`${-HALF} ${-HALF} ${VIEW} ${VIEW}`}
      preserveAspectRatio="xMidYMid meet"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerLeave={endPan}
      role="img"
      aria-label="커리어 별자리 지도"
    >
      <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
        <CelestialChart />

        {/* 간선 (노드 아래) */}
        <g>
          {layout.edges.map((e, i) => (
            <EdgeLine key={i} edge={e} lit={isPointLit(e.from) && isPointLit(e.to)} />
          ))}
        </g>

        {/* 클러스터 중심 심볼 + 라벨 */}
        {layout.clusters.map((c) => {
          const active = activeClusters.has(c.id)
          return (
            <g className={`cluster-symbol${active ? ' is-active' : ''}`} key={c.id}>
              <ClusterSymbol name={c.symbol} cx={c.x} cy={c.y} size={32} />
              <text className={`cluster-label${active ? ' is-active' : ''}`} x={c.x} y={c.y + 34}>
                {c.label}
              </text>
            </g>
          )
        })}

        {/* 노드 */}
        <g>
          {layout.nodes.map((n) => (
            <StarNode
              key={n.id}
              node={n}
              tier={tiers[n.id] || 0}
              evidence={evidence[n.id]}
              onClick={handleNodeClick}
            />
          ))}
        </g>

        {/* 중앙 허브 — 현재의 나 */}
        <g>
          <circle className="hub__star" cx={layout.hub.x} cy={layout.hub.y} r="7" />
          <text className="hub__label" x={layout.hub.x} y={layout.hub.y + 26}>
            현재의 나
          </text>
        </g>
      </g>
    </svg>
  )
}
