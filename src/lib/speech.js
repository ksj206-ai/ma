/*
 * SpeechSynthesis 얇은 래퍼.
 *
 * 원칙: 음성은 어디까지나 "있으면 좋은" 보조 수단이다.
 * 한국어 음성이 없거나 브라우저가 지원하지 않으면 조용히 아무것도 하지 않는다.
 * 어떤 경우에도 예외를 던지지 않는다 — 소리 때문에 화면이 멈추면 안 된다.
 */

function getSynth() {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null
  } catch {
    return null
  }
}

function getKoreanVoice() {
  const synth = getSynth()
  if (!synth) return null

  let voices = []
  try {
    voices = synth.getVoices() || []
  } catch {
    return null
  }

  return voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith('ko')) || null
}

/** 이 기기에서 한국어 음성 안내가 가능한지 */
export function isKoreanVoiceAvailable() {
  return getKoreanVoice() !== null
}

/**
 * 음성 목록은 브라우저가 비동기로 채운다(크롬은 첫 호출 때 빈 배열을 준다).
 * 목록이 준비되면 알려주도록 구독한다. 정리 함수를 돌려준다.
 */
export function subscribeToVoices(listener) {
  const synth = getSynth()
  if (!synth || typeof synth.addEventListener !== 'function') return () => {}

  const handler = () => listener()
  try {
    synth.addEventListener('voiceschanged', handler)
  } catch {
    return () => {}
  }

  return () => {
    try {
      synth.removeEventListener('voiceschanged', handler)
    } catch {
      // 정리 실패는 무시한다.
    }
  }
}

/**
 * 문장을 읽어 준다.
 * 한국어 음성이 없으면 아무 일도 일어나지 않는다(에러 없음).
 * 성공적으로 말하기 시작했으면 true.
 */
export function speak(text) {
  const synth = getSynth()
  const voice = getKoreanVoice()
  if (!synth || !voice || !text) return false

  try {
    synth.cancel() // 앞의 말이 남아 겹쳐 들리지 않게 한다.
    const utterance = new SpeechSynthesisUtterance(String(text))
    utterance.voice = voice
    utterance.lang = voice.lang || 'ko-KR'
    utterance.rate = 0.9 // 고령자 대상: 조금 느리게
    utterance.pitch = 1
    synth.speak(utterance)
    return true
  } catch {
    return false
  }
}

/** 읽고 있던 것을 멈춘다. */
export function cancelSpeech() {
  const synth = getSynth()
  if (!synth) return
  try {
    synth.cancel()
  } catch {
    // 무시
  }
}
