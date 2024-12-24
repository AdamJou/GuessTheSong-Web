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
import { startGame } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();

const roomId = sessionStore.roomId;
const players = ref({});
const djId = ref("");

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

const handleStartGame = async () => {
  await startGame(roomId);
  router.push(`/song-selection/${roomId}`);
};

const isDj = computed(() => sessionStore.playerId === djId.value);
const canStartGame = computed(() => Object.keys(players.value).length > 1);

onMounted(() => {
  listenToRoom();
});
</script>
