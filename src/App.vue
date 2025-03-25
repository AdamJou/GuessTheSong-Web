<template>
  <div id="root">
    <div v-if="!isReady || !initialized" class="global-loader">
      <p>Trwa ładowanie...</p>
      <div class="nutka-spinner">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M503.32,5.94c-5.51-4.71-12.78-6.77-19.96-5.64L169.56,49.85c-12.04,1.90-20.91,12.28-20.91,24.47v256H99.10C44.46,330.32,0,371.07,0,421.16c0,50.09,44.46,90.84,99.10,90.84S198.19,471.25,198.19,421.16v-66.07V194.59l264.26-41.73v136.17h-49.55c-54.64,0-99.10,40.75-99.10,90.84s44.46,90.84,99.10,90.84S512,429.96,512,379.87v-66.07V123.87V24.77c0-7.24-3.17-14.12-8.68-18.83z"
          />
        </svg>
      </div>
    </div>
    <transition v-else name="fade" mode="out-in">
      <router-view :replace="true" />
    </transition>
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
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from "firebase/auth";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { useRouter } from "vue-router";
import { useGameStateManager } from "@/composables/useGameStateManager";

import ErrorMessage from "@/components/ErrorMessage.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";

const loadingStore = useLoadingStore();
const sessionStore = useSessionStore();
const router = useRouter();
const { fetchRoundStatus, redirectToCurrentGameState } = useGameStateManager();

const initialized = ref(false);
const isReady = ref(false);
const roomId = ref(sessionStorage.getItem("roomId") || "");

const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const gameStatus = computed(() => sessionStore.gameStatus);
const playerId = computed(() => sessionStorage.getItem("playerId"));
const djId = computed(() => sessionStore.djId);

// Add computed property to control router-view visibility
const shouldShowRouterView = computed(() => {
  // Don't show router-view if we're on NicknameInput route and have a nickname
  if (
    router.currentRoute.value.name === "NicknameInput" &&
    sessionStore.nickname
  ) {
    return false;
  }
  return true;
});

onBeforeMount(async () => {
  await initializeApp();
});

const initializeApp = async () => {
  const auth = getAuth();
  loadingStore.startLoading();

  try {
    // First ensure we have authentication
    const user = await new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      const result = await signInAnonymously(auth);
      sessionStore.setPlayerId(result.user.uid);
    } else {
      sessionStore.setPlayerId(user.uid);
    }

    // Now that we have authentication, initialize session
    await sessionStore.initializeSession();

    // Check if we have a nickname
    if (!sessionStore.nickname) {
      // If no nickname, redirect to NicknameInput
      await router.replace({ name: "NicknameInput" });
    } else {
      // If we have a roomId and game state, try to resume
      if (sessionStore.roomId && sessionStore.currentGame) {
        const roundStatus = await fetchRoundStatus();
        if (roundStatus) {
          // We have valid game state, redirect to appropriate view
          if (sessionStore.gameStatus) {
            await redirectToCurrentGameState(
              sessionStore.gameStatus,
              roundStatus
            );
          }
        } else {
          // If no valid game state found, clear roomId
          sessionStore.clearRoomId();
          await router.replace("/home");
        }
      }
    }

    initialized.value = true;
    isReady.value = true;
  } catch (error) {
    console.error("Error during initialization:", error);
    sessionStore.clearRoomId();
    await router.replace("/home");
    initialized.value = true;
    isReady.value = true;
  } finally {
    loadingStore.stopLoading();
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

watch(
  [currentGame, currentRound, gameStatus],
  async ([newCurrentGame, newCurrentRound, newGameStatus]) => {
    if (newGameStatus === "voting") {
      const fetchedRoundStatus = await fetchRoundStatus();
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
</script>

<style>
#app {
  width: 100%;
  height: 100dvh;
  overflow-y: auto;
  box-sizing: border-box;
}

#root {
  width: 100%;
  min-height: 100%;
  position: relative;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  #root {
    max-width: 600px;
    padding: 0;
  }
}

html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Bungee", sans-serif;
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

::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(173, 216, 230, 0.3);
  border-radius: 999px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(173, 216, 230, 0.5);
}

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(173, 216, 230, 0.3) transparent;
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
