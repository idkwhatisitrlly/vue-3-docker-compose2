<template>
  <div class="inventory">
    <div class="inventory__title">Инвентарь</div>
    <div class="inventory__grid">
      <div class="inventory__item">
        <div class="inventory__name">Обычная</div>
        <div class="inventory__count">{{ inventory.common || 0 }}</div>
      </div>
      <div class="inventory__item">
        <div class="inventory__name">Хорошая</div>
        <div class="inventory__count">{{ inventory.good || 0 }}</div>
      </div>
      <div class="inventory__item">
        <div class="inventory__name">Редкая</div>
        <div class="inventory__count">{{ inventory.rare || 0 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ inventory: { common: number, good: number, rare: number } }>()
</script>

<style scoped lang="less">
@bg-primary: rgba(255, 255, 255, 0.2);
@bg-secondary: rgba(255, 255, 255, 0.4);
@bg-dark: rgba(0, 0, 0, 0.2);
@border-radius: 8px;
@border-radius-large: 12px;
@spacing: 8px;
@spacing-large: 12px;

.block-base(@bg, @radius) {
  padding: @spacing;
  background: @bg;
  border-radius: @radius;
}

.inventory {
  width: 260px;
  .block-base(@bg-primary, @border-radius-large);
  backdrop-filter: blur(4px);

  &__title {
    font-weight: 700;
    margin-bottom: @spacing;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 80px;
    row-gap: @spacing;
    column-gap: @spacing;
  }

  &__item {
    display: contents;
  }

  &__name {
    .block-base(@bg-secondary, @border-radius);
  }

  &__count {
    .block-base(@bg-dark, @border-radius);
    text-align: center;
  }
}
</style>