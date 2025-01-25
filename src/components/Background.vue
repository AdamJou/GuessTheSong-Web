<template>
  <!-- Kontener tła (gradient + bąbelki) -->
  <div class="bg-container">
    <!-- Generujemy bąbelki (np. 20) -->
    <div v-for="n in 20" :key="n" class="bubble"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  const bubbleCount = window.innerWidth < 768 ? 10 : 20;

  document.querySelectorAll<HTMLElement>(".bubble").forEach((bubble, index) => {
    if (index >= bubbleCount) {
      bubble.style.display = "none";
      return;
    }
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const randomSize = Math.random() * 3 + 2;
    const randomDuration = Math.random() * 10 + 5;
    const randomHue = Math.floor(Math.random() * 60 + 200);

    bubble.style.setProperty("--x", `${randomX}vw`);
    bubble.style.setProperty("--y", `${randomY}vh`);
    bubble.style.setProperty("--size", `${randomSize}rem`);
    bubble.style.setProperty("--duration", `${randomDuration}s`);
    bubble.style.setProperty("--hue", `${randomHue}`);
    bubble.style.setProperty("--dx", `${Math.random() * 2 - 1}`);
    bubble.style.setProperty("--dy", `${Math.random() * 2 - 1}`);
  });
});
</script>

<style>
/* Tło wypełnia cały ekran, przyklejone (fixed), z-index -1 */
.bg-container {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;

  /* Gradient tła */
  background: linear-gradient(to right, #1a1a2e, #16213e);
}

/* Bąbelki z logiką animacji */
.bubble {
  position: absolute;
  background: radial-gradient(circle, hsl(var(--hue), 100%, 50%), transparent);
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.5;
  width: var(--size);
  height: var(--size);
  left: var(--x);
  top: var(--y);
  animation: float var(--duration) infinite alternate ease-in-out,
    morph 6s infinite ease-in-out;
}

/* Animacje */
@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(calc(var(--dx) * 100px), calc(var(--dy) * 100px))
      scale(1.5);
  }
  100% {
    transform: translate(calc(var(--dx) * -100px), calc(var(--dy) * -100px))
      scale(0.8);
  }
}

@keyframes morph {
  0% {
    border-radius: 50% 50% 50% 50%;
  }
  50% {
    border-radius: 40% 60% 60% 40%;
  }
  100% {
    border-radius: 60% 40% 40% 60%;
  }
}
</style>
