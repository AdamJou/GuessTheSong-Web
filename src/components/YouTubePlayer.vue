<template>
  <div class="youtube-player">
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

const props = defineProps<{
  songId: string;
}>();

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
