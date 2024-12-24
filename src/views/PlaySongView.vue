<template>
  <div class="play-song-view">
    <h1>Play Song View (DJ)</h1>

    <!-- Display song details -->
    <div v-if="currentSong">
      <h2>Current Song</h2>
      <p><strong>Song ID:</strong> {{ currentSong.songId }}</p>
      <p><strong>Song Title:</strong> {{ currentSong.songTitle }}</p>
    </div>

    <!-- Message while waiting for song data -->
    <p v-else>Waiting for the song to load...</p>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";

// Access sessionStore
const sessionStore = useSessionStore();

// Reactive references
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const roomId = computed(() => sessionStore.roomId);

// Reactive data for the current song
const currentSong = ref<{ songId: string; songTitle: string } | null>(null);

// Firebase subscription to track the song in the current round
watch(
  [currentGame, currentRound],
  ([newGame, newRound]) => {
    if (!roomId.value || !newGame || !newRound) {
      console.warn("Missing required data for subscribing to current song.");
      currentSong.value = null;
      return;
    }

    const db = getDatabase();
    const songRef = dbRef(
      db,
      `rooms/${roomId.value}/games/${newGame}/rounds/${newRound}/song`
    );

    // Subscribe to song changes
    onValue(songRef, (snapshot) => {
      if (snapshot.exists()) {
        currentSong.value = snapshot.val();
      } else {
        currentSong.value = null;
      }
    });
  },
  { immediate: true }
);
</script>

<style scoped>
.play-song-view {
  text-align: center;
  margin-top: 50px;
}

h1 {
  font-size: 2rem;
  margin-bottom: 20px;
}

p {
  font-size: 1.2rem;
}

h2 {
  margin-top: 20px;
  font-size: 1.5rem;
}
</style>
