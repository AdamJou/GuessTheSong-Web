<template>
  <div class="nickname-input">
    <h1>Wprowadź swój nick</h1>
    <form @submit.prevent="saveNickname" novalidate>
      <input
        v-model="nickname"
        type="text"
        placeholder="Twój nickname"
        required
      />
      <p v-if="error" class="error-message">{{ error }}</p>
      <button
        :class="buttonClass"
        :disabled="nickname.length < 3"
        type="submit"
      >
        Zatwierdź
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref as dbRef, set, get } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useLoadingStore } from "@/stores/useLoadingStore";

const loadingStore = useLoadingStore();
const router = useRouter();
const sessionStore = useSessionStore();

const nickname = ref(sessionStore.nickname || "");
const error = ref("");

const buttonClass = computed(() => {
  return nickname.value.length >= 3 ? "active-button" : "disabled-button";
});

const redirectAfterNickname = async () => {
  const redirectPath = sessionStorage.getItem("redirectAfterNickname");
  if (redirectPath) {
    sessionStorage.removeItem("redirectAfterNickname");
    await router.replace(redirectPath);
  } else {
    await router.replace("/home");
  }
};

const checkPlayerNickname = async () => {
  try {
    const auth = getAuth();
    let userId = sessionStore.playerId;
    if (!userId) {
      const result = await signInAnonymously(auth);
      userId = result.user.uid;
      sessionStore.setPlayerId(userId);
      console.log("Anonymous user created with ID:", userId);
    }
    const db = getDatabase();
    const playerRef = dbRef(db, `players/${userId}`);
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data.nickname && data.nickname.trim().length >= 3) {
        sessionStore.setNickname(data.nickname);
        nickname.value = data.nickname;
        if (data.currentGame && data.currentGame.trim().length > 0) {
          sessionStore.setRoomId(data.currentGame);
        }
        console.log("Nickname found in DB:", data.nickname);
        await redirectAfterNickname();
        return;
      }
    }
  } catch (err) {
    console.error("Error checking player nickname:", err);
  }
};

onMounted(async () => {
  await checkPlayerNickname();
});

const saveNickname = async () => {
  error.value = "";
  if (nickname.value.trim().length < 3) {
    error.value = "Nickname must be at least 3 characters long.";
    return;
  }
  loadingStore.startLoading();
  try {
    const auth = getAuth();
    let userId = sessionStore.playerId;
    if (!userId) {
      const result = await signInAnonymously(auth);
      userId = result.user.uid;
      sessionStore.setPlayerId(userId);
      console.log("Anonymous user created with ID:", userId);
    }
    const db = getDatabase();
    const playerRef = dbRef(db, `players/${userId}`);

    await set(playerRef, {
      nickname: nickname.value.trim(),
      currentGame: "",
    });

    sessionStore.setNickname(nickname.value.trim());
    sessionStore.setPlayerId(userId);
    await redirectAfterNickname();
  } catch (err) {
    console.error("Error saving nickname:", err);
    error.value = "An error occurred. Please try again.";
  } finally {
    loadingStore.stopLoading();
  }
};
</script>

<style scoped>
.nickname-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10vh auto 0;
  padding: 1rem;
  max-width: 25rem;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
}

@media (max-width: 30rem) {
  .nickname-input {
    margin-bottom: 30vh;
  }
}

.nickname-input h1 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: white;
}

.nickname-input form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nickname-input input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-bottom: 0.625rem;
  border: 1px solid #ccc;
  border-radius: 0.3125rem;
  box-sizing: border-box;
}

.error-message {
  color: red;
  font-size: 0.875rem;
  margin-top: 0.3125rem;
}

button {
  padding: 0.875rem 1.875rem;
  font-size: 1.125rem;
  text-transform: uppercase;
  border-radius: 0.9375rem;
  border: 0.25rem solid;
  transition: all 0.3s ease-in-out;
  letter-spacing: 2px;
  position: relative;
  cursor: pointer;
  margin-top: 1rem;
}

button.disabled-button {
  background: linear-gradient(145deg, #aaaaaa, #888888);
  border-color: #666666;
  color: #dddddd;
  cursor: not-allowed;
  box-shadow: none;
}

button.active-button {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
  animation: bounce 0.4s ease infinite alternate;
}

button.active-button:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
  transform: translateY(-0.125rem);
}

button.active-button:active {
  box-shadow: none;
  transform: translateY(0.25rem);
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.3125rem);
  }
}

@media (min-width: 48rem) {
  .nickname-input {
    margin-top: 5vh;
  }
  .nickname-input h1 {
    font-size: 2rem;
  }
}
</style>
