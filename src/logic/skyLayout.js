/*
 * skyLayout.js — 유기적 "밤하늘 별자리" 좌표 계산 (세피로트 트리 대체).
 * 종교색(생명나무·히브리) 없이, 영역들을 하늘에 불규칙하게 흩뿌리고
 * 각 영역을 아이콘 대표별 + 세부 스킬 잔별들의 작은 별자리로 구성한다.
 * 선은 최소신장트리(MST)로 이어 자연스러운 별자리 도형을 만든다.
 */

// 영역(대분류) 배치 — 손으로 잡은 불규칙한 하늘 좌표. 중앙엔 '현재의 나'.
const DOMAIN_POS = {
  keter:   { x:   40, y: -400 }, // 비전·소명 (최상단, 북극성)
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

function hash01(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 1000 / 1000
}

// 최소신장트리 (작은 점집합이라 O(n^3) 무방) → 자연스러운 별자리 도형
function primEdges(pts) {
  const n = pts.length
  if (n < 2) return []
  const inTree = new Array(n).fill(false)
  inTree[0] = true
  const edges = []
  for (let k = 0; k < n - 1; k++) {
    let best = null
    for (let i = 0; i < n; i++) {
      if (!inTree[i]) continue
      for (let j = 0; j < n; j++) {
        if (inTree[j]) continue
        const d = (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2
        if (!best || d < best.d) best = { i, j, d }
      }
    }
    inTree[best.j] = true
    edges.push([best.i, best.j])
  }
  return edges
}

export function computeSky(data) {
  const spheres = data.spheres
  const centerSphere = spheres.find((s) => s.alwaysLit) || spheres[spheres.length - 1]
  const center = { id: centerSphere.id, ko: centerSphere.ko, symbol: centerSphere.symbol, ...CENTER_POS }

  const lines = []
  const domains = []
  const anchors = [{ id: center.id, x: center.x, y: center.y }] // 영역 간 연결용

  spheres.forEach((s) => {
    if (s.id === center.id) return
    const pos = DOMAIN_POS[s.id] || { x: 0, y: 0 }
    anchors.push({ id: s.id, x: pos.x, y: pos.y })

    // 세부 스킬 잔별 — 황금각 나선 + 지터로 불규칙하게
    const skills = (s.skills || []).map((k, i) => {
      const a = i * 2.3999 + hash01(k.id) * 0.9
      const r = 42 + (i % 4) * 20 + hash01(k.id + 'r') * 26
      return { id: k.id, label: k.label, x: pos.x + Math.cos(a) * r, y: pos.y + Math.sin(a) * r * 0.85 }
    })

    // 영역 내부 별자리 선: (대표별 + 세부별)의 MST
    const pts = [{ x: pos.x, y: pos.y }, ...skills]
    primEdges(pts).forEach(([i, j]) => {
      const A = i === 0 ? { id: s.id, x: pos.x, y: pos.y } : skills[i - 1]
      const B = j === 0 ? { id: s.id, x: pos.x, y: pos.y } : skills[j - 1]
      lines.push({ x1: A.x, y1: A.y, x2: B.x, y2: B.y, a: A.id, b: B.id, kind: 'intra' })
    })

    domains.push({ id: s.id, ko: s.ko, symbol: s.symbol, x: pos.x, y: pos.y, skills })
  })

  // 영역 간 별자리 선: 대표별들 + 중앙의 MST
  primEdges(anchors).forEach(([i, j]) => {
    lines.push({
      x1: anchors[i].x, y1: anchors[i].y, x2: anchors[j].x, y2: anchors[j].y,
      a: anchors[i].id, b: anchors[j].id, kind: 'inter',
    })
  })

  return { center, domains, lines }
}
