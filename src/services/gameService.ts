import { getDatabase, ref as dbRef, set, update, get } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import type { Room, Player, Game, Round } from "../types/types";
import { generateRoomCode } from "@/utils/roomCodeGenerator";

const database = getDatabase();

export const simulateUnauthorizedUpdate = async (roomId: string): Promise<void> => {
  try {
    const db = getDatabase();
    const roomRef = dbRef(db, `rooms/${roomId}`);

    // Przykład nieautoryzowanej aktualizacji
    await update(roomRef, { status: "hacked" });

    console.log("Update succeeded (this should NOT happen).");
  } catch (error) {
    console.error("Unauthorized update failed as expected:", error);
  }
};

const updateCurrentGame = async (
  playerId: string,
  roomId: string
): Promise<void> => {
  const db = getDatabase();
  const playerRef = dbRef(db, `players/${playerId}`);
  await update(playerRef, { currentGame: roomId });
  console.log(`Updated currentGame for player ${playerId} to room ${roomId}`);
};
export const createGame = async (): Promise<string> => {
  const sessionStore = useSessionStore();

  if (!sessionStore.playerId || !sessionStore.nickname) {
    throw new Error("Player ID or nickname is missing.");
  }

  const roomId = generateRoomCode(); // 6-cyfrowy kod

  // Aktualizacja currentGame
  await updateCurrentGame(sessionStore.playerId, roomId);

  const newPlayer: Player = {
    id: sessionStore.playerId,
    name: sessionStore.nickname,
    score: 0,
    ready: false,
  };

  const newRoom: Room = {
    id: roomId,
    players: {
      [sessionStore.playerId]: newPlayer,
    },
    currentGame: "",
    currentRound: "",
    djId: sessionStore.playerId,
    status: "waiting",
    games: {},
  };

  const roomRef = dbRef(database, `rooms/${roomId}`);
  await set(roomRef, newRoom);

  sessionStore.setRoomId(roomId);
  sessionStore.subscribeToRoomStatus(); // Startuje nasłuchiwanie statusu pokoju
  sessionStore.subscribeToCurrentGame(); // Startuje nasłuchiwanie gry i rundy

  return roomId;
};

export const joinGame = async (roomId: string): Promise<void> => {
  const sessionStore = useSessionStore();

  if (!sessionStore.playerId || !sessionStore.nickname) {
    throw new Error("Player ID or nickname is missing.");
  }

  // Aktualizacja currentGame
  await updateCurrentGame(sessionStore.playerId, roomId);

  const roomRef = dbRef(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("Room not found.");
  }

  const roomData: Room = snapshot.val();

  // Sprawdzenie, czy gracz już istnieje w pokoju
  if (!roomData.players[sessionStore.playerId]) {
    const newPlayer: Player = {
      id: sessionStore.playerId,
      name: sessionStore.nickname,
      score: 0,
      ready: false,
    };

    await set(
      dbRef(database, `rooms/${roomId}/players/${sessionStore.playerId}`),
      newPlayer
    );

    console.log(`Player ${sessionStore.nickname} added to room ${roomId}`);
  }

  sessionStore.setRoomId(roomId);
  sessionStore.subscribeToRoomStatus(); // Startuje nasłuchiwanie statusu pokoju
  sessionStore.subscribeToCurrentGame(); // Startuje nasłuchiwanie gry i rundy
};

export const createGameAndRound = async (roomId: string): Promise<void> => {
  const sessionStore = useSessionStore();
  const roomRef = dbRef(database, `rooms/${roomId}`);

  // Fetch the room data
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    throw new Error("Room not found.");
  }
  const roomData: Room = snapshot.val();

  // Create new game and round IDs
  const gameId = `game${Object.keys(roomData.games || {}).length + 1}`;
  const roundId = `round1`;

  // Prepare player songs and votes
  const playerSongs: Record<string, string> = {};
  const votes: Record<string, string> = {};

  Object.keys(roomData.players).forEach((playerId) => {
    playerSongs[playerId] = ""; // Placeholder for songs

    // Exclude DJ from the initial votes
    if (playerId !== sessionStore.playerId) {
      votes[playerId] = ""; // Initialize vote as an empty string
    }
  });

  // Define the new game and round objects
  const newGame: Game = {
    id: gameId,
    djId: sessionStore.playerId!,
    playerSongs: playerSongs,
    rounds: {},
  };

  const newRound: Round = {
    id: roundId,
    song: {
      songId: "", // Placeholder
      songTitle: "", // Placeholder
      suggestedBy: "",
      wasPlayed: false,
    },
    votes: votes, // Pre-populated votes
    status: "voting",
  };

  newGame.rounds[roundId] = newRound;

  console.log("New Game:", newGame);
  console.log("New Round:", newRound);

  await update(roomRef, {
    [`games/${gameId}`]: newGame, // Update the game object without rounds
    currentGame: gameId,
    currentRound: roundId,
    status: "song_selection",
  });

  // Update the specific round separately
  await update(roomRef, {
    [`games/${gameId}/rounds/${roundId}`]: newRound, // Update the round object
  });

  sessionStore.subscribeToCurrentGame();
};
