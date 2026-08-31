import './NameReveal.css'

/*
 * NameReveal — 각인 직후, 전체 해석 전에 '별자리의 이름(아르카나)'만 먼저 공개한다.
 * 이름은 LLM이 짓는 동안 대기 문구를 보이다가, 준비되면 나타난다.
 * '결과 보기'로 전체 타로 카드(ReadingCard)를 연다.
 */
export default function NameReveal({ arcana, loading, onSeeResult, onClose }) {
  return (
    <div className="namereveal__backdrop" onClick={onClose}>
      <div className="namereveal" onClick={(e) => e.stopPropagation()}>
        <p className="namereveal__eyebrow">✦ 그대의 별자리 ✦</p>
        {loading ? (
          <p className="namereveal__loading">별자리의 이름을 짓는 중…</p>
        ) : (
          <>
            <p className="namereveal__roman">{arcana.roman}</p>
            <h2 className="namereveal__name">{arcana.ko}</h2>
            {arcana.en && <p className="namereveal__en">{arcana.en}</p>}
            {arcana.tagline && <p className="namereveal__tagline">{arcana.tagline}</p>}
            <button className="namereveal__btn" onClick={onSeeResult}>
              결과 보기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
