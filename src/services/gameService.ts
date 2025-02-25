import { getDatabase, ref as dbRef, set, update, get } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import type { Room, Player, Game, Round, GameMode } from "../types/types";
import { generateRoomCode } from "@/utils/roomCodeGenerator";

const database = getDatabase();
const updateCurrentGame = async (
  playerId: string,
  roomId: string
): Promise<void> => {
  const db = getDatabase();
  const playerRef = dbRef(db, `players/${playerId}`);
  await update(playerRef, { currentGame: roomId });
  console.log(`Updated currentGame for player ${playerId} to room ${roomId}`);
};
export const createGame = async (
  selectedGameMode: GameMode
): Promise<string> => {
  const sessionStore = useSessionStore();

  if (!sessionStore.playerId || !sessionStore.nickname) {
    throw new Error("Player ID or nickname is missing.");
  }

  const roomId = generateRoomCode();

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
    justFinishedGame: "",
    currentRound: "",
    djId: sessionStore.playerId,
    status: "waiting",
    games: {},
    gameMode: selectedGameMode,
  };

  const roomRef = dbRef(database, `rooms/${roomId}`);
  await set(roomRef, newRoom);

  sessionStore.setRoomId(roomId);
  sessionStore.subscribeToRoomStatus();
  sessionStore.subscribeToCurrentGame();

  return roomId;
};

export const joinGame = async (roomId: string): Promise<void> => {
  const sessionStore = useSessionStore();

  if (!sessionStore.playerId || !sessionStore.nickname) {
    throw new Error("Player ID or nickname is missing.");
  }

  await updateCurrentGame(sessionStore.playerId, roomId);

  const roomRef = dbRef(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    await updateCurrentGame(sessionStore.playerId, "");
    throw new Error("Room not found.");
  }

  const roomData: Room = snapshot.val();
  console.log("Room status:", roomData.status);

  if (roomData.status !== "waiting") {
    await updateCurrentGame(sessionStore.playerId, "");
    throw new Error("Game has started");
  }

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
  } else {
    console.log("Player already in the room");
  }

  sessionStore.setRoomId(roomId);
  sessionStore.subscribeToRoomStatus();
  sessionStore.subscribeToCurrentGame();
};

export const createGameAndRound = async (roomId: string): Promise<void> => {
  const sessionStore = useSessionStore();
  const roomRef = dbRef(database, `rooms/${roomId}`);

  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    throw new Error("Room not found.");
  }
  const roomData: Room = snapshot.val();

  const gameId = `game${Object.keys(roomData.games || {}).length + 1}`;
  const roundId = `round1`;

  const playerSongs: Record<string, string> = {};
  const votes: Record<string, string> = {};

  Object.keys(roomData.players).forEach((playerId) => {
    playerSongs[playerId] = "";

    if (playerId !== sessionStore.playerId) {
      votes[playerId] = "";
    }
  });

  const newGame: Game = {
    id: gameId,
    djId: sessionStore.playerId!,
    playerSongs: playerSongs,
    rounds: {},
  };

  const newRound: Round = {
    id: roundId,
    song: {
      songId: "",
      songTitle: "",
      suggestedBy: "",
      wasPlayed: false,
    },
    votes: votes,
    status: "waiting",
  };

  newGame.rounds[roundId] = newRound;

  console.log("New Game:", newGame);
  console.log("New Round:", newRound);

  await update(roomRef, {
    [`games/${gameId}`]: newGame,
    currentGame: gameId,
    currentRound: roundId,
    status: "song_selection",
  });

  await update(roomRef, {
    [`games/${gameId}/rounds/${roundId}`]: newRound,
  });

  sessionStore.subscribeToCurrentGame();
};
