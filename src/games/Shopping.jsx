import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import ChoiceButton from '../components/ChoiceButton.jsx'
import ShelfItem from '../components/ShelfItem.jsx'
import StepProgress from '../components/StepProgress.jsx'
import CountdownPanel from '../components/CountdownPanel.jsx'
import GameIntro from '../components/GameIntro.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { todayKey } from '../lib/dates.js'
import { formatWon } from '../lib/recipes.js'
import { buildSessions, elapsedSec } from './gameCommon.js'
import { useCountdown } from './useCountdown.js'
import {
  buildBridgeMissionText,
  buildChangeQuestions,
  buildRound,
  gradeCart,
  gradeChangeQuestions,
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

  // 저장된 레벨을 읽어 쓰기만 한다. 성적에 따른 조정은 세션 저장 뒤 store 가 한다(lib/adaptive.js).
  const level = getLevelConfig(levels && levels.shopping).level

  // 한 판 구성은 처음 한 번만 만든다.
  const round = useMemo(() => buildRound(level), [level])
  const { config, recipe, targets, shelf } = round

  const [phase, setPhase] = useState(PHASES.INTRO)
  const [cart, setCart] = useState([])
  const [changeChoices, setChangeChoices] = useState([])

  // 소요 시간 측정용. 렌더와 무관하므로 ref 에 둔다.
  const shopStartedAt = useRef(0)
  const checkoutStartedAt = useRef(0)
  const memoryDurationRef = useRef(0)
  const gradeRef = useRef(null)

  const hasChange = config.changeCount > 0
  const changeQuestions = useMemo(
    () => (hasChange ? buildChangeQuestions(targets, config) : []),
    [hasChange, config, targets]
  )
  const allChangeAnswered = changeQuestions.every((_, index) => changeChoices[index] != null)

  // 노출 카운트다운은 요리 게임과 공통 훅을 쓴다 (화면을 벗어나면 알아서 멈춘다).
  const secondsLeft = useCountdown(
    config.exposureSec,
    phase === PHASES.MEMORIZE,
    () => goShopping()
  )

  const totalSteps = hasChange ? 3 : 2
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

  function goShopping() {
    setPhase(PHASES.SHOP)
    shopStartedAt.current = Date.now()
  }

  /** 세션을 저장하고 결과 화면으로 넘긴다. */
  function finish(changeGrade) {
    const grade = gradeRef.current
    const now = Date.now()

    // 장보기는 인지 영역이 둘(작업기억 · 계산)이라 영역별로 레코드를 나눈다.
    // 계산 단계가 없는 난이도에서는 '계산' part 를 넘기지 않으므로 레코드도 생기지 않는다.
    addSessions(
      buildSessions({
        gameId: 'shopping',
        level,
        dateKey: todayKey(),
        now,
        parts: [
          {
            key: 'memory',
            domain: '작업기억',
            accuracy: grade.accuracy,
            durationSec: memoryDurationRef.current,
          },
          ...(changeGrade
            ? [
                {
                  key: 'calc',
                  domain: '계산',
                  accuracy: changeGrade.accuracy,
                  durationSec: elapsedSec(checkoutStartedAt.current),
                },
              ]
            : []),
        ],
      })
    )

    navigate('/result', {
      replace: true,
      state: {
        recipeName: recipe.name,
        replayPath: '/training/shopping',
        bridgeText: buildBridgeMissionText(recipe.name),
        headline:
          grade.missed.length === 0
            ? '전부 찾으셨어요!'
            : grade.correct.length > 0
              ? '잘하셨어요!'
              : '오늘도 해내셨어요!',
        blocks: [
          {
            kind: 'chips',
            title: '장바구니에 담으신 것',
            tone: 'good',
            items: grade.correct,
            emptyText: '이번에는 목록이 좀 어려웠지요. 다시 하면 훨씬 수월해집니다.',
            note: `살 것 ${grade.total}가지 가운데 ${grade.correct.length}가지를 기억해 담으셨습니다.`,
          },
          ...(grade.missed.length > 0
            ? [
                {
                  kind: 'chips',
                  title: '이것도 있었어요',
                  tone: 'plain',
                  items: grade.missed,
                  note: '다음에 장 보실 때 한 번 떠올려 보세요.',
                },
              ]
            : []),
          ...(changeGrade
            ? [
                {
                  kind: 'note',
                  title: '계산대',
                  lines: [
                    changeGrade.correctCount === changeGrade.total
                      ? `잔돈 문제 ${changeGrade.total}개를 모두 맞히셨어요.`
                      : `잔돈 문제 ${changeGrade.total}개 가운데 ${changeGrade.correctCount}개를 맞히셨어요.`,
                    ...changeGrade.results
                      .filter((item) => !item.isCorrect)
                      .map(
                        (item) =>
                          `${formatWon(item.bill)}을 냈을 때 거스름돈은 ${formatWon(item.answer)}이었어요.`
                      ),
                  ],
                },
              ]
            : []),
        ],
      },
    })
  }

  /** "다 담았어요" — 여기서 처음 채점한다. */
  function handleConfirmCart() {
    gradeRef.current = gradeCart(targets, cart)
    memoryDurationRef.current = elapsedSec(shopStartedAt.current)

    if (hasChange) {
      setPhase(PHASES.CHECKOUT)
      checkoutStartedAt.current = Date.now()
      return
    }
    finish(null)
  }

  function chooseChangeAnswer(questionIndex, option) {
    setChangeChoices((current) => {
      const next = [...current]
      next[questionIndex] = option
      return next
    })
  }

  function handleConfirmChange() {
    finish(gradeChangeQuestions(changeQuestions, changeChoices))
  }

  /* ---------------- (1) 요리 안내 ---------------- */
  if (phase === PHASES.INTRO) {
    return (
      <GameIntro
        title="장보기 미션"
        description="장 볼 것을 잠깐 보여 드릴 테니 기억해 주세요."
        recipeName={recipe.name}
        lead={`잠시 뒤 살 것 ${listLength}가지를 ${config.exposureSec}초 동안 보여 드립니다.`}
        startLabel="장보기 미션 시작하기"
        onStart={() => setPhase(PHASES.MEMORIZE)}
      />
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

        <CountdownPanel
          secondsLeft={secondsLeft}
          onSkip={goShopping}
          skipLabel="다 외웠으니 진열대로 넘어가기"
        >
          <ul className="space-y-3">
            {targets.map((item) => (
              <li
                key={item.name}
                className="rounded-card border-2 border-primary-200 bg-primary-50 px-5 py-4 text-button font-bold text-primary-800"
              >
                {item.name}
              </li>
            ))}
          </ul>
        </CountdownPanel>
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
          <span className="text-primary-700">{formatWon(changeQuestions[0]?.total)}</span>
        </div>
      </Card>

      <div className="mt-6 space-y-5">
        {changeQuestions.map((question, questionIndex) => (
          <Card key={question.bill}>
            <p className="text-[1.4em] font-bold leading-snug text-ink">
              {formatWon(question.bill)}을 내면 거스름돈은 얼마일까요?
            </p>

            <div className="mt-5 space-y-4">
              {question.options.map((option) => (
                <ChoiceButton
                  key={option}
                  selected={changeChoices[questionIndex] === option}
                  onClick={() => chooseChangeAnswer(questionIndex, option)}
                >
                  {formatWon(option)}
                </ChoiceButton>
              ))}
            </div>
          </Card>
        ))}

        <BigButton
          onClick={handleConfirmChange}
          disabled={!allChangeAnswered}
          aria-label="고른 거스름돈으로 계산 마치기"
        >
          {allChangeAnswered
            ? '계산 마치기'
            : `${changeQuestions.length - changeChoices.filter((choice) => choice != null).length}개 더 골라 주세요`}
        </BigButton>
      </div>
    </>
  )
}
