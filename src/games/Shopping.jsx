import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import ChoiceButton from '../components/ChoiceButton.jsx'
import ShelfItem from '../components/ShelfItem.jsx'
import StepProgress from '../components/StepProgress.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { todayKey } from '../lib/dates.js'
import { formatWon } from '../lib/recipes.js'
import {
  buildChangeQuestion,
  buildRound,
  buildSessions,
  gradeCart,
  getLevelConfig,
} from './shoppingLogic.js'

/*
 * 장보기 미션 (SPEC 6.1) — 마일스톤 3
 *
 * 흐름: 요리 안내 → 목록 노출(제한 시간) → 진열대에서 담기 → (레벨 4↑) 계산대 → 결과 화면
 *
 * 지키는 규칙
 *  - 목록은 recipes.js 에서 생성한다 (하드코딩 금지).
 *  - 오답을 담아도 그 자리에서 부정 피드백을 주지 않는다. 채점은 "다 담았어요"를 누른 뒤에 한다.
 *  - 담은 것은 다시 눌러 뺄 수 있고, 취소에 벌점·경고가 없다.
 *  - 하단 탭으로 도중에 나가도 앱이 깨지면 안 된다 → 타이머는 반드시 정리한다.
 */

const PHASES = {
  INTRO: 'intro',
  MEMORIZE: 'memorize',
  SHOP: 'shop',
  CHECKOUT: 'checkout',
}

