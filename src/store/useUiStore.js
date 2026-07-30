import { create } from 'zustand'

/*
 * 화면 표시 관련 UI 상태.
 * 마일스톤 1 에서는 "글자 크게" 플래그의 뼈대만 둔다.
 * (설정 화면 토글 UI 와 localStorage 저장은 마일스톤 2 에서 storage.js 와 함께 붙인다.)
 */
export const useUiStore = create((set) => ({
  largeText: false,
  setLargeText: (value) => set({ largeText: value }),
  toggleLargeText: () => set((state) => ({ largeText: !state.largeText })),
}))
