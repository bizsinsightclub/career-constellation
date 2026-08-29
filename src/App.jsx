import './App.css'
import StarfieldBackground from './components/StarfieldBackground.jsx'
import CardFrame from './components/CardFrame.jsx'
import ConstellationMap from './components/ConstellationMap.jsx'

/*
 * 앱 루트.
 * 배경 3중 레이어 + 잔별 위에 별자리 지도를 얹고, 화면 전체를 카드 프레임으로 감싼다.
 * M1: 미점등 별자리 지도 렌더링 (아직 API·점등 없음).
 */
export default function App() {
  return (
    <div className="app-root">
      {/* 배경 레이어 */}
      <div className="bg-veil" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <StarfieldBackground />

      {/* 별자리 지도 */}
      <ConstellationMap />

      {/* 화면 전체를 감싸는 카드 프레임 */}
      <CardFrame />

      {/* 상단 표제 (지도 위에 조용히 얹힘) */}
      <header className="stage-title">
        <p className="stage-title__arcana">✦ THE CONSTELLATION OF CAREER ✦</p>
        <h1 className="stage-title__name">커리어 별자리</h1>
      </header>

      {/* 조작 안내 */}
      <p className="stage-hint">스크롤로 확대·축소 · 드래그로 이동</p>
    </div>
  )
}
