import { getDatabase, ref as dbRef, update } from "firebase/database";

export const updatePlayerSong = async (
  roomId: string,
  gameId: string,
  playerId: string,
  songId: string,
  songTitle: string,
  wasPlayed: boolean = false
): Promise<void> => {
  try {
    const database = getDatabase();

    const playerSongRef = dbRef(
      database,
      `rooms/${roomId}/games/${gameId}/playerSongs/${playerId}`
    );

    const songData = {
      songId,
      songTitle,
      wasPlayed,
    };

    await update(playerSongRef, songData);
    console.log(
      `Song updated for player ${playerId} in room ${roomId}, game ${gameId}`
    );
  } catch (error) {
    console.error(
      `Error updating song for player ${playerId} in room ${roomId}, game ${gameId}:`,
      error
    );
    throw error;
  }
};
