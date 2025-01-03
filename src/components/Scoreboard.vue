<template>
  <div class="scoreboard-container">
    <h2>Scoreboard</h2>
    <!-- Jeśli brak graczy, wyświetlamy informację -->
    <p v-if="sortedPlayers.length === 0">Brak graczy do wyświetlenia.</p>

    <table v-else class="scoreboard-table">
      <thead>
        <tr>
          <th>Nickname</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        <!-- Wyświetlamy posortowanych graczy -->
        <tr v-for="player in sortedPlayers" :key="player.name">
          <td>{{ player.name }}</td>
          <td>{{ player.score }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSessionStore } from "@/stores/session";

// 1) Pobieramy store
const sessionStore = useSessionStore();

// 2) Tworzymy computed do sortowania
const sortedPlayers = computed(() => {
  // Pobieramy obiekt graczy ze store
  const playersObj = sessionStore.players || {};

  // Zamieniamy go w tablicę
  const playersArray = Object.values(playersObj);

  // Sortujemy malejąco po score
  playersArray.sort((a, b) => b.score - a.score);

  return playersArray;
});
</script>

<style scoped>
.scoreboard-container {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.scoreboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.scoreboard-table th,
.scoreboard-table td {
  border: 1px solid #ccc;
  padding: 8px;
}

.scoreboard-table th {
  background-color: #f5f5f5;
}
</style>
