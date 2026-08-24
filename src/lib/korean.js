/*
 * 한국어 조사 처리.
 * "미역국을(를)" 처럼 괄호를 그대로 노출하면 어르신이 읽기에 어색하므로
 * 받침을 보고 알맞은 조사를 고른다.
 */

function hasFinalConsonant(word) {
  const last = String(word).charCodeAt(String(word).length - 1)
  if (Number.isNaN(last) || last < 0xac00 || last > 0xd7a3) return null // 한글이 아님
  return (last - 0xac00) % 28 !== 0
}

/** 을 / 를 */
export function objectParticle(word) {
  const jong = hasFinalConsonant(word)
  if (jong === null) return '를'
  return jong ? '을' : '를'
}

/** 은 / 는 */
export function topicParticle(word) {
  const jong = hasFinalConsonant(word)
  if (jong === null) return '는'
  return jong ? '은' : '는'
}
