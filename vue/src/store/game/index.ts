import { ActionContext } from 'vuex'
import { GameState, Zones, Inventory, Zone, RootState } from '../types'

const lsKey = 'fishing_state_v1'
const VERSION = 4

const loadState = (): Partial<GameState> | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(lsKey) || 'null')
    if (saved && saved.version === VERSION) {
      return saved
    }
  } catch (e) {
    console.error('Failed to load state:', e)
  }
  return null
}

const generateZones = (): Zones => {
  const rng = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min
  const range = 1500
  const mediumCount = 16
  const highCount = 7
  const medium: Zone[] = []
  const high: Zone[] = []
  
  for (let i = 0; i < mediumCount; i++) {
    medium.push({ x: rng(-range, range), y: rng(-range, range), r: rng(140, 240) })
  }
  for (let i = 0; i < highCount; i++) {
    high.push({ x: rng(-range, range), y: rng(-range, range), r: rng(100, 160) })
  }
  return { medium, high }
}

const savedState = loadState()
const initialZones = savedState && savedState.zones ? savedState.zones : generateZones()

const MUTATIONS = {
  SET_POS: 'SET_POS',
  SET_INVENTORY: 'SET_INVENTORY',
  SET_ZONES: 'SET_ZONES',
  ADD_FISH: 'ADD_FISH',
} as const

export default {
  namespaced: true,
  state(): GameState {
    return {
      pos: { x: 0, y: 0 },
      inventory: savedState && savedState.inventory ? savedState.inventory : {
        common: 0,
        good: 0,
        rare: 0,
      },
      zones: initialZones,
    }
  },
  getters: {
    getPos: (state: GameState) => state.pos,
    getInventory: (state: GameState) => state.inventory,
    getZones: (state: GameState) => state.zones,
    getZoneType: (state: GameState): 'low' | 'medium' | 'high' => {
      const isInside = (p: {x: number, y: number}, c: Zone) => {
        const dx = p.x - c.x
        const dy = p.y - c.y
        return Math.hypot(dx, dy) <= c.r
      }
      for (const c of state.zones.high) {
        if (isInside(state.pos, c)) return 'high'
      }
      for (const c of state.zones.medium) {
        if (isInside(state.pos, c)) return 'medium'
      }
      return 'low'
    },
    getZoneLabel: (_state: GameState, getters: any) => {
      const t = getters.getZoneType
      return t === 'high' ? 'Высокая' : t === 'medium' ? 'Средняя' : 'Низкая'
    },
  },
  mutations: {
    [MUTATIONS.SET_POS]: (state: GameState, payload: {x: number, y: number}) => {
      state.pos = payload
    },
    [MUTATIONS.SET_INVENTORY]: (state: GameState, payload: Partial<Inventory>) => {
      state.inventory = { ...state.inventory, ...payload }
    },
    [MUTATIONS.SET_ZONES]: (state: GameState, payload: Zones) => {
      state.zones = payload
    },
    [MUTATIONS.ADD_FISH]: (state: GameState, type: string) => {
      if (type === 'high') {
        state.inventory.rare += 1
      } else if (type === 'medium') {
        state.inventory.good += 1
      } else {
        state.inventory.common += 1
      }
    },
  },
  actions: {
    moveBoat: (context: ActionContext<GameState, RootState>, payload: {x: number, y: number}) => {
      context.commit(MUTATIONS.SET_POS, payload)
    },
    addFish: (context: ActionContext<GameState, RootState>, type: string) => {
      context.commit(MUTATIONS.ADD_FISH, type)
      context.dispatch('saveToLocalStorage')
    },
    saveToLocalStorage: (context: ActionContext<GameState, RootState>) => {
      localStorage.setItem(lsKey, JSON.stringify({
        version: VERSION,
        pos: context.getters.getPos,
        inventory: context.getters.getInventory,
        zones: context.getters.getZones,
      }))
    },
  },
}
