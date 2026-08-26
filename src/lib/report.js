import {
  calcStreak,
  formatKoreanDate,
  formatShortDate,
  thisWeekStartKey,
  weekStartKeyWeeksAgo,
} from './dates.js'
import { getGame } from './games.js'
import { objectParticle } from './korean.js'
import { DOMAIN_ORDER } from './profile.js'

/*
 * 가족 리포트 자료 만들기 (SPEC 8장) — 마일스톤 6.
 *
 * 이 파일은 새 점수·통계를 만들지 않는다. 하는 일은 세 가지뿐이다.
 *   1) 이번 주 / 최근 몇 주라는 기간으로 기록을 걸러 낸다 (필터)
 *   2) 걸러 낸 것의 개수를 센다 (날짜 수 · 기록 수 · 영역별 횟수 · 누적 횟수)
 *   3) 이미 저장돼 있는 값(score, done, gameId)을 그대로 읽어 문장으로 옮긴다
 *
 * 연속 사용일은 lib/dates.js 의 calcStreak 가 계산한다(마일스톤 5). 다시 만들지 않는다.
 *
 * [마일스톤 7 — 가족 화면에서 점수를 걷어냈다]
 * 마일스톤 6까지는 이 화면도 영역별 0~100 점수(profile.js)를 그대로 보여 줬다.
 * 보호자는 그 숫자를 "몇 점짜리 상태인가"로 읽기 쉽고, 그건 우리가 하지 않기로 한
 * 판정이다(SPEC 4·8장). 그래서 가족 화면은 점수 대신 **활동량**만 본다.
 *   - 영역별: 이번 주에 그 영역을 몇 번 하셨는지 (buildActivityMix)
 *   - 흐름:   지금까지 모두 몇 번 하셨는지 누적 (buildCumulative)
 * profile.js 의 점수 함수는 지우지 않았다. 홈 화면(본인이 보는 자리)에서는 그대로 쓴다.
 *
 * [카피 원칙 — SPEC 4장]
 * 이 리포트는 "이번 주에 무엇을 하셨는가"의 활동 요약이며 진단이 아니다.
 * 판정·비교 표현(위험/이상/저하/또래 대비 …), 등급·신호등·백분위, 지시형 경고 문구를
 * 만들지 않는다. 못 한 것을 세지 않고, 해낸 것만 센다.
 */

/** 누적 그래프에 보여 줄 주의 개수 (이번 주 포함) */
const TREND_WEEKS = 4

/** 이 수보다 적은 주가 모이면 그래프 대신 누적 숫자만 보여 준다 — 점 하나는 흐름이 아니다. */
const MIN_WEEKS_FOR_TREND = 2

/** 하이라이트 카드는 많아야 두 장. 세 장을 넘기면 요약이 아니라 목록이 된다. */
const MAX_HIGHLIGHTS = 2

/** 저장된 값이 손상돼 있어도 리포트가 깨지지 않도록, 날짜 모양부터 확인한다. */
function hasDateKey(record) {
  return Boolean(record) && typeof record.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
}

function toList(value) {
  return Array.isArray(value) ? value.filter(hasDateKey) : []
}

/**
 * 가족 화면이 필요로 하는 자료를 한 번에 만들어 돌려준다.
 *
 *   {
 *     hasAnySession,
 *     summary   { dayCount, sessionCount, streak, sentence },
 *     activity  { rows: [{ domain, count, share }], sentence },
 *     cumulative{ total, show, rows: [{ weekStart, label, count }], sentence },
 *     missions  { doneList, openList },
 *     highlights [{ id, title, body }],
 *   }
 */
export function buildFamilyReport({ sessions, missions }) {
  const allSessions = toList(sessions)
  const allMissions = toList(missions)

  const weekStart = thisWeekStartKey()
  const weekSessions = allSessions.filter((session) => session.date >= weekStart)
  const weekMissions = allMissions.filter((mission) => mission.date >= weekStart)

  const summary = buildSummary(allSessions, weekSessions)
  const missionStatus = buildMissionStatus(weekMissions)

  return {
    hasAnySession: allSessions.length > 0,
    summary,
    activity: buildActivityMix(weekSessions),
    cumulative: buildCumulative(allSessions),
    missions: missionStatus,
    highlights: buildHighlights({ summary, weekSessions, missionStatus }),
  }
}

