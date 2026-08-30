import { useReducer, useCallback, useState } from 'react'
import './App.css'
import StarfieldBackground from './components/StarfieldBackground.jsx'
import CardFrame from './components/CardFrame.jsx'
import ConstellationSky from './components/ConstellationSky.jsx'
import ApiKeyModal from './components/ApiKeyModal.jsx'
import InputPanel from './components/InputPanel.jsx'
import { DEFAULT_MODEL } from './lib/models.js'
import { generateJSON } from './lib/gemini.js'
import { buildExtractPrompt, EXTRACT_SCHEMA } from './prompts/extract.js'
import { scoreMatches } from './logic/scoring.js'
import { allSkills, aggregateToSpheres, SKILL_IDS } from './logic/mapping.js'

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
    /* 무시 */
  }
}

/*
 * 점등 상태 리듀서 — 스킬(세부별) 단위.
 *   tiers:    { [skillId]: 1|2|3 }
 *   evidence: { [skillId]: string[] }
 */
function illuminationReducer(state, action) {
  switch (action.type) {
    case 'CYCLE': {
      const cur = state.tiers[action.id] || 0
      const next = (cur + 1) % 4 // 수동/개발용
      const tiers = { ...state.tiers }
      const evidence = { ...state.evidence }
      if (next === 0) delete tiers[action.id]
      else tiers[action.id] = next
      delete evidence[action.id]
      return { tiers, evidence }
    }
    case 'SET_RESULT': {
      const tiers = {}
      const evidence = {}
      action.scored.forEach((s) => {
        if (!SKILL_IDS.has(s.id)) return
        tiers[s.id] = s.tier
        evidence[s.id] = s.evidence
      })
      return { tiers, evidence }
    }
    case 'RESET':
      return { tiers: {}, evidence: {} }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(illuminationReducer, { tiers: {}, evidence: {} })
  const [apiKey, setApiKey] = useState(() => lsGet(LS_KEY))
  const [model, setModel] = useState(() => lsGet(LS_MODEL) || DEFAULT_MODEL)
  const [modalOpen, setModalOpen] = useState(() => !lsGet(LS_KEY))
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [runId, setRunId] = useState(0) // 분석 성공 시마다 증가 → 각인 애니메이션 트리거

  const cycleSkill = useCallback((id) => dispatch({ type: 'CYCLE', id }), [])
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

  // [DEV 전용] 구독제 claude로 테스트 (localStorage cc.devllm='1'). 프로덕션 빌드에선 DCE로 제거됨.
  const devMode = import.meta.env.DEV && lsGet('cc.devllm') === '1'

  const analyze = useCallback(
    async (text) => {
      if (!apiKey && !devMode) {
        setModalOpen(true)
        return
      }
      setLoading(true)
      setStatus(null)
      try {
        const systemInstruction = buildExtractPrompt(allSkills())
        let json
        if (devMode) {
          const r = await fetch('/__llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system: systemInstruction, user: text }),
          })
          const d = await r.json()
          if (d.error) throw new Error(d.error)
          const c = String(d.text || '').replace(/```json/gi, '').replace(/```/g, '').trim()
          json = JSON.parse(c.slice(c.indexOf('{'), c.lastIndexOf('}') + 1))
        } else {
          json = await generateJSON({
            apiKey,
            model,
            systemInstruction,
            userText: text,
            responseSchema: EXTRACT_SCHEMA,
          })
        }
        const matches = Array.isArray(json) ? json : json.matches || json.nodes || json.results || []
        const scored = scoreMatches(matches).filter((s) => SKILL_IDS.has(s.id))
        const domainAgg = aggregateToSpheres(scored)
        if (scored.length === 0) {
          setStatus({ kind: 'info', text: '관련된 별을 찾지 못했습니다. 조금 더 구체적으로 들려주세요.' })
        } else {
          dispatch({ type: 'SET_RESULT', scored })
          setRunId((n) => n + 1) // 각인 애니메이션 시작
          setStatus({
            kind: 'done',
            text: `${scored.length}개의 별이 깃들어 ${domainAgg.spheres.length}개 영역이 빛납니다.`,
          })
        }
      } catch (e) {
        setStatus({ kind: 'error', text: e?.message || '알 수 없는 오류가 발생했습니다.' })
      } finally {
        setLoading(false)
      }
    },
    [apiKey, model, devMode],
  )

  return (
    <div className="app-root">
      <div className="bg-veil" aria-hidden="true" />
      <div className="bg-nebula" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <StarfieldBackground />

      <ConstellationSky skillTiers={state.tiers} onSkillClick={cycleSkill} runId={runId} />

      <CardFrame />

      <header className="stage-title">
        <p className="stage-title__arcana">✦ THE CONSTELLATION OF CAREER ✦</p>
        <h1 className="stage-title__name">커리어 별자리</h1>
      </header>

      {litCount > 0 && (
        <button className="reset-btn" onClick={reset}>
          모두 끄기 ({litCount})
        </button>
      )}

      <InputPanel
        hasKey={!!apiKey || devMode}
        loading={loading}
        status={status}
        onAnalyze={analyze}
        onOpenSettings={() => setModalOpen(true)}
      />

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
