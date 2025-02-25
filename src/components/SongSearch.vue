<template>
  <div class="song-search">
    <div v-if="fetchingPlayerSongs">
      <p>Wyszukiwanie...</p>
    </div>

    <div v-else-if="hasSubmitted">
      <h3>Wybrany utwór</h3>
      <p>{{ playerSongs[playerId].songTitle }}</p>
    </div>

    <div v-else>
      <div class="search-bar">
        <input
          v-model="query"
          type="text"
          placeholder="Wprowadź tytuł utworu..."
          @keyup.enter="search"
        />
        <button @click="search" :disabled="loading" class="btn-search">
          Szukaj
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="loading">Wyszkiwanie...</p>

      <ul v-if="!loading && videos.length">
        <li
          v-for="video in videos"
          :key="video.id.videoId"
          @click="selectSong(video)"
          class="video-item"
          :class="{
            selected:
              selectedSong && selectedSong.id.videoId === video.id.videoId,
          }"
        >
          <img :src="video.snippet.thumbnails.default.url" alt="Thumbnail" />
          <div class="title">
            <p>{{ video.snippet.title }}</p>
          </div>
        </li>
      </ul>

      <Transition name="cartoon-modal" appear>
        <div v-if="selectedSong">
          <button @click="submitSelectedSong" class="btn-submit">
            Zatwierdź
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";

import { fetchYouTubeVideos } from "@/yt";
import { updatePlayerSong } from "@/services/songService";
import { useSessionStore } from "@/stores/session";
import { YouTubeVideo } from "@/types/types";

const sessionStore = useSessionStore();
const roomId = sessionStore.roomId as string;
const playerId = sessionStore.playerId as string;
const currentGame = computed(() => sessionStore.currentGame as string);

const query = ref("");
const videos = ref<YouTubeVideo[]>([]);
const loading = ref(false);
const error = ref("");
const selectedSong = ref<YouTubeVideo | null>(null);

const playerSongs = ref<Record<string, { songId: string; songTitle: string }>>(
  {}
);

const fetchingPlayerSongs = ref(true);

const hasSubmitted = computed(() => {
  return !!playerSongs.value[playerId];
});

let unsubscribe: (() => void) | null = null;

function subscribeToPlayerSongs() {
  const db = getDatabase();
  const path = `rooms/${roomId}/games/${currentGame.value}/playerSongs`;
  const songsRef = dbRef(db, path);

  unsubscribeFromPlayerSongs();

  const offFn = onValue(songsRef, (snapshot) => {
    playerSongs.value = snapshot.exists() ? snapshot.val() : {};
    fetchingPlayerSongs.value = false;
  });

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

watch(
  currentGame,
  (newGame) => {
    fetchingPlayerSongs.value = true;
    unsubscribeFromPlayerSongs();
    if (newGame) {
      subscribeToPlayerSongs();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  unsubscribeFromPlayerSongs();
});

async function search() {
  if (!query.value.trim()) {
    error.value = "Enter a song title.";
    return;
  }
  try {
    loading.value = true;
    error.value = "";
    videos.value = await fetchYouTubeVideos(
      query.value,
      import.meta.env.VITE_YOUTUBE_API_KEY,
      4
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
  } catch (err) {
    console.error("Error saving song:", err);
    alert("Failed to save the song. Please try again.");
  }
}
</script>

<style scoped>
.song-search {
  text-align: center;
  max-width: 100vw;
  padding: 1rem;
  overflow-x: hidden;
  margin-bottom: 3rem;
}

.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

input {
  padding: 10px;
  font-size: 16px;
}
button {
  padding: 0.5rem 1.875rem; /* 14px 30px */
  font-size: 1rem; /* 18px */
  text-transform: uppercase;
  border-radius: 0.9375rem; /* 15px */
  border: none;
  transition: all 0.3s ease-in-out;
  letter-spacing: 2px;
  position: relative;
  cursor: pointer;
}
.btn-search {
  color: #fff;
  height: 100%;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
}
.btn-search:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
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
  border-radius: 10px;
  cursor: pointer;
  padding: 10px;
  color: white;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  transition: background-color 0.2s ease;
}
.video-item p {
  margin: 0;
}
.video-item.selected {
  background-color: #007bff;
  color: white;
  border-radius: 5px;
}
.video-item:hover {
  background-color: #ff9900;
}

.video-item img {
  width: 80px;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.error {
  color: red;
  font-weight: bold;
}
</style>
