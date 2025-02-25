<template>
  <div class="game-summary">
    <div v-if="!gameData">
      <p class="no-data">Brak danych gry do wyświetlenia.</p>
    </div>
    <div v-else>
      <h2>Gra {{ gameData.id.replace(/\D/g, "") }}</h2>

      <div v-if="rounds.length === 0">
        <p class="no-rounds">Brak rund w tej grze.</p>
      </div>
      <div v-else>
        <div class="round-navigation" v-if="rounds.length > 1">
          <button
            :disabled="currentRoundIndex === 0"
            @click="prevRound"
            class="btn-prev"
          >
            Poprzednia runda
          </button>
          <button
            :disabled="currentRoundIndex === rounds.length - 1"
            @click="nextRound"
            class="btn-next"
          >
            Następna runda
          </button>
        </div>

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

const rounds = computed<Round[]>(() => {
  if (!props.gameData) return [];
  const raw = props.gameData.rounds || {};
  return Object.values(raw);
});

const currentRoundIndex = ref(0);
const currentRound = computed<Round | null>(() => {
  return rounds.value[currentRoundIndex.value] || null;
});

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
.game-summary {
  max-width: 500px;
  margin: 1rem 1rem; 
  background-color: #1e1f29;
  border: 1px solid #2a2b36;
  border-radius: 8px;
  color: #ffffff;
  font-family: "Bungee", sans-serif;
  padding: 1rem;
}


.game-summary h2 {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  margin-bottom: 1.2rem;
  color: #ffcc00; 
  text-align: center;
}


.no-data,
.no-rounds {
  text-align: center;
  color: #ccc;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
}


.game-summary h3 {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  margin-bottom: 0.8rem;
  color: #00ff99; 
  text-align: center;
}


.song-title,
.player-nickname {
  font-style: italic;
}

.player-nickname {
  color: #00ff99; 
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
}


.round-navigation {
  display: flex;
  padding: 1rem;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.round-navigation button {
  background-color: #2a2b36;
  color: #fff;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(0.9rem, 1.2vw, 1rem);
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
  margin: 0.5rem 0;
}

.votes h4 {
  font-size: clamp(1.2rem, 2vw, 1.8rem);
  margin-top: 0.6rem;
  margin-bottom: 0.6rem;
  color: #ffcc00;
}

.votes ul {
  list-style: none;
  padding-left: 0;
  height: 100%;
  margin: 0;
}

.votes li {
  margin-bottom: 1.5rem;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
}


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
  color: gray;
}

.btn-prev,
.btn-next {
  color: #fff;
  background: linear-gradient(145deg, #00ff99, #00cc88);
  border: 1px solid #00aa66;
  box-shadow: 0 0.375rem 0 #009966, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #009966;
  padding: 0.6rem 1rem;
  font-family: inherit;
  font-size: clamp(0.9rem, 1.2vw, 1rem);
  cursor: pointer;
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.1s ease;
  border-radius: 4px;
}

.btn-prev:hover:not(:disabled),
.btn-next:hover:not(:disabled) {
  background: linear-gradient(145deg, #33ffbb, #00dd99);
  box-shadow: 0 0.25rem 0 #009966, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}

.btn-prev:active,
.btn-next:active {
  transform: scale(0.98);
  box-shadow: 0 0.25rem 0 #009966, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}

.btn-prev:disabled,
.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .game-summary {
    max-width: 700px;
    padding: 1.5rem;
  }

  strong {
    font-size: 0.8em;
  }
}

@media (min-width: 1024px) {
  .game-summary {
    max-width: 900px;
    padding: 2rem;
  }

  .game-summary h2 {
    font-size: clamp(1.8rem, 2vw, 2.5rem);
  }

  .game-summary h3 {
    font-size: clamp(1.4rem, 2.5vw, 1.8rem);
  }

  .votes h4 {
    font-size: clamp(1.4rem, 2.5vw, 2rem);
  }
}
</style>
