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
  text-align: center;
  margin-top: 20px;
  color: white;
  font-family: "Bungee", sans-serif;
  padding: 0 1rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.votes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.player-vote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem;
  font-size: 1.2rem;
}

.player-name {
  flex: 1;
  text-align: left;
  color: #00ff99;
}

.vote-label {
  flex: 1;
  text-align: center;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1;
  color: #ddd;
}

.voted-player {
  flex: 1;
  text-align: right;
  color: #ffcc00;
}

.not-voted-icon {
  text-align: right;
  color: #ff5555;
  font-size: 1.4rem;
}

.fade-enter-active,
.fade-leave-active,
.fade-move {
  transition: all 0.5s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
