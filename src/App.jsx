import { useReducer, useCallback, useState, useEffect } from 'react'
import './App.css'
import StarfieldBackground from './components/StarfieldBackground.jsx'
import CardFrame from './components/CardFrame.jsx'
import ConstellationSky from './components/ConstellationSky.jsx'
import ApiKeyModal from './components/ApiKeyModal.jsx'
import InputPanel from './components/InputPanel.jsx'
import ReadingCard from './components/ReadingCard.jsx'
import NameReveal from './components/NameReveal.jsx'
import TopBar from './components/TopBar.jsx'
import { DEFAULT_MODEL } from './lib/models.js'
import { generateJSON } from './lib/gemini.js'
import { buildExtractPrompt, EXTRACT_SCHEMA } from './prompts/extract.js'
import { buildInterpretPrompt, interpretUserText, INTERPRET_SCHEMA } from './prompts/interpret.js'
import { scoreMatches } from './logic/scoring.js'
import { allSkills, aggregateToSpheres, SKILL_IDS } from './logic/mapping.js'
import { buildReading } from './logic/reading.js'
import { seedFromString } from './logic/skyLayout.js'
import { encodeResult, decodeResult } from './lib/share.js'

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
 */
function illuminationReducer(state, action) {
  switch (action.type) {
    case 'CYCLE': {
      const cur = state.tiers[action.id] || 0
      const next = (cur + 1) % 4
      const tiers = { ...state.tiers }
      const evidence = { ...state.evidence }
      const labels = { ...state.labels }
      if (next === 0) delete tiers[action.id]
      else tiers[action.id] = next
      delete evidence[action.id]
      delete labels[action.id]
      return { tiers, evidence, labels }
    }
    case 'SET_RESULT': {
      const tiers = {}
      const evidence = {}
      const labels = {}
      action.scored.forEach((s) => {
        if (!SKILL_IDS.has(s.id)) return
        tiers[s.id] = s.tier
        evidence[s.id] = s.evidence
        if (s.label) labels[s.id] = s.label
      })
      return { tiers, evidence, labels }
    }
    case 'SET_SHARED':
      return { tiers: action.tiers || {}, evidence: {}, labels: action.labels || {} }
    case 'RESET':
      return { tiers: {}, evidence: {}, labels: {} }
    default:
      return state
  }
}

// 공유 링크로 열 때: 저장된 tier/label로 해석(프리셋)을 재구성 (아르카나·개인화 문단은 저장값으로 덮어씀)
function readingFromTiers(tiers, labels) {
  const scored = Object.entries(tiers).map(([id, tier]) => ({
    id,
    tier,
    score: { 1: 2, 2: 5, 3: 9 }[tier] || tier,
    evidence: [],
    label: labels[id],
  }))
  return buildReading(aggregateToSpheres(scored).spheres)
}

