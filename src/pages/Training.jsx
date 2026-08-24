import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import { GAMES } from '../lib/games.js'

/*
 * 훈련 목록.
 * 아직 만들지 않은 게임은 "준비 중" 카드로만 둔다.
 * 준비 중 카드에는 버튼을 넣지 않는다 — 눌러도 아무 일이 없는 버튼이
 * Tab 순서에 끼어 있으면 키보드만 쓰는 분에게 혼란스럽기 때문이다.
 *
 * 코스 모드는 마일스톤 9.
 */
export default function Training() {
  const navigate = useNavigate()
  const games = Object.values(GAMES)

  return (
    <>
      <PageTitle description="일상 속 과제로 만든 훈련들입니다.">훈련</PageTitle>

      <ul className="space-y-5">
        {games.map((game) => (
          <li key={game.id}>
            <Card>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h2 className="text-[1.4em] font-bold leading-snug text-ink">
                  {game.name}
                </h2>
                {!game.available ? (
                  <span className="rounded-pill border-2 border-line bg-bg px-4 py-1 text-body font-bold text-muted">
                    준비 중
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-body text-muted">{game.summary}</p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {game.domains.map((domain) => (
                  <li
                    key={domain}
                    className="rounded-pill border-2 border-primary-200 bg-primary-50 px-4 py-2 text-body font-bold text-primary-700"
                  >
                    {domain}
                  </li>
                ))}
              </ul>

              {game.available ? (
                <div className="mt-6">
                  <BigButton
                    onClick={() => navigate(game.route)}
                    aria-label={`${game.name} 시작하기`}
                  >
                    시작하기
                  </BigButton>
                </div>
              ) : (
                <p className="mt-5 text-body text-muted">
                  곧 만나 보실 수 있습니다.
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
