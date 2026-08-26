/**
 * 앱 전체에서 쓰는 기본 버튼.
 * 접근성 규칙(SPEC 3장)을 컴포넌트 하나에 고정해 둔다.
 *  - 최소 높이 64px (min-h-touch)
 *  - 글자 24px (text-button)
 *  - hover 가 아니라 상태 기반 스타일 / 명확한 포커스 표시
 *  - 반드시 <button> 태그
 */
const VARIANTS = {
  primary: 'bg-primary-600 text-white border-primary-700 active:bg-primary-700',
  secondary:
    'bg-surface text-primary-700 border-primary-300 active:bg-primary-50',
  // 데이터 초기화처럼 되돌릴 수 없는 행동에만 쓴다 (설정 화면).
  danger: 'bg-surface text-danger border-danger active:bg-red-50',
}

export default function BigButton({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex w-full items-center justify-center gap-3',
        'min-h-touch rounded-card border-4 px-6 py-4',
        'text-button font-bold',
        'transition-colors duration-150',
        'disabled:opacity-60',
        VARIANTS[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
