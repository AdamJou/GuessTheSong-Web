<template>
  <div class="nickname-input">
    <h1>Enter your nickname</h1>
    <form @submit.prevent="saveNickname" novalidate>
      <input
        v-model="nickname"
        type="text"
        placeholder="Your nickname"
        required
      />
      <p v-if="error" class="error-message">{{ error }}</p>
      <button type="submit">Continue</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getAuth, signInAnonymously } from "firebase/auth"; // Firebase auth
import { getDatabase, ref as dbRef, set } from "firebase/database"; // Firebase database
import { useSessionStore } from "@/stores/session"; // Session store

const router = useRouter();
const sessionStore = useSessionStore();
const nickname = ref(sessionStore.nickname || ""); // Pobranie istniejącego nicku (jeśli jest)
const error = ref(""); // Do przechowywania błędów

const saveNickname = async () => {
  error.value = ""; // Reset error

  if (nickname.value.trim().length < 3) {
    error.value = "Nickname must be at least 3 characters long.";
    return;
  }

  try {
    // Jeśli użytkownik nie jest zalogowany, zaloguj anonimowo
    const auth = getAuth();
    let userId = sessionStore.playerId;

    if (!userId) {
      const result = await signInAnonymously(auth);
      userId = result.user.uid;
      console.log("Anonymous user created with ID:", userId);
    }

    // Zapisz nick i currentGame w Firebase Realtime Database
    const db = getDatabase();
    const playerRef = dbRef(db, `players/${userId}`);
    await set(playerRef, {
      nickname: nickname.value.trim(),
      currentGame: "", // Początkowo puste
    });

    console.log("Player data saved:", userId);

    // Zapisanie w session store
    sessionStore.setNickname(nickname.value.trim());
    sessionStore.setPlayerId(userId);

    // Przekierowanie na stronę docelową, jeśli istnieje
    const redirectPath = sessionStorage.getItem("redirectAfterNickname");
    if (redirectPath) {
      sessionStorage.removeItem("redirectAfterNickname");
      await router.push(redirectPath);
      console.log("Redirected to saved path:", redirectPath);
    } else {
      await router.push("/home");
      console.log("Redirected to /home");
    }
  } catch (err) {
    console.error("Error saving nickname:", err);
    error.value = "An error occurred. Please try again.";
  }
};
</script>

<style scoped>
.nickname-input {
  text-align: center;
  margin-top: 50px;
}

input {
  padding: 10px;
  font-size: 16px;
  width: 200px;
  margin-bottom: 10px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
}

.error-message {
  color: red;
  font-size: 14px;
  margin-top: 5px;
}
</style>
