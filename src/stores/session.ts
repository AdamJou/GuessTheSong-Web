import { defineStore } from "pinia";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";

type GameStatus =
  | "waiting"
  | "song_selection"
  | "voting"
  | "summary"
  | "finished";
type RoundStatus = "voting" | "completed" | "waiting";

export const useSessionStore = defineStore("session", {
  state: () => ({
    playerId: sessionStorage.getItem("playerId") || null,
    nickname: sessionStorage.getItem("nickname") || null,
    roomId: sessionStorage.getItem("roomId") || null,

    gameStatus: null as GameStatus | null,
    currentGame: null as string | null,
    currentRound: null as string | null,
    roundStatus: null as RoundStatus | null,

    djId: null as string | null,
    players: {} as Record<
      string,
      { name: string; score: number; ready: boolean }
    >,

    _roomStatusUnsub: null as null | (() => void),
    _gameSubUnsub: null as null | (() => void),
    _roundSubUnsub: null as null | (() => void),
    _playersSubUnsub: null as null | (() => void),
  }),

  actions: {
    initializeSession(): Promise<void> {
      return new Promise((resolve) => {
        this.playerId = sessionStorage.getItem("playerId");
        this.nickname = sessionStorage.getItem("nickname");
        this.roomId = sessionStorage.getItem("roomId");
        this.currentGame = sessionStorage.getItem("currentGame");

        if (this.roomId) {
          this.subscribeToRoomStatus();
          this.subscribeToCurrentGame();
          this.subscribeToCurrentRound();
          this.subscribeToPlayers();
        }

        resolve();
      });
    },
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

      this.subscribeToRoomStatus();
      this.subscribeToCurrentGame();
      this.subscribeToPlayers();
    },

    clearRoomId() {
      this.roomId = null;
      sessionStorage.removeItem("roomId");

      this.unsubscribeRoomStatus();
      this.unsubscribeCurrentGame();
      this.unsubscribeCurrentRound();
      this.unsubscribePlayers();
      this.gameStatus = null;
      this.currentGame = null;
      this.currentRound = null;
      this.roundStatus = null;
      this.djId = null;
      this.players = {};
    },

    subscribeToRoomStatus() {
      if (!this.roomId) return;
      this.unsubscribeRoomStatus();

      const db = getDatabase();
      const statusRef = dbRef(db, `rooms/${this.roomId}/status`);

      const callback = onValue(statusRef, (snapshot) => {
        this.gameStatus = snapshot.exists() ? snapshot.val() : null;
      });

      this._roomStatusUnsub = callback;
    },

    unsubscribeRoomStatus() {
      if (this._roomStatusUnsub) {
        this._roomStatusUnsub();
        this._roomStatusUnsub = null;
      }
    },

    subscribeToCurrentGame() {
      if (!this.roomId) return;
      this.unsubscribeCurrentGame();

      const db = getDatabase();
      const gameRef = dbRef(db, `rooms/${this.roomId}/currentGame`);

      const callback = onValue(gameRef, (snapshot) => {
        this.currentGame = snapshot.exists() ? snapshot.val() : null;

        if (this.currentGame) {
          this.subscribeToCurrentRound();
        } else {
          this.unsubscribeCurrentRound();
        }
      });

      this._gameSubUnsub = callback;
    },

    unsubscribeCurrentGame() {
      if (this._gameSubUnsub) {
        this._gameSubUnsub();
        this._gameSubUnsub = null;
      }
    },

    subscribeToCurrentRound() {
      if (!this.roomId || !this.currentGame) return;
      this.unsubscribeCurrentRound();

      const db = getDatabase();
      const roundRef = dbRef(db, `rooms/${this.roomId}/currentRound`);

      const callback = onValue(roundRef, (snapshot) => {
        this.currentRound = snapshot.exists() ? snapshot.val() : null;
      });

      this._roundSubUnsub = callback;
    },

    unsubscribeCurrentRound() {
      if (this._roundSubUnsub) {
        this._roundSubUnsub();
        this._roundSubUnsub = null;
      }
    },

    subscribeToRoundStatus() {
      if (!this.roomId || !this.currentGame || !this.currentRound) return;

      const db = getDatabase();
      const roundStatusRef = dbRef(
        db,
        `rooms/${this.roomId}/games/${this.currentGame}/rounds/${this.currentRound}/status`
      );

      const callback = onValue(roundStatusRef, (snapshot) => {
        this.roundStatus = snapshot.exists() ? snapshot.val() : null;
      });

      this._roundSubUnsub = callback;
    },

    unsubscribeRoundStatus() {
      if (this._roundSubUnsub) {
        this._roundSubUnsub();
        this._roundSubUnsub = null;
      }
    },

    subscribeToPlayers() {
      if (!this.roomId) {
        return;
      }

      this.unsubscribePlayers();

      const db = getDatabase();
      const playersPath = `rooms/${this.roomId}/players`;
      const djPath = `rooms/${this.roomId}/djId`;

      const playersRef = dbRef(db, playersPath);
      const djRef = dbRef(db, djPath);

      const playersCallback = onValue(
        playersRef,
        (snapshot) => {
          if (snapshot.exists()) {
            this.players = snapshot.val();
          } else {
            this.players = {};
          }
        },
        (error) => {
          console.error("[playersCallback]", error);
        }
      );

      const djCallback = onValue(
        djRef,
        (snapshot) => {
          if (snapshot.exists()) {
            this.djId = snapshot.val();
          } else {
            this.djId = null;
          }
        },
        (error) => {
          console.error("[djCallback] BŁĄD onValue djRef:", error);
        }
      );

      this._playersSubUnsub = () => {
        playersCallback();
        djCallback();
      };
    },

    unsubscribePlayers() {
      if (this._playersSubUnsub) {
        this._playersSubUnsub();
        this._playersSubUnsub = null;
      }
    },

    async setGameStatus(status: GameStatus) {
      if (!this.roomId) return;
      const db = getDatabase();
      const roomRef = dbRef(db, `rooms/${this.roomId}`);

      await update(roomRef, { status });
    },

    async setRoundStatus(status: RoundStatus) {
      if (!this.roomId || !this.currentGame || !this.currentRound) return;
      const db = getDatabase();
      const roundRef = dbRef(
        db,
        `rooms/${this.roomId}/games/${this.currentGame}/rounds/${this.currentRound}`
      );

      await update(roundRef, { status });
    },

    reconnect() {
      if (this.roomId) {
        this.subscribeToRoomStatus();
        this.subscribeToCurrentGame();
        this.subscribeToPlayers();
      }
    },
  },
});
