<template>
  <div class="voting-view">
    <h1>Voting View</h1>

    <!-- Display message while waiting for DJ -->
    <p v-if="!currentSong">Waiting for DJ to set a song...</p>

    <!-- Display song details once available -->
    <div v-else>
      <h2>Current Song</h2>
      <p><strong>Song ID:</strong> {{ currentSong.songId }}</p>
      <p><strong>Song Title:</strong> {{ currentSong.songTitle }}</p>
    </div>

    <!-- Voting Section -->
    <div v-if="currentSong && !hasVoted">
      <h2>Vote for who you think suggested this song:</h2>
      <ul>
        <li
          v-for="(player, playerId) in otherPlayers"
          :key="playerId"
          @click="selectPlayer(playerId)"
          :class="{ selected: selectedPlayer === playerId }"
        >
          {{ player.name }}
        </li>
      </ul>
      <button @click="submitVote" :disabled="!selectedPlayer">
        Submit Vote
      </button>
    </div>

    <!-- After Voting -->
    <div v-if="hasVoted">
      <p>
        You have voted for: <strong>{{ votedPlayer }}</strong>
      </p>
    </div>

    <!-- Display Real-Time Votes -->
    <div v-if="Object.keys(votes).length > 0">
      <h2>Votes So Far</h2>
      <ul>
        <li v-for="(votedFor, voter) in votes" :key="voter">
          {{ getPlayerName(voter) }} voted for {{ getPlayerName(votedFor) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { Players } from "@/types/types";
import { update } from "firebase/database";
// Session Store
const sessionStore = useSessionStore();

// Reactive Data
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const players = computed<Players>(() => sessionStore.players);
const playerId = computed(() => sessionStore.playerId);
const currentSong = ref<{ songId: string; songTitle: string } | null>(null);

const selectedPlayer = ref<string | null>(null);
const hasVoted = ref(false);
const votedPlayer = ref<string | null>(null);
const votes = ref<Record<string, string>>({});

// Helper function to get player names
const getPlayerName = (id: string): string => {
  return players.value?.[id]?.name || "Unknown";
};

// Other players excluding the current player
const otherPlayers = computed(() =>
  Object.keys(players.value || {}).reduce((filtered, id) => {
    if (id !== playerId.value) {
      filtered[id] = players.value[id];
    }
    return filtered;
  }, {} as Record<string, { name: string }>)
);

// Firebase Subscription Management
let songUnsubscribe: (() => void) | null = null;
let votesUnsubscribe: (() => void) | null = null;

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

const subscribeToVotes = () => {
  if (!roomId.value || !currentGame.value || !currentRound.value) return;

  const db = getDatabase();
  const votesRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/votes`
  );

  votesUnsubscribe = onValue(votesRef, (snapshot) => {
    const voteData = snapshot.val() || {};
    votes.value = voteData;

    if (playerId.value && voteData[playerId.value]) {
      hasVoted.value = true;
      votedPlayer.value =
        players.value?.[voteData[playerId.value]]?.name || "Unknown";
    }
  });
};

const unsubscribeFromFirebase = () => {
  if (songUnsubscribe) songUnsubscribe();
  if (votesUnsubscribe) votesUnsubscribe();
};

// Watchers for Game and Round
watch(
  [currentGame, currentRound],
  () => {
    unsubscribeFromFirebase();
    subscribeToSong();
    subscribeToVotes();
  },
  { immediate: true }
);

// Handle player selection
const selectPlayer = (id: string) => {
  selectedPlayer.value = id;
};

// Submit the vote
const submitVote = async () => {
  if (
    !roomId.value ||
    !currentGame.value ||
    !currentRound.value ||
    !playerId.value ||
    !selectedPlayer.value
  ) {
    alert("Unable to submit your vote. Please try again.");
    return;
  }

  const db = getDatabase();
  const votesRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/votes`
  );

  await update(votesRef, {
    [playerId.value]: selectedPlayer.value,
  });

  hasVoted.value = true;
  votedPlayer.value = players.value?.[selectedPlayer.value]?.name || "Unknown";

  alert("Vote submitted successfully!");
};
</script>
