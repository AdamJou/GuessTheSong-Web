<template>
  <div class="home-view">
    <section v-if="!roomId">
      <h1>Czyja To Melodia?</h1>
      <div class="buttons-container">
        <!-- Po kliknięciu otwieramy modal z opcją trybu gry -->
        <button @click="handleStartGame" class="btn-start">Utwórz grę</button>
        <button @click="showJoinGameModal = true" class="btn-join">
          Dołącz do gry
        </button>
      </div>
    </section>

    <!-- Modal do dołączania do gry -->
    <div
      v-if="showJoinGameModal"
      class="modal"
      @click.self="showJoinGameModal = false"
    >
      <transition name="cartoon-modal" appear>
        <div class="modal-content">
          <h2>Dołącz do gry</h2>
          <input
            v-model="roomIdInput"
            type="text"
            placeholder="Wprowadź kod pokoju"
          />
          <div class="modal-actions">
            <button @click="handleJoinGame" class="btn-modal-confirm">
              Dołącz
            </button>
            <button @click="showJoinGameModal = false" class="btn-modal-cancel">
              Anuluj
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Modal do wyboru trybu gry przy tworzeniu pokoju -->
    <div
      v-if="showStartGameModal"
      class="modal"
      @click.self="showStartGameModal = false"
    >
      <transition name="cartoon-modal" appear>
        <div class="modal-content">
          <h2>Wybierz tryb gry</h2>
          <div class="toggle-container">
            <!-- Etykieta może być w języku polskim, a wartość pozostaje zgodna z typem GameMode -->
            <label class="toggle-option">
              <input
                type="radio"
                name="gameMode"
                value="together"
                v-model="gameMode"
              />
              Razem
            </label>
            <label class="toggle-option">
              <input
                type="radio"
                name="gameMode"
                value="separate"
                v-model="gameMode"
              />
              Osobno
            </label>
          </div>
          <div class="modal-actions">
            <button @click="confirmStartGame" class="btn-modal-confirm">
              Start
            </button>
            <button
              @click="showStartGameModal = false"
              class="btn-modal-cancel"
            >
              Anuluj
            </button>
          </div>
        </div>
      </transition>
    </div>
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
const roomId = sessionStore.roomId;

// Modal dla dołączania do gry
const showJoinGameModal = ref(false);
const roomIdInput = ref("");

// Modal dla opcji przy tworzeniu gry
const showStartGameModal = ref(false);
// Tryb gry: "razem" (domyślnie) lub "osobno"
const gameMode = ref<"together" | "separate">("together");

// Funkcja otwierająca modal do wyboru trybu gry
const handleStartGame = () => {
  showStartGameModal.value = true;
};

// Funkcja potwierdzająca wybór trybu i rozpoczynająca grę
const confirmStartGame = async () => {
  try {
    const roomId = await createGame(gameMode.value);
    sessionStore.setRoomId(roomId);
    // Opcjonalnie: sessionStore.setGameMode(gameMode.value);
    router.push(`/lobby/${roomId}`);
    showStartGameModal.value = false;
  } catch (error) {
    console.error("Error starting game:", error);
    alert("Wystąpił błąd podczas tworzenia gry. Spróbuj ponownie.");
  }
};

const handleJoinGame = async () => {
  loadingStore.startLoading();
  try {
    if (!roomIdInput.value.trim()) {
      alert("Wprowadź poprawny kod pokoju.");
      return;
    }
    await joinGame(roomIdInput.value.trim());
    sessionStore.setRoomId(roomIdInput.value.trim());
    router.push(`/lobby/${roomIdInput.value.trim()}`);
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
/* Podstawowe style */
h1 {
  color: white;
}
section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  background-color: rgba(81, 24, 204, 0.12);
  backdrop-filter: blur(2.7px);
  -webkit-backdrop-filter: blur(2.7px);
  border: 1px solid rgb(82, 28, 231);
  height: 40vh;
  padding: 2rem;
  margin: 1rem;
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
  padding: 0.875rem 1.875rem;
  font-size: 1.125rem;
  text-transform: uppercase;
  border-radius: 0.9375rem;
  border: 0.25rem solid;
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

/* ---- Modal Style ---- */
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

.modal-content {
  background: rgb(82, 28, 231);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  border-radius: 0.75rem;
  padding: 2rem;
  width: 100%;
  max-width: 24rem;
  text-align: center;
  color: #fff;
}

.modal-content h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: normal;
  color: #ff9900;
}

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
  padding: 0.625rem;
  font-size: 1rem;
  width: 100%;
  max-width: 16rem;
  margin: 0.75rem auto;
  border: 1px solid #ccc;
  border-radius: 0.3125rem;
  box-sizing: border-box;
}

/* ---- Style Toggle dla trybu gry ---- */
.toggle-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1rem 0;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  cursor: pointer;
}

.toggle-option input[type="radio"] {
  accent-color: #ff9900;
}

/* ---- Responsive Adjustments ---- */
@media (max-width: 768px) {
  .buttons-container {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
