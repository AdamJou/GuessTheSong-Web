<template>
  <!-- Tło -->
  <Background />

  <!-- Główny kontener wypełniający okno -->
  <!-- Kontener wycentrowany w pionie i poziomie (flex), 
         wewnątrz którego jest #root -->
  <div id="root">
    <!-- Właściwa logika aplikacji -->
    <router-view v-if="initialized" />
    <div v-if="showReturnButton" class="return-container">
      <p>Twoja gra została wstrzymana.</p>
      <button @click="resumeGame">Powróć do gry w pokoju {{ roomId }}</button>
    </div>
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

/* Komponenty */
import Background from "@/components/Background.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";

const loadingStore = useLoadingStore();
const sessionStore = useSessionStore();
const router = useRouter();

const initialized = ref(false);
const showReturnButton = ref(false);
const roomId = ref(sessionStorage.getItem("roomId") || "");

// Tworzymy reaktywne referencje dla wartości ze store'a
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const gameStatus = computed(() => sessionStore.gameStatus);
const playerId = computed(() => sessionStorage.getItem("playerId"));
const djId = computed(() => sessionStore.djId);

// Funkcja pobierająca aktualny roundStatus bez subskrypcji
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
      console.log("[App] Pobrano roundStatus:", snapshot.val());
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
      console.log("[fetchDjId] Pobrano djId:", snapshot.val());
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

// Funkcja do obsługi powrotu do gry
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
  }
};

// Funkcja inicjalizująca aplikację
const initializeApp = async () => {
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

  // Pobieranie danych gry po autoryzacji użytkownika
  await sessionStore.initializeSession();
};

// Przekierowanie użytkownika do strony głównej po odświeżeniu
onMounted(async () => {
  if (roomId.value) {
    showReturnButton.value = true;
    router.push("/home");
  } else {
    await initializeApp();
  }

  window.addEventListener("beforeunload", handleBeforeUnload);
});

// Dodajemy watchery dla kluczowych pól, aby monitorować zmiany
watch(
  [currentGame, currentRound, gameStatus],
  async ([newCurrentGame, newCurrentRound, newGameStatus]) => {
    console.log("Zmiana wartości:");
    console.log("currentGame:", newCurrentGame);
    console.log("currentRound:", newCurrentRound);
    console.log("gameStatus:", newGameStatus);

    if (newGameStatus === "voting") {
      const fetchedRoundStatus = await fetchRoundStatus();
      const djId = await fetchDjId(roomId.value);
      if (djId) {
        console.log("DJ ID:", djId);
        sessionStore.djId = djId;
      }
      console.log("Fetched roundStatus:", fetchedRoundStatus);
      redirectToCurrentGameState(newGameStatus, fetchedRoundStatus);
    }
  },
  { immediate: true }
);

// Obsługa zdarzenia zamknięcia strony
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = "";
};

// Usuwanie event listenera przy odmontowaniu
onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

// Funkcja przekierowania na podstawie aktualnego stanu gry
const redirectToCurrentGameState = async (
  gameStatus: string,
  roundStatus: string | null
) => {
  if (!roomId.value) return;
  console.log(djId.value, playerId.value);
  console.log("Przekierowanie na podstawie gameStatus:", gameStatus);
  console.log("currentGame:", currentGame.value);
  console.log("currentRound:", currentRound.value);
  console.log("roundStatus:", roundStatus);

  switch (gameStatus) {
    case "waiting":
      router.push({ name: "Lobby", params: { roomId: roomId.value } });
      break;
    case "song_selection":
      router.push({ name: "SongSelection", params: { roomId: roomId.value } });
      break;
    case "voting":
      console.log("playerId:", playerId.value, "djId:", djId.value);
      if (playerId.value !== djId.value) {
        console.log("[Redirect] Gracz - voting");
        showReturnButton.value = false;

        router.push({ name: "Voting", params: { roomId: roomId.value } });
      } else {
        console.log("[Redirect] DJ - voting");

        if (
          roundStatus === "waiting" ||
          roundStatus === "completed" ||
          roundStatus === "song_selection"
        ) {
          console.log("[Redirect] DJ - DjPanel");
          router.push({ name: "DjPanel", params: { roomId: roomId.value } });
        } else if (roundStatus === "voting") {
          console.log("[Redirect] DJ - PlaySong");
          showReturnButton.value = false;

          router.push({ name: "PlaySong", params: { roomId: roomId.value } });
        } else {
          console.log("roundStatus", roundStatus);
        }
      }
      break;
    case "summary":
      router.push({ name: "Summary", params: { roomId: roomId.value } });
      break;
    case "finished":
      console.log("xd");
      sessionStore.clearRoomId();

      router.push({ name: "/home" });
    default:
      router.push("/home");
      console.warn("Nieznany status gry:", gameStatus);
  }
};
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
  display: flex;
  justify-content: center;
  align-items: cetner;
  font-size: 14px;
}

#app {
  /* Ustawienia kontenera */
  max-width: 1200px; /* szerokość max. np. na duże monitory */
  margin: 60px auto 0 auto; /* wycentrowanie + odstęp od góry */
  padding: 2rem; /* drobny padding z boków, żeby nie kleiło się do krawędzi */
  text-align: center;
  color: #2c3e50;
  background-color: red;

  display: flex;
  justify-content: center;
  align-items: cetner;
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
</style>
