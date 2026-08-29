import { useReducer, useCallback } from 'react'
import './App.css'
import StarfieldBackground from './components/StarfieldBackground.jsx'
import CardFrame from './components/CardFrame.jsx'
import ConstellationMap from './components/ConstellationMap.jsx'

/*
 * 점등 상태 리듀서.
 * tiers: { [nodeId]: 1|2|3 }
 * M2에서는 노드 클릭으로 tier를 순환(CYCLE)시켜 시각을 검증한다.
 * M3에서는 API 추출 결과(점수)로부터 tier를 세팅하는 액션을 추가한다.
 */
function illuminationReducer(state, action) {
  switch (action.type) {
    case 'CYCLE': {
      const cur = state.tiers[action.id] || 0
      const next = (cur + 1) % 4 // 0→1→2→3→0
      const tiers = { ...state.tiers }
      if (next === 0) delete tiers[action.id]
      else tiers[action.id] = next
      return { ...state, tiers }
    }
    case 'RESET':
      return { ...state, tiers: {} }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(illuminationReducer, { tiers: {} })
  const cycleNode = useCallback((id) => dispatch({ type: 'CYCLE', id }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])
  const litCount = Object.keys(state.tiers).length

  return (
    <div className="app-root">
      {/* 배경 레이어 */}
      <div className="bg-veil" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <StarfieldBackground />

      {/* 별자리 지도 */}
      <ConstellationMap tiers={state.tiers} onNodeClick={cycleNode} />

      {/* 화면 전체를 감싸는 카드 프레임 */}
      <CardFrame />

      {/* 상단 표제 */}
      <header className="stage-title">
        <p className="stage-title__arcana">✦ THE CONSTELLATION OF CAREER ✦</p>
        <h1 className="stage-title__name">커리어 별자리</h1>
      </header>

      {/* 조작 안내 */}
      <p className="stage-hint">
        노드를 클릭하면 점등 단계가 바뀝니다 (촛불 → 금박 → 달빛 → 꺼짐) · 스크롤 확대·드래그 이동
      </p>

      {/* 모두 끄기 (점등된 별이 있을 때만) */}
      {litCount > 0 && (
        <button className="reset-btn" onClick={reset}>
          모두 끄기 ({litCount})
        </button>
      )}
    </div>
  )
}