/**
 * 이번 주 요약 — 훈련한 날 수 · 기록 수 · 연속 사용일.
 * 목표치를 두지 않는다. 목표가 있으면 "얼마나 못 채웠는지"가 따라오기 때문이다(SPEC 4장).
 */
function buildSummary(allSessions, weekSessions) {
  const dayCount = new Set(weekSessions.map((session) => session.date)).size
  const sessionCount = weekSessions.length
  const streak = calcStreak(allSessions)

  return {
    dayCount,
    sessionCount,
    streak,
    sentence:
      sessionCount > 0
        ? `이번 주 ${dayCount}일, ${sessionCount}회 훈련하셨어요.`
        : '이번 주에는 아직 기록이 없어요. 한 가지만 해보셔도 이 자리에 쌓입니다.',
  }
}

/**
 * 이번 주 영역별 활동량 (마일스톤 7).
 *
 * 축 값은 점수가 아니라 **횟수**다. 점수 축은 짧은 축이 "이 영역을 못한다"로 읽히지만,
 * 횟수 축은 "이 영역을 이만큼 하셨다"로만 읽힌다 — 같은 그림이라도 뜻이 다르다.
 * 비중(share)도 함께 담아 두지만 축 값으로는 쓰지 않는다. 네 영역을 한 번씩 고르게
 * 하신 주에 25%씩 찍히면, 사실은 다 하셨는데도 그래프가 작게 보여 오해를 준다.
 *
 * 실제 기록이 있는 영역만 담는다 — 영역 목록을 고정하지 않는다(SPEC 7장).
 */
function buildActivityMix(weekSessions) {
  const counts = new Map()
  weekSessions.forEach((session) => {
    if (!session.domain) return
    counts.set(session.domain, (counts.get(session.domain) || 0) + 1)
  })

  const total = [...counts.values()].reduce((sum, n) => sum + n, 0)
  const rows = [...counts.entries()]
    .map(([domain, count]) => ({ domain, count, share: Math.round((count / total) * 100) }))
    .sort((a, b) => domainSortIndex(a.domain) - domainSortIndex(b.domain))

  return { rows, sentence: activitySentence(rows) }
}

function activitySentence(rows) {
  if (rows.length === 0) return '이번 주 훈련을 한 번 마치시면 어떤 활동을 하셨는지 여기에 모여요.'
  if (rows.length === 1) {
    const only = rows[0]
    return `이번 주에는 「${only.domain}」 활동을 ${only.count}회 하셨어요.`
  }

  const most = Math.max(...rows.map((row) => row.count))
  const top = rows.filter((row) => row.count === most)

  // 전부 같은 횟수 — 어느 하나를 "가장 많이"라고 하면 사실과 다르다.
  if (top.length === rows.length) return '이번 주에는 여러 영역을 고르게 해보셨어요.'

  const names = top.map((row) => `「${row.domain}」`).join('·')
  return `이번 주에는 ${names} 활동을 가장 많이 하셨어요.`
}

/**
 * 누적 훈련 횟수 (마일스톤 7).
 *
 * 마일스톤 6에서는 주마다의 횟수를 그렸는데, 바쁜 주가 지나가면 다음 막대가 짧아진다.
 * 짧아진 막대는 아무 라벨을 붙이지 않아도 그 자체로 "줄었다"로 읽히고, 보호자에게는
 * 그게 걱정거리가 된다(SPEC 4·8장). 누적으로 바꾸면 그래프가 내려갈 수 없다.
 * 쉰 주는 평평해질 뿐 깎이지 않는다 — 이미 하신 것이 사라지지는 않으니 사실에도 맞다.
 */
