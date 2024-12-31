// useScoreCalculator.ts

import { ref } from "vue";
import { getDatabase, ref as dbRef, update, get } from "firebase/database";
import { Room, Game, Player } from "@/types/types";
export function useScoreCalculator() {
  const scores = ref<Record<string, number>>({});
  const loading = ref(false);

  /**
   * Główna metoda obliczania i zapisywania punktów:
   * wywołujesz ją dopiero wtedy, gdy masz pewność,
   * że roomId i gameId nie są puste (null).
   */
  const calculateAndSaveScores = async (roomId: string, gameId: string) => {
    // Zabezpieczenie – jeśli jednak puste, to przerwij.
    if (!roomId || !gameId) {
      console.warn("Brak roomId albo gameId – przerywam liczenie punktów");
      return;
    }

    try {
      loading.value = true;

      const db = getDatabase();
      // Pobieramy cały obiekt "rooms/{roomId}"
      const roomRef = dbRef(db, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);

      if (!roomSnapshot.exists()) {
        throw new Error("Room data not found");
      }

      const roomData = roomSnapshot.val() as Room;
      if (!roomData.players) {
        throw new Error("No players found in this room");
      }

      // "game" to nasz obiekt w rooms/{roomId}/games/{gameId}
      const game = roomData.games?.[gameId] as Game | undefined;
      if (!game) {
        throw new Error("Game data not found");
      }

      // Mamy graczy z bazy
      const players = roomData.players;

      // Przygotowujemy "lokalną" kopię graczy, żeby zmieniać score
      const updatedPlayers: Record<string, Player> = {};
      for (const playerId in players) {
        updatedPlayers[playerId] = {
          ...players[playerId],
          score: players[playerId].score || 0,
        };
      }

      // Przeliczamy punkty na podstawie "rounds"
      const rounds = game.rounds || {};

      // Dla każdej rundy:
      for (const roundKey in rounds) {
        const round = rounds[roundKey];
        if (!round.song || !round.song.suggestedBy) {
          continue; // brak utworu, pomijamy
        }

        const suggestedBy = round.song.suggestedBy;
        const votes = round.votes || {};

        // 1) Przyznaj 1 pkt każdemu, kto poprawnie wskazał suggestedBy
        for (const voterId in votes) {
          // Jeśli w tej rundzie voterId zagłosował na 'suggestedBy'
          if (votes[voterId] === suggestedBy) {
            // Głosujący dostaje punkt (o ile istnieje w updatedPlayers)
            if (updatedPlayers[voterId]) {
              updatedPlayers[voterId].score += 1;
            }
          }
        }

        // 2) Jeśli NIKT nie zagłosował na suggestedBy -> +1 dla suggestedBy
        const guessedBySomeone = Object.values(votes).some(
          (guessedId) => guessedId === suggestedBy
        );
        if (!guessedBySomeone) {
          if (updatedPlayers[suggestedBy]) {
            updatedPlayers[suggestedBy].score += 1;
          }
        }
      }

      // Zapisujemy zaktualizowane scores do bazy
      const playersRef = dbRef(db, `rooms/${roomId}/players`);
      await update(playersRef, updatedPlayers);

      // Aktualizujemy w `scores` – tak, by UI mógł to odczytać
      for (const playerId in updatedPlayers) {
        scores.value[playerId] = updatedPlayers[playerId].score;
      }

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
  };
}
