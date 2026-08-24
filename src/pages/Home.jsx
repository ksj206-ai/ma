import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import { useAppStore, selectTodayMission } from '../store/useAppStore.js'
import { useUiStore } from '../store/useUiStore.js'
import { calcStreak } from '../lib/dates.js'
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
 * 성적을 보고 난이도를 조정하는 적응형 로직은 마일스톤 5 에서 붙는다.
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
  const recommended = pickRecommendedGame(sessions)
  const todayMission = selectTodayMission({ missions })

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
            <span className="text-[2.5em] font-bold leading-none text-primary-700">
              {streak}일
            </span>
          </div>
          <p className="mt-3 text-body text-muted">
            {streak > 0
              ? `${streak}일째 꾸준히 이어가고 계세요. 오늘도 한 가지만 해볼까요?`
              : '오늘 한 가지를 해내면 다시 1일부터 쌓입니다.'}
          </p>
        </Card>

        {/* 오늘의 추천 훈련 */}
        <Card title="오늘의 추천 훈련">
          <p className="text-[1.4em] font-bold leading-snug text-ink">
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

        {/* 오늘의 실생활 미션 — 훈련을 실제 생활로 잇는 카드 */}
        <Card title="오늘의 실생활 미션">
          {todayMission ? (
            <>
              <p className="text-[1.4em] font-bold leading-snug text-ink">
                {todayMission.text}
              </p>

              <button
                type="button"
                aria-pressed={todayMission.done}
                onClick={() => toggleMission(todayMission.id)}
                className={[
                  'mt-6 flex w-full min-h-touch items-center justify-center gap-3',
                  'rounded-card border-4 px-6 py-4 text-button font-bold',
                  'transition-colors duration-150',
                  todayMission.done
                    ? 'border-success bg-success text-white'
                    : 'border-primary-300 bg-surface text-primary-700',
                ].join(' ')}
              >
                <span aria-hidden="true" className="text-[1.3em] leading-none">
                  {todayMission.done ? '✓' : '○'}
                </span>
                <span>{todayMission.done ? '해냈어요' : '했어요 표시하기'}</span>
              </button>

              <p className="mt-3 text-body text-muted">
                {todayMission.done
                  ? '잘하셨어요. 다시 누르면 표시를 되돌릴 수 있습니다.'
                  : '오늘 중에 하시면 됩니다. 못 하셔도 괜찮아요.'}
              </p>
            </>
          ) : (
            <p className="text-body text-muted">오늘의 미션을 준비하고 있어요.</p>
          )}
        </Card>

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
