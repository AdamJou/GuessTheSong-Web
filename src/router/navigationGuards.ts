import { getDatabase, ref as dbRef, get } from "firebase/database";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import type { Room } from "../types/types";
import { useSessionStore } from "@/stores/session";

const database = getDatabase();

export const handleRoomNavigation = async (
  roomId: string,
  playerId: string,
  to: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  try {
    const roomRef = dbRef(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const room: Room = snapshot.val();

      if (room.status === "waiting") {
        if (room.djId === playerId) {
          if (to.name !== "Lobby") {
            console.log("DJ. Przekierowanie na Lobby.");
            return next({ name: "Lobby", params: { roomId } });
          }
        } else {
          if (to.name !== "Lobby") {
            console.log("Gracz. Przekierowanie na Lobby.");
            return next({ name: "Lobby", params: { roomId } });
          }
        }
      } else if (room.status === "song_selection") {
        if (!room.games || !room.currentGame || !room.players[playerId]) {
          console.error(
            "Invalid state: Missing game or player does not exist in room."
          );
          return next({ name: "HomeView" });
        }

        if (to.name !== "SongSelection") {
          console.log("Przekierowanie na SongSelection.");
          return next({ name: "SongSelection", params: { roomId } });
        }
      }
    } else {
      console.log("Pokój nie istnieje. Przekierowanie na HomeView.");
      sessionStorage.removeItem("roomId");
      return next({ name: "HomeView" });
    }
  } catch (error) {
    console.error("Błąd podczas pobierania danych pokoju:", error);
    return next({ name: "HomeView" });
  }

  next();
};

export const navigationGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const sessionStore = useSessionStore();
  const { playerId, nickname, roomId } = sessionStore;

  // Obsługa sytuacji, gdy użytkownik wchodzi na Lobby z linkiem
  if (to.name === "Lobby" && to.params.roomId) {
    if (!playerId || !nickname) {
      console.log(
        "Brak playerId lub nickname. Przekierowanie na NicknameInput."
      );
      sessionStorage.setItem("redirectAfterNickname", to.fullPath); // Zapamiętaj docelową trasę
      return next({ name: "NicknameInput" });
    }
    if (roomId !== to.params.roomId) {
      sessionStore.setRoomId(to.params.roomId as string);
    }
  }

  // 1. Brak playerId -> zawsze przekieruj na NicknameInput
  if (!playerId) {
    if (to.name !== "NicknameInput") {
      return next({ name: "NicknameInput" });
    }
    return next();
  }

  // 2. Mamy playerId, ale brak roomId -> dozwolone trasy to: HomeView, JoinGame
  if (playerId && !roomId) {
    const allowedRoutes = ["HomeView", "JoinGame"];
    if (!allowedRoutes.includes(to.name as string)) {
      return next({ name: "HomeView" });
    }
    return next();
  }

  // 3. Mamy zarówno playerId, jak i roomId -> sprawdzamy stan pokoju
  if (roomId) {
    await handleRoomNavigation(roomId, playerId, to, next);
    return;
  }

  next();
};
