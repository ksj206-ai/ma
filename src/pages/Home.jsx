import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import ProfileChart from '../components/ProfileChart.jsx'
import { useAppStore, selectTodayMissions } from '../store/useAppStore.js'
import { useUiStore } from '../store/useUiStore.js'
import { calcStreak, recentDayStamps } from '../lib/dates.js'
import { GAMES } from '../lib/games.js'
import { speak } from '../lib/speech.js'

/*
 * 홈 — 오늘 할 일 하나를 크게 보여주는 화면.
 *
 * 마일스톤 2 범위: 추천 훈련 카드 + 스트릭 + 실생활 미션 + 설정 진입.
 * 시작 버튼은 /training 으로 이동만 한다. 게임 로직은 마일스톤 3~4.
 */

/**
 * 오늘의 추천 훈련.
 * 지금은 "마지막에 한 것과 다른 것을 권한다" 수준의 단순 교대다.
 * (게임별 난이도를 성적에 따라 조정하는 적응형 로직은 lib/adaptive.js 에 있다.
 *  이 함수는 "다음에 어떤 게임을 권할지"만 정하며, 그 로직과는 별개다.)
 */
function pickRecommendedGame(sessions) {
  const last = sessions[sessions.length - 1]
  if (last && last.gameId === 'shopping') return GAMES.cooking
  return GAMES.shopping
}

