import { create } from 'zustand'
import { loadState, resetState, saveState } from '../lib/storage.js'
import { todayKey } from '../lib/dates.js'
import { useUiStore } from './useUiStore.js'

/*
 * 앱 데이터(profile / sessions / missions / levels)의 단일 출처.
 * 저장은 항상 storage.js 를 통한다. 이 파일에도 localStorage 는 등장하지 않는다.
 */

/* 오늘 미션이 아직 없을 때 붙여 줄 문장. 게임 결과에서 만들어지는 실행 브리지 미션은 마일스톤 3. */
const DAILY_MISSION_TEXTS = [
  '냉장고를 열기 전에, 안에 있는 재료 세 가지를 떠올려 보기',
  '오늘 장 볼 것 세 가지를 적지 않고 외워서 사 오기',
  '가족에게 전화해서 오늘 있었던 일 세 가지 이야기하기',
  '저녁 반찬 하나를 처음부터 끝까지 직접 만들어 보기',
  '동네를 한 바퀴 걷고, 오는 길에 본 가게 세 곳을 떠올려 보기',
]

/** 화면 설정을 UI 스토어로 밀어 넣는다. profile 이 없으면 기본값(둘 다 꺼짐). */
function syncUi(profile) {
  useUiStore.getState().setLargeText(Boolean(profile?.largeText))
  useUiStore.getState().setVoice(Boolean(profile?.voice))
}

/** 오늘 날짜의 실생활 미션이 없으면 하나 만들어 붙인다. */
function ensureTodayMission(state) {
  const today = todayKey()
  if (state.missions.some((mission) => mission.date === today)) return state

  // 날짜를 씨앗 삼아 문장을 고른다. 같은 날 새로고침해도 문장이 바뀌지 않는다.
  const seed = today.split('-').reduce((sum, part) => sum + Number(part), 0)
  const text = DAILY_MISSION_TEXTS[seed % DAILY_MISSION_TEXTS.length]

  return {
    ...state,
    missions: [...state.missions, { id: `mission-${today}`, date: today, text, done: false }],
  }
}

/** 앱 시작 시 한 번: 저장소에서 읽고, 오늘 미션을 준비하고, 화면 설정을 맞춘다. */
function bootstrap() {
  const loaded = loadState()
  const withToday = ensureTodayMission(loaded)
  if (withToday !== loaded) saveState(withToday)
  syncUi(withToday.profile)
  return withToday
}

const initialState = bootstrap()

export const useAppStore = create((set, get) => ({
  profile: initialState.profile,
  sessions: initialState.sessions,
  missions: initialState.missions,
  levels: initialState.levels,

  /** 현재 메모리 상태를 AppState 모양으로 꺼낸다. */
  getAppState: () => {
    const { profile, sessions, missions, levels } = get()
    return { profile, sessions, missions, levels }
  },

  /** 온보딩 완료 — 프로필을 만들어 저장한다. */
  completeOnboarding: ({ name, ageBand, largeText, voice }) => {
    const profile = {
      name: String(name || '').trim() || '어르신',
      ageBand: ageBand || null,
      largeText: Boolean(largeText),
      voice: Boolean(voice),
      createdAt: new Date().toISOString(),
    }
    const next = { ...get().getAppState(), profile }
    saveState(next)
    set({ profile })
    syncUi(profile)
  },

  /**
   * 설정 값 하나를 바꾼다 ('largeText' | 'voice').
   * 프로필이 아직 없으면(온보딩 중 미리보기) 화면에만 반영하고 저장하지 않는다.
   */
  setPreference: (key, value) => {
    const { profile } = get()
    if (profile) {
      const nextProfile = { ...profile, [key]: Boolean(value) }
      saveState({ ...get().getAppState(), profile: nextProfile })
      set({ profile: nextProfile })
      syncUi(nextProfile)
      return
    }
    if (key === 'largeText') useUiStore.getState().setLargeText(value)
    if (key === 'voice') useUiStore.getState().setVoice(value)
  },

  /** 실생활 미션 완료 여부 뒤집기. 되돌릴 수 있어야 하므로 토글이다(SPEC 3장 오류 관용). */
  toggleMission: (missionId) => {
    const missions = get().missions.map((mission) =>
      mission.id === missionId ? { ...mission, done: !mission.done } : mission
    )
    saveState({ ...get().getAppState(), missions })
    set({ missions })
  },

  /** 데이터 초기화 — 확인 단계는 화면(설정)에서 거친 뒤에 호출된다. */
  resetAll: () => {
    const fresh = resetState()
    set({
      profile: fresh.profile,
      sessions: fresh.sessions,
      missions: fresh.missions,
      levels: fresh.levels,
    })
    syncUi(null)
  },
}))

/** 오늘 날짜의 실생활 미션 (없으면 null) */
export function selectTodayMission(state) {
  const today = todayKey()
  return state.missions.find((mission) => mission.date === today) || null
}
