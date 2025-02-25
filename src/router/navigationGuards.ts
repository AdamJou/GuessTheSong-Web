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
  if (to.params.roomId) {
    if (!playerId || !nickname) {
      console.log("No playerId or nickname. Redirecting to NicknameInput.");
      sessionStorage.setItem("redirectAfterNickname", to.fullPath);
      return next({ name: "NicknameInput" });
    }

    if (roomId !== to.params.roomId) {
      sessionStore.setRoomId(to.params.roomId as string);
    }

    return next();
  }

  if (!playerId || !nickname) {
    if (to.name !== "NicknameInput") {
      console.log("Redirecting to NicknameInput.");
      return next({ name: "NicknameInput" });
    }
    return next();
  }

  next();
};
