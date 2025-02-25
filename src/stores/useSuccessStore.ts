import { defineStore } from "pinia";
import { ref } from "vue";

export const useSuccessStore = defineStore("success", () => {
  const successMessage = ref("");
  const isVisible = ref(false);

  function setSuccess(message: string, duration = 5000) {
    successMessage.value = message;
    isVisible.value = true;
    setTimeout(() => {
      hideSuccess();
    }, duration);
  }

  function hideSuccess() {
    successMessage.value = "";
    isVisible.value = false;
  }

  return {
    successMessage,
    isVisible,
    setSuccess,
    hideSuccess,
  };
});
