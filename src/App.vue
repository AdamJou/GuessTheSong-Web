<template>
  <!-- Tło -->
  <Background />

  <!-- Główny kontener wypełniający okno -->
  <div id="app">
    <!-- Kontener wycentrowany w pionie i poziomie (flex), 
         wewnątrz którego jest #root -->
    <div id="root">
      <!-- Właściwa logika aplikacji -->
      <router-view v-if="initialized" />

      <!-- Loader pełnoekranowy (fixed) -->
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

      <!-- Komunikaty błędów/sukcesu -->
      <ErrorMessage />
      <SuccessMessage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

import { useSessionStore } from "@/stores/session";
import { useLoadingStore } from "@/stores/useLoadingStore";

/* Komponent tła */
import Background from "@/components/Background.vue";
/* Komponenty dodatkowe */
import ErrorMessage from "@/components/ErrorMessage.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";

const loadingStore = useLoadingStore();
const sessionStore = useSessionStore();
const initialized = ref(false);

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("[App] Zalogowany user:", user.uid);
      sessionStore.setPlayerId(user.uid);
    } else {
      console.log("[App] Brak zalogowanego usera, logujemy anonimowo...");
      const result = await signInAnonymously(auth);
      sessionStore.setPlayerId(result.user.uid);
      console.log("[App] Zalogowano anonimowo:", result.user.uid);
    }
    initialized.value = true;
  });
});
</script>

<style>
/* 1) Blokada przewijania w całym dokumencie */
html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Dokument nieprzewijalny */
  font-family: "Bungee", sans-serif;

  font-size: 14px;
}

/* 2) Kontener #app – wypełnia całe okno, 
      centruje #root w pionie i poziomie */
#app {
  display: flex;
  align-items: center; /* pion */
  justify-content: center; /* poziom */
  position: relative;
  width: 100%;
  height: 100%;
}

/* 3) Kontener #root – ma max-height i overflow-y, 
      więc przy nadmiarze treści pojawia się scroll pionowy */
#root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  /* By przy dużej zawartości można przewijać w pionie */
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  -ms-overflow-style: none;

  /* Dla Firefox */
  scrollbar-width: none;
  /* Szerokość w trybie desktop i margines wewn. */
  width: 90%;
  max-width: 1200px;
  padding: 20px;

  color: #2c3e50;
  text-align: center;
  font-size: clamp(14px, 2vw, 18px);
  box-sizing: border-box;
}

/* Loader pełnoekranowy */
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

/* Animacje nutki */
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

/* --- Responsywność dla mniejszych ekranów --- */
@media (max-width: 768px) {
  #root {
    max-height: 80vh; /* np. trochę mniejsze? */
    padding: 16px;
  }
}

@media (max-width: 480px) {
  #root {
    max-height: 75vh;
    padding: 12px;
  }

  .global-loader p {
    font-size: 14px;
  }
}
</style>
