<template>
  <div class="game-summary">
    <!-- Jeśli nie ma danych gry, pokazujemy komunikat -->
    <div v-if="!gameData">
      <p class="no-data">Brak danych gry do wyświetlenia.</p>
    </div>
    <!-- Jeśli dane są, wyświetlamy podsumowanie -->
    <div v-else>
      <h2>Gra {{ gameData.id.replace(/\D/g, "") }}</h2>

      <!-- Jeśli nie ma rund, pokazujemy komunikat -->
      <div v-if="rounds.length === 0">
        <p class="no-rounds">Brak rund w tej grze.</p>
      </div>
      <!-- Wyświetlamy rundy -->
      <div v-else>
        <!-- Nawigacja po rundach (opcjonalna, jeśli > 1) -->
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

        <!-- Aktualna runda -->
        <div v-if="currentRound">
          <h3>Runda {{ currentRound.id.replace(/\D/g, "") }}</h3>
          <p>
            <span class="song-title">{{ currentRound.song.songTitle }}</span>
          </p>
          <p>
            <strong>Wybrany przez </strong>
            <span class="player-nickname">
              {{ getPlayerNickname(currentRound.song.suggestedBy) }}
            </span>
          </p>

          <!-- Lista głosów -->
          <div class="votes">
            <hr />
            <h4>Głosy</h4>
            <ul>
              <li
                v-for="(votedFor, voting) in currentRound.votes"
                :key="voting"
              >
                <span class="voter">{{ getPlayerNickname(voting) }} </span>
                <span> głosował(a) na </span>
                <span
                  :class="{
                    correct: votedFor === currentRound.song.suggestedBy,
                    wrong: votedFor !== currentRound.song.suggestedBy,
                  }"
                >
                  {{ getPlayerNickname(votedFor) }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, computed } from "vue";
import type { Game, Round } from "@/types/types";
import { useSummaryLogic } from "@/composables/useSummaryLogic";

const { getPlayerNickname } = useSummaryLogic();

const props = defineProps<{
  gameData: Game | null;
}>();

// Przerabiamy rundy w gameData na tablicę
const rounds = computed<Round[]>(() => {
  if (!props.gameData) return [];
  const raw = props.gameData.rounds || {};
  return Object.values(raw);
});

const currentRoundIndex = ref(0);
const currentRound = computed<Round | null>(() => {
  return rounds.value[currentRoundIndex.value] || null;
});

// Sterowanie "następna/poprzednia" runda
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
</script>

<style scoped>
/* Główny kontener: ciemne tło, wyśrodkowanie, neonowy klimat */
.game-summary {
  max-width: 500px;
  min-width: 500px;
  margin: 0 auto;
  background-color: #1e1f29;
  border: 1px solid #2a2b36;
  border-radius: 8px;
  padding: 1.5rem;
  color: #ffffff;
  font-family: "Bungee", sans-serif;
}

/* Tytuł główny (Podsumowanie gry) */
.game-summary h2 {
  font-size: 1.2rem;
  margin-bottom: 1.2rem;
  color: #ffcc00; /* Żółty / złoty odcień */
  text-align: center;
}

/* Brak danych lub rund */
.no-data,
.no-rounds {
  text-align: center;
  color: #ccc;
  font-size: 1rem;
}

/* Podtytuł rundy */
.game-summary h3 {
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: white; /* neonowy zielony */
}

/* Pojedyncze informacje o utworze/ graczu */
.song-title,
.player-nickname {
  font-style: italic;
}
.player-nickname {
  color: #00ff99; /* neonowy zielony */
  font-style: italic;
}

/* Nawigacja po rundach (przyciski) */
.round-navigation {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.round-navigation button {
  background-color: #2a2b36;
  color: #fff;
  border: 1px solid #444;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(1.2rem, 16px, 1.8rem);
  transition: background-color 0.3s ease;
  border-radius: 4px;
}

.round-navigation button:hover:not(:disabled) {
  background-color: #343646;
}

.round-navigation button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
hr {
  margin: 0.5rem;
}
/* Sekcja głosów */
.votes h4 {
  font-size: clamp(1.2rem, 14px, 1.8rem);
  margin-top: 0.6rem;
  margin-bottom: 0.6rem;
  color: #ffcc00;
}

/* Lista głosów */
.votes ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.votes li {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

/* Kolorowanie poprawnego / błędnego głosu */
.correct {
  color: #00ff99;
}
.wrong {
  color: #ff5555;
}
.voter {
  color: #ffcc00;
}
strong {
  font-size: 0.7em;
  color: gray;
}

/* Responsywność - zmniejszenie czcionek na bardzo wąskich ekranach */
@media (max-width: 400px) {
  .game-summary {
    padding: 1rem;
  }

  .game-summary h2 {
    font-size: 1.4rem;
  }

  .game-summary h3 {
    font-size: 1.1rem;
  }

  .votes li {
    font-size: 0.9rem;
  }

  .round-navigation button {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
}
</style>
