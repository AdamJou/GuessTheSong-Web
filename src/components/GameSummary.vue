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
                <span class="voter">{{ getPlayerNickname(voting) }}</span>
                <span class="vote-label">→</span>
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
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: rgba(30, 31, 41, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  box-sizing: border-box;
}

.game-summary h2 {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  margin: 0 0 1.5rem 0;
  color: #ffcc00;
  text-align: center;
}

.game-summary h3 {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  margin: 1rem 0;
  color: #00ff99;
  text-align: center;
}

.song-title {
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: #fff;
  opacity: 0.9;
  display: block;
  text-align: center;
  margin: 0.5rem 0;
}

p {
  text-align: center;
  margin: 0.5rem 0;
  font-size: clamp(0.875rem, 2vw, 1rem);
}

strong {
  font-size: clamp(0.875rem, 2vw, 1rem);
}

.player-nickname {
  color: #ffcc00;
  font-size: clamp(0.875rem, 2vw, 1rem);
}

.votes {
  margin-top: 1.5rem;
}

.votes h4 {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: #ffcc00;
  text-align: center;
  margin: 1rem 0;
}

.votes ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.votes li {
  display: grid;
  grid-template-columns: 1fr 50px 1fr;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem;
  gap: 0.5rem;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  line-height: 1.4;
}

.voter {
  text-align: right;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 0.5rem;
}

.vote-label {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.25rem;
  font-weight: bold;
}

.correct,
.wrong {
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 0.5rem;
}

.correct {
  color: #00ff99;
}

.wrong {
  color: #ff5555;
}

hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 1.5rem 0;
}

@media (max-width: 480px) {
  .game-summary {
    padding: 1rem;
  }

  .votes li {
    padding: 0.625rem;
    gap: 0.25rem;
    border-radius: 8px;
    font-size: 0.75rem;
  }
}

.no-data,
.no-rounds {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(0.875rem, 2vw, 1rem);
  margin: 1rem 0;
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
