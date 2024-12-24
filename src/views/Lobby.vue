<template>
  <div class="lobby">
    <h1>Room Lobby</h1>
    <p>
      Room Code: <strong>{{ roomId }}</strong>
    </p>
    <p>Share this code with others to join your game.</p>

    <h2>Players:</h2>
    <ul>
      <li v-for="(player, id) in players" :key="id">
        {{ player.name }} ({{ id === djId ? "DJ" : "Player" }})
      </li>
    </ul>

    <button v-if="isDj" @click="startGame" :disabled="!canStartGame">
      Start Game
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import type { Player } from "@/types";

const database = getDatabase();
const router = useRouter();
const route = useRoute();

const roomId = route.params.roomId as string;
const players = ref<Record<string, Player>>({});
const djId = ref<string | null>(null);

// Pobieranie danych graczy w czasie rzeczywistym
const listenToRoom = () => {
  const roomRef = dbRef(database, `rooms/${roomId}`);
  onValue(roomRef, (snapshot) => {
    const roomData = snapshot.val();
    if (roomData) {
      players.value = roomData.players || {};
      djId.value = roomData.djId || null;
    }
  });
};

// Rozpoczęcie gry
const startGame = async () => {
  const roomRef = dbRef(database, `rooms/${roomId}`);
  await update(roomRef, {
    status: "song_selection",
    currentGame: "game1",
    currentRound: "round1",
  });
  router.push(`/song-selection/${roomId}`);
};

// Czy DJ może rozpocząć grę
const isDj = computed(() => sessionStorage.getItem("playerId") === djId.value);
const canStartGame = computed(() => Object.keys(players.value).length > 1);

onMounted(() => {
  listenToRoom();
});
</script>

<style scoped>
.lobby {
  text-align: center;
  margin-top: 50px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

p {
  margin-top: 20px;
  font-size: 18px;
}
</style>
