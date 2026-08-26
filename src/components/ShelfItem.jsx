/**
 * 마트 진열대의 품목 한 칸.
 *
 * 접근성 규칙(SPEC 3.1)
 *  - native <button> 이므로 Tab 이동 + Enter 실행이 된다. (div onClick 금지)
 *  - 담긴 상태는 hover 가 아니라 색 + 테두리 + 체크 아이콘 + 글자("담음") 네 가지로 동시에 표시한다.
 *  - 테두리는 항상 4px 로 두고 색만 바꾼다. 담을 때 칸 크기가 흔들리지 않게 하기 위해서다.
 *  - 좁은 화면(360px) + 글자 크게(1.25배)에서도 두 칸이 들어가도록 세로로 쌓는다.
 *
 * 마일스톤 1 토큰만 사용한다: min-h-touch / text-button / rounded-card / primary·line·ink
 */
export default function ShelfItem({ name, picked, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      aria-label={picked ? `${name} 빼기` : `${name} 담기`}
      // 이벤트를 그대로 넘긴다 — 부모가 이 버튼의 위치를 재서 "장바구니로 이동" 효과의
      // 출발점으로 쓴다(마일스톤 8). 효과가 없어도 담기 자체는 그대로 동작한다.
      onClick={onToggle}
      className={[
        'flex w-full min-h-touch flex-col items-center justify-center gap-2',
        'rounded-card border-4 px-2 py-4 text-button font-bold',
        'text-center leading-tight transition-colors duration-150',
        picked
          ? 'border-primary-700 bg-primary-100 text-primary-800'
          : 'border-line bg-surface text-ink',
      ].join(' ')}
    >
      {/*
        break-keep(word-break: keep-all)을 쓰지 않는다.
        360px 화면 + 글자 크게에서는 두 칸으로 나뉘어 한 칸이 좁아지는데,
        낱말을 통째로 유지하면 "고춧가루" 같은 긴 이름이 칸 밖으로 삐져나간다.
        줄바꿈을 허용해 두 줄로 접히게 하는 편이 안전하다.
      */}
      <span>{name}</span>
      <span
        className={[
          'flex w-full items-center justify-center gap-1 rounded-pill px-1 py-1',
          'text-body font-bold',
          picked ? 'bg-primary-700 text-white' : 'bg-primary-50 text-primary-700',
        ].join(' ')}
      >
        <span aria-hidden="true">{picked ? '✓' : '+'}</span>
        <span>{picked ? '담음' : '담기'}</span>
      </span>
    </button>
  )
}
