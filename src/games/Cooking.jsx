import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import Card from '../components/Card.jsx'
import BigButton from '../components/BigButton.jsx'
import ChoiceButton from '../components/ChoiceButton.jsx'
import StepProgress from '../components/StepProgress.jsx'
import CountdownPanel from '../components/CountdownPanel.jsx'
import GameIntro from '../components/GameIntro.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { todayKey } from '../lib/dates.js'
import { buildSessions, elapsedSec } from './gameCommon.js'
import { useCountdown } from './useCountdown.js'
import {
  buildBridgeMissionText,
  buildRound,
  getLevelConfig,
  gradeMeasure,
  gradeOrder,
} from './cookingLogic.js'

/*
 * 요리 순서 맞추기 (SPEC 6.2) — 마일스톤 4
 *
 * 흐름: 요리 안내 → 조리 순서 노출(제한 시간) → 순서 재현 → (레벨 4↑) 재료 계량 → 결과 화면
 *
 * 지키는 규칙
 *  - 드래그 금지(SPEC 3.1). "순서대로 고르기" 방식으로만 만든다.
 *  - 고르는 중에는 정답·오답을 알려 주지 않는다. 채점은 확인 버튼을 누른 뒤에.
 *  - 잘못 골랐으면 쌓인 항목을 눌러 그 순번부터 다시 고를 수 있다. 벌점·경고 없음.
 *  - 하단 탭으로 도중에 나가도 앱이 깨지면 안 된다 → 타이머는 공용 훅이 정리한다.
 *
 * 영역 배정: 순서 재현 → '순서화', 재료 계량 → '실행기능'.
 * 작업기억 세션은 만들지 않는다 (그 영역은 장보기가 맡는다).
 */

const PHASES = {
  INTRO: 'intro',
  MEMORIZE: 'memorize',
  ORDER: 'order',
  MEASURE: 'measure',
}

