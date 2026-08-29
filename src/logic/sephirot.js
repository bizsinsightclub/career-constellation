/*
 * sephirot.js — constellation.json(세피로트 구조)로부터 화면 좌표와 경로선을 계산한다.
 * (기존 방사형 layout.js 대체)
 *
 * 정규화 좌표(x: -1좌~+1우, y: 0상~아래)를 픽셀로 스케일.
 * 트리는 세로로 길다 → 세로 중앙 정렬.
 */

const SX = 195 // x 스케일 (±0.85 → ±166px)
const SY = 76 // y 스케일 (단위 간격)
const Y_MID = 3.3 // y 중앙(0~6.6의 중간)

function toPx(pos) {
  return { x: pos.x * SX, y: (pos.y - Y_MID) * SY }
}

export function computeTree(data) {
  const posMap = new Map()
  const spheres = data.spheres.map((s) => {
    const p = toPx(s.position)
    posMap.set(s.id, p)
    return { ...s, x: p.x, y: p.y }
  })

  const paths = data.paths.map(([from, to]) => {
    const a = posMap.get(from)
    const b = posMap.get(to)
    return { from, to, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
  })

  // 각인 애니메이션용: 번개 흐름(order) 순서
  const order = [...spheres].sort((a, b) => a.order - b.order)

  return { spheres, paths, order }
}
