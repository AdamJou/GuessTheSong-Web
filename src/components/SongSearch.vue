<template>
  <div class="song-search">
    <h2>Song Selection</h2>

    <!-- 1) Ładowanie danych o piosenkach z Firebase -->
    <div v-if="fetchingPlayerSongs">
      <p>Loading player songs...</p>
    </div>

    <!-- 2) Gracz ma już piosenkę w bazie -->
    <div v-else-if="hasSubmitted">
      <h3>Submitted Song</h3>
      <p><strong>Title:</strong> {{ playerSongs[playerId].songTitle }}</p>
      <!-- Możesz tu dodać informację, że piosenki nie da się zmienić itp. -->
    </div>

    <!-- 3) Gracz NIE ma piosenki (po odczycie z bazy) => pokazujemy wyszukiwanie i "Submit" -->
    <div v-else>
      <div class="search-bar">
        <input
          v-model="query"
          type="text"
          placeholder="Enter song title..."
          @keyup.enter="search"
        />
        <button @click="search" :disabled="loading">Search</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="loading">Loading songs...</p>

      <!-- Lista wyników wyszukiwania -->
      <ul v-if="!loading && videos.length">
        <li
          v-for="video in videos"
          :key="video.id.videoId"
          @click="selectSong(video)"
          class="video-item"
        >
          <img :src="video.snippet.thumbnails.default.url" alt="Thumbnail" />
          <div>
            <p>
              <strong>{{ video.snippet.title }}</strong>
            </p>
            <p>{{ video.snippet.channelTitle }}</p>
          </div>
        </li>
      </ul>

      <!-- Informacja o wybranym utworze i przycisk zatwierdzania -->
      <div v-if="selectedSong">
        <h3>Selected Song</h3>
        <p><strong>Title:</strong> {{ selectedSong.snippet.title }}</p>
        <button @click="submitSelectedSong">Submit</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SongSearch.vue
 * Komponent, który:
 *  - subskrybuje playerSongs w Realtime Database
 *  - sprawdza, czy gracz ma już wybraną piosenkę
 *  - jeśli tak, wyświetla info o piosence
 *  - jeśli nie, daje możliwość wyszukiwania i wybrania piosenki
 */

import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";

// Usługi/aplikacje
import { fetchYouTubeVideos } from "@/yt";
import { updatePlayerSong } from "@/services/songService";
import { useSessionStore } from "@/stores/session";
import { YouTubeVideo } from "@/types/types";
// 1. Pobieramy dane z sessionStore
const sessionStore = useSessionStore();
const roomId = sessionStore.roomId as string;
const playerId = sessionStore.playerId as string;
const currentGame = computed(() => sessionStore.currentGame as string);

// 2. Stan wyszukiwania YouTube
const query = ref("");
const videos = ref<YouTubeVideo[]>([]);
const loading = ref(false);
const error = ref("");
const selectedSong = ref<YouTubeVideo | null>(null);

// 3. Stan piosenek w Firebase
//    Struktura: { player1: { songId: "...", songTitle: "..." }, player2: { ... }, ... }
const playerSongs = ref<Record<string, { songId: string; songTitle: string }>>(
  {}
);

// 4. Flaga, czy wciąż czekamy na dane z Firebase
const fetchingPlayerSongs = ref(true);

// 5. Czy aktualny gracz (playerId) ma już wybraną piosenkę?
const hasSubmitted = computed(() => {
  return !!playerSongs.value[playerId];
});

// 6. Subskrypcja do zmian w bazie
let unsubscribe: (() => void) | null = null;

function subscribeToPlayerSongs() {
  const db = getDatabase();
  const path = `rooms/${roomId}/games/${currentGame.value}/playerSongs`;
  const songsRef = dbRef(db, path);

  // Na wszelki wypadek, jeśli było wcześniej zarejestrowane "onValue", odpinamy
  unsubscribeFromPlayerSongs();

  // Ustawiamy subskrypcję
  const offFn = onValue(songsRef, (snapshot) => {
    playerSongs.value = snapshot.exists() ? snapshot.val() : {};
    // Gdy tylko mamy dane (po raz pierwszy lub przy każdej zmianie), możemy powiedzieć:
    fetchingPlayerSongs.value = false;
  });

  // Zapamiętujemy funkcję do odsubskrybowania
  unsubscribe = () => {
    off(songsRef, "value", offFn);
  };
}

function unsubscribeFromPlayerSongs() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// 7. Gdy zmienia się currentGame, odpinamy poprzednią subskrypcję i ustawiamy nową
watch(
  currentGame,
  (newGame) => {
    // Reset flagi ładowania
    fetchingPlayerSongs.value = true;
    // Odsubskrybowujemy starą
    unsubscribeFromPlayerSongs();
    // Subskrybujemy nową
    if (newGame) {
      subscribeToPlayerSongs();
    }
  },
  { immediate: true }
);

// 8. Przy odmontowaniu komponentu odpinamy się od Firebase
onBeforeUnmount(() => {
  unsubscribeFromPlayerSongs();
});

// 9. Funkcje logiki wyszukiwania i wyboru piosenki

async function search() {
  if (!query.value.trim()) {
    error.value = "Enter a song title.";
    return;
  }
  try {
    loading.value = true;
    error.value = "";
    // Możesz zmienić liczbę wyników (tu: 10)
    videos.value = await fetchYouTubeVideos(
      query.value,
      import.meta.env.VITE_YOUTUBE_API_KEY,
      2
    );
  } catch (err) {
    console.error("Search failed:", err);
    error.value = "Failed to fetch videos. Please try again.";
  } finally {
    loading.value = false;
  }
}

function selectSong(video: any) {
  if (hasSubmitted.value) {
    alert("You have already submitted a song.");
    return;
  }
  selectedSong.value = video;
}

async function submitSelectedSong() {
  if (!selectedSong.value) {
    alert("No song selected.");
    return;
  }
  try {
    await updatePlayerSong(
      roomId,
      currentGame.value,
      playerId,
      selectedSong.value.id.videoId,
      selectedSong.value.snippet.title
    );
    alert("Song submitted successfully!");
  } catch (err) {
    console.error("Error saving song:", err);
    alert("Failed to save the song. Please try again.");
  }
}
</script>

<style scoped>
.song-search {
  text-align: center;
  margin-top: 20px;
}

.search-bar {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  padding: 10px;
  font-size: 16px;
  width: 300px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

ul {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  transition: background-color 0.2s;
}

.video-item:hover {
  background-color: #f0f0f0;
}

.video-item img {
  width: 60px;
  height: 60px;
}

.error {
  color: red;
  font-weight: bold;
}
</style>
