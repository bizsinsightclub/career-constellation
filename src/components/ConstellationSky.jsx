import { useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react'
import './ConstellationSky.css'
import { computeSky, weightedMst } from '../logic/skyLayout.js'
import constellation from '../../data/constellation.json'
import EdgeLine from './EdgeLine.jsx'
import SkillStar from './SkillStar.jsx'
import ClusterSymbol from './ClusterSymbol.jsx'

const VBW = 1420
const VBH = 1360
const VBX = -VBW / 2
const VBY = -660
const VBCX = VBX + VBW / 2 // 0
const VBCY = VBY + VBH / 2 // 20

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 640
}
function reduceMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// 별 목록의 bounding box
function bboxOf(list) {
  const xs = list.map((s) => s.x)
  const ys = list.map((s) => s.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}
// bbox를 화면에 담는 view{scale,tx,ty}
function viewFor(bbox, fill, minS, maxS) {
  const w = Math.max(bbox.w, 120)
  const h = Math.max(bbox.h, 120)
  let s = Math.min((VBW * fill) / w, (VBH * fill) / h)
  s = Math.min(maxS, Math.max(minS, s))
  const cx = bbox.x + bbox.w / 2
  const cy = bbox.y + bbox.h / 2
  return { scale: s, tx: VBCX - s * cx, ty: VBCY - s * cy }
}

export default function ConstellationSky({ skillTiers = {}, skillLabels = {}, onSkillClick, runId = 0, onEngraveDone }) {
  const sky = useMemo(() => computeSky(constellation), [])
  const svgRef = useRef(null)
  const doneRef = useRef(onEngraveDone)
  doneRef.current = onEngraveDone

  const wholeView = useMemo(() => viewFor(bboxOf(sky.stars), 0.9, 0.85, 3.2), [sky])
  const initialView = useMemo(() => {
    if (!isMobile()) return { scale: 1, tx: 0, ty: 0 }
    const s = 2.2
    return { scale: s, tx: VBCX - s * 20, ty: VBCY - s * 70 }
  }, [])

  const [view, setView] = useState(initialView)
  const [panning, setPanning] = useState(false)
  const [cam, setCam] = useState(false) // 카메라 부드러운 전환(애니메이션 중만)
  const [animating, setAnimating] = useState(false)
  const [revealed, setRevealed] = useState(null) // Set<skillId> | null(=전체 공개)
  const pointers = useRef(new Map())
  const pinch = useRef(null)
  const moved = useRef(false)
  const timeline = useRef([])

  const clearTimeline = useCallback(() => {
    timeline.current.forEach(clearTimeout)
    timeline.current = []
  }, [])

  // 세부별의 '보이는' tier (애니메이션 중 아직 공개 전이면 0)
  const effSkillTier = useCallback(
    (id) => {
      const t = skillTiers[id] || 0
      if (t === 0) return 0
      if (revealed && !revealed.has(id)) return 0
      return t
    },
    [skillTiers, revealed],
  )

  const domainTier = useMemo(() => {
    const map = {}
    sky.stars.forEach((s) => {
      if (s.kind !== 'skill') return
      const t = effSkillTier(s.id)
      if (t > (map[s.domain] || 0)) map[s.domain] = t
    })
    return map
  }, [sky, effSkillTier])

  const starById = useMemo(() => {
    const m = new Map()
    sky.stars.forEach((s) => m.set(s.id, s))
    return m
  }, [sky])

  const isLit = useCallback(
    (id) => {
      const s = starById.get(id)
      if (!s) return false
      if (s.kind === 'self') return true
      if (s.kind === 'notable') return (domainTier[id] || 0) > 0
      return effSkillTier(id) > 0
    },
    [starById, domainTier, effSkillTier],
  )

  // 최종적으로 켜질 별들의 별자리 선을 '미리' 한 번 계산(토폴로지 고정 → 애니 중 튐 없음).
  const finalMst = useMemo(() => {
    const finalLit = (s) => {
      if (s.kind === 'self') return true
      if (s.kind === 'skill') return (skillTiers[s.id] || 0) > 0
      return sky.stars.some((k) => k.kind === 'skill' && k.domain === s.id && (skillTiers[k.id] || 0) > 0)
    }
    const stars = sky.stars.filter(finalLit).map((s) => ({ id: s.id, x: s.x, y: s.y, domain: s.domain }))
    return weightedMst(stars)
  }, [sky, skillTiers])

  // 공개된(현재 켜진) 양끝의 선만 밝게 표시 → 공개될수록 선이 자라남
  const litLines = useMemo(() => finalMst.filter((l) => isLit(l.a) && isLit(l.b)), [finalMst, isLit])

  // ── 각인 애니메이션 (분석 결과가 들어올 때) ──
  // useLayoutEffect: 결과가 그려지기 '전에' revealed를 비워, 전체가 한 번 깜빡이는 것 방지
  useLayoutEffect(() => {
    if (runId === 0) return
    clearTimeline()
    const litSkills = sky.stars.filter((s) => s.kind === 'skill' && (skillTiers[s.id] || 0) > 0)
    const allLit = new Set(litSkills.map((s) => s.id))
    if (litSkills.length === 0) {
      setRevealed(null)
      setAnimating(false)
      setCam(false)
      doneRef.current?.()
      return
    }
    if (reduceMotion()) {
      setRevealed(null)
      setAnimating(false)
      setCam(false)
      setView(wholeView)
      doneRef.current?.()
      return
    }

    // 점등 영역을 order 순으로
    const orderOf = {}
    const notableOf = {}
    sky.stars.forEach((s) => {
      if (s.kind !== 'skill') {
        orderOf[s.domain] = s.order
        notableOf[s.domain] = s
      }
    })
    const litDomains = [...new Set(litSkills.map((s) => s.domain))].sort(
      (a, b) => (orderOf[a] ?? 0) - (orderOf[b] ?? 0),
    )

    setAnimating(true)
    setCam(true)
    const shown = new Set()
    setRevealed(new Set())
    const push = (delay, fn) => timeline.current.push(setTimeout(fn, delay))

    let t = 200
    litDomains.forEach((dom) => {
      const domLit = litSkills.filter((s) => s.domain === dom)
      const frame = [notableOf[dom], ...domLit].filter(Boolean)
      // 카메라를 이 영역으로 줌인
      push(t, () => setView(viewFor(bboxOf(frame), 0.5, 1.5, 2.4)))
      // 카메라 안정 후 별을 하나씩 점등
      let dt = t + 850
      domLit.forEach((s) => {
        push(dt, () => {
          shown.add(s.id)
          setRevealed(new Set(shown))
        })
        dt += 380
      })
      t = dt + 350
    })
    // 마무리: 전체 줌아웃
    push(t, () => setView(wholeView))
    push(t + 250, () => setRevealed(new Set(allLit)))
    push(t + 1150, () => {
      setAnimating(false)
      setCam(false)
      setRevealed(null)
      doneRef.current?.()
    })

    return clearTimeline
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  // 애니메이션 건너뛰기 (탭/드래그 시작 시)
  const skipAnim = useCallback(() => {
    if (!animating) return
    clearTimeline()
    setRevealed(null)
    setAnimating(false)
    setCam(false)
    setView(wholeView)
    doneRef.current?.()
  }, [animating, clearTimeline, wholeView])

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
      const real = scale / v.scale
      return {
        scale,
        tx: focusUser.x * (1 - real) + v.tx * real,
        ty: focusUser.y * (1 - real) + v.ty * real,
      }
    })
  }, [])

  const onWheel = useCallback(
    (e) => {
      skipAnim()
      applyZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, toUser(e.clientX, e.clientY))
    },
    [applyZoom, toUser, skipAnim],
  )

  const onPointerDown = useCallback(
    (e) => {
      if (animating) {
        skipAnim()
        return
      }
      pointers.current.set(e.pointerId, toUser(e.clientX, e.clientY))
      moved.current = false
      setPanning(true)
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) }
      }
    },
    [toUser, animating, skipAnim],
  )

  const onPointerMove = useCallback(
    (e) => {
      if (!pointers.current.has(e.pointerId)) return
      const prev = pointers.current.get(e.pointerId)
      const now = toUser(e.clientX, e.clientY)
      pointers.current.set(e.pointerId, now)
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        if (pinch.current?.dist) applyZoom(dist / pinch.current.dist, mid)
        pinch.current = { dist }
        moved.current = true
      } else {
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
      if (moved.current || animating) return
      onSkillClick?.(id)
    },
    [onSkillClick, animating],
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
      <g
        className={cam ? 'sky-cam' : undefined}
        transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}
      >
        {/* 배경 별자리 격자 (아주 옅게) */}
        <g className="sky-lattice">
          {sky.lines.map((l, i) => (
            <EdgeLine key={i} edge={l} />
          ))}
        </g>

        {/* 켜진 별들의 별자리 선 (밝게, 공개될수록 자라남) */}
        <g>
          {litLines.map((l) => (
            <EdgeLine key={`${l.a}|${l.b}`} edge={l} lit />
          ))}
        </g>

        {/* 세부 스킬 잔별 */}
        <g>
          {sky.stars
            .filter((s) => s.kind === 'skill')
            .map((k) => (
              <SkillStar
                key={k.id}
                skill={k}
                tier={effSkillTier(k.id)}
                customLabel={skillLabels[k.id]}
                onClick={handleSkillClick}
              />
            ))}
        </g>

        {/* 영역 대표별 + 현재의 나 */}
        {sky.stars
          .filter((s) => s.kind !== 'skill')
          .map((s) => {
            const self = s.kind === 'self'
            const t = self ? 4 : domainTier[s.id] || 0
            const cls = self ? 'notable notable--self' : `notable ${t > 0 ? `notable--t${t}` : 'notable--dim'}`
            return (
              <g key={s.id} className={cls} transform={`translate(${s.x} ${s.y})`}>
                <circle className="notable__disc" r={self ? 14 : 12} />
                <ClusterSymbol name={s.symbol} cx={0} cy={0} size={self ? 24 : 21} />
                <text className="notable__label" y={self ? 31 : 28}>
                  {s.ko}
                </text>
              </g>
            )
          })}
      </g>
    </svg>
  )
}
