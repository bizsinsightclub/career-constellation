/*
 * 카드 프레임 네 모서리의 오컬트 문양 4종 (design.md §4, §9).
 * 전부 획 1.5px 라인 선각화 스타일로 자체 제작 — 이모지·기성 아이콘 금지.
 * 위협적 기호(펜타그램·해골) 대신 "열려 있는" 상징만: 달·눈·손·열쇠.
 * 색은 currentColor를 따르며 CardFrame이 금빛(--frame-gold)을 지정한다.
 */

const base = {
  width: 40,
  height: 40,
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

// 달 위상 — 초승달 + 작은 별점
export function MoonMotif() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M28 10 a15 15 0 1 0 0 28 a11 11 0 1 1 0 -28 z" />
      <path d="M14 15 l0 4 M12 17 l4 0" />
    </svg>
  )
}

// 눈 — 만물을 읽는 눈 (아몬드 + 홍채 + 빛살)
export function EyeMotif() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M8 24 Q24 11 40 24 Q24 37 8 24 Z" />
      <circle cx="24" cy="24" r="5" />
      <circle cx="24" cy="24" r="1.4" fill="currentColor" stroke="none" />
      <path d="M24 6 v3 M24 39 v3 M6 24 h-0 M42 24 h0" />
    </svg>
  )
}

// 손 — 펼친 손 (가능성을 여는 상징)
export function HandMotif() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M18 16 V27 M23 13 V27 M28 14 V27 M33 18 V27" />
      <path d="M15 24 L18 21" />
      <path d="M14 27 Q24 41 34 27" />
    </svg>
  )
}

// 열쇠 — 카드를 여는 열쇠 (design.md의 "열쇠를 꽂아야 카드를 읽는다" 톤)
export function KeyMotif() {
  return (
    <svg {...base} aria-hidden="true">
      <circle cx="24" cy="13" r="6" />
      <path d="M24 19 V39" />
      <path d="M24 32 H30 M24 36 H28" />
    </svg>
  )
}

// 네 모서리 배치용 순서: 좌상 달 · 우상 눈 · 좌하 손 · 우하 열쇠
export const CORNER_MOTIFS = {
  topLeft: MoonMotif,
  topRight: EyeMotif,
  bottomLeft: HandMotif,
  bottomRight: KeyMotif,
}
