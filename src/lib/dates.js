/*
 * 날짜 유틸 — 저장되는 날짜는 항상 로컬 기준 'YYYY-MM-DD' 문자열이다.
 * (toISOString() 은 UTC 로 밀려 한국 시간 새벽에 하루가 어긋나므로 쓰지 않는다.)
 */

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** Date 객체 -> 'YYYY-MM-DD' (로컬 기준) */
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** 오늘의 'YYYY-MM-DD' */
export function todayKey() {
  return toDateKey(new Date())
}

/** n일 전의 'YYYY-MM-DD' */
export function dateKeyDaysAgo(n) {
  const d = new Date()
  d.setHours(12, 0, 0, 0) // 서머타임/자정 경계로 하루가 밀리지 않게 정오 기준으로 계산
  d.setDate(d.getDate() - n)
  return toDateKey(d)
}

/** 'YYYY-MM-DD' -> '8월 24일 (월)' */
export function formatKoreanDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${m}월 ${d}일 (${weekday})`
}

/**
 * 연속 사용일(스트릭).
 * 오늘 아직 훈련하지 않았어도 어제까지 이어졌다면 스트릭은 살아 있는 것으로 센다.
 * (오늘 아침에 열었을 때 "0일"이 되어 의욕이 꺾이지 않도록 — SPEC 3장 격려 원칙)
 */
export function calcStreak(sessions) {
  const days = new Set((sessions || []).map((s) => s.date))
  if (days.size === 0) return 0

  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  // 오늘 기록이 없으면 어제부터 세기 시작한다.
  if (!days.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(toDateKey(cursor))) return 0
  }

  let streak = 0
  while (days.has(toDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/*
 * 주 단위 헬퍼 — 가족 리포트(마일스톤 6)의 "이번 주" 기준.
 * 주의 시작은 월요일로 둔다. 'YYYY-MM-DD' 문자열은 사전순 비교가 곧 시간순 비교이므로
 * 주 범위를 고를 때 별도의 파싱 없이 문자열 비교(>=)만으로 걸러 낼 수 있다.
 */

/** 그 날짜가 속한 주의 월요일 'YYYY-MM-DD' */
export function weekStartKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  const weekdayFromMonday = (date.getDay() + 6) % 7 // 월=0 … 일=6
  date.setDate(date.getDate() - weekdayFromMonday)
  return toDateKey(date)
}

/** 이번 주 월요일 'YYYY-MM-DD' */
export function thisWeekStartKey() {
  return weekStartKey(todayKey())
}

/** n주 전 주의 월요일 'YYYY-MM-DD' (0 이면 이번 주) */
export function weekStartKeyWeeksAgo(n) {
  return weekStartKey(dateKeyDaysAgo(n * 7))
}

/** 'YYYY-MM-DD' -> '8/17' (차트 축처럼 좁은 자리에 쓰는 짧은 표기) */
export function formatShortDate(dateKey) {
  const [, m, d] = dateKey.split('-').map(Number)
  return `${m}/${d}`
}
