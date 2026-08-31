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
 * 하단 입력 패널 — 모바일 우선으로 단순화.
 * 텍스트 입력 + 단일 주요 버튼(키 없으면 'API 키 등록' → 설정). 설정·해석·초기화는 상단 메뉴로 이동.
 */
export default function InputPanel({ hasKey, loading, status, onAnalyze, onOpenSettings }) {
  const [text, setText] = useState('')
  const [msgIndex, setMsgIndex] = useState(0)
  const canAnalyze = hasKey && text.trim().length > 0 && !loading

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
      <div className="input-panel__field">
        <textarea
          className="input-panel__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="이력서를 붙여넣거나 경력을 자유롭게 적어주세요.&#10;예) 저는 8년간 건설사에서 브랜드 전략을 맡아…"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') analyze()
          }}
        />
        {text.trim() && !loading && (
          <button className="input-panel__clear" onClick={() => setText('')} aria-label="지우기">
            ✕
          </button>
        )}
      </div>

      <div className="input-panel__row">
        <span
          className={`input-panel__status${status ? ` input-panel__status--${status.kind}` : ''}`}
        >
          {loading ? (
            <span className="input-panel__loading">{LOADING_MESSAGES[msgIndex]}</span>
          ) : status ? (
            status.text
          ) : hasKey ? (
            '이력서를 붙여넣고 별빛을 깃들이세요.'
          ) : (
            'Google Gemini 무료 키가 필요합니다.'
          )}
        </span>

        {hasKey ? (
          <button className="input-panel__btn input-panel__btn--primary" onClick={analyze} disabled={!canAnalyze}>
            별빛 깃들이기
          </button>
        ) : (
          <button className="input-panel__btn input-panel__btn--primary" onClick={onOpenSettings}>
            API 키 등록
          </button>
        )}
      </div>
    </div>
  )
}