export default function App() {
  const [state, dispatch] = useReducer(illuminationReducer, { tiers: {}, evidence: {}, labels: {} })
  const [apiKey, setApiKey] = useState(() => lsGet(LS_KEY))
  const [model, setModel] = useState(() => lsGet(LS_MODEL) || DEFAULT_MODEL)
  const isSharedLink = typeof location !== 'undefined' && /^#r=/.test(location.hash)
  const [modalOpen, setModalOpen] = useState(() => !lsGet(LS_KEY) && !isSharedLink)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [toast, setToast] = useState(null)
  const [runId, setRunId] = useState(0)
  const [layoutSeed, setLayoutSeed] = useState(1) // 사람마다 별자리 배치가 달라지도록
  const [reading, setReading] = useState(null)
  const [revealStage, setRevealStage] = useState('none') // 'none' | 'name' | 'card'

  const cycleSkill = useCallback((id) => dispatch({ type: 'CYCLE', id }), [])
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
    setStatus(null)
    setReading(null)
    setRevealStage('none')
  }, [])
  const litCount = Object.keys(state.tiers).length

  const saveKey = useCallback((k, m) => {
    setApiKey(k)
    setModel(m)
    lsSet(LS_KEY, k)
    lsSet(LS_MODEL, m)
    setModalOpen(false)
  }, [])

  // [DEV 전용] 구독제 claude로 테스트. 프로덕션 빌드에선 DCE로 제거됨.
  const devMode = import.meta.env.DEV && lsGet('cc.devllm') === '1'

  // LLM 호출 (dev=구독제 claude / prod=사용자 Gemini 키) 공통
  const runLLM = useCallback(
    async (systemInstruction, userText, schema) => {
      if (devMode) {
        const r = await fetch('/__llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ system: systemInstruction, user: userText }),
        })
        const d = await r.json()
        if (d.error) throw new Error(d.error)
        const c = String(d.text || '').replace(/```json/gi, '').replace(/```/g, '').trim()
        return JSON.parse(c.slice(c.indexOf('{'), c.lastIndexOf('}') + 1))
      }
      return generateJSON({ apiKey, model, systemInstruction, userText, responseSchema: schema })
    },
    [apiKey, model, devMode],
  )

  // 해석 개인화(LLM #2) — 프리셋 위에 문단 덧붙임. 실패해도 프리셋만으로 완결.
  const personalize = useCallback(
    async (presetReading) => {
      try {
        const json = await runLLM(buildInterpretPrompt(), interpretUserText(presetReading), INTERPRET_SCHEMA)
        const text = (json.reading || json.text || '').trim()
        // LLM이 창작한 아르카나가 있으면 프리셋 대신 사용(반복 방지)
        const arcana = json.arcanaKo
          ? {
              roman: json.arcanaRoman || presetReading.arcana.roman,
              ko: json.arcanaKo,
              en: json.arcanaEn || '',
              tagline: json.arcanaTagline || '',
            }
          : undefined
        setReading((r) =>
          r ? { ...r, personal: text, personalLoading: false, ...(arcana ? { arcana } : {}) } : r,
        )
      } catch {
        setReading((r) => (r ? { ...r, personalLoading: false } : r))
      }
    },
    [runLLM],
  )

  const analyze = useCallback(
    async (text) => {
      if (!apiKey && !devMode) {
        setModalOpen(true)
        return
      }
      setLoading(true)
      setStatus(null)
      setReading(null)
      setRevealStage('none')
      // 공유 링크로 들어왔더라도 새 분석을 시작하면 해시 정리(새로고침 시 옛 결과가 뜨지 않게)
      if (location.hash) history.replaceState(null, '', location.pathname + location.search)
      try {
        const json = await runLLM(buildExtractPrompt(allSkills()), text, EXTRACT_SCHEMA)
        const matches = Array.isArray(json) ? json : json.matches || json.nodes || json.results || []
        const scored = scoreMatches(matches).filter((s) => SKILL_IDS.has(s.id))
        const domainAgg = aggregateToSpheres(scored)
        if (scored.length === 0) {
          setStatus({ kind: 'info', text: '관련된 별을 찾지 못했습니다. 조금 더 구체적으로 들려주세요.' })
        } else {
          dispatch({ type: 'SET_RESULT', scored })
          setLayoutSeed(seedFromString(scored.map((s) => s.id).sort().join(',')) || 1)
          setRunId((n) => n + 1)
          // 프리셋 해석 즉시 조립 + LLM 개인화 비동기
          const preset = buildReading(domainAgg.spheres)
          setReading({ ...preset, personal: null, personalLoading: true })
          personalize(preset)
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
    [apiKey, model, devMode, runLLM, personalize],
  )

  // 각인 애니메이션이 끝나면 먼저 '별자리 이름'을 공개한다 (결과 보기 → 전체 카드)
  const onEngraveDone = useCallback(() => {
    setReading((r) => {
      if (r) setRevealStage('name')
      return r
    })
  }, [])

  // 공유 링크(#r=...)로 열렸을 때: 저장된 결과를 재현하고 각인 애니메이션 재생
  useEffect(() => {
    const m = (location.hash || '').match(/^#r=(.+)$/)
    if (!m) return
    const data = decodeResult(m[1])
    if (!data) return
    dispatch({ type: 'SET_SHARED', tiers: data.tiers, labels: data.labels })
    setLayoutSeed(data.seed || 1)
    const base = readingFromTiers(data.tiers, data.labels)
    setReading({
      ...base,
      personal: data.personal,
      personalLoading: false,
      ...(data.arcana ? { arcana: data.arcana } : {}),
    })
    setModalOpen(false)
    setRunId((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 결과 공유 링크 생성 + 클립보드 복사
  const shareResult = useCallback(async () => {
    if (!reading) return
    const enc = encodeResult({
      tiers: state.tiers,
      labels: state.labels,
      seed: layoutSeed,
      arcana: reading.arcana,
      personal: reading.personal,
    })
    const url = `${location.origin}${location.pathname}#r=${enc}`
    try {
      await navigator.clipboard.writeText(url)
      setToast('공유 링크가 복사되었습니다')
    } catch {
      location.hash = `r=${enc}` // 복사 실패 시 주소창에라도 반영
      setToast('주소창의 링크를 복사해 주세요')
    }
    setTimeout(() => setToast(null), 2800)
  }, [reading, state.tiers, state.labels, layoutSeed])

  return (
    <div className="app-root">
      <div className="bg-veil" aria-hidden="true" />
      <div className="bg-nebula" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <StarfieldBackground />

      <ConstellationSky
        skillTiers={state.tiers}
        skillLabels={state.labels}
        layoutSeed={layoutSeed}
        onSkillClick={cycleSkill}
        runId={runId}
        onEngraveDone={onEngraveDone}
      />

      <CardFrame />

      <TopBar
        hasReading={!!reading}
        litCount={litCount}
        onOpenSettings={() => setModalOpen(true)}
        onOpenReading={() => setRevealStage('card')}
        onReset={reset}
      />

      <InputPanel
        hasKey={!!apiKey || devMode}
        loading={loading}
        status={status}
        onAnalyze={analyze}
        onOpenSettings={() => setModalOpen(true)}
      />

      {revealStage === 'name' && reading && (
        <NameReveal
          arcana={reading.arcana}
          loading={reading.personalLoading}
          onSeeResult={() => setRevealStage('card')}
          onClose={() => setRevealStage('none')}
        />
      )}

      {revealStage === 'card' && reading && (
        <ReadingCard
          reading={reading}
          personal={reading.personal}
          personalLoading={reading.personalLoading}
          onClose={() => setRevealStage('none')}
          onPickNext={() => setRevealStage('none')}
          onShare={shareResult}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

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
