<template>
  <div v-if="!roomId">
    <p>Ładowanie...</p>
  </div>
  <div v-else class="container">
    <Scoreboard />

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
      <button @click="setSongSelection" class="btn-start">
        Rozpocznij kolejną grę
      </button>
    </div>

    <!-- Kiedy status=finished -->
    <div v-if="isRoomFinished" class="finished-controls">
      <p>Rozgrywka się zakończyła!</p>
      <button @click="goHome" class="btn-start">
        Powrót do strony głównej
      </button>
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
.container {
  max-width: 100vw;
}
.dj-controls {
  margin-top: 16px;
}
.last-game-nav {
  margin-bottom: 1rem;
}
.game-buttons {
  display: flex;
  width: 100%;

  align-items: center;
  justify-content: center;
  gap: 8px;
}
.game-buttons .active {
  background-color: #ccc;
  font-weight: bold;
}

button {
  padding: 0.875rem 1.875rem; /* 14px 30px */
  font-size: 1.125rem; /* 18px */
  text-transform: uppercase;
  border-radius: 0.9375rem; /* 15px */
  border: 0.25rem solid; /* 4px */
  transition: all 0.3s ease-in-out;
  letter-spacing: 2px;
  position: relative;
  cursor: pointer;
}
.btn-start {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
  margin-bottom: 2rem;
}

.btn-start:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}
</style>
