import { useMemo, useRef, useState, useCallback } from 'react'
import './ConstellationSky.css'
import { computeSky } from '../logic/skyLayout.js'
import constellation from '../../data/constellation.json'
import EdgeLine from './EdgeLine.jsx'
import SkillStar from './SkillStar.jsx'
import ClusterSymbol from './ClusterSymbol.jsx'

// 넓은 밤하늘 viewBox (가로형). 세로로 여유를 둬 상단 표제·하단 입력 패널과 겹치지 않게.
const VBW = 1420
const VBH = 1360
const VBX = -VBW / 2
const VBY = -660

export default function ConstellationSky({ skillTiers = {}, onSkillClick }) {
  const sky = useMemo(() => computeSky(constellation), [])
  const svgRef = useRef(null)
  // 모바일은 가독성을 위해 '현재의 나' 중심으로 확대해 시작 (핀치로 탐색)
  const [view, setView] = useState(() => {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 640
    if (!mobile) return { scale: 1, tx: 0, ty: 0 }
    const s = 2.4
    const P = { x: 20, y: 70 } // 현재의 나 근처
    const T = { x: 0, y: 20 } // viewBox 중심(user 좌표)
    return { scale: s, tx: T.x - s * P.x, ty: T.y - s * P.y }
  })
  const [panning, setPanning] = useState(false)
  const pointers = useRef(new Map()) // pointerId → user좌표
  const pinch = useRef(null) // {dist, mid}
  const moved = useRef(false)

  // 영역별 tier (그 영역 스킬들의 최고 tier)
  const domainTier = useMemo(() => {
    const map = {}
    sky.domains.forEach((d) => {
      let t = 0
      d.skills.forEach((k) => {
        if ((skillTiers[k.id] || 0) > t) t = skillTiers[k.id]
      })
      map[d.id] = t
    })
    return map
  }, [skillTiers, sky])

  const domainIds = useMemo(() => new Set(sky.domains.map((d) => d.id)), [sky])

  const isLit = useCallback(
    (id) => {
      if (id === sky.center.id) return true
      if (domainIds.has(id)) return (domainTier[id] || 0) > 0
      return (skillTiers[id] || 0) > 0
    },
    [sky.center.id, domainIds, domainTier, skillTiers],
  )

  // client px → viewBox user 좌표 (그룹 transform 이전 공간)
  const toUser = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const u = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: u.x, y: u.y }
  }, [])

  const applyZoom = useCallback((f, focusUser) => {
    setView((v) => {
      const scale = Math.min(5, Math.max(0.4, v.scale * f))
      const real = scale / v.scale // 클램프 반영된 실제 배율
      return {
        scale,
        tx: focusUser.x * (1 - real) + v.tx * real,
        ty: focusUser.y * (1 - real) + v.ty * real,
      }
    })
  }, [])

  const onWheel = useCallback(
    (e) => {
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12
      applyZoom(f, toUser(e.clientX, e.clientY))
    },
    [applyZoom, toUser],
  )

  const onPointerDown = useCallback(
    (e) => {
      pointers.current.set(e.pointerId, toUser(e.clientX, e.clientY))
      moved.current = false
      setPanning(true)
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) }
      }
    },
    [toUser],
  )

  const onPointerMove = useCallback(
    (e) => {
      if (!pointers.current.has(e.pointerId)) return
      const prev = pointers.current.get(e.pointerId)
      const now = toUser(e.clientX, e.clientY)
      pointers.current.set(e.pointerId, now)

      if (pointers.current.size >= 2) {
        // 핀치 줌
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        if (pinch.current?.dist) applyZoom(dist / pinch.current.dist, mid)
        pinch.current = { dist }
        moved.current = true
      } else {
        // 한 손가락/마우스 이동
        const dx = now.x - prev.x
        const dy = now.y - prev.y
        if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true
        setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }))
      }
    },
    [toUser, applyZoom],
  )

  const onPointerUp = useCallback((e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) setPanning(false)
  }, [])

  const handleSkillClick = useCallback(
    (id) => {
      if (moved.current) return
      onSkillClick?.(id)
    },
    [onSkillClick],
  )

  return (
    <svg
      ref={svgRef}
      className={`map-svg${panning ? ' is-panning' : ''}`}
      viewBox={`${VBX} ${VBY} ${VBW} ${VBH}`}
      preserveAspectRatio="xMidYMid meet"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      role="img"
      aria-label="커리어 별자리"
    >
      <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
        {/* 별자리 선 */}
        <g>
          {sky.lines.map((l, i) => (
            <EdgeLine key={i} edge={l} lit={isLit(l.a) && isLit(l.b)} />
          ))}
        </g>

        {/* 세부 스킬 잔별 */}
        <g>
          {sky.domains.map((d) =>
            d.skills.map((k) => (
              <SkillStar key={k.id} skill={k} tier={skillTiers[k.id] || 0} onClick={handleSkillClick} />
            )),
          )}
        </g>

        {/* 영역 대표별 */}
        {sky.domains.map((d) => {
          const t = domainTier[d.id] || 0
          return (
            <g
              key={d.id}
              className={`notable ${t > 0 ? `notable--t${t}` : 'notable--dim'}`}
              transform={`translate(${d.x} ${d.y})`}
            >
              <circle className="notable__disc" r="11" />
              <ClusterSymbol name={d.symbol} cx={0} cy={0} size={20} />
              <text className="notable__label" y="27">
                {d.ko}
              </text>
            </g>
          )
        })}

        {/* 중앙 — 현재의 나 */}
        <g className="notable notable--self" transform={`translate(${sky.center.x} ${sky.center.y})`}>
          <circle className="notable__disc" r="13" />
          <ClusterSymbol name={sky.center.symbol} cx={0} cy={0} size={22} />
          <text className="notable__label" y="30">
            현재의 나
          </text>
        </g>
      </g>
    </svg>
  )
}
