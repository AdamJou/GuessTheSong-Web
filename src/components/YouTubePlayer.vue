<template>
  <div class="youtube-player">
    <!-- Możesz dostosować rozmiar iframe wedle uznania -->
    <iframe
      width="560"
      height="315"
      :src="iframeSrc"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

// Odbieramy "songId" jako prop
const props = defineProps<{
  songId: string;
}>();

// Generujemy URL do osadzenia YouTube
// np. https://www.youtube.com/embed/<songId>?autoplay=1
const iframeSrc = computed(() => {
  return `https://www.youtube.com/embed/${props.songId}?autoplay=1`;
});
</script>

<style scoped>
.youtube-player {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}
</style>
