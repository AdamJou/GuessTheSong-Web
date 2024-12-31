<template>
  <div class="play-song-view" v-if="roomId">
    <h1>Play Song</h1>

    <!-- Display current song -->
    <div v-if="currentSong">
      <h2>Current Song</h2>
      <p><strong>Song ID:</strong> {{ currentSong.songId }}</p>
      <p><strong>Song Title:</strong> {{ currentSong.songTitle }}</p>
    </div>

    <!-- Display "Votes So Far" -->
    <div v-if="Object.keys(votes).length > 0">
      <h2>Votes So Far</h2>
      <ul>
        <li v-for="(votedFor, voter) in votes" :key="voter">
          {{ getPlayerName(voter) }} voted for {{ getPlayerName(votedFor) }}
        </li>
      </ul>
    </div>

    <!-- Display button if all players have voted -->
    <div v-if="allPlayersHaveVoted">
      <button @click="goBackToSongSelection">Go Back to Song Selection</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useVotes } from "@/composables/useVotes";
import { useRouter } from "vue-router";
import { useScoreCalculator } from "@/composables/useScoreCalculator";
const { calculateAndSaveScores } = useScoreCalculator();

// Session Store and Router
const sessionStore = useSessionStore();
const router = useRouter();

// Reactive Data
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const players = computed(() => sessionStore.players);
const playerId = computed(() => sessionStore.playerId);
const currentSong = ref<{ songId: string; songTitle: string } | null>(null);
// Use the reusable useVotes composable
const { votes, getPlayerName } = useVotes();

// Check if all players have voted
const allPlayersHaveVoted = computed(() => {
  const totalPlayers = Object.keys(players.value || {}).filter(
    (id) => id !== sessionStore.djId // Exclude the DJ's ID
  );
  return totalPlayers.every((id) => votes.value[id]); // Check if all remaining players have voted
});

// Firebase Subscription for Current Song
let songUnsubscribe: (() => void) | null = null;

const subscribeToSong = () => {
  if (!roomId.value || !currentGame.value || !currentRound.value) return;

  const db = getDatabase();
  const songRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/song`
  );

  songUnsubscribe = onValue(songRef, (snapshot) => {
    currentSong.value = snapshot.exists() ? snapshot.val() : null;
  });
};

const unsubscribeFromSong = () => {
  if (songUnsubscribe) {
    songUnsubscribe();
    songUnsubscribe = null;
  }
};

// Watchers for Game and Round
watch(
  [currentGame, currentRound],
  () => {
    unsubscribeFromSong();
    subscribeToSong();
  },
  { immediate: true }
);

// Go back to song selection
const goBackToSongSelection = async () => {
  try {
    const db = getDatabase();

    // Define paths
    const currentRoundPath = `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}`;
    const gamePath = `rooms/${roomId.value}/games/${currentGame.value}`;
    const roomPath = `rooms/${roomId.value}`; // Root path for the room

    // Get the current round number
    const currentRoundNumber = parseInt(
      currentRound.value!.replace("round", "")
    );
    const playerCount = Object.values(players.value || {}).length;

    // Check if a new round should be created
    if (currentRoundNumber >= playerCount) {
      console.log("Cannot create a new round: All players have had a turn.");
      alert("Cannot create a new round. All players have already played.");
      await calculateAndSaveScores(roomId.value!, currentGame.value!);

      await update(dbRef(db, roomPath), {
        status: "summary",
      });
      router.push({ name: "Summary", params: { roomId: roomId.value } });

      return; // Exit the function
    }

    // Mark the current round as completed
    await update(dbRef(db, currentRoundPath), {
      status: "completed",
    });

    // Generate next round ID
    const nextRoundNumber = currentRoundNumber + 1;
    const nextRoundId = `round${nextRoundNumber}`;

    // Initialize votes for all players except the DJ
    const votes = Object.keys(players.value || {}).reduce((acc, playerId) => {
      if (playerId !== sessionStore.djId) {
        acc[playerId] = ""; // No vote yet
      }
      return acc;
    }, {} as Record<string, string>);

    // Create a new round object
    const newRound = {
      id: nextRoundId,
      song: {
        songId: "", // Placeholder
        songTitle: "", // Placeholder
        suggestedBy: "",
        wasPlayed: false,
      },
      votes: votes, // Include initialized votes
      status: "song_selection",
    };

    // Add the new round to the game
    await update(dbRef(db, gamePath), {
      [`rounds/${nextRoundId}`]: newRound,
    });

    // Update the `currentRound` at both the room and game levels
    await update(dbRef(db, roomPath), {
      currentRound: nextRoundId, // Update root-level currentRound
    });

    await update(dbRef(db, gamePath), {
      currentRound: nextRoundId, // Update game-level currentRound
    });

    // Navigate back to the DJ Panel
    router.push({ name: "DjPanel", params: { roomId: roomId.value } });
  } catch (error) {
    console.error(
      "Error updating round status and creating the next round:",
      error
    );
    alert("Failed to go back to song selection. Please try again.");
  }
};
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
