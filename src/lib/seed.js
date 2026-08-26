import { dateKeyDaysAgo } from './dates.js'

/*
 * 데모용 더미 시드 (SPEC 9장).
 * 최초 실행 시 지난 2주치 세션을 채워 두어 홈의 스트릭과 가족 리포트(마일스톤 6)가
 * 처음부터 의미 있게 보이도록 한다.
 *
 * 규칙
 *  - gameId 는 마일스톤 2 시점에 존재가 예정된 'shopping' 과 'cooking' 만 사용한다.
 *  - domain 은 SPEC 7장 영역명을 정확히 쓴다(작업기억·계산·순서화·실행기능).
 *  - 매일 채우지 않는다. 3·11일 전은 비워서 스트릭이 자연스럽게 끊겼다 이어지게 한다.
 *  - 난수를 쓰지 않는다. 새로고침마다 데모 수치가 흔들리면 안 되기 때문이다.
 *
 * 마일스톤 5 보완: '실행기능'은 요리의 재료 계량 문항(레벨 4 이상)에서만 나오는데,
 * 원래 시드에는 1건뿐이라 기능 프로파일이 3세션 미만으로 "기록이 적어요" 상태에 머물러
 * 차트가 4축으로 그려지지 않았다. 계량 문항이 있는 레벨(4)의 요리 세션을 더 채워
 * '순서화'·'실행기능' 모두 3세션 이상이 되도록 했다(6일 전, 5일 전, 2일 전).
 */

// daysAgo: 며칠 전 / courseId 는 낱개 플레이이므로 전부 null (SPEC 9장)
const SESSION_PLAN = [
  { daysAgo: 13, gameId: 'shopping', domain: '작업기억', level: 1, score: 60, accuracy: 0.67, durationSec: 190 },
  { daysAgo: 12, gameId: 'cooking', domain: '순서화', level: 1, score: 65, accuracy: 0.71, durationSec: 205 },
  // 11일 전 — 쉬는 날
  { daysAgo: 10, gameId: 'shopping', domain: '작업기억', level: 1, score: 72, accuracy: 0.75, durationSec: 176 },
  { daysAgo: 9, gameId: 'cooking', domain: '작업기억', level: 1, score: 70, accuracy: 0.73, durationSec: 188 },
  { daysAgo: 8, gameId: 'shopping', domain: '계산', level: 1, score: 68, accuracy: 0.70, durationSec: 212 },
  { daysAgo: 7, gameId: 'cooking', domain: '순서화', level: 2, score: 78, accuracy: 0.80, durationSec: 181 },
  { daysAgo: 6, gameId: 'cooking', domain: '순서화', level: 4, score: 82, accuracy: 0.85, durationSec: 145 },
  { daysAgo: 6, gameId: 'cooking', domain: '실행기능', level: 4, score: 82, accuracy: 0.85, durationSec: 92 },
  { daysAgo: 5, gameId: 'shopping', domain: '작업기억', level: 2, score: 80, accuracy: 0.83, durationSec: 168 },
  { daysAgo: 5, gameId: 'cooking', domain: '실행기능', level: 4, score: 75, accuracy: 0.78, durationSec: 96 },
  { daysAgo: 4, gameId: 'shopping', domain: '계산', level: 2, score: 82, accuracy: 0.85, durationSec: 174 },
  // 3일 전 — 쉬는 날
  { daysAgo: 2, gameId: 'shopping', domain: '계산', level: 2, score: 85, accuracy: 0.88, durationSec: 162 },
  { daysAgo: 2, gameId: 'cooking', domain: '실행기능', level: 4, score: 90, accuracy: 0.92, durationSec: 78 },
  { daysAgo: 1, gameId: 'cooking', domain: '순서화', level: 2, score: 88, accuracy: 0.90, durationSec: 158 },
  { daysAgo: 0, gameId: 'shopping', domain: '작업기억', level: 2, score: 86, accuracy: 0.89, durationSec: 165 },
]

/*
 * 실행 브리지 미션 (SPEC 9장 RealWorldMission) — 일부는 이미 해낸 상태로 둔다.
 *
 * 마일스톤 6 보완: 해낸 미션 하나를 daysAgo 0(오늘)에 둔다.
 * 가족 리포트는 "이번 주"(월요일 시작)를 기준으로 보는데, daysAgo 를 며칠 전으로 잡으면
 * 앱을 여는 요일에 따라 그 미션이 지난주로 밀려 버린다. 예를 들어 수요일에 열면
 * daysAgo 3 은 이미 지난주다. 오늘 날짜에 하나를 두면 무슨 요일에 열어도
 * "이번 주에 해내신 미션"이 반드시 하나는 보인다.
 * (홈 화면에도 완료 표시가 된 미션과 아직 안 한 미션이 하나씩 보이게 되는 부수 효과가 있다)
 */
const MISSION_PLAN = [
  { daysAgo: 5, text: '장 보러 가서 살 것 세 가지를 적지 않고 외워서 사 오기', done: true },
  { daysAgo: 3, text: '동네 한 바퀴 걷고 오는 길에 본 가게 세 곳 떠올리기', done: true },
  { daysAgo: 1, text: '가족에게 전화해서 오늘 있었던 일 세 가지 이야기하기', done: false },
  { daysAgo: 0, text: '저녁에 미역국을 끓여 가족과 나눠 먹기', done: true },
  { daysAgo: 0, text: '냉장고를 열어 보기 전에, 안에 있는 재료 세 가지를 떠올려 보기', done: false },
]

/** 시드 세션 목록을 만든다 (localStorage 를 건드리지 않는 순수 함수) */
export function buildSeedSessions() {
  return SESSION_PLAN.map((plan, index) => ({
    id: `seed-session-${String(index + 1).padStart(2, '0')}`,
    date: dateKeyDaysAgo(plan.daysAgo),
    gameId: plan.gameId,
    courseId: null,
    domain: plan.domain,
    level: plan.level,
    score: plan.score,
    accuracy: plan.accuracy,
    durationSec: plan.durationSec,
  }))
}

/** 시드 실생활 미션 목록을 만든다 */
export function buildSeedMissions() {
  return MISSION_PLAN.map((plan, index) => ({
    id: `seed-mission-${index + 1}`,
    date: dateKeyDaysAgo(plan.daysAgo),
    text: plan.text,
    done: plan.done,
  }))
}

/**
 * 게임별 시작 난이도. 적응형 조정 로직은 lib/adaptive.js (마일스톤 5).
 * 위 세션에 레벨 4짜리 요리 판이 몇 번 섞여 있지만, 가장 최근 요리 판(1일 전)은
 * 레벨 2에서 치렀으므로 지금 저장된 레벨도 2로 둔다 — 다음 판은 이 레벨에서 이어진다.
 */
export function buildSeedLevels() {
  return { shopping: 2, cooking: 2 }
}
