import { defineStore } from "pinia";
import { ref } from "vue";

export const useErrorStore = defineStore("error", () => {
  const errorMessage = ref("");
  const isVisible = ref(false);

  function setError(message: string, duration = 5000) {
    errorMessage.value = message;
    isVisible.value = true;
    setTimeout(() => {
      hideError();
    }, duration);
  }

  function hideError() {
    errorMessage.value = "";
    isVisible.value = false;
  }

  return {
    errorMessage,
    isVisible,
    setError,
    hideError,
  };
});
