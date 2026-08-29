import './App.css'
import StarfieldBackground from './components/StarfieldBackground.jsx'
import CardFrame from './components/CardFrame.jsx'

/*
 * 앱 루트.
 * M0(셋업)에서는 "한 장의 카드" 무대만 세운다:
 *   배경 3중 레이어(void·veil·noise) + 잔별 + 카드 프레임 + 중앙 워드마크.
 * 별자리 지도는 M1에서 이 위에 얹는다.
 */
export default function App() {
  return (
    <div className="app-root">
      {/* 배경 레이어: veil 그라디언트 · 노이즈는 CSS 클래스로, 잔별은 SVG로 */}
      <div className="bg-veil" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <StarfieldBackground />

      {/* 화면 전체를 감싸는 카드 프레임 */}
      <CardFrame />

      {/* 임시 중앙 워드마크 — 폰트·분위기 확인용 (M1에서 지도로 대체) */}
      <div className="wordmark">
        <p className="wordmark__arcana">✦ THE CONSTELLATION OF CAREER ✦</p>
        <h1 className="wordmark__title">커리어 별자리</h1>
        <p className="wordmark__sub">그대의 여정이 별빛으로 깃드는 곳</p>
      </div>
    </div>
  )
}
