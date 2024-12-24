import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { navigationGuard } from "./navigationGuards";

import NicknameInput from "@/components/NicknameInput.vue";
import HomeView from "@/views/HomeView.vue";
import Lobby from "@/views/Lobby.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "NicknameInput",
    component: NicknameInput,
  },
  {
    path: "/home",
    name: "HomeView",
    component: HomeView,
  },
  {
    path: "/lobby/:roomId",
    name: "Lobby",
    component: Lobby,
  },

  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Przypisanie wyodrębnionej logiki przekierowań jako globalnego guard
router.beforeEach(navigationGuard);

export default router;
