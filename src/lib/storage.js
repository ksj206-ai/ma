import { buildSeedLevels, buildSeedMissions, buildSeedSessions } from './seed.js'

/*
 * 앱의 유일한 localStorage 접근 지점 (SPEC 9장).
 * 다른 파일에서 localStorage 를 직접 호출하지 않는다.
 *
 * AppState { schemaVersion, profile, sessions[], missions[], levels{} }
 *   profile  UserProfile { name, ageBand, largeText, voice, createdAt } | null
 *   sessions Session[]          { id, date, gameId, courseId, domain, level, score, accuracy, durationSec }
 *   missions RealWorldMission[] { id, date, text, done }
 *   levels   { [gameId]: number }  게임별 난이도. 조정 로직은 lib/adaptive.js (마일스톤 5).
 *
 * 저장소는 언제든 실패할 수 있다(사생활 보호 모드, 용량 초과, 손상된 JSON).
 * 어떤 경우에도 예외를 밖으로 던지지 않고 초기 상태로 복구한다. 앱이 죽으면 안 된다.
 */

const STORAGE_KEY = 'cognitive-care.appState.v1'

/** 데이터 모양이 바뀌면 이 숫자를 올린다. 다르면 초기화된다. */
export const SCHEMA_VERSION = 1

/** 저장된 것이 아무것도 없는 깨끗한 상태 */
export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: null,
    sessions: [],
    missions: [],
    levels: {},
  }
}

function getStorage() {
  try {
    // 사생활 보호 모드 등에서 접근 자체가 예외를 던지는 브라우저가 있다.
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 읽어 온 값의 모양을 보정한다.
 * 필드가 없거나 타입이 어긋나도 그 부분만 기본값으로 채우고 나머지는 살린다.
 * 모양이 근본적으로 다르면 null 을 돌려주어 호출부가 초기화하도록 한다.
 */
function normalizeState(raw) {
  if (!isPlainObject(raw)) return null
  if (raw.schemaVersion !== SCHEMA_VERSION) return null

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: isPlainObject(raw.profile) ? raw.profile : null,
    sessions: Array.isArray(raw.sessions) ? raw.sessions.filter(isPlainObject) : [],
    missions: Array.isArray(raw.missions) ? raw.missions.filter(isPlainObject) : [],
    levels: isPlainObject(raw.levels) ? raw.levels : {},
  }
}

/**
 * 앱 상태를 읽는다.
 *  - 저장된 것이 없거나 schemaVersion 이 다르면 -> 더미 데이터를 시드해서 돌려준다.
 *  - JSON 이 깨져 있으면 -> 예외를 삼키고 역시 시드 상태로 복구한다.
 * 항상 유효한 AppState 를 돌려준다. 절대 null 이나 예외가 나가지 않는다.
 */
export function loadState() {
  const storage = getStorage()
  if (!storage) return withSeedData(createInitialState())

  let rawText = null
  try {
    rawText = storage.getItem(STORAGE_KEY)
  } catch {
    return withSeedData(createInitialState())
  }

  if (rawText === null) return seedDemoData()

  let parsed = null
  try {
    parsed = JSON.parse(rawText)
  } catch {
    // 손상된 데이터. 사용자에게 오류를 보이는 대신 조용히 처음 상태로 되돌린다.
    return seedDemoData()
  }

  const normalized = normalizeState(parsed)
  if (!normalized) return seedDemoData()

  return normalized
}

/** 앱 상태를 저장한다. 실패해도 예외를 던지지 않고 false 를 돌려준다. */
export function saveState(state) {
  const storage = getStorage()
  if (!storage) return false

  try {
    const toSave = { ...state, schemaVersion: SCHEMA_VERSION }
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch {
    return false
  }
}

/**
 * 데이터 초기화 (설정 화면).
 * 데모 시드를 다시 채우지 않는다. 사용자가 "지우기"를 택했으면 정말 비어 있어야 한다.
 * 돌려주는 상태에는 profile 이 없으므로 앱은 온보딩으로 돌아간다.
 */
export function resetState() {
  const fresh = createInitialState()
  const storage = getStorage()
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // 지우지 못해도 아래에서 빈 상태로 덮어쓰면 된다.
    }
  }
  saveState(fresh)
  return fresh
}

function withSeedData(state) {
  return {
    ...state,
    sessions: buildSeedSessions(),
    missions: buildSeedMissions(),
    levels: buildSeedLevels(),
  }
}

/**
 * 데모용 더미 데이터를 채운 상태를 만들어 저장하고 돌려준다 (SPEC 9장).
 * profile 은 채우지 않는다. 이름·나이대는 온보딩에서 직접 받아야 하기 때문이다.
 */
export function seedDemoData() {
  const seeded = withSeedData(createInitialState())
  saveState(seeded)
  return seeded
}
