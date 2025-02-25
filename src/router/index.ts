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
  { path: "/", name: "NicknameInput", component: NicknameInput },
  { path: "/home", name: "HomeView", component: HomeView },
  { path: "/lobby/:roomId", name: "Lobby", component: Lobby },
  { path: "/dj-panel/:roomId", name: "DjPanel", component: DjPanel },
  { path: "/voting/:roomId", name: "Voting", component: VotingView },
  { path: "/play/:roomId", name: "PlaySong", component: PlaySongView },
  {
    path: "/song-selection/:roomId",
    name: "SongSelection",
    component: SongSelection,
  },
  { path: "/summary/:roomId", name: "Summary", component: SummaryView },
  { path: "/:catchAll(.*)", redirect: "/" }, // Domyślne przekierowanie
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔹 Blokowanie wstecz - pozostanie na bieżącej stronie
const preventBack = () => {
  history.pushState(null, "", location.href);
};

window.addEventListener("popstate", (event) => {
  event.preventDefault();
  preventBack();
});

// 🔹 Wywołanie przy każdej zmianie strony, by zablokować cofanie
router.afterEach(() => {
  preventBack();
});

// 🔹 Blokowanie gestów cofania na iPhone/Android
document.body.addEventListener(
  "touchstart",
  function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  },
  { passive: false }
);

router.beforeEach(navigationGuard);

export default router;
