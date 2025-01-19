import { ref, computed, watch } from "vue";
import { getDatabase, ref as dbRef, onValue, update, get, } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useVotes } from "@/composables/useVotes";
import { useRouter } from "vue-router";
import { useScoreCalculator } from "@/composables/useScoreCalculator";
import YouTubePlayer from "@/components/YouTubePlayer.vue";
const { calculateAndSaveScores } = useScoreCalculator();
// Session Store and Router
const sessionStore = useSessionStore();
const router = useRouter();
// Reactive Data
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const players = computed(() => sessionStore.players);
const playerId = computed(() => sessionStore.playerId);
const currentSong = ref(null);
// Use the reusable useVotes composable
const { votes, getPlayerName } = useVotes();
// Check if all players have voted
const allPlayersHaveVoted = computed(() => {
    const totalPlayers = Object.keys(players.value || {}).filter((id) => id !== sessionStore.djId // Exclude the DJ's ID
    );
    return totalPlayers.every((id) => votes.value[id]); // Check if all remaining players have voted
});
// Firebase Subscription for Current Song
let songUnsubscribe = null;
const subscribeToSong = () => {
    if (!roomId.value || !currentGame.value || !currentRound.value)
        return;
    const db = getDatabase();
    const songRef = dbRef(db, `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/song`);
    songUnsubscribe = onValue(songRef, (snapshot) => {
        currentSong.value = snapshot.exists() ? snapshot.val() : null;
    });
};
const unsubscribeFromSong = () => {
    if (songUnsubscribe) {
        songUnsubscribe();
        songUnsubscribe = null;
    }
};
// Watchers for Game and Round
watch([currentGame, currentRound], () => {
    unsubscribeFromSong();
    subscribeToSong();
}, { immediate: true });
// Go back to song selection
const goBackToSongSelection = async () => {
    try {
        const db = getDatabase();
        // Define paths
        const currentRoundPath = `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}`;
        const gamePath = `rooms/${roomId.value}/games/${currentGame.value}`;
        const roomPath = `rooms/${roomId.value}`; // Root path for the room
        // Get the current round number
        const currentRoundNumber = parseInt(currentRound.value.replace("round", ""));
        const playerCount = Object.values(players.value || {}).length;
        // Check if a new round should be created
        if (currentRoundNumber >= playerCount) {
            console.log("Cannot create a new round: All players have had a turn.");
            await update(dbRef(db, currentRoundPath), {
                status: "completed",
            });
            alert("Cannot create a new round. All players have already played.");
            await update(dbRef(db, roomPath), {
                currentRound: "round1", // Update root-level currentRound
            });
            //HERE
            await calculateAndSaveScores(roomId.value, currentGame.value);
            const currentGameNumber = parseInt(currentGame.value.replace("game", ""));
            if (currentGameNumber >= playerCount) {
                alert("All games have finished! The session is over.");
                await update(dbRef(db, roomPath), {
                    status: "finished", // Oznaczamy w bazie, że rozgrywka się skończyła
                });
                router.push({ name: "Summary", params: { roomId: roomId.value } });
                return;
            }
            // 1) Wydobywamy numer z obecnego currentGame (np. "1" z "game1")
            /* const currentGameNumber = parseInt(
              currentGame.value!.replace("game", "")
            );*/
            const nextGameNumber = currentGameNumber + 1;
            const nextGameId = `game${nextGameNumber}`;
            // 2) Resetujemy currentRound na "round1"
            //    i ustawiamy w rooms/{roomId} -> currentGame = nextGameId
            await update(dbRef(db, roomPath), {
                currentGame: nextGameId,
                currentRound: "round1",
            });
            // 3) Wybieramy nowego DJ-a:
            //    - sprawdzamy, kto był DJ‑em w poprzednich grach
            //    - bierzemy zaktualizowanych graczy z największą liczbą punktów (którzy nie byli DJ‑ami)
            const roomSnap = await get(dbRef(db, roomPath));
            if (!roomSnap.exists()) {
                throw new Error("Room data not found");
            }
            const roomVal = roomSnap.val() || {};
            const allGames = roomVal.games || {};
            // Tworzymy zbiór użytych DJ‑ów (z dotychczasowych gier)
            const usedDjIds = new Set();
            Object.values(allGames).forEach((g) => {
                if (g.djId) {
                    usedDjIds.add(g.djId);
                }
            });
            // Po calculateAndSaveScores w bazie mamy uaktualnione "players" z punktami
            const playersSnap = await get(dbRef(db, `${roomPath}/players`));
            if (!playersSnap.exists()) {
                throw new Error("No players found in this room");
            }
            const updatedPlayers = playersSnap.val();
            const playersArray = Object.values(updatedPlayers);
            // Odfiltrowujemy tych, którzy byli już DJ‑ami
            const potentialNewDjs = playersArray.filter((p) => !usedDjIds.has(p.id));
            // Sortujemy malejąco po score
            potentialNewDjs.sort((a, b) => b.score - a.score);
            // Najlepszy wynik wśród tych, którzy nie byli DJ-ami
            let newDjId = "";
            if (potentialNewDjs.length > 0) {
                newDjId = potentialNewDjs[0].id;
            }
            else {
                console.warn("Wszyscy gracze byli już DJ‑ami – brak kandydata na DJ‑a.");
            }
            // Ustawiamy nowego DJ-a w rooms/{roomId}/djId
            await update(dbRef(db, roomPath), {
                djId: newDjId,
            });
            // 4) Tworzymy nową grę w "rooms/{roomId}/games/{nextGameId}"
            //    Z jedną rundą "round1" w statusie "song_selection".
            //    W 'votes' inicjalizujemy tylko graczy, którzy nie są DJ‑em.
            const nonDjVotes = Object.keys(updatedPlayers).filter((pid) => pid !== newDjId);
            const votesObj = nonDjVotes.reduce((acc, pid) => {
                acc[pid] = "";
                return acc;
            }, {});
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
                        votes: votesObj, // <- inicjalizujemy id graczy (bez DJ‑a)
                        status: "song_selection",
                    },
                },
            };
            // Zapisujemy nową grę w bazie
            await update(dbRef(db, `${roomPath}/games`), {
                [nextGameId]: newGameObj,
            });
            // 5) Dopiero teraz przechodzimy do summary
            await update(dbRef(db, roomPath), {
                status: "summary",
            });
            router.push({ name: "Summary", params: { roomId: roomId.value } });
            return;
        }
        // Mark the current round as completed
        await update(dbRef(db, currentRoundPath), {
            status: "completed",
        });
        // Generate next round ID
        const nextRoundNumber = currentRoundNumber + 1;
        const nextRoundId = `round${nextRoundNumber}`;
        // Initialize votes for all players except the DJ
        const votes = Object.keys(players.value || {}).reduce((acc, playerId) => {
            if (playerId !== sessionStore.djId) {
                acc[playerId] = ""; // No vote yet
            }
            return acc;
        }, {});
        // Create a new round object
        const newRound = {
            id: nextRoundId,
            song: {
                songId: "", // Placeholder
                songTitle: "", // Placeholder
                suggestedBy: "",
                wasPlayed: false,
            },
            votes: votes, // Include initialized votes
            status: "song_selection",
        };
        // Add the new round to the game
        await update(dbRef(db, gamePath), {
            [`rounds/${nextRoundId}`]: newRound,
        });
        // Update the `currentRound` at both the room and game levels
        await update(dbRef(db, roomPath), {
            currentRound: nextRoundId, // Update root-level currentRound
        });
        await update(dbRef(db, gamePath), {
            currentRound: nextRoundId, // Update game-level currentRound
        });
        // Navigate back to the DJ Panel
        router.push({ name: "DjPanel", params: { roomId: roomId.value } });
    }
    catch (error) {
        console.error("Error updating round status and creating the next round:", error);
        alert("Failed to go back to song selection. Please try again.");
    }
};
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    if (__VLS_ctx.roomId) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("play-song-view") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
        if (__VLS_ctx.currentSong) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.currentSong.songId);
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.currentSong.songTitle);
            if (__VLS_ctx.currentSong.songId) {
                // @ts-ignore
                /** @type { [typeof YouTubePlayer, ] } */ ;
                // @ts-ignore
                const __VLS_0 = __VLS_asFunctionalComponent(YouTubePlayer, new YouTubePlayer({
                    songId: ((__VLS_ctx.currentSong.songId)),
                }));
                const __VLS_1 = __VLS_0({
                    songId: ((__VLS_ctx.currentSong.songId)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_0));
            }
        }
        if (Object.keys(__VLS_ctx.votes).length > 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
            for (const [votedFor, voter] of __VLS_getVForSourceType((__VLS_ctx.votes))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    key: ((voter)),
                });
                (__VLS_ctx.getPlayerName(voter));
                (__VLS_ctx.getPlayerName(votedFor));
            }
        }
        if (__VLS_ctx.allPlayersHaveVoted) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goBackToSongSelection) },
            });
        }
    }
    ['play-song-view',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            YouTubePlayer: YouTubePlayer,
            roomId: roomId,
            currentSong: currentSong,
            votes: votes,
            getPlayerName: getPlayerName,
            allPlayersHaveVoted: allPlayersHaveVoted,
            goBackToSongSelection: goBackToSongSelection,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
