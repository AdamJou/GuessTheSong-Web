<template>
  <div class="join-game">
    <h1>Enter Room Code</h1>
    <form @submit.prevent="joinRoom">
      <input v-model="roomCode" type="text" placeholder="Room Code" required />
      <button type="submit">Join</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

// Router
const router = useRouter();
const roomCode = ref<string>("");

// Funkcja dołączenia do pokoju
const joinRoom = () => {
  console.log(`Joining room with code: ${roomCode.value}`);
  router.push("/lobby"); // Przekierowanie na lobby (lub inny widok)
};
</script>

<style scoped>
.join-game {
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
