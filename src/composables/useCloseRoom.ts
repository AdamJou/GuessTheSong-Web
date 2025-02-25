import { computed } from "vue";
import { getDatabase, ref as dbRef, update } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";

export function useCloseRoom() {
  const sessionStore = useSessionStore();
  const router = useRouter();

  const roomId = computed(() => sessionStore.roomId);
  const djId = computed(() => sessionStore.djId);

  const isDj = computed(() => sessionStore.playerId === djId.value);

  async function closeRoom() {
    if (!roomId.value) {
      console.error("Brak roomId, nie można usunąć pokoju.");
      return;
    }

    try {
      const db = getDatabase();
      const updates: Record<string, any> = {};

      updates[`rooms/${roomId.value}`] = null;

      updates[`players/${sessionStore.playerId}/currentGame`] = "";

      await update(dbRef(db), updates);

      sessionStore.clearRoomId();
      router.replace("/home");

      console.log(`Pokój ${roomId.value} usunięty przez DJ-a.`);
    } catch (error) {
      console.error("Błąd przy zamykaniu pokoju:", error);
      alert("Wystąpił błąd przy usuwaniu pokoju. Spróbuj ponownie.");
    }
  }

  return {
    closeRoom,
  };
}
