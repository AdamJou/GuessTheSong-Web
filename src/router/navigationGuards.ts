import { getDatabase, ref as dbRef, get } from "firebase/database";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import type { Room } from "../types/types";

const database = getDatabase();

// Funkcja sprawdzająca stan pokoju i przekierowująca w zależności od roli i statusu
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
          // DJ: Przekieruj na Lobby
          if (to.name !== "Lobby") {
            console.log("DJ. Przekierowanie na Lobby.");
            return next({ name: "Lobby", params: { roomId } });
          }
        } else {
          // Gracz: Przekieruj na Lobby
          if (to.name !== "Lobby") {
            console.log("Gracz. Przekierowanie na Lobby.");
            return next({ name: "Lobby", params: { roomId } });
          }
        }
      } else if (room.status === "song_selection") {
        // Przekierowanie w zależności od statusu gry
        console.log("Przekierowanie na SongSelection.");
        return next({ name: "SongSelection", params: { roomId } });
      }
      // Można dodać kolejne fazy gry
    } else {
      // Pokój nie istnieje
      console.log("Pokój nie istnieje. Przekierowanie na HomeView.");
      sessionStorage.removeItem("roomId");
      return next({ name: "HomeView" });
    }
  } catch (error) {
    console.error("Błąd podczas pobierania danych pokoju:", error);
    return next({ name: "HomeView" });
  }

  // Jeśli wszystko jest w porządku
  next();
};

// Funkcja główna obsługująca logikę nawigacji
export const navigationGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const playerId = sessionStorage.getItem("playerId");
  const roomId = sessionStorage.getItem("roomId");

  // 1. Brak playerId -> zawsze przekieruj na NicknameInput
  if (!playerId) {
    if (to.name !== "NicknameInput") {
      console.log("Brak playerId. Przekierowanie na NicknameInput.");
      return next({ name: "NicknameInput" });
    }
    return next();
  }

  // 2. Mamy playerId, ale brak roomId -> dozwolone trasy to: HomeView, JoinGame
  if (playerId && !roomId) {
    const allowedRoutes = ["HomeView", "JoinGame"];
    if (!allowedRoutes.includes(to.name as string)) {
      console.log("Brak roomId. Przekierowanie na HomeView.");
      return next({ name: "HomeView" });
    }
    return next();
  }

  // 3. Mamy zarówno playerId, jak i roomId -> sprawdzamy stan pokoju
  if (roomId) {
    await handleRoomNavigation(roomId, playerId, to, next);
    return;
  }

  // Jeśli wszystkie warunki spełnione, przepuszczamy dalej
  next();
};
