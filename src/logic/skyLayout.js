/*
 * skyLayout.js — 유기적 "밤하늘 별자리" 좌표.
 * 좌표를 '시드(seed)'로 매번 다르게 생성 → 사람마다 별자리 모양이 달라진다.
 * 모든 점(영역 대표별 + 세부 스킬별 + 현재의 나)을 하나의 별자리 그래프(MST)로 잇되,
 * 같은 영역 연결을 우선해 각 영역이 작은 별자리를 이루고 영역끼리는 가장 가까운 별에서 다리를 놓는다.
 * 선은 전부 실제 별↔별, 직선.
 */

const CENTER_POS = { x: 20, y: 70 } // 현재의 나 (malkhut)
const CROSS_PENALTY = 2.1

// 시드 기반 결정적 난수 (mulberry32)
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/*
 * 가중 최소신장트리 — 같은 영역 연결을 싸게. stars:[{id,x,y,domain}] → edges.
 */
export function weightedMst(stars, cross = CROSS_PENALTY) {
  const n = stars.length
  if (n < 2) return []
  const inTree = new Array(n).fill(false)
  inTree[0] = true
  const edges = []
  const w = (i, j) => {
    const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y)
    return stars[i].domain === stars[j].domain ? d : d * cross
  }
  for (let k = 0; k < n - 1; k++) {
    let best = null
    for (let i = 0; i < n; i++) {
      if (!inTree[i]) continue
      for (let j = 0; j < n; j++) {
        if (inTree[j]) continue
        const c = w(i, j)
        if (!best || c < best.c) best = { i, j, c }
      }
    }
    inTree[best.j] = true
    const A = stars[best.i]
    const B = stars[best.j]
    edges.push({ x1: A.x, y1: A.y, x2: B.x, y2: B.y, a: A.id, b: B.id })
  }
  return edges
}

export function computeSky(data, seed = 1) {
  const rng = mulberry32((seed >>> 0) || 1)
  const spheres = data.spheres
  const centerSphere = spheres.find((s) => s.alwaysLit) || spheres[spheres.length - 1]
  const domains = spheres.filter((s) => s.id !== centerSphere.id)

  // 영역 배치: 중앙 둘레 섹터에 시드 각도·반지름으로 흩뿌림(반지름을 크게 흔들어 '고리' 느낌 탈피)
  const rotation = rng() * Math.PI * 2
  const N = domains.length
  const domainPos = new Map()
  domains.forEach((s, i) => {
    const sector = rotation + (i + (rng() - 0.5) * 0.75) * ((Math.PI * 2) / N)
    const radius = 200 + rng() * 320
    domainPos.set(s.id, {
      x: CENTER_POS.x + Math.cos(sector) * radius,
      y: CENTER_POS.y + Math.sin(sector) * radius * 0.72,
    })
  })

  const stars = []
  stars.push({
    id: centerSphere.id, kind: 'self', domain: centerSphere.id,
    ko: centerSphere.ko, symbol: centerSphere.symbol, order: centerSphere.order ?? 99,
    x: CENTER_POS.x, y: CENTER_POS.y,
  })
  domains.forEach((s) => {
    const pos = domainPos.get(s.id)
    stars.push({
      id: s.id, kind: 'notable', domain: s.id, ko: s.ko, symbol: s.symbol,
      order: s.order ?? 0, x: pos.x, y: pos.y,
    })
    ;(s.skills || []).forEach((k) => {
      const a = rng() * Math.PI * 2
      const r = 44 + rng() * 74
      stars.push({
        id: k.id, kind: 'skill', domain: s.id, label: k.label, order: s.order ?? 0,
        x: pos.x + Math.cos(a) * r, y: pos.y + Math.sin(a) * r * 0.85,
      })
    })
  })

  const lines = weightedMst(stars)
  return { stars, lines }
}

// 문자열 → 32비트 시드
export function seedFromString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
