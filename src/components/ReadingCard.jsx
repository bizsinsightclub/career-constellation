import { useRef, useEffect } from 'react'
import './ReadingCard.css'

/*
 * ReadingCard — 타로 카드 형태의 해석 패널 (design.md §8 시그니처).
 * 뒤집히며 등장, 상단 아르카나(로마숫자+이름), 드롭캡 본문(프리셋+LLM 개인화),
 * 하단 '다음에 깃들 별'(클릭 시 해당 영역으로).
 */
export default function ReadingCard({ reading, personal, personalLoading, onClose, onPickNext }) {
  const cardRef = useRef(null)
  useEffect(() => {
    if (cardRef.current) cardRef.current.scrollTop = 0 // 열릴 때 맨 위부터
  }, [])
  if (!reading) return null
  const { arcana, verdict, strengths, dark } = reading

  return (
    <div className="reading__backdrop" onClick={onClose}>
      <div ref={cardRef} className="reading-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="커리어 해석">
        <button className="reading__close" onClick={onClose} aria-label="닫기">✕</button>

        {/* 아르카나 헤더 */}
        <div className="reading__header">
          <p className="reading__roman">{arcana.roman}</p>
          <h2 className="reading__name">{arcana.ko}</h2>
          <p className="reading__en">{arcana.en}</p>
          <p className="reading__tagline">— {arcana.tagline} —</p>
        </div>

        <div className="reading__star">✦</div>

        {/* 전체 인상 + 개인화 문단 */}
        <div className="reading__body">
          <p className="reading__verdict">{verdict.line}</p>
          {personalLoading ? (
            <p className="reading__loading">그대의 별을 읽어 문장을 엮는 중…</p>
          ) : personal ? (
            <p className="reading__personal">{personal}</p>
          ) : null}
        </div>

        {/* 빛나는 별들 */}
        {strengths.length > 0 && (
          <>
            <div className="reading__star">✦</div>
            <div className="reading__section">
              <h3 className="reading__subtitle">빛나는 별들</h3>
              <ul className="reading__list">
                {strengths.map((s) => (
                  <li key={s.id} className="reading__strength">
                    <span className="reading__strength-name">
                      {s.ko}
                      <em className={`reading__tier reading__tier--${s.tier}`}>{s.tierName}</em>
                    </span>
                    <span className="reading__strength-line">{s.line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* 다음에 깃들 별 */}
        {dark.length > 0 && (
          <>
            <div className="reading__star">✦</div>
            <div className="reading__section">
              <h3 className="reading__subtitle">다음에 깃들 별</h3>
              <ul className="reading__list">
                {dark.map((d) => (
                  <li key={d.id}>
                    <button className="reading__next" onClick={() => onPickNext?.(d.id)}>
                      <span className="reading__next-name">{d.ko}</span>
                      <span className="reading__next-line">{d.line}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
