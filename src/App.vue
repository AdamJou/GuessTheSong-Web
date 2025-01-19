<template>
  <div id="app">
    <Suspense>
      <!-- 
        "default" - wyświetlamy router-view, ale 
        tylko jeśli 'initialized' jest true
      -->
      <template #default>
        <router-view v-if="initialized" />
      </template>

      <!-- 
        "fallback" - tymczasowy widok ładowania, 
        dopóki 'initialized' nie jest true
      -->
      <template #fallback>
        <div class="loading-screen">
          <p>Trwa weryfikacja użytkownika...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const initialized = ref(false);

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("[App] Zalogowany user:", user.uid);
      sessionStore.setPlayerId(user.uid);
      // Tu można odpalić np. subskrypcje do bazy: sessionStore.subscribeToPlayers();
    } else {
      console.log("[App] Brak zalogowanego usera, logujemy anonimowo...");
      const result = await signInAnonymously(auth);
      sessionStore.setPlayerId(result.user.uid);
      console.log("[App] Zalogowano anonimowo:", result.user.uid);
      // Można też tutaj odpalić subskrypcje
    }
    // Gdy mamy już usera (anonim lub zwykły), uznajemy aplikację za "zainicjalizowaną"
    initialized.value = true;
  });
});
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  min-height: 100vh;
}

#app {
  max-width: 1200px;
  margin: 60px auto 0 auto;
  padding: 0 16px;
  text-align: center;
  color: #2c3e50;
}

/* Ekran ładowania */
.loading-screen {
  margin-top: 80px;
  font-size: 18px;
  color: #666;
}

@media (max-width: 768px) {
  #app {
    max-width: 100%;
    margin-top: 40px;
    padding: 0 12px;
  }
}

@media (max-width: 480px) {
  #app {
    margin-top: 20px;
    padding: 0 8px;
  }
}
</style>
