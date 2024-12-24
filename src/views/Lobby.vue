<template>
  <div class="lobby">
    <h1>Room Lobby</h1>
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
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createGameAndRound } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  type DataSnapshot,
} from "firebase/database";
import type { Player } from "@/types/types";

// Pobierz parametry routingu
const route = useRoute();
const router = useRouter();

// Pobierz dane z store
const sessionStore = useSessionStore();
const roomId = sessionStore.roomId;

// Typowane refy dla stanu komponentu
const players = ref<Record<string, Player>>({});
const djId = ref<string>("");

// Pobieranie danych pokoju w czasie rzeczywistym
const listenToRoom = () => {
  const roomRef = dbRef(getDatabase(), `rooms/${roomId}`);
  onValue(roomRef, (snapshot: DataSnapshot) => {
    const roomData = snapshot.val() as {
      players?: Record<string, Player>;
      djId?: string;
      status?: string;
    };

    if (roomData) {
      players.value = roomData.players || {};
      djId.value = roomData.djId || "";

      // Automatyczne przekierowanie na SongSelection, jeśli status zmienia się na "song_selection"
      if (roomData.status === "song_selection") {
        router.push(`/song-selection/${roomId}`);
      }
    }
  });
};

// Funkcja dołączania gracza do pokoju
const ensurePlayerInRoom = async () => {
  try {
    const { joinGame } = await import("@/services/gameService");
    if (roomId) {
      await joinGame(roomId); // Dodaj gracza do pokoju
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
    if (roomId) {
      await createGameAndRound(roomId); // Tworzenie gry i pierwszej rundy
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

// Komputowane właściwości
const isDj = computed(() => sessionStore.playerId === djId.value);
const canStartGame = computed(() => Object.keys(players.value).length > 1);

// Główna logika w onMounted
onMounted(async () => {
  await ensurePlayerInRoom(); // Upewnij się, że gracz jest w pokoju
  listenToRoom(); // Słuchaj zmian w pokoju
});
</script>
