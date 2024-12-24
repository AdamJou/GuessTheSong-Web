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

const generatePlayerId = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const router = useRouter();
const nickname = ref<string>("");

const saveNickname = () => {
  console.log("saveNickname executed", nickname.value); // DEBUG
  if (nickname.value.trim()) {
    sessionStorage.setItem("nickname", nickname.value.trim());
    const playerId = generatePlayerId();
    sessionStorage.setItem("playerId", playerId);

    // Zamiast routera testowo wyświetl log
    console.log("Nickname saved, ready to navigate");
    router
      .push("/home")
      .then(() => console.log("Router push successful"))
      .catch((err) => console.error("Router error:", err));
  } else {
    alert("Please enter a valid nickname.");
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
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
}
</style>
