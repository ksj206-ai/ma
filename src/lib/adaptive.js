import { GAMES } from './games.js'

/*
 * 적응형 난이도 조정 (SPEC 7장) — 마일스톤 5.
 *
 * 비대칭 규칙: 올리는 건 신중하게(연속 3세션 정확도 85% 이상), 내리는 건 상대적으로
 * 빠르게(연속 2세션 정확도 50% 미만) 잡는다. 어르신에게 과제가 너무 어려우면 좌절과
 * 이탈로 이어지고, 너무 쉬우면 지루해진다. 그 사이에서는 실패 경험이 쌓이는 쪽의
 * 피해가 더 크므로, 내려가는 문턱을 올라가는 문턱보다 낮게 둔다.
 *
 * 레벨은 게임 단위로 저장된다(storage.js `levels{}`). 한 판에 영역이 둘(예: 장보기의
 * 작업기억+계산)이어도 판의 난이도는 하나이므로, 그 게임의 "대표 영역"
 * (games.js 의 domains[0] — 그 게임이 항상 만들어 내는 핵심 영역) 세션만 보고 조정한다.
 * 계산·실행기능처럼 상위 레벨에서만 등장하는 보조 영역은 프로파일 점수에는 들어가되
 * 난이도 조정에는 관여하지 않는다.
 *
 * 조용히 조정한다(SPEC 4·7장) — 이 파일은 다음 레벨 숫자만 계산할 뿐,
 * 화면에 알리는 문구는 다루지 않는다. 호출부(store)도 사용자에게 레벨 자체를
 * 노출하지 않는다.
 */

export const MIN_LEVEL = 1
export const MAX_LEVEL = 5

const LEVEL_UP_STREAK = 3
const LEVEL_UP_ACCURACY = 0.85
const LEVEL_DOWN_STREAK = 2
const LEVEL_DOWN_ACCURACY = 0.5

function clampLevel(level) {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level))
}

function normalizeLevel(level) {
  return clampLevel(Math.round(Number(level) || MIN_LEVEL))
}

/** 그 게임이 항상 만들어 내는 대표 영역. games.js 의 domains 첫 번째 값을 그대로 쓴다. */
export function primaryDomainFor(gameId) {
  const domains = GAMES[gameId]?.domains
  return Array.isArray(domains) && domains.length > 0 ? domains[0] : null
}

/**
 * "지금 레벨에서 치른" 세션만 순서대로 골라낸다.
 * 세션 배열은 시간순으로 쌓이므로(useAppStore.addSessions), 이 필터링 자체가
 * "레벨이 바뀌면 그 뒤 세션부터 새로 센다"를 구현한다 — 레벨이 바뀌는 순간부터는
 * 새 세션의 level 값도 바뀌어 이전 레벨의 목록에서 자동으로 빠지기 때문이다.
 * 그래서 스트릭을 위한 카운터를 따로 저장할 필요가 없다.
 */
function sessionsAtLevel(sessions, gameId, domain, level) {
  return (sessions || []).filter(
    (session) => session.gameId === gameId && session.domain === domain && session.level === level
  )
}

function trailingWindow(list, size) {
  return list.length >= size ? list.slice(-size) : null
}

/**
 * 다음 레벨을 계산하는 순수 함수. 저장은 호출부(useAppStore)가 한다.
 *   sessions: 전체 세션 배열 (시간순)
 *   gameId, domain: 볼 게임과 그 대표 영역
 *   currentLevel: 이번 판을 치른 레벨
 */
export function computeNextLevel({ sessions, gameId, domain, currentLevel }) {
  const level = normalizeLevel(currentLevel)
  if (!gameId || !domain) return level

  const atLevel = sessionsAtLevel(sessions, gameId, domain, level)

  const upWindow = trailingWindow(atLevel, LEVEL_UP_STREAK)
  if (upWindow && upWindow.every((session) => session.accuracy >= LEVEL_UP_ACCURACY)) {
    return clampLevel(level + 1)
  }

  const downWindow = trailingWindow(atLevel, LEVEL_DOWN_STREAK)
  if (downWindow && downWindow.every((session) => session.accuracy < LEVEL_DOWN_ACCURACY)) {
    return clampLevel(level - 1)
  }

  return level
}

/** gameId 로 대표 영역을 알아서 찾아 다음 레벨을 계산하는 편의 함수. */
export function nextLevelForGame({ sessions, gameId, currentLevel }) {
  const domain = primaryDomainFor(gameId)
  if (!domain) return normalizeLevel(currentLevel)
  return computeNextLevel({ sessions, gameId, domain, currentLevel })
}
