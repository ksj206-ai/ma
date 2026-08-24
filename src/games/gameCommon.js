/*
 * 게임들이 함께 쓰는 로직.
 * 장보기(마일스톤 3)와 요리(마일스톤 4)가 같은 코드를 두 벌로 갖지 않도록 여기로 모은다.
 */

export const MIN_LEVEL = 1
export const MAX_LEVEL = 5

/**
 * 저장된 레벨 값이 없거나 이상해도 항상 유효한 설정을 돌려준다.
 * 게임마다 난이도 표(table)만 다르고 걸러내는 방식은 같다.
 */
export function resolveLevelConfig(level, table) {
  const clamped = Math.min(
    MAX_LEVEL,
    Math.max(MIN_LEVEL, Math.round(Number(level) || MIN_LEVEL))
  )
  return { level: clamped, ...table[clamped] }
}

/** Fisher-Yates. rng 를 주입받아 테스트에서 결과를 고정할 수 있게 한다. */
export function shuffle(items, rng = Math.random) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** 시작 시각(ms)부터 지금까지 걸린 초. 0초로 저장되지 않도록 최소 1초. */
export function elapsedSec(startedAt) {
  return Math.max(1, Math.round((Date.now() - startedAt) / 1000))
}

/**
 * 세션 레코드를 만든다 (SPEC 9장).
 *
 * 한 게임이 인지 영역을 둘 다루면 Session.domain 이 문자열 하나이므로
 * 영역별로 레코드를 나눠 저장한다. 어떤 영역을 만들지는 게임이 parts 로 정한다.
 * 해당 단계를 하지 않은 난이도에서는 그 part 를 넘기지 않으면 되고,
 * 그러면 레코드가 생기지 않아 차트에 축도 생기지 않는다 (SPEC 7장).
 *
 *   parts: [{ key, domain, accuracy, durationSec }]
 */
export function buildSessions({ gameId, level, dateKey, now, parts }) {
  return parts.map((part, index) => ({
    id: `session-${now}-${part.key || index}`,
    date: dateKey,
    gameId,
    courseId: null,
    domain: part.domain,
    level,
    score: Math.round(part.accuracy * 100),
    accuracy: Number(part.accuracy.toFixed(2)),
    durationSec: part.durationSec,
  }))
}