function buildCumulative(allSessions) {
  const total = allSessions.length

  const rows = []
  for (let weeksAgo = TREND_WEEKS - 1; weeksAgo >= 0; weeksAgo -= 1) {
    const start = weekStartKeyWeeksAgo(weeksAgo)
    const end = weekStartKeyWeeksAgo(weeksAgo - 1) // 다음 주 월요일 (이번 주는 열려 있다)
    // 그 주가 끝나는 시점까지의 누적. 표시 창보다 오래된 기록도 전부 포함된다.
    const upTo = allSessions.filter((session) => weeksAgo === 0 || session.date < end).length
    rows.push({ weekStart: start, label: weekLabel(weeksAgo, start), count: upTo })
  }

  // 아직 한 번도 하지 않았던 시점의 0 은 앞에서 잘라 낸다.
  const firstActive = rows.findIndex((row) => row.count > 0)
  const trimmed = firstActive === -1 ? [] : rows.slice(firstActive)

  return {
    total,
    show: trimmed.length >= MIN_WEEKS_FOR_TREND,
    rows: trimmed,
    sentence:
      total > 0
        ? `지금까지 모두 ${total}회 함께하셨어요.`
        : '한 번 마치실 때마다 여기에 하나씩 쌓입니다.',
  }
}

/** SPEC 7장 영역 순서를 축 순서로 쓴다. 목록에 없는 영역은 뒤에 붙인다. */
function domainSortIndex(domain) {
  const index = DOMAIN_ORDER.indexOf(domain)
  return index === -1 ? DOMAIN_ORDER.length : index
}

function weekLabel(weeksAgo, weekStart) {
  if (weeksAgo === 0) return '이번 주'
  if (weeksAgo === 1) return '지난주'
  return `${formatShortDate(weekStart)} 주`
}

/**
 * 실행 미션 현황.
 * 해낸 것을 세고, 아직 하지 않은 것은 세지 않는다(SPEC 4장 — 못 한 것을 헤아리지 않는다).
 * 진행 중인 미션은 개수 없이 문장만 그대로 보여 준다.
 */
function buildMissionStatus(weekMissions) {
  return {
    doneList: weekMissions.filter((mission) => mission.done),
    openList: weekMissions.filter((mission) => !mission.done),
  }
}

/**
 * 이번 주 하이라이트 — 긍정적인 것만 골라 많아야 두 장.
 * 고를 것이 없으면 빈 카드를 두지 않고 기본 문구를 돌려준다.
 */
function buildHighlights({ summary, weekSessions, missionStatus }) {
  const candidates = [bestSessionHighlight(weekSessions), streakHighlight(summary), missionHighlight(missionStatus)]
  const picked = candidates.filter(Boolean).slice(0, MAX_HIGHLIGHTS)

  if (picked.length > 0) return picked

  return [
    {
      id: 'default',
      title: '함께한 한 주',
      body: '이번 주도 함께해주셨어요. 다음 주에도 편한 날에 한 가지씩 해보시면 됩니다.',
    },
  ]
}

/** 이번 주에 가장 좋은 기록이 난 훈련. 저장된 score 를 읽기만 하고 등급으로 바꾸지 않는다. */
function bestSessionHighlight(weekSessions) {
  if (weekSessions.length === 0) return null

  const best = weekSessions.reduce((top, session) =>
    (Number(session.score) || 0) > (Number(top.score) || 0) ? session : top
  )
  const game = getGame(best.gameId)
  if (!game) return null

  return {
    id: 'best',
    title: '잘 해내신 훈련',
    // 조사는 lib/korean.js 로 고른다. '요리 순서 맞추기'처럼 받침 없이 끝나는 이름에
    // '을'을 붙이면 문장이 어긋난다. 괄호가 아니라 이름 자체를 넘겨야 받침을 제대로 본다.
    body: `${formatKoreanDate(best.date)}에 「${game.name}」${objectParticle(game.name)} 아주 잘 해내셨어요.`,
  }
}

function streakHighlight({ streak, dayCount }) {
  if (streak >= 2) {
    return {
      id: 'streak',
      title: '꾸준함',
      body: `${streak}일 연속으로 훈련을 이어가고 계세요.`,
    }
  }
  if (dayCount >= 2) {
    return {
      id: 'days',
      title: '꾸준함',
      body: `이번 주에 ${dayCount}일 함께해 주셨어요.`,
    }
  }
  return null
}

/** 이번 주에 해낸 실행 미션 중 가장 최근 것 하나. */
function missionHighlight({ doneList }) {
  if (doneList.length === 0) return null

  const latest = doneList.reduce((newest, mission) => (mission.date >= newest.date ? mission : newest))

  return {
    id: 'mission',
    title: '실제로 해보기',
    body: `「${latest.text}」 미션을 해내셨어요.`,
  }
}
