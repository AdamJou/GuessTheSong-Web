<template>
  <div class="lobby" :style="lobbyStyle">
    <section>
      <h1>Lobby</h1>
      <div class="room-code-wrapper" @click="copyToClipboard">
        <p>Kod pokoju</p>
        <div class="room-code">
          <span>{{ roomId }}</span>
          <font-awesome-icon :icon="['fas', 'copy']" class="copy-icon" />
        </div>
      </div>
      <h3>Gracze</h3>
      <ul>
        <li v-for="(player, id) in players" :key="id">
          {{ player.name }}
          <font-awesome-icon
            v-if="id === djId"
            :icon="['fas', 'headphones']"
            class="ic-dj"
          />

          <font-awesome-icon
            v-if="isDj && id !== djId"
            :icon="['fas', 'user-minus']"
            class="ic-dj"
            @click="kickPlayer(id)"
          />
        </li>
      </ul>
      <button
        v-if="isDj"
        @click="handleStartGame"
        :disabled="!canStartGame"
        class="btn-start"
        :class="{ disabled: !canStartGame }"
      >
        Start
      </button>
    </section>
  </div>
  <font-awesome-icon
    :icon="['fas', 'trash-can']"
    v-if="isDj"
    @click="deleteGame"
    class="btn-end"
  />
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { createGameAndRound } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
import { useSuccessStore } from "@/stores/useSuccessStore";
import { useErrorStore } from "@/stores/useErrorStore";
import { useLoadingStore } from "@/stores/useLoadingStore";
import Status from "@/views/Status.vue";
import { useCloseRoom } from "@/composables/useCloseRoom";
import { useRoomWatcher } from "@/composables/useCloseRoomWatcher";
import { getDatabase, ref as dbRef, update, onValue } from "firebase/database";

const router = useRouter();
const sessionStore = useSessionStore();
const successStore = useSuccessStore();
const errorStore = useErrorStore();
const loadingStore = useLoadingStore();

const { closeRoom } = useCloseRoom();
const { watchRoomRemoved, unwatchRoomRemoved } = useRoomWatcher();

const playerId = computed(() => sessionStore.playerId);
const roomId = computed(() => sessionStore.roomId);
const players = computed(() => sessionStore.players);
const djId = computed(() => sessionStore.djId);
const gameStatus = computed(() => sessionStore.gameStatus);
const isDj = computed(() => sessionStore.playerId === djId.value);
const canStartGame = computed(
  () => Object.keys(players.value || {}).length > 1
);

const isVisible = ref(false);
const lobbyStyle = computed(() => {
  return {
    opacity: isVisible.value ? "1" : "0",
    transition: "opacity 0.5s ease",
  };
});
const currentUrl = ref(window.location.href);

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(currentUrl.value);
    successStore.setSuccess("Link do pokoju skopiowany do schowka.", 2000);
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
};

const ensurePlayerInRoom = async () => {
  try {
    const { joinGame } = await import("@/services/gameService");
    if (roomId.value) {
      await joinGame(roomId.value);
    } else {
      throw new Error("Room ID is missing.");
    }
  } catch (error: any) {
    console.error(error);
    alert(error.message || "An error occurred.");
    router.replace("/home");
  }
};

const handleStartGame = async () => {
  loadingStore.startLoading();
  await new Promise((r) => setTimeout(r, 2000));

  try {
    if (roomId.value) {
      await createGameAndRound(roomId.value);
    } else {
      throw new Error("Room ID is missing.");
    }
  } catch (error: any) {
    console.error("Error starting the game:", error);
    errorStore.setError(
      error.message || "Wystąpił błąd podczas startowania gry."
    );
  } finally {
    loadingStore.stopLoading();
  }
};

const deleteGame = () => {
  if (window.confirm("Na pewno chcesz usunąć pokój?")) {
    closeRoom();
  }
};

const kickPlayer = async (playerIdToKick: string) => {
  if (!roomId.value) return;
  if (!players.value[playerIdToKick]) return;

  const playerName = players.value[playerIdToKick].name || "???";
  const confirmKick = window.confirm(
    `Na pewno chcesz wyrzucić gracza ${playerName}?`
  );
  if (!confirmKick) return;

  try {
    const db = getDatabase();
    const updates: Record<string, any> = {};

    updates[`rooms/${roomId.value}/players/${playerIdToKick}`] = null;

    await update(dbRef(db), updates);
  } catch (error) {
    console.error("Błąd przy wyrzucaniu gracza:", error);
  }
};

