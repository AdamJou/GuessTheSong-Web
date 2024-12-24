import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { useSessionStore } from "./stores/session";
import "./firebase/init";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(createPinia());

const sessionStore = useSessionStore();
await sessionStore.initializeSession();
app.use(router);

app.mount("#app");
