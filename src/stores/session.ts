import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", {
  state: () => ({
    playerId: sessionStorage.getItem("playerId") || null,
    nickname: sessionStorage.getItem("nickname") || null,
    roomId: sessionStorage.getItem("roomId") || null,
  }),
  actions: {
    setPlayerId(id: string) {
      this.playerId = id;
      sessionStorage.setItem("playerId", id);
    },
    setNickname(name: string) {
      this.nickname = name;
      sessionStorage.setItem("nickname", name);
    },
    setRoomId(id: string) {
      this.roomId = id;
      sessionStorage.setItem("roomId", id);
    },
    clearRoomId() {
      this.roomId = null;
      sessionStorage.removeItem("roomId");
    },
  },
});
