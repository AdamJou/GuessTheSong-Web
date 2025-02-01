<template>
  <div class="scoreboard-container">
    <h2>Tablica punktów</h2>
    <!-- Jeśli brak graczy, wyświetlamy informację -->
    <p v-if="sortedPlayers.length === 0">Brak graczy do wyświetlenia.</p>

    <!-- Kontener dla tabeli – umożliwia przewijanie poziome na wąskich ekranach -->
    <div class="table-wrapper" v-else>
      <table class="scoreboard-table">
        <thead>
          <tr>
            <th>gracz</th>
            <th>wynik</th>
          </tr>
        </thead>
        <tbody>
          <!-- Wyświetlamy posortowanych graczy wraz z indeksem -->
          <tr v-for="(player, index) in sortedPlayers" :key="player.name">
            <td>
              {{ player.name }}
              <!-- Wyświetlamy ikonę korony tylko przy najwyższym wyniku w ostatniej grze -->
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

// Sortujemy graczy malejąco wg score
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
/* Kontener główny: wyśrodkowanie, ograniczenie szerokości, itd. */
.scoreboard-container {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  padding: 1rem;
  font-family: "Bungee", sans-serif;
  color: #fff;
}

/* Nagłówek */
.scoreboard-container h2 {
  font-size: clamp(1.2rem, 5vw, 1.8rem);
  margin-bottom: 1rem;
  color: #ffcc00;
}

/* Informacja o braku graczy */
.scoreboard-container p {
  color: #ccc;
}

/* Kontener tabeli z przewijaniem poziomym na wąskich ekranach */
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

/* Tabela */
.scoreboard-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 300px;
}

/* Nagłówki tabeli */
.scoreboard-table th {
  background-color: #222;
  color: #00ff99;
  padding: 12px;
  border-bottom: 2px solid #444;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1rem;
}

/* Komórki tabeli */
.scoreboard-table td {
  padding: 12px;
  border-bottom: 1px solid #333;
  font-size: 1.1rem;
  text-align: center;
}

/* Kolorowanie naprzemienne wierszy */
.scoreboard-table tbody tr:nth-child(odd) {
  background-color: #2a2b36;
}
.scoreboard-table tbody tr:nth-child(even) {
  background-color: #1e1f29;
}

/* Efekt hover dla wierszy */
.scoreboard-table tbody tr:hover {
  background-color: #343646;
}

/* Stylizacja ikony korony */
.crown-icon {
  margin-left: 0.5rem;
  font-size: 1.2rem; /* Możesz dostosować rozmiar */
}

/* Responsywność – modyfikacja czcionek i paddingu dla małych ekranów */
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
