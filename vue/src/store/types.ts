import { Store } from 'vuex'

export interface Zone {
  x: number
  y: number
  r: number
}

export interface Zones {
  medium: Zone[]
  high: Zone[]
}

export interface Inventory {
  common: number
  good: number
  rare: number
}

export interface GameState {
  pos: { x: number; y: number }
  inventory: Inventory
  zones: Zones
}

export interface RootState {
  game: GameState
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<RootState>
  }
}

