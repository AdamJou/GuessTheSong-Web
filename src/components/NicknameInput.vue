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
      <button type="submit">Continue</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session"; // Import naszego store

const router = useRouter();
const sessionStore = useSessionStore();
const nickname = ref(sessionStore.nickname || ""); // Pobranie istniejącego nicku (jeśli jest)

// Funkcja do zapisu nicku
const saveNickname = () => {
  if (nickname.value.trim()) {
    // Ustaw nickname w store
    sessionStore.setNickname(nickname.value.trim());

    // Generuj playerId, jeśli nie istnieje
    if (!sessionStore.playerId) {
      sessionStore.setPlayerId(generatePlayerId());
    }

    // Sprawdź, czy istnieje zapamiętana ścieżka do przekierowania
    const redirectPath = sessionStorage.getItem("redirectAfterNickname");
    if (redirectPath) {
      sessionStorage.removeItem("redirectAfterNickname");
      router
        .push(redirectPath)
        .then(() => console.log("Redirected to saved path:", redirectPath))
        .catch((err) => console.error("Router error:", err));
    } else {
      // Jeśli brak ścieżki, przekieruj do Home
      router
        .push("/home")
        .then(() => console.log("Redirected to /home"))
        .catch((err) => console.error("Router error:", err));
    }
  } else {
    alert("Please enter a valid nickname.");
  }
};

// Funkcja do generowania playerId
const generatePlayerId = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
}
</style>
