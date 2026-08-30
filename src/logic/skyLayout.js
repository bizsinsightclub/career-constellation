/*
 * skyLayout.js — 유기적 "밤하늘 별자리" 좌표.
 * 모든 점(영역 대표별 + 세부 스킬별 + 현재의 나)을 하나의 별자리 그래프로 잇는다.
 * 최소신장트리(MST)를 쓰되, 같은 영역 안 연결을 싸게(가중치↓) 해서
 * 각 영역이 작은 별자리를 이루고 영역끼리는 가장 가까운 '별'에서 다리를 놓는다.
 * → 모든 선이 실제 별↔별로 이어져 일관되고, 선은 전부 직선.
 */

const DOMAIN_POS = {
  keter:   { x:   40, y: -400 }, // 비전·소명
  hokhmah: { x: -250, y: -280 }, // 전략
  tiferet: { x:  330, y: -275 }, // 창작·기획
  binah:   { x: -510, y:  -70 }, // 분석·데이터
  hod:     { x:  560, y:  -55 }, // 커뮤니케이션·영향력
  daat:    { x: -560, y:  215 }, // 학습·자격
  hesed:   { x:  525, y:  210 }, // 리더십·조직
  gevurah: { x: -300, y:  375 }, // 실행·운영
  netzah:  { x:  305, y:  385 }, // 성과·수상
  yesod:   { x:  -20, y:  405 }, // 산업 경험
}
const CENTER_POS = { x: 20, y: 70 } // 현재의 나 (malkhut)
const CROSS_PENALTY = 2.1 // 영역 간 연결 억제(같은 영역 우선)

function hash01(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 1000 / 1000
}

export function computeSky(data) {
  const spheres = data.spheres
  const centerSphere = spheres.find((s) => s.alwaysLit) || spheres[spheres.length - 1]

  const stars = [] // {id, kind:'notable'|'skill'|'self', domain, ko?, symbol?, label?, order, x, y}

  spheres.forEach((s) => {
    const isCenter = s.id === centerSphere.id
    const pos = isCenter ? CENTER_POS : DOMAIN_POS[s.id] || { x: 0, y: 0 }
    stars.push({
      id: s.id,
      kind: isCenter ? 'self' : 'notable',
      domain: s.id,
      ko: s.ko,
      symbol: s.symbol,
      order: s.order ?? 0,
      x: pos.x,
      y: pos.y,
    })
    ;(s.skills || []).forEach((k, i) => {
      const a = i * 2.3999 + hash01(k.id) * 0.9
      const r = 46 + (i % 4) * 22 + hash01(k.id + 'r') * 26
      stars.push({
        id: k.id,
        kind: 'skill',
        domain: s.id,
        label: k.label,
        order: s.order ?? 0,
        x: pos.x + Math.cos(a) * r,
        y: pos.y + Math.sin(a) * r * 0.82,
      })
    })
  })

  // 가중 MST (같은 영역 저렴, 다른 영역 비쌈) — 모든 별을 하나의 별자리로
  const n = stars.length
  const inTree = new Array(n).fill(false)
  inTree[0] = true
  const lines = []
  const w = (i, j) => {
    const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y)
    return stars[i].domain === stars[j].domain ? d : d * CROSS_PENALTY
  }
  for (let k = 0; k < n - 1; k++) {
    let best = null
    for (let i = 0; i < n; i++) {
      if (!inTree[i]) continue
      for (let j = 0; j < n; j++) {
        if (inTree[j]) continue
        const cost = w(i, j)
        if (!best || cost < best.cost) best = { i, j, cost }
      }
    }
    inTree[best.j] = true
    const A = stars[best.i]
    const B = stars[best.j]
    lines.push({ x1: A.x, y1: A.y, x2: B.x, y2: B.y, a: A.id, b: B.id })
  }

  return { stars, lines }
}
