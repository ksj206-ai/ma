/*
 * 게임 표시용 메타데이터.
 * 마일스톤 2 에서는 홈의 "오늘의 추천 훈련" 카드와 시드 데이터가 같은 이름을 쓰기 위한 최소 정보만 둔다.
 * 실제 게임 구현(장보기·요리)은 마일스톤 3~4 에서 붙는다.
 *
 * domains 는 SPEC 7장의 영역명을 그대로 쓴다.
 *   작업기억 · 계산 · 전망기억 · 공간기억 · 순서화 · 실행기능
 */
export const GAMES = {
  shopping: {
    id: 'shopping',
    name: '장보기 미션',
    summary: '살 것을 기억했다가 진열대에서 찾아 담아요.',
    domains: ['작업기억', '계산'],
  },
  cooking: {
    id: 'cooking',
    name: '요리 순서 맞추기',
    summary: '요리하는 순서를 차례대로 골라 봐요.',
    domains: ['순서화', '실행기능', '작업기억'],
  },
}

export function getGame(gameId) {
  return GAMES[gameId] || null
}
