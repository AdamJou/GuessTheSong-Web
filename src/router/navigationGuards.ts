import { getDatabase, ref as dbRef, get } from "firebase/database";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import type { Room } from "../types/types";
import { useSessionStore } from "@/stores/session";

export const navigationGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const sessionStore = useSessionStore();
  const { playerId, nickname, roomId } = sessionStore;
  console.log("GS", sessionStore.gameStatus);
  // Obsługa przypadku: użytkownik próbuje wejść do pokoju po linku
  if (to.params.roomId) {
    // Jeśli brakuje nicku lub playerId, przekieruj na NicknameInput
    if (!playerId || !nickname) {
      console.log("No playerId or nickname. Redirecting to NicknameInput.");
      sessionStorage.setItem("redirectAfterNickname", to.fullPath);
      return next({ name: "NicknameInput" });
    }

    // Jeśli roomId z linku różni się od obecnego, ustaw nowe roomId
    if (roomId !== to.params.roomId) {
      sessionStore.setRoomId(to.params.roomId as string);
    }

    // Pozwól przejść do pokoju
    return next();
  }

  // Obsługa przypadku: brak playerId (użytkownik musi najpierw ustawić nick)
  if (!playerId || !nickname) {
    if (to.name !== "NicknameInput") {
      console.log("Redirecting to NicknameInput.");
      return next({ name: "NicknameInput" });
    }
    return next();
  }

  // Jeśli wszystkie warunki są spełnione, pozwól przejść dalej
  next();
};
