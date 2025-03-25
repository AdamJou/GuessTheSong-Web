<template>
  <div class="voting-status">
    <h2>Głosy</h2>

    <transition-group name="fade" tag="ul" class="votes-list">
      <li v-for="(player, id) in filteredPlayers" :key="id" class="player-vote">
        <div class="player-name">
          {{ player.name }}
        </div>

        <div class="vote-label" v-if="votes[id]">→</div>
        <div class="vote-label" v-else></div>

        <div class="voted-player" v-if="votes[id]">
          {{ getPlayerName(votes[id]) }}
        </div>
        <font-awesome-icon
          v-else
          :icon="['fas', 'xmark']"
          class="not-voted-icon"
          title="Not voted"
        />
      </li>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useVotes } from "@/composables/useVotes";
import { useSessionStore } from "@/stores/session";

const { votes, getPlayerName } = useVotes();
const sessionStore = useSessionStore();

const djId = computed(() => sessionStore.djId);

const filteredPlayers = computed(() => {
  return Object.entries(sessionStore.players || {}).reduce(
    (result, [id, player]) => {
      if (id !== djId.value) {
        result[id] = player;
      }
      return result;
    },
    {} as Record<string, { name: string }>
  );
});
</script>

<style scoped>
.voting-status {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: rgba(30, 31, 41, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h2 {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  margin: 0;
  text-align: center;
  color: #ffcc00;
}

.votes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.player-vote {
  display: grid;
  grid-template-columns: 1fr 50px 1fr;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;
}

.player-vote:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.player-name,
.voted-player {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 0.5rem;
}

.player-name {
  text-align: right;
  color: #00ff99;
}

.voted-player {
  text-align: left;
  color: #ffcc00;
}

.vote-label {
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.25rem;
  font-weight: bold;
}

.not-voted-icon {
  color: #ff5555;
  font-size: 1rem;
  opacity: 0.8;
  margin: 0 auto;
}

@media (max-width: 480px) {
  .voting-status {
    padding: 1rem;
  }

  .player-vote {
    padding: 0.625rem;
    gap: 0.25rem;
    border-radius: 8px;
  }

  .player-name,
  .voted-player {
    font-size: 0.75rem;
  }

  .vote-label {
    font-size: 1.25rem;
  }
}

@media (min-width: 768px) {
  .player-vote {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .player-vote:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-move {
  transition: transform 0.3s ease;
}
</style>
