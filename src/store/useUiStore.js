import { create } from 'zustand'

/*
 * 화면 표시 관련 UI 상태.
 *
 * 이 스토어는 "지금 화면을 어떻게 그릴지"만 들고 있는 거울이다.
 * 저장(localStorage)과 profile 갱신은 useAppStore 가 맡고,
 * 값이 바뀔 때 useAppStore 가 이쪽으로 밀어 넣는다. (단방향: useAppStore -> useUiStore)
 * 여기서 storage 를 직접 부르지 않는 이유는 저장 경로를 한 군데로 유지하기 위해서다.
 */
export const useUiStore = create((set) => ({
  /** 글자 크게 (1.25배) — App.jsx 가 <html class="large-text"> 로 반영한다. */
  largeText: false,
  /** 음성 안내 사용 여부. 기본값 false. */
  voice: false,

  setLargeText: (value) => set({ largeText: Boolean(value) }),
  toggleLargeText: () => set((state) => ({ largeText: !state.largeText })),
  setVoice: (value) => set({ voice: Boolean(value) }),
}))
