/*
 * share.js — 결과(별자리 점등 + 해석)를 URL 해시에 압축 인코딩/디코딩.
 * 정적 사이트라 서버 없이, 링크 하나로 결과 화면을 재현한다(키 불필요).
 */
import LZString from 'lz-string'

const VERSION = 1

// { tiers, labels, seed, arcana:{roman,ko,en,tagline}, personal } → URL-safe 문자열
export function encodeResult({ tiers, labels, seed, arcana, personal }) {
  const payload = {
    v: VERSION,
    s: seed || 1,
    t: tiers || {},
    l: labels || {},
    a: arcana ? { r: arcana.roman, k: arcana.ko, e: arcana.en, g: arcana.tagline } : null,
    p: personal || '',
  }
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

export function decodeResult(str) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(str)
    if (!json) return null
    const p = JSON.parse(json)
    if (p.v !== VERSION) return null
    return {
      tiers: p.t || {},
      labels: p.l || {},
      seed: p.s || 1,
      arcana: p.a ? { roman: p.a.r, ko: p.a.k, en: p.a.e, tagline: p.a.g } : null,
      personal: p.p || '',
    }
  } catch {
    return null
  }
}
