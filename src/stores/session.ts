import { defineStore } from "pinia";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";

// Zdefiniowane typy dla statusu gry i rundy.
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

    // Aktualny status gry (globalny), gra i runda.
    gameStatus: null as GameStatus | null,
    currentGame: null as string | null,
    currentRound: null as string | null,
    roundStatus: null as RoundStatus | null,

    // Informacje o DJ-u i graczach
    djId: null as string | null,
    players: {} as Record<
      string,
      { name: string; score: number; ready: boolean }
    >,

    // Funkcje do odpinania subskrypcji.
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

        // Subskrybuj dane z Firebase, jeśli roomId jest dostępne
        if (this.roomId) {
          this.subscribeToRoomStatus();
          this.subscribeToCurrentGame();
          this.subscribeToCurrentRound();
          this.subscribeToPlayers();
        }

        resolve(); // Oznacz operację jako zakończoną
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

      // Uruchamiamy subskrypcje.
      this.subscribeToRoomStatus();
      this.subscribeToCurrentGame();
      this.subscribeToPlayers();
    },

    clearRoomId() {
      this.roomId = null;
      sessionStorage.removeItem("roomId");

      // Odpinamy subskrypcje i czyścimy lokalny stan.
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

    // Subskrypcja statusu pokoju.
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

    // Subskrypcja aktualnej gry w pokoju.
    subscribeToCurrentGame() {
      if (!this.roomId) return;
      this.unsubscribeCurrentGame();

      const db = getDatabase();
      const gameRef = dbRef(db, `rooms/${this.roomId}/currentGame`);

      const callback = onValue(gameRef, (snapshot) => {
        this.currentGame = snapshot.exists() ? snapshot.val() : null;

        // Jeśli mamy aktualną grę, nasłuchujemy aktualnej rundy.
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

    // Subskrypcja aktualnej rundy w grze.
    subscribeToCurrentRound() {
      if (!this.roomId || !this.currentGame) return;
      this.unsubscribeCurrentRound();

      const db = getDatabase();
      const roundRef = dbRef(db, `rooms/${this.roomId}/currentRound`);

      const callback = onValue(roundRef, (snapshot) => {
        this.currentRound = snapshot.exists() ? snapshot.val() : null;
        console.log("Updated currentRound:", this.currentRound); // Debugging log
      });

      this._roundSubUnsub = callback;
    },

    unsubscribeCurrentRound() {
      if (this._roundSubUnsub) {
        this._roundSubUnsub();
        this._roundSubUnsub = null;
      }
    },

    // Subskrypcja statusu aktualnej rundy.
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

    // Subskrypcja graczy i DJ-a w pokoju.
    subscribeToPlayers() {
      // 1) Najpierw sprawdź, czy w ogóle jest roomId
      if (!this.roomId) {
        console.log(
          "[subscribeToPlayers] Brak this.roomId => subskrypcja przerwana."
        );
        return;
      }

      console.log(
        "[subscribeToPlayers] URUCHAMIAM subskrypcję players, roomId=",
        this.roomId
      );

      // 2) Odpinamy ewentualną starą subskrypcję
      this.unsubscribePlayers();

      // 3) Tworzymy referencje do /players i /djId w danym roomie
      const db = getDatabase();
      const playersPath = `rooms/${this.roomId}/players`;
      const djPath = `rooms/${this.roomId}/djId`;

      console.log(
        `[subscribeToPlayers] playersRef = ${playersPath}`,
        `djRef = ${djPath}`
      );

      const playersRef = dbRef(db, playersPath);
      const djRef = dbRef(db, djPath);

      // 4) Callback do playersRef
      const playersCallback = onValue(
        playersRef,
        (snapshot) => {
          // Sukces – dostaliśmy dane
          console.log(
            "[playersCallback] onValue SUKCES, snapshot =",
            snapshot.val()
          );
          if (snapshot.exists()) {
            this.players = snapshot.val();
            console.log(
              "[playersCallback] Zaktualizowano this.players =>",
              this.players
            );
          } else {
            this.players = {};
            console.log(
              "[playersCallback] snapshot nie istnieje => players = {}"
            );
          }
        },
        (error) => {
          // Błąd – logujemy go
          console.error("[playersCallback] BŁĄD onValue playersRef:", error);
        }
      );

      // 5) Callback do djRef
      const djCallback = onValue(
        djRef,
        (snapshot) => {
          console.log(
            "[djCallback] onValue SUKCES, djId snapshot =",
            snapshot.val()
          );
          if (snapshot.exists()) {
            this.djId = snapshot.val();
            console.log("[djCallback] this.djId =", this.djId);
          } else {
            this.djId = null;
            console.log("[djCallback] snapshot nie istnieje => djId = null");
          }
        },
        (error) => {
          console.error("[djCallback] BŁĄD onValue djRef:", error);
        }
      );

      // 6) Przechowujemy referencje, by móc je odpiąć (unsubscribe)
      this._playersSubUnsub = () => {
        console.log(
          "[unsubscribePlayers] Wywołane => odpinam playersRef i djRef"
        );
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

    // Aktualizacja statusu gry.
    async setGameStatus(status: GameStatus) {
      if (!this.roomId) return;
      const db = getDatabase();
      const roomRef = dbRef(db, `rooms/${this.roomId}`);

      await update(roomRef, { status });
    },

    // Aktualizacja statusu rundy.
    async setRoundStatus(status: RoundStatus) {
      if (!this.roomId || !this.currentGame || !this.currentRound) return;
      const db = getDatabase();
      const roundRef = dbRef(
        db,
        `rooms/${this.roomId}/games/${this.currentGame}/rounds/${this.currentRound}`
      );

      await update(roundRef, { status });
    },

    // Wznowienie subskrypcji po odświeżeniu strony
    reconnect() {
      if (this.roomId) {
        this.subscribeToRoomStatus();
        this.subscribeToCurrentGame();
        this.subscribeToPlayers();
      }
    },
  },
});
