import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import Card from './Card.jsx'
import { useUiStore } from '../store/useUiStore.js'

/*
 * 주별 훈련 횟수 추이 (SPEC 8장) — 마일스톤 6. 가족 화면에서만 쓴다.
 *
 * 지키는 규칙 (SPEC 4장)
 *  - 막대 색은 주마다 똑같다. 적은 주를 빨강·경고 아이콘으로 구분하지 않는다.
 *  - 오르내림에 해석 라벨을 붙이지 않는다. 숫자와 막대 길이만 둔다.
 *  - hover 로만 보이는 정보를 만들지 않는다 — 횟수는 차트 아래 목록에 글자로도 보인다.
 *
 * 가로 막대(layout="vertical")를 쓰는 이유는 ProfileChart 와 같다. 한국어 라벨을 세로축에
 * 두면 폭이 좁아도 글자가 겹치지 않고, "글자 크게"로 커져도 막대 높이만 늘어난다.
 */
export default function WeeklyTrendChart({ rows }) {
  const largeText = useUiStore((state) => state.largeText)
  const scale = largeText ? 1.25 : 1

  if (!rows || rows.length === 0) return null

  const tickFontSize = Math.round(20 * scale)
  const yAxisWidth = Math.round(96 * scale)
  const barSize = Math.round(26 * scale)
  const height = Math.max(Math.round(140 * scale), rows.length * Math.round(66 * scale))

  return (
    <Card title="주별 훈련 흐름" description="주마다 몇 번 하셨는지 모아 본 것이에요.">
      {/* key={scale} · overflow-x-auto 이유는 ProfileChart 주석 참고. */}
      <div className="overflow-x-auto">
        <ResponsiveContainer key={scale} width="100%" height={height}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="#C9D4E4" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: tickFontSize, fill: '#3D4A63' }}
              axisLine={{ stroke: '#C9D4E4' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={yAxisWidth}
              tick={{ fontSize: tickFontSize, fontWeight: 700, fill: '#111C33' }}
              axisLine={{ stroke: '#C9D4E4' }}
              tickLine={false}
            />
            <Bar dataKey="count" fill="#1F4B87" radius={[0, 8, 8, 0]} barSize={barSize} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-5 space-y-2">
        {rows.map((row) => (
          <li key={row.weekStart} className="flex items-center justify-between gap-4 text-body text-ink">
            <span className="font-bold">{row.label}</span>
            <span className="font-bold text-primary-700">{row.count}회</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