export default function Cooking() {
  const navigate = useNavigate()
  const levels = useAppStore((state) => state.levels)
  const addSessions = useAppStore((state) => state.addSessions)

  // 저장된 레벨을 읽어 쓰기만 한다. 성적에 따른 조정은 세션 저장 뒤 store 가 한다(lib/adaptive.js).
  const level = getLevelConfig(levels && levels.cooking).level

  const round = useMemo(() => buildRound(level), [level])
  const { config, recipe, correctSteps, cards, measureQuestions } = round

  const [phase, setPhase] = useState(PHASES.INTRO)
  const [picked, setPicked] = useState([])
  const [answers, setAnswers] = useState([])

  const orderStartedAt = useRef(0)
  const measureStartedAt = useRef(0)
  const orderDurationRef = useRef(0)
  const orderGradeRef = useRef(null)

  const secondsLeft = useCountdown(
    config.exposureSec,
    phase === PHASES.MEMORIZE,
    () => goOrdering()
  )

  const totalSteps = config.hasMeasure ? 3 : 2
  const currentStep = phase === PHASES.MEASURE ? 3 : phase === PHASES.ORDER ? 2 : 1

  const remainingCards = cards.filter((card) => !picked.includes(card))
  const isOrderComplete = picked.length >= correctSteps.length

  function goOrdering() {
    setPhase(PHASES.ORDER)
    orderStartedAt.current = Date.now()
  }

  /** 카드를 골라 "내가 만든 순서"에 쌓는다. */
  function pickCard(card) {
    if (isOrderComplete) return
    setPicked((current) => [...current, card])
  }

  /**
   * 쌓인 항목을 누르면 그 자리부터 다시 고른다.
   * 뒤의 것까지 함께 비워야 "그 순번으로 되돌아간다"가 성립한다.
   * 되돌리는 데 벌점이나 경고는 없다.
   */
  function undoFrom(index) {
    setPicked((current) => current.slice(0, index))
  }

  function chooseAnswer(questionIndex, option) {
    setAnswers((current) => {
      const next = [...current]
      next[questionIndex] = option
      return next
    })
  }

  /** 세션을 저장하고 결과 화면으로 넘긴다. */
  function finish(measureGrade) {
    const orderGrade = orderGradeRef.current
    const now = Date.now()

    // 요리는 순서화(+상위 난이도에서 실행기능)만 기록한다. 작업기억은 장보기 몫이다.
    addSessions(
      buildSessions({
        gameId: 'cooking',
        level,
        dateKey: todayKey(),
        now,
        parts: [
          {
            key: 'order',
            domain: '순서화',
            accuracy: orderGrade.accuracy,
            durationSec: orderDurationRef.current,
          },
          ...(measureGrade
            ? [
                {
                  key: 'measure',
                  domain: '실행기능',
                  accuracy: measureGrade.accuracy,
                  durationSec: elapsedSec(measureStartedAt.current),
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
        replayPath: '/training/cooking',
        bridgeText: buildBridgeMissionText(recipe.name),
        headline:
          orderGrade.correctCount === orderGrade.total
            ? '순서를 다 맞히셨어요!'
            : orderGrade.correctCount > 0
              ? '잘하셨어요!'
              : '오늘도 해내셨어요!',
        blocks: [
          {
            kind: 'ordered',
            title: '올바른 순서는 이랬어요',
            items: correctSteps,
            note: `${orderGrade.total}단계 가운데 ${orderGrade.correctCount}단계를 제자리에 놓으셨습니다.`,
          },
          ...(measureGrade
            ? [
                {
                  kind: 'note',
                  title: '재료 계량',
                  lines: [
                    measureGrade.correctCount === measureGrade.total
                      ? '계량 문제도 모두 맞히셨어요.'
                      : `${measureGrade.total}문제 가운데 ${measureGrade.correctCount}문제를 맞히셨어요.`,
                    ...measureGrade.results
                      .filter((item) => !item.isCorrect)
                      .map((item) => `정답은 "${item.answer}" 이었어요.`),
                  ],
                },
              ]
            : []),
        ],
      },
    })
  }

  /** "다 골랐어요" — 여기서 처음 채점한다. */
  function handleConfirmOrder() {
    orderGradeRef.current = gradeOrder(correctSteps, picked)
    orderDurationRef.current = elapsedSec(orderStartedAt.current)

    if (config.hasMeasure) {
      setPhase(PHASES.MEASURE)
      measureStartedAt.current = Date.now()
      return
    }
    finish(null)
  }

  function handleConfirmMeasure() {
    finish(gradeMeasure(measureQuestions, answers))
  }

  /* ---------------- (1) 요리 안내 ---------------- */
  if (phase === PHASES.INTRO) {
    return (
      <GameIntro
        title="요리 순서 맞추기"
        description="만드는 순서를 잠깐 보여 드릴 테니 기억해 주세요."
        recipeName={recipe.name}
        lead={`잠시 뒤 만드는 순서 ${correctSteps.length}단계를 ${config.exposureSec}초 동안 보여 드립니다.`}
        startLabel="요리 순서 맞추기 시작하기"
        onStart={() => setPhase(PHASES.MEMORIZE)}
      />
    )
  }

  /* ---------------- (2) 조리 순서 노출 ---------------- */
  if (phase === PHASES.MEMORIZE) {
    return (
      <>
        <StepProgress current={currentStep} total={totalSteps} />
        <PageTitle description={`${recipe.name} 만드는 순서입니다.`}>
          순서를 기억해 주세요
        </PageTitle>

        <CountdownPanel
          secondsLeft={secondsLeft}
          onSkip={goOrdering}
          skipLabel="다 외웠으니 순서 맞추기로 넘어가기"
        >
          <ol className="space-y-4">
            {correctSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-card border-2 border-primary-200 bg-primary-50 px-4 py-4"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-primary-600 text-body font-bold text-white"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 break-keep break-words text-button font-bold text-primary-800">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </CountdownPanel>
      </>
    )
  }

  /* ---------------- (3) 순서 재현 (드래그 없이 탭으로만) ---------------- */
  if (phase === PHASES.ORDER) {
    return (
      <>
        <StepProgress current={currentStep} total={totalSteps} />
        <PageTitle description={`${recipe.name} 만드는 순서를 다시 만들어 주세요.`}>
          {isOrderComplete
            ? '다 고르셨어요'
            : `${picked.length + 1}번째로 할 일을 골라주세요`}
        </PageTitle>

        <div className="space-y-5">
          <Card title="내가 만든 순서">
            {picked.length > 0 ? (
              <>
                <ol className="space-y-4">
                  {picked.map((step, index) => (
                    <li key={step}>
                      <button
                        type="button"
                        onClick={() => undoFrom(index)}
                        aria-label={`${index + 1}번째 ${step} 빼고 여기부터 다시 고르기`}
                        className={[
                          // "빼기"를 같은 줄에 두면 좁은 화면에서 단계 문구가 쓸 폭이 없어
                          // 글자가 한 줄에 하나씩 세로로 쌓인다. 그래서 아래위 두 줄로 나눈다.
                          // anim-settle: 방금 고른 단계가 아래에서 살짝 올라오며 놓인다.
                          // 내 선택이 목록의 몇 번째에 놓였는지 눈으로 따라가게 하는 것이
                          // 목적이다(마일스톤 8). 280ms, 튕김 없음.
                          'anim-settle flex w-full min-h-touch flex-col gap-2',
                          'rounded-card border-4 border-primary-700 bg-primary-100 px-3 py-4',
                          // text-button: 이 칸도 누를 수 있는 선택지다. 글자 크기를 지정하지
                          // 않으면 본문(20px)을 물려받아 "버튼 24px 이상"(SPEC 3장)에 미달한다.
                          'text-left text-button transition-colors duration-150',
                        ].join(' ')}
                      >
                        <span className="flex w-full items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-primary-700 text-body font-bold text-white"
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 break-keep break-words text-button font-bold text-primary-800">
                            {step}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="self-end text-button font-bold text-primary-700"
                        >
                          빼기
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-body text-muted">
                  잘못 고르셨으면 그 항목을 눌러 주세요. 그 순서부터 다시 고를 수 있습니다.
                </p>
              </>
            ) : (
              <p className="text-body text-muted">
                아래에서 가장 먼저 할 일을 골라 주세요.
              </p>
            )}
          </Card>

          {!isOrderComplete ? (
            <Card title="할 일 목록">
              <ul className="space-y-4">
                {remainingCards.map((card) => (
                  <li key={card}>
                    <button
                      type="button"
                      onClick={() => pickCard(card)}
                      aria-label={`${picked.length + 1}번째로 ${card} 고르기`}
                      className={[
                        'flex w-full min-h-touch items-center gap-3',
                        'rounded-card border-4 border-line bg-surface px-3 py-4',
                        'text-left text-button font-bold text-ink',
                        'transition-colors duration-150',
                      ].join(' ')}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border-2 border-line bg-bg text-body font-bold text-muted"
                      >
                        +
                      </span>
                      <span className="min-w-0 flex-1 break-keep break-words">
                        {card}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <BigButton
            onClick={handleConfirmOrder}
            disabled={!isOrderComplete}
            aria-label="고른 순서로 확인하기"
          >
            {isOrderComplete
              ? '다 골랐어요'
              : `${correctSteps.length - picked.length}개 더 골라 주세요`}
          </BigButton>
        </div>
      </>
    )
  }

  /* ---------------- (4) 재료 계량 (레벨 4 이상) ---------------- */
  const allAnswered = measureQuestions.every((_, index) => answers[index] != null)

  return (
    <>
      <StepProgress current={currentStep} total={totalSteps} />
      <PageTitle description="부엌에서 자주 마주치는 계산입니다.">재료 계량</PageTitle>

      <div className="space-y-5">
        {measureQuestions.map((question, questionIndex) => (
          <Card key={question.key}>
            <p className="break-keep text-lead font-bold text-ink">
              {question.text}
            </p>

            <div className="mt-5 space-y-4">
              {question.options.map((option) => (
                <ChoiceButton
                  key={option}
                  selected={answers[questionIndex] === option}
                  onClick={() => chooseAnswer(questionIndex, option)}
                >
                  {option}
                </ChoiceButton>
              ))}
            </div>
          </Card>
        ))}

        <BigButton
          onClick={handleConfirmMeasure}
          disabled={!allAnswered}
          aria-label="고른 답으로 계량 문제 마치기"
        >
          {allAnswered ? '다 골랐어요' : '두 문제 모두 골라 주세요'}
        </BigButton>
      </div>
    </>
  )
}
