import { useState, useEffect, useCallback } from 'react'
import './ApiKeyModal.css'
import { listModels } from '../lib/gemini.js'
import { tierHint, pickDefaultModel, curateModels } from '../lib/models.js'

/*
 * API 키 입력 화면 (design.md §8).
 * 키를 넣고 '모델 불러오기'를 누르면, 그 키로 실제 사용 가능한 모델만 드롭다운에 채운다
 * (하드코딩된 모델 id 추측을 없앰). 키는 브라우저 localStorage에만 저장(부모가 처리).
 */
export default function ApiKeyModal({ initialKey = '', initialModel = '', onSave, onClose, canClose = false }) {
  const [key, setKey] = useState(initialKey)
  const [model, setModel] = useState(initialModel)
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadModels = useCallback(
    async (k) => {
      const trimmed = (k ?? key).trim()
      if (!trimmed) return
      setLoading(true)
      setError(null)
      try {
        const list = curateModels(await listModels(trimmed))
        setModels(list)
        setModel((cur) => (list.some((m) => m.id === cur) ? cur : pickDefaultModel(list)))
        if (list.length === 0) setError('이 키로 사용할 수 있는 분석 모델이 없습니다.')
      } catch (e) {
        setModels([])
        setError(e?.message || '모델 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [key],
  )

  // 저장된 키가 있으면 열릴 때 자동으로 목록 로드
  useEffect(() => {
    if (initialKey) loadModels(initialKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = models.find((m) => m.id === model)
  const canSave = key.trim() && model && models.length > 0
  const save = () => {
    if (!canSave) return
    onSave?.(key.trim(), model)
  }

  return (
    <div className="keymodal__backdrop">
      <div className="keymodal" role="dialog" aria-modal="true" aria-label="API 키 입력">
        <p className="keymodal__arcana">✦ INSERT THE KEY ✦</p>
        <h2 className="keymodal__title">열쇠를 꽂아야 카드를 읽을 수 있습니다</h2>
        <p className="keymodal__sub">
          커리어 해석에는 Google Gemini API 키가 필요합니다.
          <br />
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            Google AI Studio에서 무료로 발급받기 →
          </a>
        </p>

        <label className="keymodal__field">
          <span className="keymodal__label">API 키</span>
          <div className="keymodal__inputrow">
            <input
              className="keymodal__input"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadModels()}
              placeholder="AIza… 로 시작하는 키를 붙여넣으세요"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              className="keymodal__load"
              onClick={() => loadModels()}
              disabled={!key.trim() || loading}
            >
              {loading ? '불러오는 중…' : '모델 불러오기'}
            </button>
          </div>
        </label>

        {models.length > 0 && (
          <label className="keymodal__field">
            <span className="keymodal__label">분석 모델 · 가성비·최신 순</span>
            <select
              className="keymodal__select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName ? `${m.displayName} (${m.id})` : m.id}
                </option>
              ))}
            </select>
            <p className="keymodal__hint">
              {tierHint(model)}
              {selected?.description ? (
                <>
                  <br />
                  {selected.description}
                </>
              ) : null}
            </p>
          </label>
        )}

        {error && <p className="keymodal__error">{error}</p>}

        <div className="keymodal__actions">
          <button className="keymodal__save" onClick={save} disabled={!canSave}>
            열쇠 꽂기
          </button>
          {canClose && (
            <button className="keymodal__skip" onClick={onClose}>
              지도 먼저 둘러보기
            </button>
          )}
        </div>

        <p className="keymodal__privacy">
          키는 오직 이 브라우저(localStorage)에만 저장되며, 어떤 서버로도 전송·수집되지 않습니다.
          <br />
          입력한 경력 텍스트도 서버에 저장되지 않고, Gemini 호출에만 쓰인 뒤 폐기됩니다.
        </p>
      </div>
    </div>
  )
}
