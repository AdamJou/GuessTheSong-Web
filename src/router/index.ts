import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { navigationGuard } from "./navigationGuards";

import NicknameInput from "@/components/NicknameInput.vue";
import HomeView from "@/views/HomeView.vue";
import Lobby from "@/views/Lobby.vue";
import SongSelection from "@/views/SongSelection.vue";
import DjPanel from "@/views/DjPanel.vue";
import VotingView from "@/views/VotingView.vue";
import PlaySongView from "@/views/PlaySongView.vue";

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
  { path: "/dj-panel/:roomId", name: "DjPanel", component: DjPanel },
  {
    path: "/lobby/:roomId",
    name: "Lobby",
    component: Lobby,
  },
  {
    path: "/voting/:roomId",
    name: "Voting",
    component: VotingView,
  },

  {
    path: "/play/:roomId",
    name: "PlaySong",
    component: PlaySongView,
  },
  {
    path: "/song-selection/:roomId", // Dodajemy trasę dla SongSelection
    name: "SongSelection",
    component: SongSelection,
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
