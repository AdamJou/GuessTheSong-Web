<template>
  <div class="game-summary">
    <h2>Podsumowanie gry: {{ gameId }}</h2>

    <!-- Sekcja ładowania / błędu -->
    <div v-if="loading">Wczytywanie danych z bazy...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!rounds.length">
      <p>Brak rund w tej grze lub dane gry są nieprawidłowe.</p>
    </div>
    <div v-else>
      <!-- Nawigacja po rundach (jeśli jest więcej niż 1 runda) -->
      <div class="round-navigation" v-if="rounds.length > 1">
        <button :disabled="currentRoundIndex === 0" @click="prevRound">
          Poprzednia runda
        </button>
        <button
          :disabled="currentRoundIndex === rounds.length - 1"
          @click="nextRound"
        >
          Następna runda
        </button>
      </div>

      <!-- Aktualnie wybrana runda -->
      <div v-if="currentRound">
        <h3>Runda: {{ currentRound.id }}</h3>
        <p><strong>Utwór:</strong> {{ currentRound.song.songTitle }}</p>
        <p>
          <strong>Zaprezentowany przez:</strong>
          {{ getPlayerNickname(currentRound.song.suggestedBy) }}
        </p>

        <!-- Lista głosów -->
        <div class="votes">
          <h4>Głosy:</h4>
          <ul>
            <li
              v-for="(votedForPlayerId, votingPlayerId) in currentRound.votes"
              :key="votingPlayerId"
            >
              <!-- Nick głosującego -->
              {{ getPlayerNickname(votingPlayerId) }}
              głosował(a) na
              <!-- Nick gracza, na którego oddano głos -->
              <span
                :class="{
                  correct: votedForPlayerId === currentRound.song.suggestedBy,
                  wrong: votedForPlayerId !== currentRound.song.suggestedBy,
                }"
              >
                {{ getPlayerNickname(votedForPlayerId) }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, onMounted, watch } from "vue";

// Importujemy typy z pliku types.ts
import type { Round, Room, Player } from "@/types/types"; // dostosuj ścieżkę do swojego pliku

import { getDatabase, ref as dbRef, get } from "firebase/database";

/**
 * Załóżmy, że rodzic przekaże nam dwa parametry (props):
 * - roomId: string (np. "106517")
 * - gameId: string (np. "game1" albo "game2")
 */
const props = defineProps<{
  roomId: string;
  gameId: string;
}>();

// Stan lokalny: loading, error
const loading = ref(true);
const error = ref<string | null>(null);

// Pobrani z bazy gracze (klucz: playerId)
const players = ref<Record<string, Player>>({});

// Tablica rund, które wczytamy z bazy
const rounds = ref<Round[]>([]);

// Indeks aktualnej rundy
const currentRoundIndex = ref(0);

// Bieżąca runda wybrana do wyświetlenia
const currentRound = computed<Round | null>(() => {
  return rounds.value[currentRoundIndex.value] || null;
});

/**
 * Pobieranie danych z bazy:
 * 1. /rooms/{roomId}
 * 2. Wewnątrz sprawdzamy, czy istnieje game o nazwie props.gameId
 * 3. Wczytujemy rundy (rounds) i konwertujemy na tablicę
 * 4. Wczytujemy graczy (players)
 */
async function fetchGameData() {
  if (!props.roomId || !props.gameId) {
    error.value = "Brak prawidłowych parametrów roomId/gameId";
    loading.value = false;
    return;
  }

  try {
    const db = getDatabase();
    const roomRef = dbRef(db, `rooms/${props.roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      error.value = `Pokój ${props.roomId} nie istnieje w bazie.`;
      return;
    }

    const roomData = snapshot.val() as Room; // rzutujemy na nasz typ Room

    // Wczytujemy graczy
    players.value = roomData.players || {};

    // Sprawdzamy istnienie danej gry
    const gameData = roomData.games[props.gameId];
    if (!gameData) {
      error.value = `Gra "${props.gameId}" nie istnieje w pokoju ${props.roomId}.`;
      return;
    }

    // Mamy obiekt { roundId: Round, ... }; zamieniamy go na tablicę
    const rawRounds = gameData.rounds || {};
    rounds.value = Object.values(rawRounds); // to daje tablicę Round[]
  } catch (err: any) {
    error.value = err.message || String(err);
  } finally {
    loading.value = false;
  }
}

/**
 * Przełączanie rund
 */
function nextRound() {
  if (currentRoundIndex.value < rounds.value.length - 1) {
    currentRoundIndex.value++;
  }
}
function prevRound() {
  if (currentRoundIndex.value > 0) {
    currentRoundIndex.value--;
  }
}

/**
 * Pobranie wyświetlanej nazwy gracza
 */
function getPlayerNickname(playerId: string): string {
  const p = players.value[playerId];
  return p?.name || "??";
}

/**
 * Wczytanie danych po zamontowaniu
 */
onMounted(() => {
  fetchGameData();
});

/**
 * Jeśli props (roomId/gameId) mogą zmieniać się dynamicznie,
 * można obserwować zmiany i w razie czego ponownie pobrać dane.
 */
watch(
  () => [props.roomId, props.gameId],
  () => {
    rounds.value = [];
    currentRoundIndex.value = 0;
    loading.value = true;
    error.value = null;
    fetchGameData();
  }
);
</script>

<style scoped>
.game-summary {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
}
.error {
  color: red;
  font-weight: bold;
}
.round-navigation {
  margin-bottom: 1rem;
}
.correct {
  color: green;
  font-weight: bold;
}
.wrong {
  color: red;
  font-weight: bold;
}
</style>
