<template>
  <div class="lobby">
    <h1>Room Lobby</h1>
    <p>
      Room Code: <strong>{{ roomId }}</strong>
    </p>
    <h2>Players:</h2>
    <ul>
      <li v-for="(player, id) in players" :key="id">
        {{ player.name }} ({{ id === djId ? "DJ" : "Player" }})
      </li>
    </ul>
    <button v-if="isDj" @click="handleStartGame" :disabled="!canStartGame">
      Start Game
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createGameAndRound, joinGame } from "@/services/gameService"; // Zmieniono import
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();

const roomId = sessionStore.roomId;
const players = ref({});
const djId = ref("");

// Pobieranie danych pokoju w czasie rzeczywistym
const listenToRoom = () => {
  const roomRef = dbRef(getDatabase(), `rooms/${roomId}`);
  onValue(roomRef, (snapshot) => {
    const roomData = snapshot.val();
    if (roomData) {
      players.value = roomData.players || {};
      djId.value = roomData.djId;
    }
  });
};

// Funkcja dołączania gracza do pokoju
const ensurePlayerInRoom = async () => {
  try {
    await joinGame(roomId); // Dodaj gracza do pokoju
  } catch (error) {
    alert(error.message);
    router.push("/home"); // Jeśli nie można dołączyć, wróć do HomeView
  }
};

// Obsługa rozpoczęcia gry przez DJ-a
const handleStartGame = async () => {
  try {
    await createGameAndRound(roomId); // Tworzenie gry i pierwszej rundy
    router.push(`/song-selection/${roomId}`); // Przekierowanie do wyboru piosenek
  } catch (error) {
    console.error("Error starting the game:", error);
    alert("An error occurred while starting the game. Please try again.");
  }
};

// Komputowane właściwości
const isDj = computed(() => sessionStore.playerId === djId.value);
const canStartGame = computed(() => Object.keys(players.value).length > 1);

onMounted(async () => {
  await ensurePlayerInRoom(); // Upewnij się, że gracz jest w pokoju
  listenToRoom(); // Słuchaj zmian w pokoju
});
</script>
