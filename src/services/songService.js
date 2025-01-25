import { getDatabase, ref as dbRef, update } from "firebase/database";
/**
 * Aktualizacja piosenki wybranej przez gracza
 * @param roomId - ID pokoju
 * @param gameId - ID aktualnej gry
 * @param playerId - ID gracza
 * @param songId - ID piosenki
 * @param songTitle - Tytuł piosenki
 */
export const updatePlayerSong = async (roomId, gameId, playerId, songId, songTitle, wasPlayed = false) => {
    try {
        const database = getDatabase();
        // Ścieżka w Firebase dla `playerSongs`
        const playerSongRef = dbRef(database, `rooms/${roomId}/games/${gameId}/playerSongs/${playerId}`);
        // Dane do zapisania
        const songData = {
            songId,
            songTitle,
            wasPlayed,
        };
        // Aktualizacja Firebase
        await update(playerSongRef, songData);
        console.log(`Song updated for player ${playerId} in room ${roomId}, game ${gameId}`);
    }
    catch (error) {
        console.error(`Error updating song for player ${playerId} in room ${roomId}, game ${gameId}:`, error);
        throw error;
    }
};
