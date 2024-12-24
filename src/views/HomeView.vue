<template>
  <div class="home-view">
    <h1>Welcome to Guess the Song</h1>
    <button @click="handleStartGame">Start Game</button>
    <button @click="showJoinGameModal = true">Join Game</button>

    <!-- Modal -->
    <div v-if="showJoinGameModal" class="modal">
      <div class="modal-content">
        <h2>Join a Game</h2>
        <input
          v-model="roomIdInput"
          type="text"
          placeholder="Enter Room Code"
        />
        <div class="modal-actions">
          <button @click="handleJoinGame">Join</button>
          <button @click="showJoinGameModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createGame, joinGame } from "@/services/gameService";

const router = useRouter();
const showJoinGameModal = ref(false);
const roomIdInput = ref("");

const handleStartGame = async () => {
  try {
    const roomId = await createGame();
    router.push(`/lobby/${roomId}`);
  } catch (error) {
    alert(error.message);
  }
};

const handleJoinGame = async () => {
  try {
    await joinGame(roomIdInput.value);
    router.push(`/lobby/${roomIdInput.value}`);
    showJoinGameModal.value = false;
  } catch (error) {
    alert(error.message);
  }
};
</script>
