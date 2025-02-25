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

const router = useRouter();
const sessionStore = useSessionStore();
const successStore = useSuccessStore();
const errorStore = useErrorStore();
const loadingStore = useLoadingStore();

const { closeRoom } = useCloseRoom();
const { watchRoomRemoved, unwatchRoomRemoved } = useRoomWatcher();

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
    router.push("/home");
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

onMounted(async () => {
  setTimeout(() => {
    isVisible.value = true;
  }, 1000);
  await ensurePlayerInRoom();
  watchRoomRemoved();
});

onUnmounted(() => {
  unwatchRoomRemoved();
});
const handleGameStatusChange = (status: string | null) => {
  if (!status) return;

  if (status === "song_selection") {
    router.push({ name: "SongSelection", params: { roomId: roomId.value } });
  }
};
watch(gameStatus, (newStatus) => {
  handleGameStatusChange(newStatus);
});
</script>

<style scoped>
.lobby {
  color: white;
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
  text-align: left;
}
li {
  margin: 0.5rem 0;
  font-size: clamp(1rem, 0.4vw + 0.4rem, 1.5rem);
  border-bottom: 1px solid #ff9900;
}
.room-code-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.845);
  backdrop-filter: blur(2.7px);
  -webkit-backdrop-filter: blur(2.7px);
  border: 1px solid rgba(82, 28, 231, 0.579);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.375);
}
.room-code {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.room-code p {
  margin: 0;
  color: gray;
}

.room-code span {
  font-size: 1.5rem;
  color: #00ff99;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ic-dj {
  color: #ff9900;
  margin-left: 0.5rem;
}
.copy-icon {
  cursor: pointer;
  color: gray;
  font-size: 20px;
  transition: color 0.3s;
  transition: 0.3s ease-in-out;
}
.room-code-wrapper:hover {
  cursor: pointer;
}
.room-code-wrapper:hover > .room-code .copy-icon {
  transform: scale(1.1);
  color: #ff9900;
}
button {
  padding: 0.875rem 1.875rem; /* 14px 30px */
  font-size: 1.125rem; /* 18px */
  text-transform: uppercase;
  border-radius: 0.9375rem; /* 15px */
  border: 0.25rem solid; /* 4px */
  transition: all 0.3s ease-in-out;
  letter-spacing: 2px;
  position: relative;
  cursor: pointer;
  margin-top: 1rem;
}
.btn-start {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
}

.btn-start:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}
.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-end {
  color: #fff;
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  font-size: 2rem;
  transition: color 0.3s ease;
}
.btn-end:hover {
  color: #bbb;
  cursor: pointer;
}
</style>
