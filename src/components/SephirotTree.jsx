import { useMemo, useRef, useState, useCallback } from 'react'
import './SephirotTree.css'
import { computeTree } from '../logic/sephirot.js'
import constellation from '../../data/constellation.json'
import EdgeLine from './EdgeLine.jsx'
import SphereNode from './SphereNode.jsx'

// viewBox 한 변 (원점 중심). 세로 트리 + 라벨 여백 포함
const VIEW = 820
const HALF = VIEW / 2
const BASE_Y = -30 // 트리를 살짝 위로 (하단 입력 패널과 겹치지 않게)

export default function SephirotTree({ tiers = {}, onSphereClick }) {
  const tree = useMemo(() => computeTree(constellation), [])
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [panning, setPanning] = useState(false)
  const drag = useRef(null)
  const moved = useRef(false)

  // 구가 점등 상태인가 (malkhut은 항상 점등)
  const isLit = useCallback(
    (id) => {
      const s = tree.spheres.find((x) => x.id === id)
      return !!s?.alwaysLit || (tiers[id] || 0) > 0
    },
    [tiers, tree.spheres],
  )

  const onWheel = useCallback((e) => {
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    setView((v) => ({ ...v, scale: Math.min(4, Math.max(0.5, v.scale * factor)) }))
  }, [])
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
  const handleClick = useCallback(
    (id) => {
      if (moved.current) return
      onSphereClick?.(id)
    },
    [onSphereClick],
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
      aria-label="세피로트 커리어 트리"
    >
      <g transform={`translate(${view.tx} ${view.ty + BASE_Y}) scale(${view.scale})`}>
        {/* 세 기둥 은은한 수직선 */}
        <g className="pillars" aria-hidden="true">
          <line x1="0" y1={-HALF} x2="0" y2={HALF} />
          <line x1="-174" y1={-260} x2="-174" y2={200} />
          <line x1="174" y1={-260} x2="174" y2={200} />
        </g>

        {/* 경로 (구 아래) */}
        <g>
          {tree.paths.map((p, i) => (
            <EdgeLine key={i} edge={{ ...p, kind: 'path' }} lit={isLit(p.from) && isLit(p.to)} />
          ))}
        </g>

        {/* 구 */}
        <g>
          {tree.spheres.map((s) => (
            <SphereNode key={s.id} sphere={s} tier={tiers[s.id] || 0} onClick={handleClick} />
          ))}
        </g>
      </g>
    </svg>
  )
}
