import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import Card from './Card.jsx'
import { useUiStore } from '../store/useUiStore.js'

/*
 * 차트 선 색 (마일스톤 7 접근성 점검).
 * 축선은 그래프의 구조라 WCAG 1.4.11 의 비텍스트 대비 3:1 을 지켜야 해서 primary-400
 * (흰 카드 위 4.09:1)을 쓴다. 안쪽 눈금 격자는 값을 읽는 데 쓰이지 않는 장식이고
 * (횟수·점수는 차트 아래 목록에 글자로 항상 나온다) 진하면 오히려 그래프를 가려서
 * 옅은 line(#C9D4E4)을 그대로 둔다.
 */
/*
 * isAnimationActive={false} (마일스톤 7 점검에서 잡은 버그)
 *
 * Recharts 는 기본으로 그래프를 "자라나는" 애니메이션으로 그린다. 그런데 이 앱에서는
 * 그 애니메이션이 첫 프레임에서 멈춰 버렸다. 레이더는 반지름 0(가운데 점 하나)에
 * 머물러 사실상 보이지 않았고, 홈의 기능 프로파일 차트가 마일스톤 5부터 줄곧 그 상태였다.
 * 실제 렌더된 도형의 반지름을 재 보고서야 발견했다 — 화면만 보면 "그래프가 좀 작네"로
 * 넘어가기 쉬운 종류의 버그다.
 *
 * 애니메이션을 끄면 처음부터 최종 모양으로 그려져 문제가 사라진다. 애초에 SPEC 3장이
 * "애니메이션은 절제하고 느리게", 12장이 "과도한 애니메이션 금지"라고 못 박은 만큼,
 * 고령자용 화면에서 차트가 스스로 자라날 이유도 없다.
 */

const AXIS_LINE = '#4F7FC0'
const GRID_LINE = '#C9D4E4'

/*
 * 누적 훈련 횟수 (SPEC 8장) — 마일스톤 7. 가족 화면에서만 쓴다.
 *
 * 마일스톤 6에서는 "주별 훈련 횟수"를 그렸다. 라벨도 색도 중립으로 뒀지만, 바쁜 주
 * 다음의 짧아진 막대는 그 자체로 "줄었다"로 읽힌다. 보호자 화면에서 그 오독은
 * 그냥 오독으로 끝나지 않는다(SPEC 4·8장). 그래서 누적으로 바꿨다 — 누적 막대는
 * 내려갈 수 없고, 쉰 주는 짧아지는 대신 평평해진다.
 *
 * 지키는 규칙
 *  - 막대 색은 주마다 똑같다. 목표선·기준선을 두지 않는다.
 *  - hover 로만 보이는 정보를 만들지 않는다 — 횟수는 차트 아래 목록에 글자로도 보인다.
 *  - 가로 막대(layout="vertical")를 쓴다. 한국어 라벨을 세로축에 두면 폭이 좁아도
 *    글자가 겹치지 않고, "글자 크게"로 커져도 막대 높이만 늘어난다.
 */
export default function CumulativeTrainingChart({ cumulative }) {
  const largeText = useUiStore((state) => state.largeText)
  const scale = largeText ? 1.25 : 1

  const rows = cumulative?.rows || []

  return (
    <Card title="지금까지 함께한 훈련" description="한 번 하실 때마다 하나씩 쌓입니다.">
      <p className="text-[1.6em] font-bold leading-none text-primary-700">
        {cumulative.total}회
      </p>
      <p className="mt-3 text-body text-ink">{cumulative.sentence}</p>

      {cumulative.show ? (
        <>
          {/* key={scale} · overflow-x-auto 이유는 ProfileChart 주석 참고. */}
          <div aria-hidden="true" className="mt-6 overflow-x-auto">
            <ResponsiveContainer
              key={scale}
              width="100%"
              height={Math.max(Math.round(140 * scale), rows.length * Math.round(66 * scale))}
            >
              <BarChart data={rows} accessibilityLayer={false} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
                <CartesianGrid horizontal={false} stroke={GRID_LINE} />
                <XAxis
                  type="number"
                  // 0에서 시작해 실제 최댓값에서 끝나게 못 박는다. 맡겨 두면 눈금이
                  // "5, 20"처럼 0도 최댓값도 아닌 값 두 개만 찍히는 경우가 있다.
                  domain={[0, 'dataMax']}
                  tickCount={4}
                  allowDecimals={false}
                  tick={{ fontSize: Math.round(20 * scale), fill: '#3D4A63' }}
                  axisLine={{ stroke: AXIS_LINE }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={Math.round(96 * scale)}
                  tick={{ fontSize: Math.round(20 * scale), fontWeight: 700, fill: '#111C33' }}
                  axisLine={{ stroke: AXIS_LINE }}
                  tickLine={false}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="count"
                  fill="#1F4B87"
                  radius={[0, 8, 8, 0]}
                  barSize={Math.round(26 * scale)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-5 space-y-2">
            {rows.map((row) => (
              <li
                key={row.weekStart}
                className="flex items-center justify-between gap-4 text-body text-ink"
              >
                <span className="font-bold">{row.label}까지</span>
                <span className="font-bold text-primary-700">{row.count}회</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Card>
  )
}
