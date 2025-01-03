<template>
  <div id="app">
    <router-view />
    <!-- Widok routera, gdzie renderują się wszystkie trasy -->
  </div>
</template>

<script setup lang="ts"></script>

<style>
/* Reset lub globalne style - przykładowe */
html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Dobrze, by body też miało 100% szerokości */
  width: 100%;
  min-height: 100vh;
}

#app {
  /* Ustawienia kontenera */
  max-width: 1200px; /* szerokość max. np. na duże monitory */
  margin: 60px auto 0 auto; /* wycentrowanie + odstęp od góry */
  padding: 0 16px; /* drobny padding z boków, żeby nie kleiło się do krawędzi */
  text-align: center;
  color: #2c3e50;
}

/* Przykładowe media queries dla telefonów i tabletów */
@media (max-width: 768px) {
  #app {
    max-width: 100%; /* na tablecie może być pełna szerokość */
    margin-top: 40px;
    padding: 0 12px;
  }
}

@media (max-width: 480px) {
  #app {
    /* na bardzo małych ekranach (telefony) */
    margin-top: 20px;
    padding: 0 8px;
  }
}
</style>
