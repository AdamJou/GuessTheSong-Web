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
import { useSessionStore } from "@/stores/session";

const router = useRouter();
const sessionStore = useSessionStore();

const showJoinGameModal = ref(false);
const roomIdInput = ref("");

const handleStartGame = async () => {
  try {
    const roomId = await createGame();
    sessionStore.setRoomId(roomId); // Synchronizuj pokój w store
    router.push(`/lobby/${roomId}`); // Przekierowanie do lobby
  } catch (error) {
    console.error("Error starting game:", error);
    alert("An error occurred while creating the game. Please try again.");
  }
};

const handleJoinGame = async () => {
  try {
    if (!roomIdInput.value.trim()) {
      alert("Please enter a valid room code.");
      return;
    }
    await joinGame(roomIdInput.value.trim());
    sessionStore.setRoomId(roomIdInput.value.trim()); // Synchronizuj pokój w store
    router.push(`/lobby/${roomIdInput.value.trim()}`); // Przekierowanie do lobby
    showJoinGameModal.value = false;
  } catch (error) {
    console.error("Error joining game:", error);
    alert("An error occurred while joining the game. Please try again.");
  }
};
</script>

<style scoped>
.home-view {
  text-align: center;
  margin-top: 50px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin: 10px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.modal-actions {
  margin-top: 20px;
}

input {
  padding: 10px;
  font-size: 16px;
  width: 200px;
  margin: 10px 0;
}
</style>
