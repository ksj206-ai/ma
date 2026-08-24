import { RECIPES } from '../lib/recipes.js'
import { objectParticle } from '../lib/korean.js'
import { resolveLevelConfig, shuffle } from './gameCommon.js'

/*
 * 요리 순서 맞추기의 순수 로직 (화면 없음) — SPEC 6.2 / 마일스톤 4
 *
 * 레벨 clamp · 섞기 · 세션 레코드 생성은 장보기와 공통이라 gameCommon.js 에 있다.
 *
 * 난이도 레버(SPEC 6.2): 단계 수 · 노출 시간 · 방해 단계 수 · 재료 계량 포함 여부
 * ※ levels 에 저장된 값을 읽어 쓰기만 한다. 적응형 조정은 마일스톤 5.
 */
export const COOKING_LEVELS = {
  1: { stepCount: 3, exposureSec: 10, distractors: 0, hasMeasure: false },
  2: { stepCount: 4, exposureSec: 9, distractors: 0, hasMeasure: false },
  3: { stepCount: 4, exposureSec: 8, distractors: 1, hasMeasure: false },
  4: { stepCount: 5, exposureSec: 6, distractors: 2, hasMeasure: true },
  5: { stepCount: 6, exposureSec: 5, distractors: 3, hasMeasure: true },
}

/** 계량 과제 문항 수. 0점 아니면 100점이 되지 않도록 2문항으로 둔다. */
export const MEASURE_QUESTION_COUNT = 2

export function getLevelConfig(level) {
  return resolveLevelConfig(level, COOKING_LEVELS)
}

/**
 * 한 판을 구성한다.
 *
 * 조리 순서는 반드시 앞에서부터 이어지는 구간으로 자른다.
 * 중간을 건너뛰고 뽑으면 "올바른 순서"라는 것 자체가 성립하지 않기 때문이다.
 */
export function buildRound(level, rng = Math.random) {
  const config = getLevelConfig(level)

  const roomy = RECIPES.filter((recipe) => recipe.steps.length >= config.stepCount)
  const pool = roomy.length > 0 ? roomy : RECIPES
  const recipe = pool[Math.floor(rng() * pool.length)]

  const stepCount = Math.min(config.stepCount, recipe.steps.length)
  const correctSteps = recipe.steps.slice(0, stepCount)

  // 방해 단계는 그 요리에 어울리지 않는 문장으로. 실제 단계와 겹치지 않게 거른다.
  const distractors = shuffle(
    recipe.distractorSteps.filter((text) => !correctSteps.includes(text)),
    rng
  ).slice(0, config.distractors)

  return {
    config,
    recipe,
    correctSteps,
    // 고를 카드 더미. 정답과 방해 단계를 섞어 둔다.
    cards: shuffle([...correctSteps, ...distractors], rng),
    measureQuestions: config.hasMeasure ? buildMeasureQuestions(recipe, rng) : null,
  }
}

/**
 * 순서 채점.
 * 자리마다 맞았는지로 센다. 방해 단계를 골랐다면 그 자리는 자동으로 틀린 자리가 된다.
 */
export function gradeOrder(correctSteps, pickedSteps) {
  const placements = correctSteps.map((step, index) => ({
    position: index + 1,
    correctStep: step,
    pickedStep: pickedSteps[index] ?? null,
    isCorrect: pickedSteps[index] === step,
  }))

  const correctCount = placements.filter((item) => item.isCorrect).length
  return {
    placements,
    correctCount,
    total: correctSteps.length,
    accuracy: correctSteps.length === 0 ? 0 : correctCount / correctSteps.length,
  }
}

/*
 * 재료 계량 미니과제 (레벨 4 이상).
 *
 * 추상적인 분수 문제("2와 1/2은?")로 만들지 않는다.
 * 실제 재료 이름을 넣어 부엌에서 마주치는 상황으로 묻는다.
 * 정답은 계산을 해야 나오도록 하고, 보기는 그럴듯한 값으로 채운다.
 */
/*
 * 재료마다 부엌에서 쓰는 단위가 다르다.
 * 아무 재료나 넣으면 "마늘 두 컵", "김을 한 큰술" 같은 말이 안 되는 문항이 나오므로
 * 문항 유형별로 어울리는 재료만 쓰도록 갈래를 나눠 둔다.
 */
