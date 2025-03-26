import { getDatabase, ref as dbRef, get } from "firebase/database";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import type { Room } from "../types/types";
import { useSessionStore } from "@/stores/session";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { joinGame } from "@/services/gameService";

export const navigationGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const sessionStore = useSessionStore();
  const { playerId, nickname, roomId } = sessionStore;

  // If we're already on NicknameInput, allow it
  if (to.name === "NicknameInput") {
    return next();
  }

  // Check if we have required data
  if (!playerId || !nickname) {
    // Store the intended destination
    sessionStorage.setItem("redirectAfterNickname", to.fullPath);
    return next({ name: "NicknameInput" });
  }

  // Handle room-specific routes
  if (to.params.roomId) {
    try {
      // Ensure authentication is complete
      const auth = getAuth();
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      // If roomId in route doesn't match stored roomId, try to join the room
      if (roomId !== to.params.roomId) {
        try {
          // First try to join the room
          await joinGame(to.params.roomId as string);
          // If successful, set the roomId which will set up subscriptions
          sessionStore.setRoomId(to.params.roomId as string);
          return next();
        } catch (error) {
          console.error("Error joining room:", error);
          sessionStore.clearRoomId();
          return next({ name: "HomeView" });
        }
      }
      return next();
    } catch (error) {
      console.error("Error in navigation guard:", error);
      sessionStore.clearRoomId();
      return next({ name: "HomeView" });
    }
  }

  // For non-room routes, allow navigation
  next();
};
