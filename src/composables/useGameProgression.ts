import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";
import { useScoreCalculator } from "./useScoreCalculator";

export function useGameProgression() {
  const sessionStore = useSessionStore();
  const router = useRouter();
  const { calculateAndSaveScores } = useScoreCalculator();

  /**
   * Sequence of operations for transitioning to the next round
   */
  const handleNextRound = async (
    roomId: string,
    currentGame: string,
    currentRound: string,
    players: Record<string, any>,
    djId: string
  ) => {
    const db = getDatabase();
    const currentRoundPath = `rooms/${roomId}/games/${currentGame}/rounds/${currentRound}`;
    const gamePath = `rooms/${roomId}/games/${currentGame}`;
    const roomPath = `rooms/${roomId}`;

    // 1. Mark current round as completed
    await update(dbRef(db, currentRoundPath), {
      status: "completed",
    });

    // 2. Create next round structure
    const currentRoundNumber = parseInt(currentRound.replace("round", ""));
    const nextRoundNumber = currentRoundNumber + 1;
    const nextRoundId = `round${nextRoundNumber}`;

    const votes = Object.keys(players).reduce((acc, playerId) => {
      if (playerId !== djId) {
        acc[playerId] = "";
      }
      return acc;
    }, {} as Record<string, string>);

    const newRound = {
      id: nextRoundId,
      song: {
        songId: "",
        songTitle: "",
        suggestedBy: "",
        wasPlayed: false,
      },
      votes: votes,
      status: "song_selection",
    };

    // 3. Update game with new round
    await update(dbRef(db, gamePath), {
      [`rounds/${nextRoundId}`]: newRound,
    });

    // 4. Update room and game references to point to new round
    await update(dbRef(db, roomPath), {
      currentRound: nextRoundId,
    });

    await update(dbRef(db, gamePath), {
      currentRound: nextRoundId,
    });

    return nextRoundId;
  };

  /**
   * Sequence of operations for transitioning to the next game
   */
  const handleNextGame = async (
    roomId: string,
    currentGame: string,
    currentRound: string,
    players: Record<string, any>
  ) => {
    const db = getDatabase();
    const roomPath = `rooms/${roomId}`;
    const currentRoundPath = `${roomPath}/games/${currentGame}/rounds/${currentRound}`;

    // 1. Mark current round as completed and reset to round1
    await update(dbRef(db, currentRoundPath), {
      status: "completed",
    });
    await update(dbRef(db, roomPath), {
      currentRound: "round1",
    });

    // 2. Calculate and save scores for the current game
    await calculateAndSaveScores(roomId, currentGame);

    // 3. Check if this was the last game
    const currentGameNumber = parseInt(currentGame.replace("game", ""));
    const playerCount = Object.keys(players).length;

    if (currentGameNumber >= playerCount) {
      await update(dbRef(db, roomPath), {
        status: "finished",
        justFinishedGame: currentGame,
      });
      router.replace({ name: "Summary", params: { roomId } });
      return true;
    }

    // 4. Set up next game
    const nextGameNumber = currentGameNumber + 1;
    const nextGameId = `game${nextGameNumber}`;

    // 5. Update room with new game info first
    await update(dbRef(db, roomPath), {
      currentGame: nextGameId,
      currentRound: "round1",
      justFinishedGame: "game" + currentGameNumber,
    });

    // 6. Find new DJ based on scores and history
    const roomSnap = await get(dbRef(db, roomPath));
    if (!roomSnap.exists()) {
      throw new Error("Room data not found");
    }
    const roomVal = roomSnap.val() || {};
    const allGames = roomVal.games || {};

    const usedDjIds = new Set<string>();
    Object.values(allGames).forEach((g: any) => {
      if (g.djId) {
        usedDjIds.add(g.djId);
      }
    });

    const playersSnap = await get(dbRef(db, `${roomPath}/players`));
    if (!playersSnap.exists()) {
      throw new Error("No players found in this room");
    }
    const updatedPlayers = playersSnap.val() as Record<
      string,
      { id: string; score: number; name: string }
    >;
    const playersArray = Object.values(updatedPlayers);

    const potentialNewDjs = playersArray.filter((p) => !usedDjIds.has(p.id));
    potentialNewDjs.sort((a, b) => b.score - a.score);

    let newDjId = "";
    if (potentialNewDjs.length > 0) {
      newDjId = potentialNewDjs[0].id;
    } else {
      console.warn("Wszyscy gracze byli już DJ‑ami – brak kandydata na DJ‑a.");
    }

    // 7. Update room with new DJ
    await update(dbRef(db, roomPath), {
      djId: newDjId,
    });

    // 8. Create and initialize new game structure
    const nonDjVotes = Object.keys(updatedPlayers).filter(
      (pid) => pid !== newDjId
    );
    const votesObj = nonDjVotes.reduce((acc, pid) => {
      acc[pid] = "";
      return acc;
    }, {} as Record<string, string>);

    const newGameObj = {
      id: nextGameId,
      djId: newDjId,
      currentRound: "round1",
      rounds: {
        round1: {
          id: "round1",
          song: {
            songId: "",
            songTitle: "",
            suggestedBy: "",
            wasPlayed: false,
          },
          votes: votesObj,
          status: "song_selection",
        },
      },
    };

    await update(dbRef(db, `${roomPath}/games`), {
      [nextGameId]: newGameObj,
    });

    // 9. Update room status to summary last
    await update(dbRef(db, roomPath), {
      status: "summary",
    });

    router.replace({ name: "Summary", params: { roomId } });
    return false;
  };

  return {
    handleNextRound,
    handleNextGame,
  };
}
