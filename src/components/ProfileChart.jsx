import { useMemo } from 'react'
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
import { computeDomainProfiles, MIN_SESSIONS_FOR_SCORE } from '../lib/profile.js'
import { useUiStore } from '../store/useUiStore.js'

/*
 * 기능 프로파일 차트 (SPEC 7장) — 마일스톤 5. 홈·가족 화면이 함께 쓴다.
 *
 * 지키는 규칙
 *  - 실제 세션이 있는 영역만 축으로 그린다(영역 목록을 고정하지 않는다 — lib/profile.js).
 *  - 축 3개 이하는 막대, 4개 이상은 레이더로 자동 판정한다.
 *  - hover 로만 보이는 정보를 만들지 않는다. 점수는 차트 아래 목록에 숫자로도 항상 보인다
 *    (색만으로 정보를 전달하지 말 것 — SPEC 3장).
 *  - 표본이 적은 영역은 점수를 만들어 내지 않고 "기록이 적어요"로만 보여준다(SPEC 4장:
 *    적은 데이터로 등급을 매기지 않는다).
 *  - "글자 크게"가 켜지면 rem 기반 CSS는 저절로 커지지만, Recharts 에 넘기는 폰트 크기·
 *    축 너비는 숫자(px)라 자동으로 따라오지 않는다. 그래서 largeText 값을 직접 읽어
 *    같은 1.25배를 수동으로 곱해 준다.
 *
 * 마일스톤 6: 제목·설명만 화면별로 바꿔 끼울 수 있게 열어 두었다. 가족 화면은 보호자가
 * 보는 자리라 "기능 프로파일"보다 활동 요약처럼 읽히는 제목이 맞기 때문이다(SPEC 4장).
 * 계산과 차트는 그대로 하나를 쓴다 — 화면마다 다른 점수가 나오면 안 된다.
 */
const DEFAULT_TITLE = '기능 프로파일'
const DEFAULT_DESCRIPTION =
  '영역별로 요즘 어떻게 해내고 계신지 보여 드려요. 쉬셨다고 내려가지 않아요.'

export default function ProfileChart({
  sessions,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}) {
  const largeText = useUiStore((state) => state.largeText)
  const scale = largeText ? 1.25 : 1

  const profiles = useMemo(() => computeDomainProfiles(sessions), [sessions])
  const ready = profiles.filter((item) => item.status === 'ready')
  const few = profiles.filter((item) => item.status === 'few')

  if (profiles.length === 0) {
    return (
      <Card title={title}>
        <p className="text-body text-muted">훈련을 시작하면 여기에 기록이 모여요.</p>
      </Card>
    )
  }

  return (
    <Card title={title} description={description}>
      {ready.length > 0 ? (
        <>
          {ready.length <= 3 ? (
            <BarProfile data={ready} scale={scale} />
          ) : (
            <RadarProfile data={ready} scale={scale} />
          )}

          <ul className="mt-5 space-y-2">
            {ready.map((item) => (
              <li
                key={item.domain}
                className="flex items-center justify-between gap-4 text-body text-ink"
              >
                <span className="font-bold">{item.domain}</span>
                <span className="font-bold text-primary-700">{item.score}점</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-body text-muted">조금 더 해보시면 이 자리에 그래프로 보여 드릴게요.</p>
      )}

      {few.length > 0 ? (
        <ul
          className={[
            'space-y-2',
            ready.length > 0 ? 'mt-5 border-t-2 border-line pt-5' : '',
          ].join(' ')}
        >
          {few.map((item) => (
            <li key={item.domain} className="text-body text-muted">
              <span className="font-bold text-ink">{item.domain}</span>
              {' · 아직 기록이 적어요 ('}
              {item.count}/{MIN_SESSIONS_FOR_SCORE}회)
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}

function BarProfile({ data, scale }) {
  const tickFontSize = Math.round(20 * scale)
  const yAxisWidth = Math.round(108 * scale)
  const barSize = Math.round(28 * scale)
  const height = Math.max(Math.round(140 * scale), data.length * Math.round(72 * scale))

  return (
    // key={scale}: "글자 크게" 를 켜고 끄면 카드 폭이 rem 단위로 바뀌는데, Recharts 는
    // 처음 잰 픽셀 크기를 들고 있다가 그 뒤의 크기 변화를 항상 잡아내지는 못한다.
    // 폭을 결정하는 값(scale)이 바뀔 때 통째로 다시 그리게 해 잘리는 걸 막는다.
    // overflow-x-auto 는 혹시라도 못 잡아낸 경우에 카드 밖 페이지 전체가 가로로
    // 밀리지 않고, 카드 안에서만 스크롤되게 막는 안전장치다.
    <div className="overflow-x-auto">
      <ResponsiveContainer key={scale} width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="#C9D4E4" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: tickFontSize, fill: '#3D4A63' }}
            axisLine={{ stroke: '#C9D4E4' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="domain"
            width={yAxisWidth}
            tick={{ fontSize: tickFontSize, fontWeight: 700, fill: '#111C33' }}
            axisLine={{ stroke: '#C9D4E4' }}
            tickLine={false}
          />
          <Bar dataKey="score" fill="#1F4B87" radius={[0, 8, 8, 0]} barSize={barSize} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RadarProfile({ data, scale }) {
  const tickFontSize = Math.round(20 * scale)
  const radiusTickFontSize = Math.round(14 * scale)
  const height = Math.round(300 * scale)

  return (
    // key={scale} · overflow-x-auto 이유는 BarProfile 주석 참고.
    <div className="overflow-x-auto">
      <ResponsiveContainer key={scale} width="100%" height={height}>
        <RadarChart data={data} outerRadius="62%" margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
          <PolarGrid stroke="#C9D4E4" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fontSize: tickFontSize, fontWeight: 700, fill: '#111C33' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: radiusTickFontSize, fill: '#3D4A63' }}
            axisLine={false}
          />
          <Radar dataKey="score" stroke="#1F4B87" fill="#1F4B87" fillOpacity={0.35} strokeWidth={3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
