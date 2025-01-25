<template>
  <transition name="fade">
    <div v-if="errorStore.isVisible" class="error-toast">
      {{ errorStore.errorMessage }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useErrorStore } from "@/stores/useErrorStore";

const errorStore = useErrorStore();
</script>

<style scoped>
.error-toast {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff4d4d;
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
}
</style>
