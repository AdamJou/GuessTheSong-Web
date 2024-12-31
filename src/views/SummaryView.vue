<template>
  <div v-if="!roomId || !currentGame">
    <p>Ładowanie...</p>
  </div>
  <div v-else>
    <!-- Tabela z wynikami -->
    <Scoreboard />

    <!-- Komponent pokazujący aktualny status (opcja) -->
    <Status />

    <!-- Przycisk jest widoczny tylko dla DJ-a -->
    <div v-if="isDj" class="dj-controls">
      <button @click="setSongSelection">
        Rozpocznij kolejną fazę (song_selection)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, update } from "firebase/database";

// Komponenty
import Scoreboard from "@/components/Scoreboard.vue";
import Status from "@/views/Status.vue";

// Store
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const router = useRouter();

// Identyfikatory bieżącego pokoju i gry
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);

// Czy nasz gracz to DJ?
const isDj = computed(() => {
  return sessionStore.playerId === sessionStore.djId;
});

/**
 * Funkcja zmienia status pokoju (rooms/{roomId}/status) na "song_selection".
 * Wywoływana WYŁĄCZNIE przez DJ-a.
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
 * Gdy status w store zmieni się na "song_selection",
 * przekierowujemy WSZYSTKICH (nie tylko DJ-a) na SongSelection.vue
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
</script>

<style scoped>
.dj-controls {
  margin-top: 16px;
}
</style>
