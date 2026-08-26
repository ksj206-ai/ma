import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
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
 * 이번 주 활동 영역 (SPEC 8장) — 마일스톤 7. 가족 화면에서만 쓴다.
 *
 * ProfileChart(홈)와 그림은 닮았지만 축에 얹는 값이 다르다.
 *   홈   = 영역별 0~100 점수 (본인이 자기 흐름을 보는 자리)
 *   가족 = 영역별 이번 주 훈련 횟수 (보호자가 활동을 보는 자리)
 * 보호자에게 점수를 보여 주면 "몇 점짜리 상태인가"로 읽히고, 그건 우리가 하지 않기로 한
 * 판정이다(SPEC 4장). 횟수 축은 짧아도 "이 영역을 덜 하셨다"까지만 말한다.
 *
 * 지키는 규칙 (ProfileChart 와 동일)
 *  - 실제 기록이 있는 영역만 축으로 그린다. 영역 목록을 코드에 고정하지 않는다.
 *  - 축 3개 이하는 막대, 4개 이상은 레이더.
 *  - 색만으로 정보를 전달하지 않는다. 횟수는 차트 아래 목록에 글자로도 항상 보인다.
 *  - 축마다 색을 달리하지 않는다. 많고 적음에 좋고 나쁨을 붙이지 않기 위해서다.
 *  - "글자 크게" 는 rem 이 아닌 Recharts 숫자 props 에 직접 곱해 준다.
 */
export default function ActivityMixChart({ activity }) {
  const largeText = useUiStore((state) => state.largeText)
  const scale = largeText ? 1.25 : 1

  const rows = activity?.rows || []

  return (
    <Card
      title="이번 주 활동 영역"
      description="이번 주에 어떤 활동을 하셨는지 영역별 횟수로 보여 드려요."
    >
      {rows.length > 0 ? (
        <>
          <p className="text-lead font-bold text-ink">{activity.sentence}</p>

          <div className="mt-5">
            {rows.length <= 3 ? (
              <BarMix rows={rows} scale={scale} />
            ) : (
              <RadarMix rows={rows} scale={scale} />
            )}
          </div>

          <ul className="mt-5 space-y-2">
            {rows.map((row) => (
              <li
                key={row.domain}
                className="flex items-center justify-between gap-4 text-body text-ink"
              >
                <span className="font-bold">{row.domain}</span>
                <span className="font-bold text-primary-700">{row.count}회</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-body text-ink">{activity.sentence}</p>
      )}
    </Card>
  )
}

/* key={scale} · overflow-x-auto 이유는 ProfileChart 주석 참고. */
function BarMix({ rows, scale }) {
  return (
    <div aria-hidden="true" className="overflow-x-auto">
      <ResponsiveContainer
        key={scale}
        width="100%"
        height={Math.max(Math.round(140 * scale), rows.length * Math.round(72 * scale))}
      >
        <BarChart data={rows} accessibilityLayer={false} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID_LINE} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: Math.round(20 * scale), fill: '#3D4A63' }}
            axisLine={{ stroke: AXIS_LINE }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="domain"
            width={Math.round(108 * scale)}
            tick={{ fontSize: Math.round(20 * scale), fontWeight: 700, fill: '#111C33' }}
            axisLine={{ stroke: AXIS_LINE }}
            tickLine={false}
          />
          <Bar isAnimationActive={false} dataKey="count" fill="#1F4B87" radius={[0, 8, 8, 0]} barSize={Math.round(28 * scale)} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RadarMix({ rows, scale }) {
  // 축 상한은 이번 주 최다 횟수. 고정 상한(예: 10회)을 두면 열심히 하신 주에도
  // 도형이 작게 나와 "적게 했다"로 보인다.
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <div aria-hidden="true" className="overflow-x-auto">
      <ResponsiveContainer key={scale} width="100%" height={Math.round(300 * scale)}>
        <RadarChart data={rows} accessibilityLayer={false} outerRadius="62%" margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
          <PolarGrid stroke={GRID_LINE} />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fontSize: Math.round(20 * scale), fontWeight: 700, fill: '#111C33' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, max]}
            allowDecimals={false}
            tickCount={Math.min(max + 1, 5)}
            tick={{ fontSize: Math.round(14 * scale), fill: '#3D4A63' }}
            axisLine={false}
          />
          <Radar isAnimationActive={false} dataKey="count" stroke="#1F4B87" fill="#1F4B87" fillOpacity={0.35} strokeWidth={3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
