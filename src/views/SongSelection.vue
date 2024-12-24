<template>
  <div class="song-selection">
    <h1>Song Selection</h1>
    <p>
      Your Room Code: <strong>{{ roomId }}</strong>
    </p>
    <form @submit.prevent="submitSong" v-if="!isSubmitted">
      <div>
        <label for="songId">Song ID:</label>
        <input
          v-model="songId"
          type="text"
          id="songId"
          placeholder="Enter Song ID"
          required
        />
      </div>
      <div>
        <label for="songTitle">Song Title:</label>
        <input
          v-model="songTitle"
          type="text"
          id="songTitle"
          placeholder="Enter Song Title"
          required
        />
      </div>
      <button type="submit" :disabled="!canSubmit">Submit</button>
    </form>

    <div v-if="allPlayersSubmitted">
      <p>
        Everyone has submitted their songs! Waiting for the game to start...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import { updatePlayerSong } from "@/services/songService";

// Room and Current Game
const route = useRoute();
const sessionStore = useSessionStore();

const roomId = sessionStore.roomId as string; // Room ID z store, wymuszenie typu
const currentGame = ref<string | null>(null); // Current Game ID w czasie rzeczywistym
const playerId = sessionStore.playerId as string; // Player ID z store

// Form Data
const songId = ref<string>("");
const songTitle = ref<string>("");
const isSubmitted = ref<boolean>(false);

const allPlayersSubmitted = ref<boolean>(false);

// Computed, aby włączyć/wyłączyć przycisk Submit
const canSubmit = computed(() => songId.value.trim() && songTitle.value.trim());

// Nasłuchiwanie aktualnego `currentGame`
const listenToCurrentGame = () => {
  const db = getDatabase();
  const currentGameRef = dbRef(db, `rooms/${roomId}/currentGame`);

  onValue(currentGameRef, (snapshot) => {
    if (snapshot.exists()) {
      currentGame.value = snapshot.val();
      listenToPlayerSong();
      checkAllPlayersSubmitted(); // Sprawdź, czy wszyscy gracze już przesłali piosenkę
    } else {
      console.error("No current game found for this room.");
    }
  });
};

// Nasłuchiwanie, czy gracz już przesłał piosenkę
const listenToPlayerSong = () => {
  const songRef = dbRef(
    getDatabase(),
    `rooms/${roomId}/games/${currentGame.value}/playerSongs/${playerId}`
  );
  onValue(songRef, (snapshot) => {
    const songData = snapshot.val();
    if (songData) {
      isSubmitted.value = true;
    }
  });
};

const checkAllPlayersSubmitted = () => {
  const songsRef = dbRef(
    getDatabase(),
    `rooms/${roomId}/games/${currentGame.value}/playerSongs`
  );
  const playersRef = dbRef(getDatabase(), `rooms/${roomId}/players`);

  // Pobieramy wszystkich graczy w pokoju
  onValue(playersRef, (playersSnapshot) => {
    if (playersSnapshot.exists()) {
      const players = playersSnapshot.val();
      const totalPlayers = Object.keys(players);

      // Pobieramy przesłane piosenki
      onValue(songsRef, (songsSnapshot) => {
        if (songsSnapshot.exists()) {
          const submittedSongs = songsSnapshot.val();

          // Sprawdzamy, czy każda piosenka w `playerSongs` jest poprawnie uzupełniona
          allPlayersSubmitted.value = totalPlayers.every((playerId) => {
            const songData = submittedSongs[playerId];
            return songData && songData.songId && songData.songTitle;
          });
        }
      });
    } else {
      console.log("Brak graczy w pokoju.");
    }
  });
};

// Funkcja przesyłania piosenki
const submitSong = async () => {
  try {
    if (canSubmit.value && roomId && playerId && currentGame.value) {
      await updatePlayerSong(
        roomId,
        currentGame.value,
        playerId,
        songId.value,
        songTitle.value
      );
      isSubmitted.value = true;
    } else {
      alert("Please fill in both Song ID and Song Title.");
    }
  } catch (error) {
    console.error("Error submitting song:", error);
    alert("An error occurred while submitting your song. Please try again.");
  }
};

// Walidacja przy `onMounted`
onMounted(() => {
  if (!roomId || !playerId) {
    console.error("Missing roomId or playerId in session.");
  } else {
    listenToCurrentGame(); // Rozpocznij nasłuchiwanie aktualnej gry
  }
});
</script>

<style scoped>
.song-selection {
  text-align: center;
  margin-top: 50px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

form div {
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
</style>
