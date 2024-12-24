<template>
  <div class="lobby">
    <h1>Room Lobby</h1>
    <Status />
    <p>
      Room Code: <strong>{{ roomId }}</strong>
    </p>
    <h2>Players:</h2>
    <ul>
      <li v-for="(player, id) in players" :key="id">
        {{ player.name }} ({{ id === djId ? "DJ" : "Player" }} )
      </li>
    </ul>
    <button v-if="isDj" @click="handleStartGame" :disabled="!canStartGame">
      Start Game
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { createGameAndRound } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
import Status from "@/views/Status.vue";

// Router i session store
const router = useRouter();
const sessionStore = useSessionStore();

// Komputowane właściwości z session store
const roomId = computed(() => sessionStore.roomId);
const players = computed(() => sessionStore.players);
const djId = computed(() => sessionStore.djId);
const gameStatus = computed(() => sessionStore.gameStatus); // Obserwacja statusu gry
const isDj = computed(() => sessionStore.playerId === djId.value);
const canStartGame = computed(
  () => Object.keys(players.value || {}).length > 1
);

// Funkcja dołączania gracza do pokoju
const ensurePlayerInRoom = async () => {
  try {
    const { joinGame } = await import("@/services/gameService");
    if (roomId.value) {
      await joinGame(roomId.value); // Dodaj gracza do pokoju
    } else {
      throw new Error("Room ID is missing.");
    }
  } catch (error: any) {
    console.error(error);
    alert(error.message || "An error occurred.");
    router.push("/home"); // Jeśli nie można dołączyć, wróć do HomeView
  }
};

// Obsługa rozpoczęcia gry przez DJ-a
const handleStartGame = async () => {
  try {
    if (roomId.value) {
      await createGameAndRound(roomId.value); // Tworzenie gry i pierwszej rundy
      console.log("Game started and players are redirected to SongSelection");
    } else {
      throw new Error("Room ID is missing.");
    }
  } catch (error: any) {
    console.error("Error starting the game:", error);
    alert(
      error.message ||
        "An error occurred while starting the game. Please try again."
    );
  }
};

// Główna logika w onMounted
onMounted(async () => {
  await ensurePlayerInRoom(); // Upewnij się, że gracz jest w pokoju
});

// Funkcja reagująca na zmianę statusu gry
const handleGameStatusChange = (status: string | null) => {
  if (!status) return;

  if (status === "song_selection") {
    router.push({ name: "SongSelection", params: { roomId: roomId.value } });
  }
};
// Obserwacja `gameStatus` i reagowanie na jego zmiany
watch(gameStatus, (newStatus) => {
  handleGameStatusChange(newStatus);
});
</script>
