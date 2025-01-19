import { ref, computed, onBeforeUnmount, watch, } from "vue";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import { useRouter } from "vue-router";
const router = useRouter();
// Session store for current session details
const sessionStore = useSessionStore();
const roomId = sessionStorage.getItem("roomId");
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const allSongsPlayed = ref(false);
// Reactive variable for storing player songs and selected song
const playerSongs = ref({});
const selectedPlayerId = ref(null);
const selectedSong = ref(null);
// Firebase subscription management
let unsubscribe = null;
const unplayedSongs = computed(() => Object.entries(playerSongs.value).filter(([_, song]) => !song.wasPlayed));
const subscribeToPlayerSongs = () => {
    const db = getDatabase();
    const gameId = currentGame.value;
    if (!roomId || !gameId)
        return;
    const songsRef = dbRef(db, `rooms/${roomId}/games/${gameId}/playerSongs`);
    unsubscribe = onValue(songsRef, (snapshot) => {
        if (snapshot.exists()) {
            playerSongs.value = snapshot.val();
        }
        else {
            playerSongs.value = {};
        }
        allSongsPlayed.value = Object.values(playerSongs.value).every((song) => song.wasPlayed);
        console.log(allSongsPlayed.value);
    });
};
const unsubscribeFromPlayerSongs = () => {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
};
watch(currentRound, (newRound) => {
    console.log("currentRound updated in DjPanel:", newRound);
});
watch(currentGame, (newGame) => {
    unsubscribeFromPlayerSongs();
    if (newGame) {
        subscribeToPlayerSongs();
    }
}, { immediate: true });
onBeforeUnmount(() => {
    unsubscribeFromPlayerSongs();
});
// Selecting a song
const selectSong = (playerId, song) => {
    selectedPlayerId.value = playerId;
    selectedSong.value = {
        songId: song.songId,
        songTitle: song.songTitle,
        suggestedBy: playerId, // Dodaj pole "suggestedBy"
    };
    console.log("Selected Song:", selectedSong.value);
};
// Submitting the selected song to the current round
const submitSelectedSong = async () => {
    if (!roomId ||
        !currentGame.value ||
        !currentRound.value ||
        !selectedSong.value) {
        console.log(roomId, currentGame.value, currentRound.value, selectedSong.value);
        alert("Missing data to submit the song.");
        return;
    }
    try {
        const db = getDatabase();
        const roundRef = dbRef(db, `rooms/${roomId}/games/${currentGame.value}/rounds/${currentRound.value}`);
        await update(roundRef, {
            song: selectedSong.value,
            status: "voting", // Update the status to voting
        });
        // Optionally mark the song as played
        const playerSongRef = dbRef(db, `rooms/${roomId}/games/${currentGame.value}/playerSongs/${selectedPlayerId.value}`);
        await update(playerSongRef, { wasPlayed: true });
        alert("Song submitted to the current round.");
        router.push({ name: "PlaySong", params: { roomId } });
    }
    catch (error) {
        console.error("Error submitting song to current round:", error);
        alert("Failed to submit the song. Please try again.");
    }
};
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['song-item',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("dj-panel") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.roomId);
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    if (__VLS_ctx.unplayedSongs.length > 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [[playerId, song], index] of __VLS_getVForSourceType((__VLS_ctx.unplayedSongs))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.unplayedSongs.length > 0)))
                            return;
                        __VLS_ctx.selectSong(playerId, song);
                    } },
                key: ((index)),
                ...{ class: ("song-item") },
                ...{ class: (({ selected: __VLS_ctx.selectedPlayerId === playerId })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (playerId);
            __VLS_elementAsFunction(__VLS_intrinsicElements.br)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (song.songId);
            __VLS_elementAsFunction(__VLS_intrinsicElements.br)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (song.songTitle);
            __VLS_elementAsFunction(__VLS_intrinsicElements.br)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (song.wasPlayed ? "Yes" : "No");
        }
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    if (__VLS_ctx.selectedSong) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.selectedSong.songId);
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.selectedSong.songTitle);
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.selectedSong.suggestedBy);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitSelectedSong) },
        });
    }
    ['dj-panel', 'song-item', 'selected',];
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
            roomId: roomId,
            selectedPlayerId: selectedPlayerId,
            selectedSong: selectedSong,
            unplayedSongs: unplayedSongs,
            selectSong: selectSong,
            submitSelectedSong: submitSelectedSong,
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
