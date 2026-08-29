import { useReducer, useCallback, useState } from 'react'
import './App.css'
import StarfieldBackground from './components/StarfieldBackground.jsx'
import CardFrame from './components/CardFrame.jsx'
import ConstellationMap from './components/ConstellationMap.jsx'
import ApiKeyModal from './components/ApiKeyModal.jsx'
import InputPanel from './components/InputPanel.jsx'
import constellation from '../data/constellation.json'
import { DEFAULT_MODEL } from './lib/models.js'
import { generateJSON } from './lib/gemini.js'
import { buildExtractPrompt, EXTRACT_SCHEMA } from './prompts/extract.js'
import { scoreMatches } from './logic/scoring.js'
import { toIlluminationResult } from './logic/mapping.js'

/* ── localStorage 안전 접근 ─────────────────────────── */
const LS_KEY = 'cc.apiKey'
const LS_MODEL = 'cc.model'
function lsGet(k) {
  try {
    return localStorage.getItem(k) || ''
  } catch {
    return ''
  }
}
function lsSet(k, v) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* 무시 (프라이빗 모드 등) */
  }
}

/*
 * 점등 상태 리듀서.
 *   tiers:    { [id]: 1|2|3 }
 *   scores:   { [id]: number }   (분석 결과일 때)
 *   evidence: { [id]: string[] } (분석 근거)
 */
function illuminationReducer(state, action) {
  switch (action.type) {
    case 'CYCLE': {
      const cur = state.tiers[action.id] || 0
      const next = (cur + 1) % 4 // 0→1→2→3→0 (수동/개발용)
      const tiers = { ...state.tiers }
      const scores = { ...state.scores }
      const evidence = { ...state.evidence }
      if (next === 0) delete tiers[action.id]
      else tiers[action.id] = next
      delete scores[action.id] // 수동 점등은 점수·근거 없음
      delete evidence[action.id]
      return { tiers, scores, evidence }
    }
    case 'SET_RESULT': {
      const tiers = {}
      const scores = {}
      const evidence = {}
      action.result.nodes.forEach((n) => {
        tiers[n.id] = n.tier
        scores[n.id] = n.score
        evidence[n.id] = n.evidence
      })
      return { tiers, scores, evidence }
    }
    case 'RESET':
      return { tiers: {}, scores: {}, evidence: {} }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(illuminationReducer, {
    tiers: {},
    scores: {},
    evidence: {},
  })
  const [apiKey, setApiKey] = useState(() => lsGet(LS_KEY))
  const [model, setModel] = useState(() => lsGet(LS_MODEL) || DEFAULT_MODEL)
  const [modalOpen, setModalOpen] = useState(() => !lsGet(LS_KEY)) // 첫 진입에 키 없으면 열림
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // {kind, text}

  const cycleNode = useCallback((id) => dispatch({ type: 'CYCLE', id }), [])
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
    setStatus(null)
  }, [])
  const litCount = Object.keys(state.tiers).length

  const saveKey = useCallback((k, m) => {
    setApiKey(k)
    setModel(m)
    lsSet(LS_KEY, k)
    lsSet(LS_MODEL, m)
    setModalOpen(false)
  }, [])

  // 추출 → 점수 → 점등
  const analyze = useCallback(
    async (text) => {
      if (!apiKey) {
        setModalOpen(true)
        return
      }
      setLoading(true)
      setStatus(null)
      try {
        const systemInstruction = buildExtractPrompt(constellation.nodes)
        const json = await generateJSON({
          apiKey,
          model,
          systemInstruction,
          userText: text,
          responseSchema: EXTRACT_SCHEMA,
        })
        const result = toIlluminationResult(scoreMatches(json.matches))
        if (result.nodes.length === 0) {
          setStatus({ kind: 'info', text: '관련된 별을 찾지 못했습니다. 조금 더 구체적으로 들려주세요.' })
        } else {
          dispatch({ type: 'SET_RESULT', result })
          setStatus({ kind: 'done', text: `${result.nodes.length}개의 별에 빛이 깃들었습니다.` })
        }
      } catch (e) {
        setStatus({ kind: 'error', text: e?.message || '알 수 없는 오류가 발생했습니다.' })
      } finally {
        setLoading(false)
      }
    },
    [apiKey, model],
  )

  return (
    <div className="app-root">
      {/* 배경 레이어 */}
      <div className="bg-veil" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <StarfieldBackground />

      {/* 별자리 지도 */}
      <ConstellationMap tiers={state.tiers} evidence={state.evidence} onNodeClick={cycleNode} />

      {/* 카드 프레임 */}
      <CardFrame />

      {/* 상단 표제 */}
      <header className="stage-title">
        <p className="stage-title__arcana">✦ THE CONSTELLATION OF CAREER ✦</p>
        <h1 className="stage-title__name">커리어 별자리</h1>
      </header>

      {/* 모두 끄기 */}
      {litCount > 0 && (
        <button className="reset-btn" onClick={reset}>
          모두 끄기 ({litCount})
        </button>
      )}

      {/* 하단 입력 패널 */}
      <InputPanel
        hasKey={!!apiKey}
        loading={loading}
        status={status}
        onAnalyze={analyze}
        onOpenSettings={() => setModalOpen(true)}
      />

      {/* API 키 입력 화면 */}
      {modalOpen && (
        <ApiKeyModal
          initialKey={apiKey}
          initialModel={model}
          onSave={saveKey}
          onClose={() => setModalOpen(false)}
          canClose
        />
      )}
    </div>
  )
}