export default function Home() {
  const navigate = useNavigate()
  const profile = useAppStore((state) => state.profile)
  const sessions = useAppStore((state) => state.sessions)
  const missions = useAppStore((state) => state.missions)
  const toggleMission = useAppStore((state) => state.toggleMission)
  const voice = useUiStore((state) => state.voice)

  const streak = calcStreak(sessions)
  const dayStamps = recentDayStamps(sessions)
  const recommended = pickRecommendedGame(sessions)
  const todayMissions = selectTodayMissions({ missions })

  return (
    <>
      <PageTitle description="오늘도 두뇌 건강 습관을 이어가 볼까요?">
        {profile?.name ? `${profile.name}님, 안녕하세요` : '안녕하세요'}
      </PageTitle>

      <div className="space-y-5">
        {/* 연속 사용일 — 숫자를 크게, 판정이 아니라 격려로 (SPEC 4장) */}
        <Card>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="text-button font-bold text-ink">연속 사용일</span>
            <span className="text-hero font-bold text-primary-700">
              {streak}일
            </span>
          </div>
          <p className="mt-3 text-body text-muted">
            {streak > 0
              ? `${streak}일째 꾸준히 이어가고 계세요. 오늘도 한 가지만 해볼까요?`
              : '오늘 한 가지를 해내면 다시 1일부터 쌓입니다.'}
          </p>

          <DayStamps stamps={dayStamps} />
        </Card>

        {/* 오늘의 추천 훈련 */}
        <Card title="오늘의 추천 훈련">
          <p className="text-lead font-bold text-ink">
            {recommended.name}
          </p>
          <p className="mt-2 text-body text-muted">{recommended.summary}</p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {recommended.domains.map((domain) => (
              <li
                key={domain}
                className="rounded-pill border-2 border-primary-200 bg-primary-50 px-4 py-2 text-body font-bold text-primary-700"
              >
                {domain}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-4">
            <BigButton
              onClick={() => navigate('/training')}
              aria-label={`${recommended.name} 시작하기`}
            >
              시작하기
            </BigButton>

            {/* 음성 안내를 켠 분에게만 보이는 버튼. 자동으로 소리를 내지는 않는다. */}
            {voice ? (
              <BigButton
                variant="secondary"
                onClick={() => speak(`오늘의 추천 훈련은 ${recommended.name}입니다. ${recommended.summary}`)}
                aria-label="오늘의 추천 훈련을 소리로 듣기"
              >
                소리로 듣기
              </BigButton>
            ) : null}
          </div>
        </Card>

        {/* 오늘의 실생활 미션 — 훈련을 실제 생활로 잇는 카드.
            자동으로 붙는 하루 미션 외에, 훈련 결과 화면에서 담은 실행 브리지 미션도 함께 쌓인다. */}
        <Card title="오늘의 실생활 미션">
          {todayMissions.length > 0 ? (
            <ul className="space-y-4">
              {todayMissions.map((mission) => (
                <li key={mission.id}>
                  <p className="text-lead font-bold text-ink">
                    {mission.text}
                  </p>

                  <button
                    type="button"
                    aria-pressed={mission.done}
                    onClick={() => toggleMission(mission.id)}
                    className={[
                      'mt-4 flex w-full min-h-touch items-center justify-center gap-3',
                      'rounded-card border-4 px-6 py-4 text-button font-bold',
                      'transition-colors duration-150',
                      mission.done
                        ? 'border-success bg-success text-white'
                        : 'border-primary-300 bg-surface text-primary-700',
                    ].join(' ')}
                  >
                    {/* 완료 체크만 잔잔하게 나타난다(240ms). 해제할 때는 아무 연출도 하지
                        않는다 — 되돌리는 행동은 조용해야 한다. key 로 상태가 바뀔 때만
                        다시 그리게 해 애니메이션이 한 번씩만 돈다. */}
                    <span
                      key={mission.done ? 'done' : 'todo'}
                      aria-hidden="true"
                      className={[
                        'text-[1.3em] leading-none',
                        mission.done ? 'anim-check' : '',
                      ].join(' ')}
                    >
                      {mission.done ? '✓' : '○'}
                    </span>
                    <span>{mission.done ? '해냈어요' : '했어요 표시하기'}</span>
                  </button>

                  <p className="mt-3 text-body text-muted">
                    {mission.done
                      ? '잘하셨어요. 다시 누르면 표시를 되돌릴 수 있습니다.'
                      : '오늘 중에 하시면 됩니다. 못 하셔도 괜찮아요.'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-muted">오늘의 미션을 준비하고 있어요.</p>
          )}
        </Card>

        <ProfileChart sessions={sessions} />

        <BigButton
          variant="secondary"
          onClick={() => navigate('/settings')}
          aria-label="설정 화면으로 이동"
        >
          설정
        </BigButton>
      </div>
    </>
  )
}


/**
 * 최근 7일 도장 (마일스톤 8).
 *
 * 스트릭 숫자만으로는 "언제 했는지"가 안 보인다. 요일마다 도장 하나를 찍어 두면
 * 한눈에 흐름이 잡힌다. 달력 도장을 그대로 옮긴 것이라 설명이 필요 없다.
 *
 * 하지 않은 날을 세거나 표시하지 않는다 (SPEC 4장).
 *  - 빈 날은 옅은 동그라미일 뿐이다. X 표시도, 빨간색도, "3/7" 같은 분수도 없다.
 *  - 읽어 주는 문장도 한 날은 "훈련하신 날"로만 말하고, 나머지는 말하지 않는다.
 */
function DayStamps({ stamps }) {
  const trainedCount = stamps.filter((day) => day.trained).length

  return (
    <div className="mt-5">
      {/*
        칸 안을 글자(✓)로 채우지 않고 색만 칠한다. 폭 360px + 글자 크게에서는 한 칸이
        35px 정도까지 좁아지는데, 그 안에 25px 짜리 글자를 넣으면 칸 밖으로 삐져나간다.
        도장은 칠해졌는지 아닌지만 보이면 되므로 글자가 필요 없다.
        (w-full + max-w: 넓은 화면에서는 40px 로 멈추고, 좁아지면 같이 줄어든다)
      */}
      <ul className="flex gap-1">
        {stamps.map((day) => (
          <li key={day.dateKey} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-body font-bold text-muted">{day.weekday}</span>
            <span
              aria-hidden="true"
              className={[
                'aspect-square w-full max-w-[2.5rem] rounded-pill border-2',
                day.trained
                  ? 'border-primary-700 bg-primary-600'
                  : 'border-line bg-surface',
                // 오늘은 아직 안 하셨어도 어느 칸인지 알아볼 수 있게 테두리만 진하게 둔다.
                !day.trained && day.isToday ? 'border-primary-300' : '',
              ].join(' ')}
            />
          </li>
        ))}
      </ul>
      {/* 도장은 그림이라 보조기술에 안 읽힌다. 같은 내용을 글자로 한 번 더 둔다. */}
      <p className="mt-3 text-body text-muted">
        최근 7일 가운데 {trainedCount}일 훈련하셨어요.
      </p>
    </div>
  )
}
