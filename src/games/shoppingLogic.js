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
 *   성적에 따라 레벨을 올리고 내리는 적응형 조정은 마일스톤 5 에서 붙인다.
 */
export const SHOPPING_LEVELS = {
  1: { listLength: 3, exposureSec: 8, distractors: 3, hasChange: false },
  2: { listLength: 4, exposureSec: 7, distractors: 4, hasChange: false },
  3: { listLength: 4, exposureSec: 6, distractors: 6, hasChange: false },
  4: { listLength: 5, exposureSec: 5, distractors: 8, hasChange: true },
  5: { listLength: 6, exposureSec: 4, distractors: 9, hasChange: true },
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
 * 계산대 문제 (레벨 4 이상).
 * 합계보다 큰 가장 가까운 만 원 단위 지폐를 내는 것으로 한다.
 * (합계가 만 원을 넘는데 "만 원 내면"이라고 물으면 거스름돈이 음수가 되어 말이 안 된다)
 */
export function buildChangeQuestion(targets, rng = Math.random) {
  const total = targets.reduce((sum, item) => sum + item.price, 0)
  const bill = (Math.floor(total / 10000) + 1) * 10000
  const answer = bill - total

  const options = new Set([answer])
  for (const offset of [1000, -1000, 100, -100, 2000, -2000, 500, -500]) {
    if (options.size >= 4) break
    const candidate = answer + offset
    if (candidate > 0 && candidate < bill) options.add(candidate)
  }

  return { total, bill, answer, options: shuffle([...options], rng) }
}

/** 결과 화면에서 제안할 실행 브리지 미션 문구 (SPEC 6.2 실행 브리지) */
export function buildBridgeMissionText(recipeName) {
  return `오늘 저녁에 ${recipeName}${objectParticle(recipeName)} 직접 만들어 가족과 나눠 먹기`
}
