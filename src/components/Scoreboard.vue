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
          <!-- Wyświetlamy posortowanych graczy -->
          <tr v-for="player in sortedPlayers" :key="player.name">
            <td>{{ player.name }}</td>
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

const sessionStore = useSessionStore();

// Sortujemy graczy malejąco po score
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
/* Kontener główny: wyśrodkowanie w pionie, ograniczenie szerokości, itp. */
.scoreboard-container {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  font-family: "Bungee", sans-serif; /* lub inna wybrana czcionka */
  color: #fff; /* tekst w jasnym kolorze */
}

/* Nagłówek */
.scoreboard-container h2 {
  font-size: clamp(1.2rem, 5vw, 1.8rem);

  margin-bottom: 1rem;
  color: #ffcc00; /* lekko żółty / złoty */
}

/* Wyświetlanie informacji o braku graczy */
.scoreboard-container p {
  color: #ccc;
}

/* Kontener na tabelę z możliwością przewijania w poziomie na wąskich ekranach */
.table-wrapper {
  overflow-x: auto; /* jeżeli tabela jest za szeroka, pojawi się przewijanie */
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

/* Sama tabela */
.scoreboard-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 300px; /* by zachować czytelność przy wąskim oknie */
}

/* Główki tabeli */
.scoreboard-table th {
  background-color: #222; /* ciemniejsze tło */
  color: #00ff99; /* neonowy kolor */
  padding: 12px;
  border-bottom: 2px solid #444; /* delikatny border */
  text-transform: uppercase; /* duże litery */
  letter-spacing: 1px;
  font-size: 1rem;
}

/* Komórki w wierszach */
.scoreboard-table td {
  padding: 12px;
  border-bottom: 1px solid #333;
  font-size: 1.1rem;
  text-align: center;
}

/* Kolorowanie wierszy naprzemiennie (opcjonalne) */
.scoreboard-table tbody tr:nth-child(odd) {
  background-color: #2a2b36; /* ciemniejszy */
}
.scoreboard-table tbody tr:nth-child(even) {
  background-color: #1e1f29;
}

/* Możesz też dodać efekt najechania kursorem (hover) */
.scoreboard-table tbody tr:hover {
  background-color: #343646; /* lekko jaśniejszy odcień */
}

/* Responsywność – na bardzo wąskich ekranach (np. smartfonach)
   dopasowujemy rozmiary czcionek. */
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
