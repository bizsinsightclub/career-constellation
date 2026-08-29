import { useState } from 'react'
import './ApiKeyModal.css'
import { MODELS, DEFAULT_MODEL } from '../lib/models.js'

/*
 * API 키 입력 화면 (design.md §8).
 * "열쇠를 꽂아야 카드를 읽을 수 있습니다" 톤 + 기능적 안내.
 * 키는 브라우저 localStorage에만 저장(부모가 처리). 미입력 시 '지도 먼저 둘러보기'로 닫을 수 있음.
 */
export default function ApiKeyModal({ initialKey = '', initialModel = DEFAULT_MODEL, onSave, onClose, canClose = false }) {
  const [key, setKey] = useState(initialKey)
  const [model, setModel] = useState(initialModel)
  const selected = MODELS.find((m) => m.id === model) || MODELS[0]

  const save = () => {
    const trimmed = key.trim()
    if (!trimmed) return
    onSave?.(trimmed, model)
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
          <input
            className="keymodal__input"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="AIza… 로 시작하는 키를 붙여넣으세요"
            autoComplete="off"
            spellCheck="false"
          />
        </label>

        <label className="keymodal__field">
          <span className="keymodal__label">분석 모델</span>
          <select
            className="keymodal__select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.free ? '무료 티어 가능' : '유료 전용'}
              </option>
            ))}
          </select>
          <p className="keymodal__hint">
            {selected.price}
            <br />
            {selected.note}
          </p>
        </label>

        <div className="keymodal__actions">
          <button className="keymodal__save" onClick={save} disabled={!key.trim()}>
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
