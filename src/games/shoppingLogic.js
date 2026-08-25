import { RECIPES } from '../lib/recipes.js'
import { objectParticle } from '../lib/korean.js'
import { resolveLevelConfig, shuffle } from './gameCommon.js'

/*
 * 장보기 게임의 순수 로직 (화면 없음).
 * React 밖에서 그대로 검증할 수 있도록 UI 와 분리해 둔다.
 *
 * 레벨 clamp · 섞기 · 세션 레코드 생성은 요리 게임과 공통이므로 gameCommon.js 에 있다.
 *
 * 난이도(SPEC 6.1 난이도 레버: 목록 길이 · 노출 시간 · 잔돈 계산 유무 · 방해 품목 수)
 * ※ 여기서는 levels 에 저장된 값을 "읽어 쓰기만" 한다.
 *   성적에 따라 레벨을 올리고 내리는 적응형 조정은 lib/adaptive.js 에 있다.
 */
/*
 * changeCount: 계산대 문항 수 (마일스톤 5 — 문항 1개면 정확도가 0 또는 100으로만
 *   나와 기능 프로파일이 의미 있는 값을 만들지 못한다).
 * changeStep: 내는 돈의 단위. 총액은 recipes.js 가격표가 전부 100원 단위라 항상
 *   100원 단위로 떨어진다. 같은 영수증에 여러 문항을 내려고 낸 돈을 changeStep 씩
 *   올려 가며 묻는다(자세한 계산은 buildChangeQuestions 참고).
 *   - 레벨 4는 1,000원권 단위: 첫 문항은 잔돈이 백 원대(1,000원 미만)로 끊기고,
 *     쉬운 자릿수에서 시작한다.
 *   - 레벨 5는 10,000원권 단위: 첫 문항부터 잔돈이 천 원대 이상이라 백 원대
 *     잔돈까지 포함해 받아내림이 필요해 더 어렵다.
 *   두 레벨 모두 문항이 이어질수록 액수가 changeStep 만큼씩 더 커지므로,
 *   레벨 안에서도 뒤 문항이 앞 문항보다 살짝 더 크다.
 */
export const SHOPPING_LEVELS = {
  1: { listLength: 3, exposureSec: 8, distractors: 3, changeCount: 0, changeStep: 0 },
  2: { listLength: 4, exposureSec: 7, distractors: 4, changeCount: 0, changeStep: 0 },
  3: { listLength: 4, exposureSec: 6, distractors: 6, changeCount: 0, changeStep: 0 },
  4: { listLength: 5, exposureSec: 5, distractors: 8, changeCount: 2, changeStep: 1000 },
  5: { listLength: 6, exposureSec: 4, distractors: 9, changeCount: 3, changeStep: 10000 },
}

/** 저장된 레벨이 없거나 이상한 값이어도 항상 유효한 설정을 돌려준다. */
export function getLevelConfig(level) {
  return resolveLevelConfig(level, SHOPPING_LEVELS)
}

/**
 * 한 판을 구성한다.
 * 장바구니 목록은 반드시 recipes.js 에서 꺼내 만들고(SPEC 6.1),
 * 방해 품목도 "다른 요리의 재료"에서 가져온다 — 마트에 있을 법한 물건이어야 하기 때문이다.
 */
export function buildRound(level, rng = Math.random) {
  const config = getLevelConfig(level)

  // 목록 길이를 채울 수 있는 요리를 먼저 찾는다. 없으면 전체에서 고르고 길이를 줄인다.
  const roomy = RECIPES.filter((recipe) => recipe.ingredients.length >= config.listLength)
  const pool = roomy.length > 0 ? roomy : RECIPES
  const recipe = pool[Math.floor(rng() * pool.length)]

  const targetCount = Math.min(config.listLength, recipe.ingredients.length)
  const targets = shuffle(recipe.ingredients, rng).slice(0, targetCount)
  const targetNames = new Set(targets.map((item) => item.name))

  // 다른 요리의 재료 중 정답과 겹치지 않는 것들 (이름 기준 중복 제거)
  const distractorPool = []
  const seen = new Set(targetNames)
  for (const other of RECIPES) {
    if (other.id === recipe.id) continue
    for (const item of other.ingredients) {
      if (seen.has(item.name)) continue
      seen.add(item.name)
      distractorPool.push(item)
    }
  }

  const distractors = shuffle(distractorPool, rng).slice(0, config.distractors)

  return {
    config,
    recipe,
    targets,
    shelf: shuffle([...targets, ...distractors], rng),
  }
}

/**
 * 채점. 오답을 담았다고 벌점을 주지는 않지만,
 * 정확도에는 반영해야 "아무거나 다 담기"가 만점이 되지 않는다.
 */
export function gradeCart(targets, cartNames) {
  const cart = new Set(cartNames)
  const targetNames = targets.map((item) => item.name)

  const correct = targetNames.filter((name) => cart.has(name))
  const missed = targetNames.filter((name) => !cart.has(name))
  const extra = [...cart].filter((name) => !targetNames.includes(name))

  const denominator = targetNames.length + extra.length
  const accuracy = denominator === 0 ? 0 : correct.length / denominator

  return { correct, missed, extra, accuracy, total: targetNames.length }
}

/**
 * 계산대 문제 (레벨 4 이상). 같은 영수증(총액)을 두고 여러 금액을 냈다면
 * 잔돈이 얼마인지를 config.changeCount 개 만큼 서로 다른 문제로 낸다.
 * 내는 돈은 항상 총액보다 큰 config.changeStep 의 배수 중 가장 작은 것부터 차례로 쓴다.
 * (총액을 넘지 않는 돈을 냈다고 물으면 거스름돈이 음수가 되어 말이 안 된다)
 */
export function buildChangeQuestions(targets, config, rng = Math.random) {
  const total = targets.reduce((sum, item) => sum + item.price, 0)
  const { changeCount, changeStep } = config
  const firstBill = (Math.floor(total / changeStep) + 1) * changeStep
  const optionSpread = changeStep / 10

  return Array.from({ length: changeCount }, (_, index) => {
    const bill = firstBill + changeStep * index
    const answer = bill - total

    const options = new Set([answer])
    for (const multiple of [1, -1, 2, -2, 3, -3, 5, -5]) {
      if (options.size >= 4) break
      const candidate = answer + optionSpread * multiple
      if (candidate > 0 && candidate < bill) options.add(candidate)
    }

    return { total, bill, answer, options: shuffle([...options], rng) }
  })
}

/** 계산대 채점. 문항이 여럿이라 정확도가 0/100 둘로만 나오지 않는다. */
export function gradeChangeQuestions(questions, choices) {
  const results = questions.map((question, index) => ({
    bill: question.bill,
    answer: question.answer,
    picked: choices[index] ?? null,
    isCorrect: choices[index] === question.answer,
  }))

  const correctCount = results.filter((item) => item.isCorrect).length
  return {
    total: questions.length,
    correctCount,
    results,
    accuracy: questions.length === 0 ? 0 : correctCount / questions.length,
  }
}

/** 결과 화면에서 제안할 실행 브리지 미션 문구 (SPEC 6.2 실행 브리지) */
export function buildBridgeMissionText(recipeName) {
  return `오늘 저녁에 ${recipeName}${objectParticle(recipeName)} 직접 만들어 가족과 나눠 먹기`
}
