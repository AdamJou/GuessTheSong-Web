<template>
  <div class="play-song-view" v-if="roomId">
    <h1>Play Song</h1>

    <!-- Display current song -->
    <div v-if="currentSong">
      <h2>Current Song</h2>
      <p><strong>Song ID:</strong> {{ currentSong.songId }}</p>
      <p><strong>Song Title:</strong> {{ currentSong.songTitle }}</p>
      <YouTubePlayer v-if="currentSong.songId" :songId="currentSong.songId" />
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
import {
  getDatabase,
  ref as dbRef,
  onValue,
  update,
  get,
} from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useVotes } from "@/composables/useVotes";
import { useRouter } from "vue-router";
import { useScoreCalculator } from "@/composables/useScoreCalculator";
import YouTubePlayer from "@/components/YouTubePlayer.vue";

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
      await update(dbRef(db, currentRoundPath), {
        status: "completed",
      });
      alert("Cannot create a new round. All players have already played.");
      await update(dbRef(db, roomPath), {
        currentRound: "round1", // Update root-level currentRound
      });
      //HERE
      await calculateAndSaveScores(roomId.value!, currentGame.value!);

      const currentGameNumber = parseInt(
        currentGame.value!.replace("game", "")
      );
      if (currentGameNumber >= playerCount) {
        alert("All games have finished! The session is over.");
        await update(dbRef(db, roomPath), {
          status: "finished", // Oznaczamy w bazie, że rozgrywka się skończyła
          justFinishedGame: currentGame.value,
        });
        console.log("=>", currentGame.value);
        router.push({ name: "Summary", params: { roomId: roomId.value } });
        return;
      }

      // 1) Wydobywamy numer z obecnego currentGame (np. "1" z "game1")
      /* const currentGameNumber = parseInt(
        currentGame.value!.replace("game", "")
      );*/
      const nextGameNumber = currentGameNumber + 1;
      const nextGameId = `game${nextGameNumber}`;

      // 2) Resetujemy currentRound na "round1"
      //    i ustawiamy w rooms/{roomId} -> currentGame = nextGameId
      await update(dbRef(db, roomPath), {
        currentGame: nextGameId,
        currentRound: "round1",
        justFinishedGame: "game" + currentGameNumber,
      });

      // 3) Wybieramy nowego DJ-a:
      //    - sprawdzamy, kto był DJ‑em w poprzednich grach
      //    - bierzemy zaktualizowanych graczy z największą liczbą punktów (którzy nie byli DJ‑ami)
      const roomSnap = await get(dbRef(db, roomPath));
      if (!roomSnap.exists()) {
        throw new Error("Room data not found");
      }
      const roomVal = roomSnap.val() || {};
      const allGames = roomVal.games || {};

      // Tworzymy zbiór użytych DJ‑ów (z dotychczasowych gier)
      const usedDjIds = new Set<string>();
      Object.values(allGames).forEach((g: any) => {
        if (g.djId) {
          usedDjIds.add(g.djId);
        }
      });

      // Po calculateAndSaveScores w bazie mamy uaktualnione "players" z punktami
      const playersSnap = await get(dbRef(db, `${roomPath}/players`));
      if (!playersSnap.exists()) {
        throw new Error("No players found in this room");
      }
      const updatedPlayers = playersSnap.val() as Record<
        string,
        { id: string; score: number; name: string }
      >;
      const playersArray = Object.values(updatedPlayers);

      // Odfiltrowujemy tych, którzy byli już DJ‑ami
      const potentialNewDjs = playersArray.filter((p) => !usedDjIds.has(p.id));

      // Sortujemy malejąco po score
      potentialNewDjs.sort((a, b) => b.score - a.score);

      // Najlepszy wynik wśród tych, którzy nie byli DJ-ami
      let newDjId = "";
      if (potentialNewDjs.length > 0) {
        newDjId = potentialNewDjs[0].id;
      } else {
        console.warn(
          "Wszyscy gracze byli już DJ‑ami – brak kandydata na DJ‑a."
        );
      }

      // Ustawiamy nowego DJ-a w rooms/{roomId}/djId
      await update(dbRef(db, roomPath), {
        djId: newDjId,
      });

      // 4) Tworzymy nową grę w "rooms/{roomId}/games/{nextGameId}"
      //    Z jedną rundą "round1" w statusie "song_selection".
      //    W 'votes' inicjalizujemy tylko graczy, którzy nie są DJ‑em.
      const nonDjVotes = Object.keys(updatedPlayers).filter(
        (pid) => pid !== newDjId
      );
      const votesObj = nonDjVotes.reduce((acc, pid) => {
        acc[pid] = "";
        return acc;
      }, {} as Record<string, string>);

      const newGameObj = {
        id: nextGameId,
        djId: newDjId,
        currentRound: "round1",
        rounds: {
          round1: {
            id: "round1",
            song: {
              songId: "",
              songTitle: "",
              suggestedBy: "",
              wasPlayed: false,
            },
            votes: votesObj, // <- inicjalizujemy id graczy (bez DJ‑a)
            status: "song_selection",
          },
        },
      };

      // Zapisujemy nową grę w bazie
      await update(dbRef(db, `${roomPath}/games`), {
        [nextGameId]: newGameObj,
      });

      // 5) Dopiero teraz przechodzimy do summary
      await update(dbRef(db, roomPath), {
        status: "summary",
      });

      router.push({ name: "Summary", params: { roomId: roomId.value } });
      return;
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
