import { ref, computed, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import { updatePlayerSong } from "@/services/songService";
import SongSearch from "@/components/SongSearch.vue";
// Inicjalizacja routera i store'ów
const router = useRouter();
const sessionStore = useSessionStore();
// Dane z sessionStore
const roomId = sessionStore.roomId;
const playerId = sessionStore.playerId;
const currentGame = computed(() => sessionStore.currentGame);
const players = computed(() => sessionStore.players);
const isDj = computed(() => sessionStore.djId === playerId);
const gameStatus = computed(() => sessionStore.gameStatus);
console.log("isDj", isDj.value);
// Lokalne dane formularza
const songId = ref("");
const songTitle = ref("");
const playerSongs = ref({});
// Obliczenia bazujące na `playerSongs`
const hasSubmitted = computed(() => !!playerSongs.value[playerId]);
const allPlayersSubmitted = computed(() => {
    const totalPlayers = Object.keys(players.value || {});
    return totalPlayers.every((id) => !!playerSongs.value[id]);
});
// Walidacja formularza
const canSubmit = computed(() => songId.value.trim() && songTitle.value);
// Funkcja przesyłania piosenki
const submitSong = async () => {
    if (canSubmit.value) {
        await updatePlayerSong(roomId, currentGame.value, playerId, songId.value, songTitle.value);
    }
};
// Subskrypcja do zmian w playerSongs
let unsubscribe = null;
const subscribeToPlayerSongs = () => {
    const db = getDatabase();
    const path = `rooms/${roomId}/games/${currentGame.value}/playerSongs`;
    const songsRef = dbRef(db, path);
    unsubscribe = onValue(songsRef, (snapshot) => {
        playerSongs.value = snapshot.exists() ? snapshot.val() : {};
    });
};
const unsubscribeFromPlayerSongs = () => {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
};
// Subskrypcje na `currentGame`
watch(currentGame, (newGame) => {
    unsubscribeFromPlayerSongs();
    if (newGame) {
        subscribeToPlayerSongs();
    }
}, { immediate: true });
onBeforeUnmount(() => {
    unsubscribeFromPlayerSongs();
});
const handleStartGame = async () => {
    try {
        await sessionStore.setGameStatus("voting");
        handleGameStatusChange("voting");
    }
    catch (error) {
        console.error("Error starting the game:", error);
        alert("An error occurred while starting the game. Please try again.");
    }
};
// Funkcja reagująca na zmianę statusu gry
const handleGameStatusChange = (status) => {
    if (!status)
        return;
    if (status === "voting") {
        if (isDj.value) {
            router.push({ name: "DjPanel", params: { roomId } });
        }
        else {
            router.push({ name: "Voting", params: { roomId } });
        }
    }
};
// Obserwacja `gameStatus` i reagowanie na jego zmiany
watch(gameStatus, (newStatus) => {
    handleGameStatusChange(newStatus);
});
watch(currentGame, (newGameId) => {
    if (newGameId) {
        unsubscribeFromPlayerSongs();
        subscribeToPlayerSongs();
    }
}, { immediate: true });
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("song-selection") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.roomId);
    // @ts-ignore
    /** @type { [typeof SongSearch, ] } */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(SongSearch, new SongSearch({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
    if (!__VLS_ctx.hasSubmitted) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.submitSong) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("songId"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.songId)),
            type: ("text"),
            id: ("songId"),
            placeholder: ("Enter Song ID"),
            required: (true),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("songTitle"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.songTitle)),
            type: ("text"),
            id: ("songTitle"),
            placeholder: ("Enter Song Title"),
            required: (true),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            disabled: ((!__VLS_ctx.canSubmit)),
        });
    }
    if (__VLS_ctx.allPlayersSubmitted) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        if (__VLS_ctx.isDj) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.handleStartGame) },
            });
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    if (__VLS_ctx.players && Object.keys(__VLS_ctx.players).length > 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [player, id] of __VLS_getVForSourceType((__VLS_ctx.players))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: ((id)),
            });
            (player.name);
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (({ submitted: !!__VLS_ctx.playerSongs[id] })) },
            });
            (__VLS_ctx.playerSongs[id] ? "Submitted" : "Not Submitted");
        }
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    ['song-selection', 'submitted',];
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
            SongSearch: SongSearch,
            roomId: roomId,
            players: players,
            isDj: isDj,
            songId: songId,
            songTitle: songTitle,
            playerSongs: playerSongs,
            hasSubmitted: hasSubmitted,
            allPlayersSubmitted: allPlayersSubmitted,
            canSubmit: canSubmit,
            submitSong: submitSong,
            handleStartGame: handleStartGame,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
