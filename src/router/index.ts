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
import SummaryView from "@/views/SummaryView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "NicknameInput",
    component: NicknameInput,
    children: [],
  },
  {
    path: "/home",
    name: "HomeView",
    component: HomeView,
    children: [],
  },
  {
    path: "/lobby/:roomId",
    name: "Lobby",
    component: Lobby,
    children: [],
  },
  {
    path: "/dj-panel/:roomId",
    name: "DjPanel",
    component: DjPanel,
    children: [],
  },
  {
    path: "/voting/:roomId",
    name: "Voting",
    component: VotingView,
    children: [],
  },
  {
    path: "/play/:roomId",
    name: "PlaySong",
    component: PlaySongView,
    children: [],
  },
  {
    path: "/song-selection/:roomId",
    name: "SongSelection",
    component: SongSelection,
    children: [],
  },
  {
    path: "/summary/:roomId",
    name: "Summary",
    component: SummaryView,
    children: [],
  },
  /* {
    path: "/:catchAll(.*)",
    redirect: "/",
    children: [],
  },*/
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Funkcja do sprawdzenia, czy URL powinien być ukryty
const shouldHideUrl = (path: string) => {
  return !path.startsWith("/lobby") && path !== "/" && path !== "/home";
};

// Zmiana URL na "/play", jeśli nie jesteśmy na dozwolonych ścieżkach
router.afterEach((to) => {
  if (shouldHideUrl(to.path)) {
    window.history.replaceState(null, "", "/play");
  }
});

// Globalna kontrola dostępu
router.beforeEach(navigationGuard);

export default router;
