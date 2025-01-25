<template>
  <div class="home-view">
    <section>
      <h1>Czyja To Melodia?</h1>
      <div class="buttons-container">
        <button @click="handleStartGame" class="btn-start">Utwórz grę</button>
        <button @click="showJoinGameModal = true" class="btn-join">
          Dołącz do gry
        </button>
      </div>
    </section>
    <!-- Modal -->
    <transition name="cartoon-modal" appear>
      <div
        v-if="showJoinGameModal"
        class="modal"
        @click.self="showJoinGameModal = false"
      >
        <div class="modal-content">
          <h2>Dołącz do gry</h2>
          <input
            v-model="roomIdInput"
            type="text"
            placeholder="Wprowadź kod pokoju"
          />

          <div class="modal-actions">
            <!-- If you want the same "arcade" button styles, you can reuse .btn-start, .btn-join, or create new classes. -->
            <button @click="handleJoinGame" class="btn-modal-confirm">
              Dołącz
            </button>
            <button @click="showJoinGameModal = false" class="btn-modal-cancel">
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createGame, joinGame } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
import { useErrorStore } from "@/stores/useErrorStore";
import { useLoadingStore } from "@/stores/useLoadingStore";

const router = useRouter();
const sessionStore = useSessionStore();
const errorStore = useErrorStore();
const loadingStore = useLoadingStore();

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
  loadingStore.startLoading();
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
    errorStore.setError(
      `Pokój o ID ${roomIdInput.value.trim()} nie istnieje!`,
      3000
    );
  } finally {
    loadingStore.stopLoading();
  }
};
</script>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2.7px);
  -webkit-backdrop-filter: blur(2.7px);
  border: 1px solid rgba(83, 28, 231, 0.04);
  height: 40vh;
  padding: 2rem;
}
.home-view {
  text-align: center;
  margin-top: 50px;
}
h1 {
  font-size: clamp(36px, 2vw, 18px);
}
.buttons-container {
  display: flex;
  gap: 2rem;
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
  margin-top: 1rem;
}

.btn-start {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
}

.btn-start:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}

.btn-join {
  color: #fff;
  background: linear-gradient(145deg, #00ccff, #0099ff);
  border-color: #0077cc;
  box-shadow: 0 0.375rem 0 #005a99, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #005a99;
}

.btn-join:hover {
  background: linear-gradient(145deg, #33ddff, #00bbff);
  box-shadow: 0 0.25rem 0 #005a99, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
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
  padding: 1rem;
  box-sizing: border-box;
}

/* ---- Modal Content ---- */
.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: 0.75rem;
  padding: 2rem;
  width: 100%;
  max-width: 24rem;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  color: #333;
}

.modal-content h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

/* ---- Modal Buttons & Input ---- */
.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-modal-confirm {
  background-color: #0099ff;
  border-color: #007acc;
  color: #fff;
  box-shadow: 0 0.25rem 0 #005999, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}
.btn-modal-confirm:hover {
  background-color: #00bbff;
}

.btn-modal-cancel {
  background-color: #aaa;
  border-color: #999;
  color: #fff;
}
.btn-modal-cancel:hover {
  background-color: #bbb;
}

input {
  padding: 0.625rem; /* 10px */
  font-size: 1rem;
  width: 100%;
  max-width: 16rem; /* 256px */
  margin: 0.75rem auto;
  border: 1px solid #ccc;
  border-radius: 0.3125rem; /* 5px */
  box-sizing: border-box;
}

/* ---- Responsive Adjustments ---- */
@media (max-width: 768px) {
  /* If you want the section to adapt on smaller screens */
  section {
    height: auto;
    width: 90%;
    margin: 1rem auto;
  }

  .buttons-container {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
