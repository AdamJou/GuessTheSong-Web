import { ref } from "vue";
import { getDatabase, ref as dbRef, update, get } from "firebase/database";
import { Room, Game, Player } from "@/types/types";

export function useScoreCalculator() {
  const scores = ref<Record<string, number>>({});
  const loading = ref(false);

  const highestScorer = ref<Player | null>(null);

  const calculateAndSaveScores = async (roomId: string, gameId: string) => {
    if (!roomId || !gameId) {
      console.warn("Brak roomId albo gameId – przerywam liczenie punktów");
      return;
    }

    try {
      loading.value = true;

      const db = getDatabase();
      const roomRef = dbRef(db, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);

      if (!roomSnapshot.exists()) {
        throw new Error("Room data not found");
      }

      const roomData = roomSnapshot.val() as Room;

      if (!roomData.players) {
        throw new Error("No players found in this room");
      }

      const game = roomData.games?.[gameId] as Game | undefined;
      if (!game) {
        throw new Error("Game data not found");
      }

      const players = roomData.players;

      const updatedPlayers: Record<string, Player> = {};
      for (const playerId in players) {
        updatedPlayers[playerId] = {
          ...players[playerId],
          score: players[playerId].score || 0,
        };
      }

      const rounds = game.rounds || {};

      for (const roundKey in rounds) {
        const round = rounds[roundKey];
        if (!round.song || !round.song.suggestedBy) {
          continue;
        }

        const suggestedBy = round.song.suggestedBy;
        const votes = round.votes || {};

        for (const voterId in votes) {
          if (votes[voterId] === suggestedBy) {
            if (updatedPlayers[voterId]) {
              updatedPlayers[voterId].score += 1;
            }
          }
        }

        const guessedBySomeone = Object.values(votes).some(
          (guessedId) => guessedId === suggestedBy
        );
        if (!guessedBySomeone) {
          if (updatedPlayers[suggestedBy]) {
            updatedPlayers[suggestedBy].score += 1;
          }
        }
      }

      const playersRef = dbRef(db, `rooms/${roomId}/players`);
      await update(playersRef, updatedPlayers);

      for (const playerId in updatedPlayers) {
        scores.value[playerId] = updatedPlayers[playerId].score;
      }

      const playersArray = Object.values(updatedPlayers);
      playersArray.sort((a, b) => b.score - a.score);

      highestScorer.value = playersArray.length > 0 ? playersArray[0] : null;

      console.log("Scores successfully updated in the database");
    } catch (error) {
      console.error("Error calculating and saving scores:", error);
    } finally {
      loading.value = false;
    }
  };

  return {
    calculateAndSaveScores,
    scores,
    loading,
    highestScorer,
  };
}
