import { useState, useEffect } from 'react'
import './InputPanel.css'

// 분석 중 회전하는 감성 문구
const LOADING_MESSAGES = [
  '당신만의 별자리를 하늘에 새기고 있습니다…',
  '생명나무에 빛이 스미는 중입니다…',
  '별들이 제자리를 찾는 중입니다…',
  '경력의 별빛을 하나씩 읽어내는 중입니다…',
]

/*
 * 하단 입력 패널 (design.md §8).
 * 이력서/자유 서술 입력 → "별빛 깃들이기"로 분석. 키 미입력 시 분석 버튼 비활성.
 * 상태(로딩·오류·결과)를 한 줄로 안내한다.
 */
export default function InputPanel({
  hasKey,
  loading,
  status, // { kind: 'info'|'error'|'done', text } | null
  onAnalyze,
  onOpenSettings,
}) {
  const [text, setText] = useState('')
  const [msgIndex, setMsgIndex] = useState(0)
  const canAnalyze = hasKey && text.trim().length > 0 && !loading

  // 분석 중에는 문구를 2.6초마다 회전
  useEffect(() => {
    if (!loading) {
      setMsgIndex(0)
      return
    }
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length), 2600)
    return () => clearInterval(t)
  }, [loading])

  const analyze = () => {
    if (!canAnalyze) return
    onAnalyze?.(text.trim())
  }

  return (
    <div className="input-panel">
      <textarea
        className="input-panel__textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="그대의 여정을 들려주십시오 — 이력서를 붙여넣거나, 자유롭게 서술하세요. (예: 저는 8년간 건설사에서 브랜드 전략을 맡아…)"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') analyze()
        }}
      />

      <div className="input-panel__row">
        <span
          className={`input-panel__status${status ? ` input-panel__status--${status.kind}` : ''}`}
        >
          {loading ? (
            <span className="input-panel__loading">{LOADING_MESSAGES[msgIndex]}</span>
          ) : status ? (
            status.text
          ) : hasKey ? (
            'Ctrl+Enter 로도 분석할 수 있습니다.'
          ) : (
            '분석하려면 먼저 API 키를 등록하세요.'
          )}
        </span>

        <button className="input-panel__btn input-panel__btn--ghost" onClick={onOpenSettings}>
          {hasKey ? '키·모델 설정' : 'API 키 등록'}
        </button>
        {text.trim() && !loading && (
          <button
            className="input-panel__btn input-panel__btn--ghost"
            onClick={() => setText('')}
          >
            지우기
          </button>
        )}
        <button
          className="input-panel__btn input-panel__btn--primary"
          onClick={analyze}
          disabled={!canAnalyze}
        >
          별빛 깃들이기
        </button>
      </div>
    </div>
  )
}
