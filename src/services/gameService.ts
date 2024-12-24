import { getDatabase, ref as dbRef, set, update, get } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import type { Room, Player } from "../types/types";
import { generateRoomCode } from "@/utils/roomCodeGenerator";
const database = getDatabase();

export const createGame = async (): Promise<string> => {
  const sessionStore = useSessionStore();

  if (!sessionStore.playerId || !sessionStore.nickname) {
    throw new Error("Player ID or nickname is missing.");
  }

  const roomId = generateRoomCode(); // 6-cyfrowy kod

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

  return roomId;
};

export const joinGame = async (roomId: string): Promise<void> => {
  const sessionStore = useSessionStore();

  if (!sessionStore.playerId || !sessionStore.nickname) {
    throw new Error("Player ID or nickname is missing.");
  }

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
};

export const startGame = async (roomId: string): Promise<void> => {
  const roomRef = dbRef(database, `rooms/${roomId}`);
  await update(roomRef, {
    status: "song_selection",
    currentGame: "game1",
    currentRound: "round1",
  });
};