export default function Shopping() {
  const navigate = useNavigate()
  const levels = useAppStore((state) => state.levels)
  const addSessions = useAppStore((state) => state.addSessions)

  // 저장된 레벨을 읽어 쓰기만 한다. 성적에 따른 조정은 마일스톤 5.
  const level = getLevelConfig(levels && levels.shopping).level

  // 한 판 구성은 처음 한 번만 만든다.
  const round = useMemo(() => buildRound(level), [level])
  const { config, recipe, targets, shelf } = round

  const [phase, setPhase] = useState(PHASES.INTRO)
  const [secondsLeft, setSecondsLeft] = useState(config.exposureSec)
  const [cart, setCart] = useState([])
  const [changeChoice, setChangeChoice] = useState(null)

  // 소요 시간 측정용. 렌더와 무관하므로 ref 에 둔다.
  const shopStartedAt = useRef(0)
  const checkoutStartedAt = useRef(0)
  const memoryDurationRef = useRef(0)
  const gradeRef = useRef(null)

  const changeQuestion = useMemo(
    () => (config.hasChange ? buildChangeQuestion(targets) : null),
    [config.hasChange, targets]
  )

  // 목록 노출 카운트다운. 화면을 벗어나면 반드시 멈춘다.
  useEffect(() => {
    if (phase !== PHASES.MEMORIZE) return undefined

    const timer = setInterval(() => {
      setSecondsLeft((remaining) => {
        if (remaining <= 1) {
          clearInterval(timer)
          setPhase(PHASES.SHOP)
          shopStartedAt.current = Date.now()
          return 0
        }
        return remaining - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase])

  const totalSteps = config.hasChange ? 3 : 2
  const currentStep = phase === PHASES.CHECKOUT ? 3 : phase === PHASES.SHOP ? 2 : 1
  const listLength = Math.min(config.listLength, recipe.ingredients.length)

  function toggleItem(name) {
    // 담기와 빼기가 같은 동작이다. 어느 쪽도 벌점이나 경고가 없다.
    setCart((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    )
  }

  function elapsedSec(startedAt) {
    return Math.max(1, Math.round((Date.now() - startedAt) / 1000))
  }

  function goShopping() {
    setPhase(PHASES.SHOP)
    shopStartedAt.current = Date.now()
  }

  /** 세션을 저장하고 결과 화면으로 넘긴다. */
  function finish(change) {
    const grade = gradeRef.current
    const now = Date.now()

    const sessions = buildSessions({
      level,
      grade,
      change,
      memoryDurationSec: memoryDurationRef.current,
      changeDurationSec: change ? elapsedSec(checkoutStartedAt.current) : 0,
      dateKey: todayKey(),
      now,
    })
    addSessions(sessions)

    navigate('/result', {
      replace: true,
      state: {
        gameId: 'shopping',
        level,
        recipeId: recipe.id,
        recipeName: recipe.name,
        correct: grade.correct,
        missed: grade.missed,
        total: grade.total,
        change: change
          ? {
              isCorrect: change.isCorrect,
              answer: changeQuestion.answer,
              bill: changeQuestion.bill,
              total: changeQuestion.total,
            }
          : null,
      },
    })
  }

  /** "다 담았어요" — 여기서 처음 채점한다. */
  function handleConfirmCart() {
    gradeRef.current = gradeCart(targets, cart)
    memoryDurationRef.current = elapsedSec(shopStartedAt.current)

    if (config.hasChange) {
      setPhase(PHASES.CHECKOUT)
      checkoutStartedAt.current = Date.now()
      return
    }
    finish(null)
  }

  function handleConfirmChange() {
    finish({ isCorrect: changeChoice === changeQuestion.answer })
  }

  /* ---------------- (1) 요리 안내 ---------------- */
  if (phase === PHASES.INTRO) {
    return (
      <>
        <PageTitle description="장 볼 것을 잠깐 보여 드릴 테니 기억해 주세요.">
          장보기 미션
        </PageTitle>

        <Card>
          <p className="text-body text-muted">오늘 만들 요리는</p>
          <p className="mt-2 text-title font-bold text-primary-700">{recipe.name}</p>
          <p className="mt-4 text-body text-muted">
            잠시 뒤 살 것 {listLength}가지를 {config.exposureSec}초 동안 보여 드립니다.
          </p>
        </Card>

        <div className="mt-6">
          <BigButton
            onClick={() => {
              setSecondsLeft(config.exposureSec)
              setPhase(PHASES.MEMORIZE)
            }}
            aria-label="장보기 미션 시작하기"
          >
            시작하기
          </BigButton>
        </div>
      </>
    )
  }

  /* ---------------- (2) 장바구니 목록 노출 ---------------- */
  if (phase === PHASES.MEMORIZE) {
    return (
      <>
        <StepProgress current={currentStep} total={totalSteps} />
        <PageTitle description={`${recipe.name}에 필요한 재료입니다.`}>
          이것들을 사 오세요
        </PageTitle>

        <Card>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-button font-bold text-ink">남은 시간</span>
            <span className="text-[2.5em] font-bold leading-none text-primary-700">
              {secondsLeft}초
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {targets.map((item) => (
              <li
                key={item.name}
                className="rounded-card border-2 border-primary-200 bg-primary-50 px-5 py-4 text-button font-bold text-primary-800"
              >
                {item.name}
              </li>
            ))}
          </ul>
        </Card>

        <p className="mt-5 text-body text-muted">
          다 외우셨으면 기다리지 않고 넘어가셔도 됩니다.
        </p>
        <div className="mt-3">
          <BigButton
            variant="secondary"
            onClick={goShopping}
            aria-label="다 외웠으니 진열대로 넘어가기"
          >
            다 외웠어요
          </BigButton>
        </div>
      </>
    )
  }

  /* ---------------- (3) 진열대에서 담기 ---------------- */
  if (phase === PHASES.SHOP) {
    return (
      <>
        <StepProgress current={currentStep} total={totalSteps} />
        <PageTitle description="아까 본 재료를 찾아 눌러 담아 주세요.">진열대</PageTitle>

        <Card>
          <p className="text-body text-muted">
            장바구니에 담긴 것{' '}
            <span className="font-bold text-primary-700">{cart.length}개</span>
          </p>
          <p className="mt-1 text-body text-muted">
            잘못 담았으면 한 번 더 누르면 빠집니다. 괜찮습니다.
          </p>

          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {shelf.map((item) => (
              <li key={item.name}>
                <ShelfItem
                  name={item.name}
                  picked={cart.includes(item.name)}
                  onToggle={() => toggleItem(item.name)}
                />
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-6">
          <BigButton onClick={handleConfirmCart} aria-label="다 담았으니 확인하기">
            다 담았어요
          </BigButton>
        </div>
      </>
    )
  }

  /* ---------------- (4) 계산대 (레벨 4 이상) ---------------- */
  return (
    <>
      <StepProgress current={currentStep} total={totalSteps} />
      <PageTitle description="계산대에서 거스름돈을 확인해 주세요.">계산대</PageTitle>

      <Card title="영수증">
        <ul className="space-y-3">
          {targets.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-4 border-b-2 border-line pb-3 text-body text-ink"
            >
              <span>{item.name}</span>
              <span className="font-bold">{formatWon(item.price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-4 text-button font-bold text-ink">
          <span>합계</span>
          <span className="text-primary-700">{formatWon(changeQuestion.total)}</span>
        </div>
      </Card>

      <div className="mt-6">
        <Card>
          <p className="text-[1.4em] font-bold leading-snug text-ink">
            {formatWon(changeQuestion.bill)}을 내면 거스름돈은 얼마일까요?
          </p>

          <div className="mt-5 space-y-4">
            {changeQuestion.options.map((option) => (
              <ChoiceButton
                key={option}
                selected={changeChoice === option}
                onClick={() => setChangeChoice(option)}
              >
                {formatWon(option)}
              </ChoiceButton>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <BigButton
          onClick={handleConfirmChange}
          disabled={changeChoice === null}
          aria-label="고른 거스름돈으로 계산 마치기"
        >
          {changeChoice === null ? '하나를 골라 주세요' : '계산 마치기'}
        </BigButton>
      </div>
    </>
  )
}
