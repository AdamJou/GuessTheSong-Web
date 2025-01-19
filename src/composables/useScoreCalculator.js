// useScoreCalculator.ts
import { ref } from "vue";
import { getDatabase, ref as dbRef, update, get } from "firebase/database";
export function useScoreCalculator() {
    const scores = ref({});
    const loading = ref(false);
    // Nowa zmienna do przechowywania gracza z najwyższym wynikiem.
    const highestScorer = ref(null);
    const calculateAndSaveScores = async (roomId, gameId) => {
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
            const roomData = roomSnapshot.val();
            if (!roomData.players) {
                throw new Error("No players found in this room");
            }
            const game = roomData.games?.[gameId];
            if (!game) {
                throw new Error("Game data not found");
            }
            const players = roomData.players;
            // Przygotowujemy "lokalną" kopię graczy z aktualnymi wynikami
            const updatedPlayers = {};
            for (const playerId in players) {
                updatedPlayers[playerId] = {
                    ...players[playerId],
                    score: players[playerId].score || 0,
                };
            }
            // Przeliczamy punkty na podstawie "rounds"
            const rounds = game.rounds || {};
            for (const roundKey in rounds) {
                const round = rounds[roundKey];
                if (!round.song || !round.song.suggestedBy) {
                    continue;
                }
                const suggestedBy = round.song.suggestedBy;
                const votes = round.votes || {};
                // 1) Każdy głosujący, który wskazał `suggestedBy`, dostaje punkt
                for (const voterId in votes) {
                    if (votes[voterId] === suggestedBy) {
                        if (updatedPlayers[voterId]) {
                            updatedPlayers[voterId].score += 1;
                        }
                    }
                }
                // 2) Jeśli nikt nie wytypował autora, autor dostaje punkt
                const guessedBySomeone = Object.values(votes).some((guessedId) => guessedId === suggestedBy);
                if (!guessedBySomeone) {
                    if (updatedPlayers[suggestedBy]) {
                        updatedPlayers[suggestedBy].score += 1;
                    }
                }
            }
            // Zapisujemy zaktualizowane wartości do bazy
            const playersRef = dbRef(db, `rooms/${roomId}/players`);
            await update(playersRef, updatedPlayers);
            // Aktualizujemy w `scores`, by UI mógł je odczytać
            for (const playerId in updatedPlayers) {
                scores.value[playerId] = updatedPlayers[playerId].score;
            }
            // Wyznaczamy gracza o najwyższym score
            const playersArray = Object.values(updatedPlayers);
            playersArray.sort((a, b) => b.score - a.score);
            // Pierwszy w posortowanej tablicy ma największy wynik
            highestScorer.value = playersArray.length > 0 ? playersArray[0] : null;
            console.log("Scores successfully updated in the database");
        }
        catch (error) {
            console.error("Error calculating and saving scores:", error);
        }
        finally {
            loading.value = false;
        }
    };
    return {
        calculateAndSaveScores,
        scores,
        loading,
        highestScorer, // Udostępniamy zmienną na zewnątrz
    };
}
