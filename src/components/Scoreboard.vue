<template>
  <div class="scoreboard-container">
    <h2>Tablica punktów</h2>
    <p v-if="sortedPlayers.length === 0">Brak graczy do wyświetlenia.</p>

    <div class="table-wrapper" v-else>
      <table class="scoreboard-table">
        <thead>
          <tr>
            <th>gracz</th>
            <th>wynik</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in sortedPlayers" :key="player.name">
            <td>
              {{ player.name }}
              <span v-if="lastGame && index === 0" class="crown-icon">👑</span>
            </td>
            <td>{{ player.score }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useSessionStore } from "@/stores/session";

const props = defineProps<{
  lastGame: boolean;
}>();

const sessionStore = useSessionStore();

const sortedPlayers = computed(() => {
  const playersObj = sessionStore.players || {};
  const playersArray = Object.values(playersObj);
  playersArray.sort((a, b) => b.score - a.score);
  return playersArray;
});

onMounted(() => {
  console.log(
    "[Scoreboard] onMounted => wołamy sessionStore.subscribeToPlayers()"
  );
  sessionStore.subscribeToPlayers();
});
</script>

<style scoped>
.scoreboard-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 1rem;
  font-family: "Bungee", sans-serif;
  color: #fff;
  box-sizing: border-box;
}

.scoreboard-container h2 {
  font-size: clamp(1.2rem, 5vw, 1.8rem);
  margin-bottom: 1rem;
  color: #ffcc00;
}

.scoreboard-container p {
  color: #ccc;
}

.table-wrapper {
  width: 100%;
  overflow-x: hidden;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.scoreboard-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.scoreboard-table th,
.scoreboard-table td {
  padding: 0.75rem;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scoreboard-table th {
  background-color: #222;
  color: #00ff99;
  padding: 12px;
  border-bottom: 2px solid #444;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1rem;
}

.scoreboard-table td {
  padding: 12px;
  border-bottom: 1px solid #333;
  font-size: 1.1rem;
  text-align: center;
}

.scoreboard-table tbody tr:nth-child(odd) {
  background-color: #2a2b36;
}
.scoreboard-table tbody tr:nth-child(even) {
  background-color: #1e1f29;
}

.scoreboard-table tbody tr:hover {
  background-color: #343646;
}

.crown-icon {
  margin-left: 0.5rem;
  font-size: 1.2rem;
}

@media (max-width: 400px) {
  .scoreboard-container h2 {
    font-size: 1.5rem;
  }
  .scoreboard-table th,
  .scoreboard-table td {
    font-size: 0.9rem;
    padding: 8px;
  }
}
</style>
