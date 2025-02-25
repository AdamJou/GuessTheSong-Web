<template>
  <div class="players-ready-status">
    <div class="chips-container">
      <div v-for="(player, id) in players" :key="id" class="chip">
        <span class="dot" :class="player.ready ? 'ready' : 'not-ready'"></span>
        <span class="player-name">{{ player.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { usePlayerReady } from "@/composables/usePlayerReady";

const { players, subscribeToPlayersReady, unsubscribeFromPlayersReady } =
  usePlayerReady();

onMounted(() => {
  subscribeToPlayersReady();
});

onBeforeUnmount(() => {
  unsubscribeFromPlayersReady();
});
</script>

<style scoped>
.players-ready-status {
  max-width: 497px;
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 8px;
  box-sizing: border-box;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.chip {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 16px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.dot.ready {
  background-color: #4caf50;
}

.dot.not-ready {
  background-color: #f44336;
}

.player-name {
  font-weight: 500;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .chip {
    padding: 0.4rem 0.8rem;
  }
  .player-name {
    font-size: 0.8rem;
  }
}
</style>
