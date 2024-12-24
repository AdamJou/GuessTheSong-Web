<template>
  <div id="app">
    <router-view />
    <!-- Widok routera, gdzie renderują się wszystkie trasy -->
  </div>
</template>

<script setup lang="ts">
// Nie wymaga dodatkowej logiki w App.vue na tym etapie
</script>

<style>
/* Opcjonalne globalne style */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