let kickedUnsubscribe: (() => void) | null = null;

const subscribeToKicked = () => {
  if (!roomId.value || !sessionStore.playerId) return;
  const db = getDatabase();
  const myRoomPlayerRef = dbRef(
    db,
    `rooms/${roomId.value}/players/${sessionStore.playerId}`
  );

  kickedUnsubscribe = onValue(myRoomPlayerRef, async (snapshot) => {
    if (!snapshot.exists()) {
      alert("Zostałeś wyrzucony z pokoju.");
      try {
        await update(dbRef(db), {
          [`players/${sessionStore.playerId}/roomId`]: "",
        });
      } catch (error) {
        console.error("Błąd przy aktualizacji roomId na pusty:", error);
      }
      sessionStorage.setItem("roomId", "");
      sessionStore.roomId = "";
      router.replace("/home");
    }
  });
};

onMounted(async () => {
  setTimeout(() => {
    isVisible.value = true;
  }, 1000);
  await ensurePlayerInRoom();
  watchRoomRemoved();
  subscribeToKicked();
});

onUnmounted(() => {
  unwatchRoomRemoved();
  if (kickedUnsubscribe) {
    kickedUnsubscribe();
    kickedUnsubscribe = null;
  }
});
const handleGameStatusChange = (status: string | null) => {
  if (!status) return;

  if (status === "song_selection") {
    router.replace({ name: "SongSelection", params: { roomId: roomId.value } });
  }
};
watch(gameStatus, (newStatus) => {
  handleGameStatusChange(newStatus);
});
</script>

<style scoped>
.lobby {
  color: white;
  padding: 2rem 0;
  min-height: 100vh;
  box-sizing: border-box;
}

section {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: rgba(30, 31, 41, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  margin: 0 0 1.5rem 0;
  color: white;
  text-align: center;
}

h3 {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  margin: 1.5rem 0 1rem;
  color: #ffcc00;
  text-align: center;
  width: 100%;
}

strong {
  color: #ff9900;
  font-size: larger;
}

ul {
  list-style-type: none;
  margin: 0;
  max-height: 30vh;
  overflow-y: auto;
  padding: 0;
  width: 100%;
}

li {
  margin: 0.5rem 0;
  font-size: clamp(0.875rem, 2vw, 1rem);
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-code-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: rgba(30, 31, 41, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 12px;
  transition: all 0.2s ease-in-out;
}

.room-code {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}

.room-code p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(0.875rem, 2vw, 1rem);
}

.room-code span {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  color: #00ff99;
  font-weight: bold;
}

.ic-dj {
  color: #ff9900;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.ic-dj:hover {
  transform: scale(1.1);
  color: #ffbb33;
}

.copy-icon {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  transition: all 0.2s ease-in-out;
}

.room-code-wrapper:hover {
  cursor: pointer;
  background: rgba(30, 31, 41, 0.9);
}

.room-code-wrapper:hover .copy-icon {
  transform: scale(1.1);
  color: #ff9900;
}

button {
  padding: 0.875rem 1.875rem;
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  text-transform: uppercase;
  border-radius: 0.9375rem;
  border: 0.25rem solid;
  transition: all 0.3s ease-in-out;
  letter-spacing: 2px;
  position: relative;
  cursor: pointer;
  margin-top: 1.5rem;
  white-space: nowrap;
}

.btn-start {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
}

.btn-start:hover:not(.disabled) {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-end {
  color: #ff5555;
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  font-size: 2rem;
  transition: all 0.3s ease;
}

.btn-end:hover {
  color: #ff3333;
  cursor: pointer;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .lobby {
    padding: 1rem 0;
  }

  .room-code-wrapper {
    padding: 0.75rem;
  }

  li {
    padding: 0.625rem;
    font-size: 0.875rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .btn-end {
    right: 1rem;
    bottom: 1rem;
    font-size: 1.5rem;
  }
}
</style>
