<template>
  <div class="home-view">
    <section v-if="!roomId" class="main-section">
      <div class="content-wrapper">
        <h1>Czyja To Melodia?</h1>
        <GamePresentation />
      </div>
      <div class="buttons-container">
        <button @click="handleStartGame" class="btn-start">Utwórz grę</button>
        <button @click="showJoinGameModal = true" class="btn-join">
          Dołącz do gry
        </button>
      </div>
    </section>

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

    <div
      v-if="showStartGameModal"
      class="modal"
      @click.self="showStartGameModal = false"
    >
      <transition name="cartoon-modal" appear>
        <div class="modal-content">
          <h2>Wybierz tryb gry</h2>
          <div class="toggle-container">
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { createGame, joinGame } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
import { useErrorStore } from "@/stores/useErrorStore";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import GamePresentation from "@/components/GamePresentation.vue";

const router = useRouter();
const sessionStore = useSessionStore();
const errorStore = useErrorStore();
const loadingStore = useLoadingStore();
const roomId = ref(sessionStorage.getItem("roomId") || "");

const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const gameStatus = computed(() => sessionStore.gameStatus);
const playerId = computed(() => sessionStorage.getItem("playerId"));
const djId = computed(() => sessionStore.djId);

const showJoinGameModal = ref(false);
const roomIdInput = ref("");
const showStartGameModal = ref(false);
const gameMode = ref<"together" | "separate">("together");

onMounted(async () => {
  if (roomId.value) {
    await handleAutoResume();
  }
});

const handleAutoResume = async () => {
  try {
    // Ensure authentication is complete
    const auth = getAuth();
    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    // Verify room exists
    const db = getDatabase();
    const roomRef = dbRef(db, `rooms/${roomId.value}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      sessionStore.clearRoomId();
      return;
    }

    // If we have a game status, redirect accordingly
    if (sessionStore.gameStatus) {
      const roundStatus = await fetchRoundStatus();
      redirectToCurrentGameState(sessionStore.gameStatus, roundStatus);
    } else {
      // If no game status, redirect to lobby
      router.replace({ name: "Lobby", params: { roomId: roomId.value } });
    }
  } catch (error) {
    console.error("Error auto-resuming game:", error);
    sessionStore.clearRoomId();
    router.replace({ name: "HomeView" });
  }
};

const redirectToCurrentGameState = async (
  gameStatus: string,
  roundStatus: string | null
) => {
  if (!roomId.value) return;
  switch (gameStatus) {
    case "waiting":
      router.replace({ name: "Lobby", params: { roomId: roomId.value } });
      break;
    case "song_selection":
      router.replace({
        name: "SongSelection",
        params: { roomId: roomId.value },
      });
      break;
    case "voting":
      if (playerId.value !== djId.value) {
        router.replace({ name: "Voting", params: { roomId: roomId.value } });
      } else {
        if (
          roundStatus === "waiting" ||
          roundStatus === "completed" ||
          roundStatus === "song_selection"
        ) {
          router.replace({ name: "DjPanel", params: { roomId: roomId.value } });
        } else if (roundStatus === "voting") {
          router.replace({
            name: "PlaySong",
            params: { roomId: roomId.value },
          });
        } else {
          console.log("roundStatus", roundStatus);
        }
      }
      break;
    case "summary":
      router.replace({ name: "Summary", params: { roomId: roomId.value } });
      break;
    case "finished":
      sessionStore.clearRoomId();
      router.replace({ name: "HomeView" });
      break;
    default:
      router.replace({ name: "HomeView" });
  }
};

const fetchRoundStatus = async () => {
  if (!roomId.value || !currentGame.value || !currentRound.value) {
    console.warn("Brak danych do pobrania roundStatus.");
    return null;
  }

  const db = getDatabase();
  const roundStatusRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/status`
  );

  try {
    const snapshot = await get(roundStatusRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("[App] Błąd pobierania roundStatus:", error);
    return null;
  }
};

const handleStartGame = () => {
  showStartGameModal.value = true;
};

const confirmStartGame = async () => {
  loadingStore.startLoading();

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const roomId = await createGame(gameMode.value);
    sessionStore.setRoomId(roomId);
    router.replace(`/lobby/${roomId}`);
    showStartGameModal.value = false;
  } catch (error) {
    console.error("Error starting game:", error);
    alert("Wystąpił błąd podczas tworzenia gry. Spróbuj ponownie.");
  } finally {
    loadingStore.stopLoading();
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
    router.replace(`/lobby/${roomIdInput.value.trim()}`);
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
.home-view {
  padding: 1rem 0;
  min-height: 100vh;
  box-sizing: border-box;
}

section {
  text-align: center;
  min-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.main-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(85vh - 2rem);
  max-height: calc(90vh - 2rem);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  background-color: rgba(81, 24, 204, 0.12);
  backdrop-filter: blur(2.7px);
  -webkit-backdrop-filter: blur(2.7px);
  border: 1px solid rgb(82, 28, 231);
  padding: 1.5rem;
  box-sizing: border-box;
  position: relative;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

h1 {
  color: white;
  margin: 0 0 1rem 0;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  flex-shrink: 0;
}

.presentation-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
}

.buttons-container {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
  flex-shrink: 0;
}

button {
  padding: 0.875rem 1.875rem;
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  text-transform: uppercase;
  border-radius: 0.9375rem;
  border: 0.25rem solid;
  transition: all 0.3s ease-in-out;
  letter-spacing: 2px;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
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
  transform: translateY(-2px);
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
  transform: translateY(-2px);
}

/* Modal styles */
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
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-sizing: border-box;
  z-index: 1000;
}

.modal-content {
  background: rgb(82, 28, 231);
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

@media (max-width: 768px) {
  .main-section {
    min-height: 85vh;
    padding: 1rem;
  }

  .buttons-container {
    flex-direction: column;
    padding: 1rem 0.5rem;
  }

  button {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }

  .toggle-container {
    flex-direction: column;
    gap: 1rem;
  }

  .modal-content {
    padding: 1.5rem;
    margin: 1rem;
  }
}
</style>
