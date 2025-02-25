<template>
  <div v-if="!roomId">
    <p>Ładowanie...</p>
  </div>
  <div v-else class="container">
    <Scoreboard :lastGame="isLastGame" />

    <div v-if="isLastGame" class="last-game-nav">
      <p>To była ostatnia gra. Możesz przejrzeć wyniki wszystkich gier</p>
      <div class="game-buttons">
        <button
          v-for="gid in allGameIds"
          :key="gid"
          @click="setDisplayedGame(gid)"
          :class="{ active: gid === displayedGameId }"
          class="btn-game"
        >
          GRA
          {{ gid.replace(/\D/g, "") }}
        </button>
      </div>
    </div>

    <GameSummary v-if="displayedGameId" :gameData="displayedGameData" />

    <div class="tet">
      <PlayersReadyStatus v-if="!isRoomFinished && !isLastGame" />
    </div>

    <div v-if="!isRoomFinished && !playerReady" class="player-ready-control">
      <button @click="handleSetReady" class="btn-ready">Jestem gotowy</button>
    </div>

    <div
      v-if="isDj && allPlayersReady && !isRoomFinished && !isLastGame"
      class="dj-controls"
    >
      <button @click="startNextGameHandler" class="btn-start">
        Rozpocznij kolejną grę
      </button>
    </div>

    <div v-if="isRoomFinished" class="finished-controls">
      <p>Rozgrywka się zakończyła!</p>
      <button @click="goHome" class="btn-start">
        Powrót do strony głównej
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import Scoreboard from "@/components/Scoreboard.vue";
import GameSummary from "@/components/GameSummary.vue";
import PlayersReadyStatus from "@/components/PlayersReadyStatus.vue";
import { useSummaryLogic } from "@/composables/useSummaryLogic";
import { useSessionStore } from "@/stores/session";
import { usePlayerReady } from "@/composables/usePlayerReady";
import { useSuccessStore } from "@/stores/useSuccessStore";
const successStore = useSuccessStore();
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

const { setCurrentPlayerReady, players, resetReadyStatus } = usePlayerReady();

const sessionStore = useSessionStore();
const allPlayersReady = computed(() => {
  const p = players.value;
  const keys = Object.keys(p);
  if (keys.length === 0) return false;
  keys.every((id) => p[id]?.ready === true)
    ? successStore.setSuccess(
        "Wszyscy gracze potwierdzili swoją gotowość, możesz rozpocząć grę! 🎉",
        3000
      )
    : "";

  return keys.every((id) => p[id]?.ready === true);
});

const playerReady = computed(
  () => players.value[sessionStore.playerId!!]?.ready ?? false
);

const handleSetReady = async () => {
  await setCurrentPlayerReady();
};

const startNextGameHandler = async () => {
  await setSongSelection();
  await resetReadyStatus();
};

onMounted(() => {
  initSummary();
});

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

.btn-game {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border: 1px solid #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
  padding: 0.6rem 1rem;
  font-family: inherit;
  font-size: clamp(0.9rem, 1.2vw, 1rem);
  cursor: pointer;
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.1s ease;
  border-radius: 4px;
}

.btn-game:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}

.btn-game:active {
  transform: scale(0.98);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}

.btn-game:not(.active) {
  opacity: 0.7;
}

.btn-game.active {
  opacity: 1;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border: 1px solid #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.4);
}

.game-buttons .active {
  background-color: #ccc;
  color: yellow;
}

.player-ready-control {
  margin: 1rem 0;
  text-align: center;
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

.btn-ready {
  color: #fff;
  background: linear-gradient(145deg, #00ccff, #0099ff);
  border-color: #007acc;
  box-shadow: 0 0.375rem 0 #005a99, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #005a99;
  margin-bottom: 1rem;
}

.btn-ready:hover {
  background: linear-gradient(145deg, #33ddff, #00bbff);
  box-shadow: 0 0.25rem 0 #005a99, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}
.finished-controls {
  margin: 1rem;
}
</style>
