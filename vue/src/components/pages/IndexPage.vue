<template>
  <div class="game" :style="mapStyle">
    <div class="game__zones">
      <div
        v-for="(c, i) in zones.medium"
        :key="'m'+i"
        class="zone zone__medium"
        :style="circleStyle(c)"
      ></div>
      <div
        v-for="(c, i) in zones.high"
        :key="'h'+i"
        class="zone zone__high"
        :style="circleStyle(c)"
      ></div>
    </div>
    <div class="game__info">
      <div>Координаты: {{ pos.x }} / {{ pos.y }}</div>
      <div>Зона: {{ zoneLabel }}</div>
    </div>
    <div class="game__controls-area">
      <div class="game__controls">
        <button class="game__button" :disabled="waiting || active" @click="startFishing">Старт</button>
        <div class="game__waiting" v-if="waiting">Ожидание поклёвки...</div>
      </div>
      <FishingMiniGame @result="(ok) => onMiniResult(ok)" v-if="active" />
    </div>
    <div class="game__inventory">
      <InventoryPanel :inventory="inventory" />
    </div>
    <div class="game__boat">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <path d="M60 20 L60 70" stroke="#d63031" stroke-width="6" />
        <path d="M60 20 C90 30 90 70 60 70 Z" fill="none" stroke="#d63031" stroke-width="6" />
        <path d="M20 80 Q60 100 100 80" fill="none" stroke="#d63031" stroke-width="6" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import FishingMiniGame from '@/components/FishingMiniGame.vue'
import InventoryPanel from '@/components/InventoryPanel.vue'

const store = useStore()

const pos = computed(() => store.getters['game/getPos'])
const inventory = computed(() => store.getters['game/getInventory'])
const zones = computed(() => store.getters['game/getZones'])
const zoneType = computed(() => store.getters['game/getZoneType'])
const zoneLabel = computed(() => store.getters['game/getZoneLabel'])

const circleStyle = (c: { x: number, y: number, r: number }) => ({
  left: `calc(50% + ${c.x - pos.value.x}px)`,
  top: `calc(50% + ${c.y - pos.value.y}px)`,
  width: `${c.r * 2}px`,
  height: `${c.r * 2}px`
})

const pressed = reactive<Record<string, boolean>>({})
let raf: number = 0
let last: number = 0
const speed: number = 240

const tick = (t: number): void => {
  const dt: number = last ? (t - last) / 1000 : 0
  last = t
  if (active.value) {
    raf = requestAnimationFrame(tick)
    return
  }
  let dx: number = 0, dy: number = 0
  if (pressed['ArrowLeft']) dx -= speed * dt
  if (pressed['ArrowRight']) dx += speed * dt
  if (pressed['ArrowUp']) dy -= speed * dt
  if (pressed['ArrowDown']) dy += speed * dt
  if (dx || dy) {
    const newX: number = Math.round(pos.value.x + dx)
    const newY: number = Math.round(pos.value.y + dy)
    store.dispatch('game/moveBoat', { x: newX, y: newY })
    saveThrottled()
  }
  raf = requestAnimationFrame(tick)
}

const isArrow = (k: string): boolean => k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
const onDown = (e: KeyboardEvent): void => {
  if (isArrow(e.key)) e.preventDefault()
  pressed[e.key] = true
}
const onUp = (e: KeyboardEvent): void => {
  if (isArrow(e.key)) e.preventDefault()
  pressed[e.key] = false
}

onMounted(() => {
  raf = requestAnimationFrame(tick)
  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onDown)
  window.removeEventListener('keyup', onUp)
})

const waiting = ref<boolean>(false)
const active = ref<boolean>(false)
let capturedZone: 'low' | 'medium' | 'high' = 'low'

const startFishing = (): void => {
  if (waiting.value || active.value) return
  waiting.value = true
  capturedZone = zoneType.value
  let delay: number = 0
  if (capturedZone === 'high') delay = 500 + Math.floor(Math.random() * 700)
  else if (capturedZone === 'medium') delay = 1000 + Math.floor(Math.random() * 1000)
  else delay = 3000 + Math.floor(Math.random() * 3000)
  setTimeout(() => {
    waiting.value = false
    active.value = true
  }, delay)
}

const onMiniResult = (ok: boolean): void => {
  active.value = false
  if (ok) {
    store.dispatch('game/addFish', capturedZone)
  }
}

const mapStyle = computed(() => {
  const x = -pos.value.x
  const y = -pos.value.y
  return {
    backgroundPosition: `${x}px ${y}px`
  }
})

let lastSave: number = 0
const saveThrottled = (): void => {
  const now: number = performance.now()
  if (now - lastSave >= 500) {
    lastSave = now
    store.dispatch('game/saveToLocalStorage')
  }
}
</script>

<style scoped lang="less">
.game {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #8ed8f7;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
  background-size: 64px 64px, 64px 64px;
  overflow: hidden;

  &__zones {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }

  &__info {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    z-index: 10;
  }

  &__controls-area {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
  }

  &__button {
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    background: #e74c3c;
    color: #fff;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }

  &__inventory {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
  }

  &__boat {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    margin: 0;
    padding: 0;
    z-index: 5;
  }
}

.zone {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px dashed rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.1);

  &__medium {
    border-color: rgba(241, 196, 15, 0.8);
    background: rgba(241, 196, 15, 0.15);
  }

  &__high {
    border-color: rgba(231, 76, 60, 0.85);
    background: rgba(231, 76, 60, 0.15);
  }
}
</style>
