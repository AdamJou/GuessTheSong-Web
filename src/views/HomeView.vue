<template>
  <div class="home-view">
    <h1>Welcome to Guess the Song</h1>
    <button @click="startGame">Start Game</button>
    <button @click="showJoinGameModal = true">Join Game</button>

    <!-- Modal dołączenia do gry -->
    <div v-if="showJoinGameModal" class="modal">
      <div class="modal-content">
        <h2>Join a Game</h2>
        <input
          v-model="roomIdInput"
          type="text"
          placeholder="Enter Room Code"
        />
        <div class="modal-actions">
          <button @click="joinGame">Join</button>
          <button @click="showJoinGameModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import { generateRoomCode } from "@/utils/roomCodeGenerator";
import type { Room, Player } from "@/types";

const database = getDatabase();
const router = useRouter();

const showJoinGameModal = ref(false); // Modal widoczny, gdy true
const roomIdInput = ref(""); // Input na kod pokoju

// Start Game - DJ tworzy grę
const startGame = async () => {
  const playerId = sessionStorage.getItem("playerId");
  const nickname = sessionStorage.getItem("nickname");

  if (!playerId || !nickname) {
    alert("You must set your nickname first!");
    router.push("/"); // Przekierowanie na NicknameInput
    return;
  }

  // Generowanie ID pokoju
  const roomId = generateRoomCode();

  // Zapisanie roomId w sessionStorage
  sessionStorage.setItem("roomId", roomId);

  // Tworzenie gracza
  const newPlayer: Player = {
    id: playerId,
    name: nickname,
    score: 0,
    ready: false,
  };

  // Tworzenie pokoju
  const newRoom: Room = {
    id: roomId,
    players: {
      [playerId]: newPlayer,
    },
    currentGame: "",
    currentRound: "",
    djId: playerId,
    status: "waiting",
    games: {},
  };

  const roomRef = dbRef(database, `rooms/${roomId}`);
  await set(roomRef, newRoom);

  // Przekierowanie do Lobby
  router.push(`/lobby/${roomId}`);
};

// Join Game - gracz dołącza do istniejącej gry
const joinGame = async () => {
  const playerId = sessionStorage.getItem("playerId");
  const nickname = sessionStorage.getItem("nickname");

  if (!playerId || !nickname) {
    alert("You must set your nickname first!");
    router.push("/"); // Przekierowanie na NicknameInput
    return;
  }

  if (!roomIdInput.value.trim()) {
    alert("Please enter a valid room code!");
    return;
  }

  const roomId = roomIdInput.value.trim();
  const roomRef = dbRef(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    const roomData: Room = snapshot.val();

    // Dodanie gracza do pokoju
    const newPlayer: Player = {
      id: playerId,
      name: nickname,
      score: 0,
      ready: false,
    };

    const playersRef = dbRef(database, `rooms/${roomId}/players`);
    await set(
      dbRef(database, `rooms/${roomId}/players/${playerId}`),
      newPlayer
    );

    // Zapisanie roomId w sessionStorage
    sessionStorage.setItem("roomId", roomId);

    // Przekierowanie do Lobby
    router.push(`/lobby/${roomId}`);
    showJoinGameModal.value = false; // Zamknięcie modalu
  } else {
    alert("Room not found! Please check the code and try again.");
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

/* Modal styling */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  width: 300px;
}

.modal-actions {
  margin-top: 20px;
}

.modal-actions button {
  margin: 0 10px;
}
</style>
