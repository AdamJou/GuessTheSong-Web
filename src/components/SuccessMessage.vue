<template>
  <transition name="fade">
    <div v-if="successStore.isVisible" class="success-toast">
      {{ successStore.successMessage }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useSuccessStore } from "@/stores/useSuccessStore";

const successStore = useSuccessStore();
</script>

<style scoped>
.success-toast {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: #00ff99;
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  color: black;
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
}
</style>
