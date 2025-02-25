<template>
  <div id="root">
    <transition name="fade" mode="out-in">
      <router-view v-if="initialized" :replace="true" />
    </transition>
    <div v-if="showReturnButton" class="return-container">
      <p>Twoja gra została wstrzymana.</p>
      <button @click="resumeGame">Powróć do gry w pokoju {{ roomId }}</button>
    </div>
    <div v-if="loadingStore.isLoading" class="global-loader">
      <p>Trwa ładowanie...</p>
      <div class="nutka-spinner">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M503.32,5.94c-5.51-4.71-12.78-6.77-19.96-5.64L169.56,49.85c-12.04,1.90-20.91,12.28-20.91,24.47v256H99.10C44.46,330.32,0,371.07,0,421.16c0,50.09,44.46,90.84,99.10,90.84S198.19,471.25,198.19,421.16v-66.07V194.59l264.26-41.73v136.17h-49.55c-54.64,0-99.10,40.75-99.10,90.84s44.46,90.84,99.10,90.84S512,429.96,512,379.87v-66.07V123.87V24.77c0-7.24-3.17-14.12-8.68-18.83z"
          />
        </svg>
      </div>
    </div>
    <ErrorMessage />
    <SuccessMessage />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  computed,
  onBeforeMount,
} from "vue";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { useRouter } from "vue-router";

import ErrorMessage from "@/components/ErrorMessage.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";

const loadingStore = useLoadingStore();
const sessionStore = useSessionStore();
const router = useRouter();

const initialized = ref(false);
const showReturnButton = ref(false);
const roomId = ref(sessionStorage.getItem("roomId") || "");

const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const gameStatus = computed(() => sessionStore.gameStatus);
const playerId = computed(() => sessionStorage.getItem("playerId"));
const djId = computed(() => sessionStore.djId);

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
      console.warn("[App] roundStatus nie istnieje w bazie.");
      return null;
    }
  } catch (error) {
    console.error("[App] Błąd pobierania roundStatus:", error);
    return null;
  }
};

const fetchDjId = async (roomId: string): Promise<string | null> => {
  if (!roomId) {
    console.warn("Brak roomId, nie można pobrać djId.");
    return null;
  }

  const db = getDatabase();
  const djRef = dbRef(db, `rooms/${roomId}/djId`);

  try {
    const snapshot = await get(djRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn("[fetchDjId] djId nie istnieje w bazie.");
      return null;
    }
  } catch (error) {
    console.error("[fetchDjId] Błąd pobierania djId:", error);
    return null;
  }
};

onBeforeMount(async () => {
  await initializeApp();
});

const resumeGame = async () => {
  showReturnButton.value = false;
  if (sessionStore.gameStatus === "waiting") {
    redirectToCurrentGameState(sessionStore.gameStatus, null);
  }

  if (sessionStore.gameStatus) {
    const roundStatus = await fetchRoundStatus();

    if (roundStatus) {
      redirectToCurrentGameState(sessionStore.gameStatus, roundStatus);
    }
  } else {
    router.replace("/");
    sessionStore.clearRoomId();
  }
};

const initializeApp = async () => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      sessionStore.setPlayerId(user.uid);
    } else {
      const result = await signInAnonymously(auth);
      sessionStore.setPlayerId(result.user.uid);
    }
    initialized.value = true;
  });
  await sessionStore.initializeSession();
};

onMounted(async () => {
  if (roomId.value) {
    showReturnButton.value = true;
    router.replace("/home");
  } else {
    await initializeApp();
  }

  window.addEventListener("beforeunload", handleBeforeUnload);
});

watch(
  [currentGame, currentRound, gameStatus],
  async ([newCurrentGame, newCurrentRound, newGameStatus]) => {
    if (newGameStatus === "voting") {
      const fetchedRoundStatus = await fetchRoundStatus();
      const djId = await fetchDjId(roomId.value);
      if (djId) {
        sessionStore.djId = djId;
      }
      redirectToCurrentGameState(newGameStatus, fetchedRoundStatus);
    }
  },
  { immediate: true }
);

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = "";
};

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

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
        showReturnButton.value = false;
        router.replace({ name: "Voting", params: { roomId: roomId.value } });
      } else {
        if (
          roundStatus === "waiting" ||
          roundStatus === "completed" ||
          roundStatus === "song_selection"
        ) {
          showReturnButton.value = false;
          router.replace({ name: "DjPanel", params: { roomId: roomId.value } });
        } else if (roundStatus === "voting") {
          showReturnButton.value = false;
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
      router.replace({ name: "/home" });
    default:
      router.replace("/home");
    //sessionStore.clearRoomId();
  }
};
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Bungee", sans-serif;
  display: flex;
  justify-content: center;
  align-items: cetner;
  font-size: 14px;
  background-color: rgb(13, 13, 58);
  background-image: radial-gradient(
    ellipse at center,
    rgba(56, 38, 191, 0.059) 40%,
    rgba(13, 13, 58, 0.95) 100%
  );

  background-size: cover;
  background-repeat: no-repeat;
}

#app {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 0 auto;
  text-align: center;
  color: #2c3e50;
  display: flex;
  justify-content: center;
  align-items: cetner;
  max-width: 100vw;
  max-height: 100vh;
  overflow-y: auto;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #add8e6;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #9ac0d4;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #add8e6 transparent;
  font-weight: normal;
}

button {
  font-family: "Bungee", sans-serif;
}
input {
  font-family: "Montserrat", sans-serif;
  border-radius: 5px;
}

.global-loader {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  color: yellow;
  align-items: center;
  justify-content: center;
}

.nutka-spinner {
  width: 80px;
  height: 80px;
}

.nutka-spinner path {
  fill: none;
  stroke: #fff;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 3500;
  stroke-dashoffset: 3500;
  animation: dash 3s infinite linear;
}

@keyframes dash {
  0% {
    stroke-dashoffset: 3500;
  }
  50% {
    stroke-dashoffset: 0;
  }
  85% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 3500;
  }
}

.nutka-spinner svg {
  animation: rotate-note 2s infinite ease-in-out;
}

@keyframes rotate-note {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(8deg) scale(1.05);
  }
  100% {
    transform: rotate(0deg) scale(1);
  }
}
.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
html {
  font-size: 16px;
}

h1 {
  font-size: clamp(1.5rem, 2vw + 1rem, 3rem);
  line-height: 1.2;
  font-weight: normal;
}

h2 {
  font-size: clamp(1.25rem, 1.5vw + 1rem, 2.5rem);
  line-height: 1.3;
  font-weight: normal;
}

h3 {
  font-size: clamp(1rem, 1.2vw + 0.8rem, 2rem);
  line-height: 1.4;
  font-weight: normal;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-move {
  transition: transform 0.5s ease;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 1s ease;
}
.slide-enter-from {
  transform: translateX(100%);
}
.slide-leave-to {
  transform: translateX(-100%);
}

.cartoon-modal-enter-from,
.cartoon-modal-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.cartoon-modal-enter-active {
  animation: popIn 0.5s ease forwards;
}
.cartoon-modal-leave-active {
  animation: popOut 0.3s ease forwards;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  60% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes popOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

.btn-submit {
  color: #fff;
  height: 100%;
  background: linear-gradient(145deg, #00ff99, #00cc88);
  border: 1px solid #00aa66;
  box-shadow: 0 0.375rem 0 #009966, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #009966;
}

.btn-submit:hover {
  background: linear-gradient(145deg, #33ffbb, #00dd99);
  box-shadow: 0 0.25rem 0 #009966, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}
</style>
