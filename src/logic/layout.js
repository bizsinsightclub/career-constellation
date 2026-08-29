/*
 * layout.js — 지도 데이터(constellation.json)로부터 실제 좌표와 간선을 계산한다.
 *
 * 구조:
 *   중앙 허브(현재의 나) — 원점(0,0)
 *   └ 8개 클러스터 중심(심볼)  — 원점에서 각도(angle)·반지름(radius)만큼 떨어진 곳
 *      └ 12개 노드            — 클러스터 중심 둘레에 고리(ring)처럼 배치
 *
 * 간선 종류(kind):
 *   hub    : 허브 → 클러스터 중심
 *   spoke  : 클러스터 중심 → 대표 노드
 *   ring   : 같은 클러스터 노드끼리 잇는 별자리 고리
 *   bridge : constellation.json의 edges — 클러스터를 가로지르는 의미상 연결
 *
 * 좌표계: 원점이 화면 중앙. 각도 0 = 위(12시), 시계방향.
 */

const RING = 92 // 클러스터 중심에서 노드까지 기본 거리

// id 문자열 → [0,1) 결정적 난수 (같은 입력은 항상 같은 값 → 별이 흔들리지 않음)
function hash01(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 1000 / 1000
}

// 각도(도)·반지름 → x,y (각도 0 = 위, 시계방향)
function polar(angleDeg, radius) {
  const a = (angleDeg * Math.PI) / 180
  return { x: radius * Math.sin(a), y: -radius * Math.cos(a) }
}

export function computeLayout(data) {
  const pos = new Map() // id → {x,y}  (허브·클러스터중심·노드 모두)

  // 1) 허브
  const hub = { ...data.hub, x: 0, y: 0 }
  pos.set(hub.id, { x: 0, y: 0 })

  // 2) 클러스터 중심
  const clusters = data.clusters.map((c) => {
    const p = polar(c.position.angle, c.position.radius)
    pos.set(c.id, p)
    return { ...c, x: p.x, y: p.y }
  })

  // 3) 노드 — 소속 클러스터 중심 둘레에 고리로 배치
  const byCluster = new Map()
  data.nodes.forEach((n) => {
    if (!byCluster.has(n.cluster)) byCluster.set(n.cluster, [])
    byCluster.get(n.cluster).push(n)
  })

  const nodes = []
  byCluster.forEach((list, clusterId) => {
    const center = pos.get(clusterId)
    const N = list.length
    list.forEach((n, i) => {
      // 고리 위 기본 각도(위에서 시작) + 약간의 결정적 흔들림 → 유기적 느낌
      const baseA = (i / N) * Math.PI * 2 - Math.PI / 2
      const jitterA = (hash01(n.id) - 0.5) * 0.24
      const jitterR = 0.82 + hash01(n.id + 'r') * 0.32
      const r = RING * jitterR
      const x = center.x + r * Math.cos(baseA + jitterA)
      const y = center.y + r * Math.sin(baseA + jitterA)
      pos.set(n.id, { x, y })
      nodes.push({ ...n, x, y })
    })
  })

  // 4) 간선 계산
  const edges = []
  const push = (from, to, kind) => {
    const a = pos.get(from)
    const b = pos.get(to)
    if (!a || !b) return
    edges.push({ from, to, kind, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  clusters.forEach((c) => {
    push(hub.id, c.id, 'hub') // 허브 → 클러스터 중심
    const list = byCluster.get(c.id) || []
    const N = list.length
    if (N > 0) {
      // 대표 노드 2개로 스포크
      push(c.id, list[0].id, 'spoke')
      push(c.id, list[Math.floor(N / 2)].id, 'spoke')
      // 별자리 고리 (닫힌 목걸이)
      for (let i = 0; i < N; i++) {
        push(list[i].id, list[(i + 1) % N].id, 'ring')
      }
    }
  })

  // 클러스터를 가로지르는 의미상 연결
  ;(data.edges || []).forEach((e) => push(e.from, e.to, 'bridge'))

  return { hub, clusters, nodes, edges }
}
