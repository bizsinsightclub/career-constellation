/*
 * 클러스터 중심 선각화 심볼 8종 (design.md §5).
 * 전략=눈 · 창작=손 · 분석=천칭 · 리더십=왕관 · 실행=열쇠 · 학습=펼친 책 · 산업=탑 · 성과=월계
 * 전부 획 1.5px 라인 자체 제작. currentColor를 따르며,
 * 미점등이면 --socket-dim, 하위 노드가 하나라도 점등되면 --lunar로 발광(색은 부모가 지정).
 */

// 48x48 viewBox 기준 경로들
const PATHS = {
  eye: (
    <>
      <path d="M6 24 Q24 10 42 24 Q24 38 6 24 Z" />
      <circle cx="24" cy="24" r="5.5" />
      <circle cx="24" cy="24" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  hand: (
    <>
      <path d="M17 16 V28 M22 12 V28 M27 13 V28 M32 17 V28" />
      <path d="M13 24 L17 21" />
      <path d="M13 27 Q24 42 35 27" />
    </>
  ),
  scales: (
    <>
      <path d="M24 9 V37" />
      <path d="M11 15 H37" />
      <circle cx="24" cy="12" r="2" />
      <path d="M11 15 L7 25 M11 15 L15 25" />
      <path d="M6 25 a5 5 0 0 0 10 0" />
      <path d="M37 15 L33 25 M37 15 L41 25" />
      <path d="M32 25 a5 5 0 0 0 10 0" />
      <path d="M19 37 H29" />
    </>
  ),
  crown: (
    <>
      <path d="M10 32 L12 16 L18 24 L24 13 L30 24 L36 16 L38 32 Z" />
      <path d="M10 36 H38" />
    </>
  ),
  key: (
    <>
      <circle cx="24" cy="13" r="6" />
      <path d="M24 19 V39" />
      <path d="M24 31 H31 M24 35 H28" />
    </>
  ),
  book: (
    <>
      <path d="M24 14 C18 11 12 11 8 13 V33 C12 31 18 31 24 34" />
      <path d="M24 14 C30 11 36 11 40 13 V33 C36 31 30 31 24 34" />
      <path d="M24 14 V34" />
    </>
  ),
  tower: (
    <>
      <path d="M16 40 V18 H32 V40" />
      <path d="M16 18 V13 H20 V16 H24 V13 H28 V16 H32 V18" />
      <path d="M21 40 V31 a3 3 0 0 1 6 0 V40" />
    </>
  ),
  laurel: (
    <>
      <path d="M24 41 Q13 32 16 14" />
      <path d="M24 41 Q35 32 32 14" />
      <path d="M17 22 q-5 -1 -6 -5 M18 30 q-5 -1 -6 -5" />
      <path d="M31 22 q5 -1 6 -5 M30 30 q5 -1 6 -5" />
      <path d="M24 41 V35" />
    </>
  ),
}

export default function ClusterSymbol({ name, cx = 0, cy = 0, size = 30 }) {
  const paths = PATHS[name]
  if (!paths) return null
  return (
    <svg
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
}