const SEASONING = new Set(['간장', '된장', '고춧가루', '참기름', '마늘', '소금', '설탕', '새우젓'])
const WEIGHED = new Set([
  '소고기', '돼지고기', '콩나물', '시금치', '당근', '감자', '양파',
  '두부', '당면', '떡국떡', '미역', '김치', '버섯', '애호박', '배', '대파',
])

const MEASURE_TEMPLATES = [
  {
    // 물은 어느 요리에나 들어가므로 요리 이름에 붙여 묻는다.
    key: 'half',
    pick: () => true,
    build: (recipe) => ({
      text: `${recipe.name}에 물 두 컵이 들어갑니다. 오늘은 절반만 만들려고 하면 몇 컵을 부을까요?`,
      answer: '1컵',
      options: ['반 컵', '1컵', '1컵 반', '2컵'],
    }),
  },
  {
    key: 'scoop',
    pick: () => true,
    build: (recipe) => ({
      text: `${recipe.name}에 물 한 컵 반을 부어야 합니다. 반 컵짜리 컵으로는 몇 번 부으면 될까요?`,
      answer: '3번',
      options: ['2번', '3번', '4번', '5번'],
    }),
  },
  {
    key: 'double',
    pick: () => true,
    build: (recipe) => ({
      text: `${recipe.name}에 물 한 컵 반이 들어갑니다. 두 배로 만들면 몇 컵이 필요할까요?`,
      answer: '3컵',
      options: ['2컵', '2컵 반', '3컵', '4컵'],
    }),
  },
  {
    // 양념은 큰술·작은술로 잰다 (1큰술 = 3작은술)
    key: 'spoon',
    pick: (ingredient) => SEASONING.has(ingredient.name),
    build: (recipe, ingredient) => ({
      text: `${ingredient.name}${objectParticle(ingredient.name)} 한 큰술 넣어야 합니다. 작은술로는 몇 번 넣으면 될까요?`,
      answer: '3번',
      options: ['2번', '3번', '4번', '6번'],
    }),
  },
  {
    // 무게로 파는 재료는 그램·봉지로 묻는다
    key: 'bag',
    pick: (ingredient) => WEIGHED.has(ingredient.name),
    build: (recipe, ingredient) => ({
      text: `${ingredient.name} 300그램이 필요합니다. 한 봉지에 100그램씩 들었다면 몇 봉지를 사야 할까요?`,
      answer: '3봉지',
      options: ['1봉지', '2봉지', '3봉지', '4봉지'],
    }),
  },
]

export function buildMeasureQuestions(recipe, rng = Math.random) {
  const ingredients = shuffle(recipe.ingredients, rng)

  // 그 요리의 재료로 만들 수 있는 문항만 남긴다.
  // (예: 떡국에는 양념 재료가 없으므로 큰술 문항은 빠진다)
  const usable = MEASURE_TEMPLATES.map((template) => ({
    template,
    ingredient: ingredients.find((item) => template.pick(item)) || null,
  })).filter((entry) => entry.template.pick.length === 0 || entry.ingredient !== null)

  return shuffle(usable, rng)
    .slice(0, MEASURE_QUESTION_COUNT)
    .map(({ template, ingredient }) => {
      const question = template.build(recipe, ingredient)
      return {
        key: template.key,
        text: question.text,
        answer: question.answer,
        options: shuffle(question.options, rng),
      }
    })
}

/** 계량 과제 채점. 2문항이므로 정확도는 0 / 0.5 / 1 이 된다. */
export function gradeMeasure(questions, answers) {
  const results = questions.map((question, index) => ({
    text: question.text,
    answer: question.answer,
    picked: answers[index] ?? null,
    isCorrect: answers[index] === question.answer,
  }))

  const correctCount = results.filter((item) => item.isCorrect).length
  return {
    results,
    correctCount,
    total: questions.length,
    accuracy: questions.length === 0 ? 0 : correctCount / questions.length,
  }
}

/** 결과 화면에서 제안할 실행 브리지 미션 문구 (SPEC 6.2 실행 브리지) */
export function buildBridgeMissionText(recipeName) {
  return `오늘 실제로 ${recipeName}${objectParticle(recipeName)} 만들어 가족과 나눠 드시기`
}
