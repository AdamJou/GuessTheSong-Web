import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoadingStore = defineStore("loading", () => {
  const isLoading = ref(false);

  function startLoading() {
    isLoading.value = true;
    console.log("startLoading() => isLoading = true");
  }

  function stopLoading() {
    isLoading.value = false;
    console.log("stopLoading() => isLoading = false");
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
});
