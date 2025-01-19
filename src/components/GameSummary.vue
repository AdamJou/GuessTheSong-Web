<template>
  <div class="game-summary">
    <div v-if="!gameData">
      <p>Brak danych gry do wyświetlenia.</p>
    </div>
    <div v-else>
      <h2>Podsumowanie gry: {{ gameData.id }}</h2>
      <div v-if="rounds.length === 0">
        <p>Brak rund w tej grze.</p>
      </div>
      <div v-else>
        <!-- Nawigacja rund (jeśli jest ich wiele) -->
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

        <div v-if="currentRound">
          <h3>Runda: {{ currentRound.id.replace(/\D/g, "") }}</h3>
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
                v-for="(votedFor, voting) in currentRound.votes"
                :key="voting"
              >
                {{ getPlayerNickname(voting) }} głosował(a) na
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

// rounds
const rounds = computed<Round[]>(() => {
  if (!props.gameData) return [];
  // gameData.rounds to Record<string,Round>, trzeba w tablicę
  const raw = props.gameData.rounds || {};
  return Object.values(raw);
});

const currentRoundIndex = ref(0);
const currentRound = computed<Round | null>(() => {
  return rounds.value[currentRoundIndex.value] || null;
});

// Podstawowe sterowanie
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
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
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
