<template>
  <div v-if="!roomId">
    <p>Ładowanie...</p>
  </div>
  <div v-else>
    <Scoreboard />
    <Status />

    <!-- Jeśli to ostatnia gra (isLastGame), pokaż przyciski do zmiany game -->
    <div v-if="isLastGame" class="last-game-nav">
      <p>To była ostatnia gra. Możesz przejrzeć wyniki wszystkich gier:</p>
      <div class="game-buttons">
        <button
          v-for="gid in allGameIds"
          :key="gid"
          @click="setDisplayedGame(gid)"
          :class="{ active: gid === displayedGameId }"
        >
          {{ gid }}
        </button>
      </div>
    </div>

    <!-- 
      GameSummary z :gameData="displayedGameData"
      => brak fetchu w GameSummary 
    -->
    <GameSummary v-if="displayedGameId" :gameData="displayedGameData" />

    <!-- Kontrolki DJ-a do next fazy -->
    <div v-if="isDj && !isRoomFinished" class="dj-controls">
      <button @click="setSongSelection">
        Rozpocznij kolejną fazę (song_selection)
      </button>
    </div>

    <!-- Kiedy status=finished -->
    <div v-if="isRoomFinished" class="finished-controls">
      <p>Rozgrywka się zakończyła!</p>
      <button @click="goHome">Powrót do strony głównej</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import Scoreboard from "@/components/Scoreboard.vue";
import Status from "@/views/Status.vue";
import GameSummary from "@/components/GameSummary.vue";
import { useSummaryLogic } from "@/composables/useSummaryLogic";
import { useSessionStore } from "@/stores/session";

// Uzyskujemy logikę z composable
const {
  roomId,
  isDj,
  isRoomFinished,
  isLastGame,
  allGameIds,
  displayedGameId,
  displayedGameData,
  initSummary,
  setDisplayedGame,
  setSongSelection,
  handleGameStatusChange,
  goHome,
} = useSummaryLogic();

const sessionStore = useSessionStore();

// Jednorazowa inicjalizacja: wczytanie danych z bazy
onMounted(() => {
  initSummary();
});

// Nasłuchujemy na zmiany statusu w store (np. "song_selection")
watch(
  () => sessionStore.gameStatus,
  (newStatus) => {
    handleGameStatusChange(newStatus);
  }
);
</script>

<style scoped>
.dj-controls {
  margin-top: 16px;
}
.last-game-nav {
  margin-bottom: 1rem;
}
.game-buttons {
  display: flex;
  gap: 8px;
}
.game-buttons .active {
  background-color: #ccc;
  font-weight: bold;
}
</style>
