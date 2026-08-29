import { useMemo } from 'react'

/*
 * 배경 잔별 (design.md §4).
 * 미점등 영역에 1px, 투명도 5~8%의 잔별을 흩뿌려
 * "아직 읽히지 않은 하늘"을 암시한다. 이 별들은 장식일 뿐 소켓이 아니다.
 */
export default function StarfieldBackground({ count = 90 }) {
  // 마운트 시 한 번만 좌표를 생성해 리렌더에도 별이 흔들리지 않게 고정
  const stars = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() < 0.85 ? 0.6 : 1.1,
      o: 0.05 + Math.random() * 0.03, // 투명도 5~8%
    }))
  }, [count])

  return (
    <svg
      className="bg-stars"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill="var(--bone)"
          opacity={s.o}
        />
      ))}
    </svg>
  )
}
