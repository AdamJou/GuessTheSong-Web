<template>
  <div v-if="!roomId">
    <p>Ładowanie...</p>
  </div>
  <div v-else>
    <!-- Tabela z wynikami -->
    <Scoreboard />
    <Status />

    <!-- 
      Jeśli jest to OSTATNIA gra (isLastGame),
      wyświetlamy przyciski do wyboru dowolnej zakończonej gry (allGameIds).
      Domyślnie od razu pokazujemy 'displayedGameId' (czyli np. "game2"),
      ale użytkownik może klikać, by obejrzeć poprzednie gry.
    -->
    <div v-if="isLastGame" class="last-game-nav">
      <p>To była ostatnia gra. Możesz przejrzeć wyniki wszystkich gier:</p>
      <div class="game-buttons">
        <button
          v-for="gid in allGameIds"
          :key="gid"
          @click="setDisplayedGame(gid)"
          :class="{ active: gid === displayedGameId }"
        >
          {{ gid }}
        </button>
      </div>
    </div>

    <!-- 
      Komponent wyświetlający podsumowanie KONKRETNEJ gry (props.gameId).
      'displayedGameId' to kluczowa zmienna, którą ustawiamy w onMounted()
      w zależności od justFinishedGame i warunku "czy to ostatnia gra?" 
    -->
    <GameSummary
      v-if="displayedGameId"
      :roomId="roomId"
      :gameId="displayedGameId"
    />

    <!-- DJ controls, ewentualnie przejście do next fazy -->
    <div v-if="isDj && !isRoomFinished" class="dj-controls">
      <button @click="setSongSelection">
        Rozpocznij kolejną fazę (song_selection)
      </button>
    </div>

    <!-- Ekran "zakończonej" rozgrywki (status = finished) -->
    <div v-if="isRoomFinished" class="finished-controls">
      <p>Rozgrywka się zakończyła!</p>
      <button @click="goHome">Powrót do strony głównej</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, update, get } from "firebase/database";

// Komponenty
import Scoreboard from "@/components/Scoreboard.vue";
import Status from "@/views/Status.vue";
import GameSummary from "@/components/GameSummary.vue";

// Typy
import type { Room } from "@/types/types"; // <-- dostosuj ścieżkę do pliku z typami

// Store
import { useSessionStore } from "@/stores/session";
const sessionStore = useSessionStore();
const router = useRouter();

// Identyfikator pokoju (np. "106517")
const roomId = computed(() => sessionStore.roomId);

// Czy nasz gracz to DJ?
const isDj = computed(() => sessionStore.playerId === sessionStore.djId);

// Czy pokój jest całkowicie zakończony? (status = "finished")
const isRoomFinished = computed(() => {
  return sessionStore.gameStatus === "finished";
});

/**
 * roomData - tutaj wczytamy z bazy całe dane pokoju (m.in. justFinishedGame, games, players).
 */
const roomData = ref<Room | null>(null);

/**
 * displayedGameId - ID gry, którą chcemy właśnie wyświetlać w podsumowaniu
 * (np. "game1", "game2").
 */
const displayedGameId = ref("");

/**
 * isLastGame - czy właśnie zakończyliśmy ostatnią możliwą grę
 * (zwykle przy 2 graczach to "game2", przy 3 graczach "game3", itd.)
 */
const isLastGame = ref(false);

/**
 * allGameIds - tablica zawierająca wszystkie istniejące w bazie gry
 * np. ["game1","game2","game3"], posortowana rosnąco po numerze.
 * Używamy jej tylko, gdy isLastGame = true, by dać użytkownikowi przyciski.
 */
const allGameIds = ref<string[]>([]);

onMounted(async () => {
  if (!roomId.value) return;
  const db = getDatabase();
  const snapshot = await get(dbRef(db, `rooms/${roomId.value}`));

  if (!snapshot.exists()) {
    console.error("Nie odnaleziono pokoju w bazie");
    return;
  }
  const rd = snapshot.val() as Room;
  roomData.value = rd;

  // 1) Odczytaj justFinishedGame (np. "game1")
  const justFinished = rd.justFinishedGame || "";
  if (!justFinished) {
    // Jeśli w bazie nie ma "justFinishedGame", nie mamy co podsumowywać
    // (Możesz tutaj obsłużyć to dowolnie, np. wrócić do innego widoku)
    console.warn("Brak justFinishedGame - nie wiadomo, którą grę podsumować");
    return;
  }

  // 2) Numer zakończonej gry (np. 1 z "game1")
  const justFinishedNum = parseInt(justFinished.replace("game", ""));

  // 3) Liczba graczy = liczba gier, jakie można rozegrać
  const playerCount = Object.keys(rd.players || {}).length;

  // 4) Czy to ostatnia gra? (jeśli numer gry == liczba graczy)
  // Np. 1 == 2 => nie jest ostatnia, 2 == 2 => jest ostatnia
  if (justFinishedNum === playerCount) {
    isLastGame.value = true;
  } else {
    isLastGame.value = false;
  }

  // 5) Ustaw domyślnie "displayedGameId" na grę, która właśnie się skończyła
  // (czyli "game1" lub "game2" itp.)
  displayedGameId.value = justFinished;

  // 6) Jeśli to rzeczywiście OSTATNIA gra, pobierz listę wszystkich gier,
  //    by dać użytkownikowi możliwość przełączania.
  if (isLastGame.value) {
    const gamesObj = rd.games || {};
    const ids = Object.keys(gamesObj); // np. ["game1","game2"]
    ids.sort(
      (a, b) =>
        parseInt(a.replace("game", "")) - parseInt(b.replace("game", ""))
    );
    allGameIds.value = ids;
  } else {
    // Nie jest ostatnia gra -> nie potrzebujemy allGameIds
    allGameIds.value = [];
  }
});

/**
 * Funkcja do przełączania wyświetlanej gry (np. po kliknięciu przycisku).
 * Działa tylko w ostatniej grze (isLastGame), gdzie są przyciski.
 */
function setDisplayedGame(gid: string) {
  displayedGameId.value = gid;
}

/**
 * Przycisk DJ-a: zmiana statusu na "song_selection"
 */
async function setSongSelection() {
  if (!roomId.value) return;
  try {
    const db = getDatabase();
    const roomRef = dbRef(db, `rooms/${roomId.value}`);
    await update(roomRef, {
      status: "song_selection",
    });
    console.log("Status pokoju zmieniony na 'song_selection'");
  } catch (error) {
    console.error("Błąd przy zmianie statusu na 'song_selection':", error);
  }
}

/**
 * Gdy store.gameStatus zmieni się na "song_selection",
 * przekierowujemy wszystkich na SongSelection.vue
 */
watch(
  () => sessionStore.gameStatus,
  (newStatus) => {
    if (newStatus === "song_selection") {
      router.push({
        name: "SongSelection",
        params: { roomId: roomId.value },
      });
    }
  }
);

/**
 * Powrót do strony głównej
 */
function goHome() {
  router.push("/");
}
</script>

<style scoped>
.dj-controls {
  margin-top: 16px;
}
.last-game-nav {
  margin-bottom: 1rem;
}
.game-buttons {
  display: flex;
  gap: 8px;
}
.game-buttons .active {
  background-color: #ccc;
  font-weight: bold;
}
</style>
