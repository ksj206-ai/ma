import {
  calcStreak,
  formatKoreanDate,
  formatShortDate,
  thisWeekStartKey,
  weekStartKeyWeeksAgo,
} from './dates.js'
import { getGame } from './games.js'
import { objectParticle } from './korean.js'

/*
 * 가족 리포트 자료 만들기 (SPEC 8장) — 마일스톤 6.
 *
 * 이 파일은 새 점수·통계를 만들지 않는다. 하는 일은 세 가지뿐이다.
 *   1) 이번 주 / 최근 몇 주라는 기간으로 기록을 걸러 낸다 (필터)
 *   2) 걸러 낸 것의 개수를 센다 (날짜 수 · 기록 수)
 *   3) 이미 저장돼 있는 값(score, done, gameId)을 그대로 읽어 문장으로 옮긴다
 *
 * 점수는 lib/profile.js 의 computeDomainProfiles 가, 연속 사용일은 lib/dates.js 의
 * calcStreak 가 계산한다(둘 다 마일스톤 5). 여기서 다시 계산하지 않는다.
 *
 * [카피 원칙 — SPEC 4장]
 * 이 리포트는 "이번 주에 무엇을 하셨는가"의 활동 요약이며 진단이 아니다.
 * 판정·비교 표현(위험/이상/저하/또래 대비 …), 등급·신호등·백분위, 지시형 경고 문구를
 * 만들지 않는다. 못 한 것을 세지 않고, 해낸 것만 센다.
 */

/** 추이에서 보여 줄 주의 개수 (이번 주 포함) */
const TREND_WEEKS = 4

/** 이 수보다 적은 주가 모이면 추이 대신 안내만 보여 준다 — 한 주짜리 "추이"는 흐름이 아니다. */
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
 *     summary  { dayCount, sessionCount, streak, sentence },
 *     trend    { show, reason, rows: [{ weekStart, label, count }] },
 *     missions { doneList, openList },
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
  const trend = buildTrend(allSessions)
  const missionStatus = buildMissionStatus(weekMissions)

  return {
    hasAnySession: allSessions.length > 0,
    summary,
    trend,
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
 * 주별 훈련 기록 수.
 * 점수가 아니라 "몇 번 하셨는지"를 센다 — 활동량이므로 오르내림에 해석을 붙일 일이 없고,
 * 그래서 이 리포트에서 가장 안전하게 보여 줄 수 있는 흐름이다.
 * 기록이 있는 주가 하나뿐이면 흐름이라 부를 수 없으므로 보여 주지 않는다.
 */
function buildTrend(allSessions) {
  const rows = []
  for (let weeksAgo = TREND_WEEKS - 1; weeksAgo >= 0; weeksAgo -= 1) {
    const start = weekStartKeyWeeksAgo(weeksAgo)
    const end = weekStartKeyWeeksAgo(weeksAgo - 1) // 다음 주 월요일 (weeksAgo 0 이면 미래라 열려 있다)
    const count = allSessions.filter(
      (session) => session.date >= start && (weeksAgo === 0 || session.date < end)
    ).length

    rows.push({ weekStart: start, label: weekLabel(weeksAgo, start), count })
  }

  // 훈련을 시작하기 전의 빈 주는 앞에서 잘라 낸다.
  // 0 짜리 막대가 앞에 붙으면 "안 한 주"를 굳이 그려 보여 주는 셈이 된다.
  const firstActive = rows.findIndex((row) => row.count > 0)
  const trimmed = firstActive === -1 ? [] : rows.slice(firstActive)

  const weeksWithData = trimmed.filter((row) => row.count > 0).length

  return {
    show: weeksWithData >= MIN_WEEKS_FOR_TREND,
    reason: weeksWithData >= MIN_WEEKS_FOR_TREND ? null : '다음 주부터 주별 흐름이 여기에 보여요.',
    rows: trimmed,
  }
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
