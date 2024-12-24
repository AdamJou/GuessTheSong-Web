<template>
  <div class="game-info">
    <h1>Game Information</h1>

    <!-- Room ID -->
    <p><strong>Room ID:</strong> {{ roomId }}</p>

    <!-- Current Game Status -->
    <p><strong>Game Status:</strong> {{ gameStatus || "Not available" }}</p>

    <!-- Current Game -->
    <p><strong>Current Game:</strong> {{ currentGame || "Not started" }}</p>

    <!-- Current Round -->
    <p><strong>Current Round:</strong> {{ currentRound || "Not started" }}</p>

    <!-- Current Round Status -->
    <p><strong>Round Status:</strong> {{ roundStatus || "Not available" }}</p>

    <!-- DJ -->
    <p><strong>DJ:</strong> {{ djName }}</p>
    <p><strong>DJ ID:</strong> {{ djId }}</p>

    <!-- Players -->
    <h2>Players</h2>
    <ul>
      <li v-for="(player, id) in players" :key="id">
        <strong>{{ player.name }}</strong>
        ({{ id === djId ? "DJ" : "Player" }}) - Score: {{ player.score }} -
        Ready: {{ player.ready ? "Yes" : "No" }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSessionStore } from "@/stores/session";

// Access the session store
const sessionStore = useSessionStore();

// Computed properties for session data
const roomId = computed(() => sessionStore.roomId);
const gameStatus = computed(() => sessionStore.gameStatus);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const roundStatus = computed(() => sessionStore.roundStatus);
const djId = computed(() => sessionStore.djId);
const players = computed(() => sessionStore.players);

// Get DJ name from players list
const djName = computed(() => {
  if (!djId.value || !players.value[djId.value]) return "Unknown";
  return players.value[djId.value].name;
});
</script>

<style scoped>
.game-info {
  margin: 20px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h1,
h2 {
  color: #333;
}

p,
li {
  margin: 8px 0;
}

ul {
  padding-left: 20px;
}

strong {
  color: #007bff;
}
</style>
