import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import ActivityMixChart from '../components/ActivityMixChart.jsx'
import CumulativeTrainingChart from '../components/CumulativeTrainingChart.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { buildFamilyReport } from '../lib/report.js'

/*
 * 가족 모드(보호자 주간 리포트) — SPEC 8장 / 마일스톤 6.
 *
 * 같은 기기의 localStorage 를 읽어 보여 주는 데모 구조다. 로그인·PIN·계정을 두지 않는다.
 * (읽기도 storage.js -> useAppStore 를 통해서만 한다. 이 파일에 localStorage 는 없다.)
 *
 * [이 화면의 성격 — SPEC 4장]
 * 여기는 "이번 주에 무엇을 하셨는가"를 보여 주는 활동 요약이지 판정이 아니다. 그래서
 *  - 판정·비교 표현을 쓰지 않는다 (위·아래를 가르는 말, 또래 대비 같은 비교).
 *  - 등급·신호등·백분위를 붙이지 않는다. 적게 하신 영역에 해석이나 경고색을 붙이지 않는다.
 *  - "~하셔야 합니다" 같은 지시·경고 문구를 쓰지 않는다.
 *  - 해낸 것을 세고, 하지 않은 것은 세지 않는다.
 * 화면 하단의 웰니스 고지는 AppLayout 이 모든 화면에 공통으로 깔아 준다(마일스톤 2).
 *
 * [마일스톤 7 — 점수를 걷어냈다]
 * 이 화면에는 영역별 0~100 점수가 나오지 않는다. 보호자는 그 숫자를 "몇 점짜리
 * 상태인가"로 읽기 쉽고, 그건 우리가 하지 않기로 한 판정이다(SPEC 8장). 대신
 * ActivityMixChart(이번 주 영역별 횟수)와 CumulativeTrainingChart(누적 횟수)로
 * 활동량만 보여 준다. 점수 자체는 홈 화면(ProfileChart)에 그대로 남아 있다 —
 * 본인이 자기 흐름을 보는 자리와, 가족이 활동을 지켜보는 자리는 다르기 때문이다.
 *
 * 자료는 전부 lib/report.js 가 만든다. 연속 사용일은 dates.js 의 calcStreak 를
 * 그대로 쓰며 이 화면에서 다시 계산하지 않는다.
 */
export default function Family() {
  const navigate = useNavigate()
  const sessions = useAppStore((state) => state.sessions)
  const missions = useAppStore((state) => state.missions)

  const report = useMemo(() => buildFamilyReport({ sessions, missions }), [sessions, missions])

  // 데이터 초기화 직후처럼 기록이 하나도 없을 때. 빈 차트를 늘어놓지 않고 안내 하나만 둔다.
  if (!report.hasAnySession) {
    return (
      <>
        <PageTitle description="어르신의 한 주 활동을 함께 봅니다.">가족</PageTitle>

        <Card title="아직 훈련 기록이 없어요">
          <p className="text-body text-ink">
            함께 시작해볼까요? 훈련을 한 번 마치면 이 자리에 한 주 활동이 모입니다.
          </p>
          <div className="mt-6">
            <BigButton onClick={() => navigate('/home')} aria-label="홈 화면으로 이동">
              홈으로 가기
            </BigButton>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageTitle description="어르신의 한 주 활동을 함께 봅니다.">가족</PageTitle>

      <div className="space-y-5">
        <WeekSummaryCard summary={report.summary} />
        <ActivityMixChart activity={report.activity} />
        <CumulativeTrainingChart cumulative={report.cumulative} />
        <MissionCard missions={report.missions} />
        <HighlightCard highlights={report.highlights} />
      </div>
    </>
  )
}

/**
 * 이번 주 요약 — 사실만 담담하게.
 * 목표치나 "권장 횟수"를 두지 않는다. 기준선이 생기는 순간 리포트가 채점표가 된다.
 */
function WeekSummaryCard({ summary }) {
  const stats = [
    { label: '훈련한 날', value: `${summary.dayCount}일` },
    { label: '훈련 횟수', value: `${summary.sessionCount}회` },
    { label: '연속 사용일', value: `${summary.streak}일` },
  ]

  return (
    <Card title="이번 주 요약">
      {/* 라벨-값 한 줄씩. 폭 360px 에서 "글자 크게"를 켜도 줄이 겹치지 않는 배치다. */}
      <ul className="divide-y-2 divide-line">
        {stats.map((stat) => (
          <li
            key={stat.label}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 first:pt-0 last:pb-0"
          >
            <span className="text-body font-bold text-ink">{stat.label}</span>
            <span className="text-title font-bold text-primary-700">
              {stat.value}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-body text-muted">{summary.sentence}</p>
    </Card>
  )
}

/**
 * 실행 미션 현황 — 해낸 것 위주.
 * 아직 하지 않은 미션은 개수를 세지 않고, 문장만 담담하게 옆에 둔다.
 */
function MissionCard({ missions }) {
  const { doneList, openList } = missions

  return (
    <Card title="실제로 해보기">
      {doneList.length > 0 ? (
        <>
          <p className="text-lead font-bold text-ink">
            이번 주에 {doneList.length}가지를 직접 해내셨어요.
          </p>
          <ul className="mt-5 space-y-4">
            {doneList.map((mission) => (
              <li key={mission.id} className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="anim-check mt-0.5 flex min-h-[2rem] min-w-[2rem] shrink-0 items-center justify-center rounded-pill bg-success text-[1.1em] font-bold leading-none text-white"
                >
                  ✓
                </span>
                <span className="text-body font-bold text-ink">{mission.text}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-body text-ink">
          {openList.length > 0
            ? '이번 주에 해보실 미션을 담아 두셨어요. 편한 날에 하시면 됩니다.'
            : '훈련을 마치면 “오늘 실제로 해보기” 미션이 이 자리에 쌓여요.'}
        </p>
      )}

      {openList.length > 0 ? (
        <div
          className={[
            'text-body text-muted',
            doneList.length > 0 ? 'mt-5 border-t-2 border-line pt-5' : 'mt-5',
          ].join(' ')}
        >
          <p className="font-bold text-ink">지금 담아 두신 미션</p>
          <ul className="mt-3 space-y-2">
            {openList.map((mission) => (
              <li key={mission.id}>{mission.text}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}

/** 이번 주 하이라이트 — 언제나 긍정 프레이밍. 고를 것이 없으면 report.js 가 기본 문구를 준다. */
function HighlightCard({ highlights }) {
  return (
    <Card title="이번 주 하이라이트">
      <ul className="space-y-5">
        {highlights.map((item) => (
          <li
            key={item.id}
            className="rounded-card border-2 border-primary-200 bg-primary-50 px-4 py-4"
          >
            <p className="text-body font-bold text-primary-700">{item.title}</p>
            <p className="mt-2 text-lead font-bold text-ink">{item.body}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
