/*
 * 기능 프로파일 점수 (SPEC 7장) — 마일스톤 5.
 *
 * 영역별로 0~100점을 매겨 홈·가족 화면의 차트 축 하나를 이룬다.
 * 이 파일은 순수 계산만 한다 (localStorage 접근 없음, storage.js 만 저장소를 만진다).
 *
 * SPEC 7장의 영역 순서를 그대로 축 순서로 쓴다. 목록에 없는 영역(오타 등)은 뒤에 붙인다.
 */
export const DOMAIN_ORDER = ['작업기억', '계산', '전망기억', '공간기억', '순서화', '실행기능']

/**
 * 1세션으로 100점이 뜨는 것을 막는 최소 표본 크기.
 * 이보다 적으면 점수 대신 "아직 기록이 적어요" 상태로만 표시한다.
 */
export const MIN_SESSIONS_FOR_SCORE = 3

/** 한 축을 계산할 때 보는 최근 세션 개수. 그 이전 세션은 흐름에 영향을 주지 않는다. */
const RECENCY_WINDOW = 10

/**
 * 최근 세션에 더 큰 가중을 준다. 달력상 며칠이 지났는지가 아니라
 * "몇 번째로 최근인가"라는 순번만 본다 — 그래야 훈련을 며칠 쉬었다가 돌아와도
 * 점수가 저절로 깎이지 않는다(SPEC 4장: 쉬었다는 이유로 점수를 내리지 않는다).
 */
const RECENCY_DECAY = 0.85

/**
 * 정확도만으로는 레벨 1의 100%가 레벨 5의 80%보다 높게 나오는 왜곡이 생긴다.
 * 레벨마다 도달 가능한 "천장"을 다르게 두어(레벨1 최대 60점 ~ 레벨5 최대 100점),
 * 같은 정확도라도 더 어려운 레벨에서 거둔 성과가 더 높은 점수로 이어지게 한다.
 */
const LEVEL_FLOOR_SCORE = 60
const LEVEL_SCORE_STEP = 10

function levelCeiling(level) {
  const clamped = Math.min(5, Math.max(1, Math.round(Number(level) || 1)))
  return LEVEL_FLOOR_SCORE + (clamped - 1) * LEVEL_SCORE_STEP
}

function sessionValue(session) {
  const accuracy = Math.min(1, Math.max(0, Number(session.accuracy) || 0))
  return accuracy * levelCeiling(session.level)
}

/** 가중 평균 점수 하나. 표본이 없으면 null. */
function weightedScore(domainSessions) {
  const recent = domainSessions.slice(-RECENCY_WINDOW)
  if (recent.length === 0) return null

  let weightedSum = 0
  let weightTotal = 0
  const lastIndex = recent.length - 1

  recent.forEach((session, index) => {
    const rankFromNewest = lastIndex - index
    const weight = RECENCY_DECAY ** rankFromNewest
    weightedSum += weight * sessionValue(session)
    weightTotal += weight
  })

  return Math.round(weightedSum / weightTotal)
}

function domainSortIndex(domain) {
  const index = DOMAIN_ORDER.indexOf(domain)
  return index === -1 ? DOMAIN_ORDER.length : index
}

/**
 * 실제 세션이 있는 영역만 골라 프로파일을 만든다.
 * 게임이 늘어날수록 여기 목록도 자동으로 늘어난다 — 영역 목록을 코드에 고정하지 않는다.
 *
 *   반환: [{ domain, status: 'ready' | 'few', count, score }]
 *     status 'ready' -> score 는 0~100 숫자
 *     status 'few'   -> score 는 null, count 로 "몇 회 남았는지" 안내에 쓴다
 */
export function computeDomainProfiles(sessions) {
  const list = Array.isArray(sessions) ? sessions : []
  const domains = [...new Set(list.map((session) => session.domain).filter(Boolean))]

  return domains
    .map((domain) => {
      const domainSessions = list.filter((session) => session.domain === domain)
      const count = domainSessions.length
      if (count < MIN_SESSIONS_FOR_SCORE) {
        return { domain, status: 'few', count, score: null }
      }
      return { domain, status: 'ready', count, score: weightedScore(domainSessions) }
    })
    .sort((a, b) => domainSortIndex(a.domain) - domainSortIndex(b.domain))
}
