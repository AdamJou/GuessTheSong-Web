<template>
  <div v-if="!roomId || !currentGame">
    <p>Ładowanie...</p>
  </div>
  <div v-else>
    <button @click="onCalculateClick">Przelicz punkty</button>
    <!-- tu inne rzeczy -->
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSessionStore } from "@/stores/session";
import { useScoreCalculator } from "@/composables/useScoreCalculator";

const sessionStore = useSessionStore();
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);

// Inicjalizujemy composable BEZ argumentów
const { calculateAndSaveScores, scores, loading } = useScoreCalculator();

// Dopiero w momencie kliku (lub w watch, itp.) wołamy:
function onCalculateClick() {
  // Sprawdzamy, czy wreszcie mamy realne ID
  if (!roomId.value || !currentGame.value) {
    console.warn("Brak roomId lub currentGame – nie da się obliczyć punktów");
    return;
  }
  // Wywołujemy funkcję z aktualnymi wartościami
  calculateAndSaveScores(roomId.value, currentGame.value);
}
</script>
