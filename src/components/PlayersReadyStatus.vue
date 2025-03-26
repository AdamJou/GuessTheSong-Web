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
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: rgba(30, 31, 41, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-sizing: border-box;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.chip {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.75rem;
}

.dot.ready {
  background-color: #00ff99;
  box-shadow: 0 0 8px rgba(0, 255, 153, 0.4);
}

.dot.not-ready {
  background-color: #ff5555;
  box-shadow: 0 0 8px rgba(255, 85, 85, 0.4);
}

.player-name {
  color: #ffffff;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 0.25rem;
}

@media (max-width: 480px) {
  .players-ready-status {
    padding: 1rem;
  }

  .chips-container {
    gap: 0.5rem;
  }

  .chip {
    padding: 0.625rem 0.875rem;
    border-radius: 8px;
  }

  .dot {
    width: 6px;
    height: 6px;
    margin-right: 0.5rem;
  }

  .player-name {
    font-size: 0.75rem;
  }
}

@media (min-width: 768px) {
  .chip {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .chip:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
</style>
