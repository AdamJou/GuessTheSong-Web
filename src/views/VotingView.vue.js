import { ref, computed, watch, onBeforeUnmount } from "vue";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";
import { useVotes } from "@/composables/useVotes";
// Router and Session Store
const router = useRouter();
const sessionStore = useSessionStore();
// Reactive Data
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const players = computed(() => sessionStore.players);
const playerId = computed(() => sessionStore.playerId);
const isDJ = computed(() => sessionStore.djId === playerId.value);
const currentSong = ref(null);
const selectedPlayer = ref(null);
const roomStatus = ref(null);
// Use the reusable useVotes composable
const { votes, hasVoted, votedPlayer, getPlayerName, resetVotes } = useVotes();
// Other players excluding the current player
const otherPlayers = computed(() => Object.keys(players.value || {}).reduce((filtered, id) => {
    if (id !== playerId.value) {
        filtered[id] = players.value[id];
    }
    return filtered;
}, {}));
// Firebase Subscription Management for Room Status and Song
let songUnsubscribe = null;
let roomStatusUnsubscribe = null;
// Subscribe to Room Status
const subscribeToRoomStatus = () => {
    if (!roomId.value)
        return;
    const db = getDatabase();
    const roomStatusRef = dbRef(db, `rooms/${roomId.value}/status`);
    roomStatusUnsubscribe = onValue(roomStatusRef, (snapshot) => {
        roomStatus.value = snapshot.val();
        if (roomStatus.value === "summary" || roomStatus.value === "finished") {
            router.push({ name: "Summary", params: { roomId: roomId.value } });
        }
    });
};
const unsubscribeFromRoomStatus = () => {
    if (roomStatusUnsubscribe) {
        roomStatusUnsubscribe();
        roomStatusUnsubscribe = null;
    }
};
// Subscribe to Current Song
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
// Reset state when the round changes
watch(currentRound, () => {
    unsubscribeFromSong();
    subscribeToSong();
    resetVotes(); // Reset voting state when the round changes
    selectedPlayer.value = null; // Clear the selected player
}, { immediate: true });
// Handle player selection
const selectPlayer = (id) => {
    selectedPlayer.value = id;
};
// Submit the vote
const submitVote = async () => {
    if (!roomId.value ||
        !currentGame.value ||
        !currentRound.value ||
        !playerId.value ||
        !selectedPlayer.value) {
        alert("Unable to submit your vote. Please try again.");
        return;
    }
    const db = getDatabase();
    const votesRef = dbRef(db, `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/votes`);
    await update(votesRef, {
        [playerId.value]: selectedPlayer.value,
    });
    alert("Vote submitted successfully!");
};
// Initial Setup: Subscribe to Room Status
subscribeToRoomStatus();
onBeforeUnmount(() => {
    unsubscribeFromSong();
    unsubscribeFromRoomStatus();
});
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("voting-view") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.currentRound);
    if (!__VLS_ctx.currentSong) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.currentSong.songId);
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.currentSong.songTitle);
    }
    if (__VLS_ctx.currentSong.songId && !__VLS_ctx.hasVoted) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [player, playerId] of __VLS_getVForSourceType((__VLS_ctx.otherPlayers))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.currentSong.songId && !__VLS_ctx.hasVoted)))
                            return;
                        __VLS_ctx.selectPlayer(playerId);
                    } },
                key: ((playerId)),
                ...{ class: (({ selected: __VLS_ctx.selectedPlayer === playerId })) },
            });
            (player.name);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitVote) },
            disabled: ((!__VLS_ctx.selectedPlayer)),
        });
    }
    if (__VLS_ctx.hasVoted) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.votedPlayer);
    }
    if (__VLS_ctx.hasVoted) {
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
    ['voting-view', 'selected',];
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
            currentRound: currentRound,
            currentSong: currentSong,
            selectedPlayer: selectedPlayer,
            votes: votes,
            hasVoted: hasVoted,
            votedPlayer: votedPlayer,
            getPlayerName: getPlayerName,
            otherPlayers: otherPlayers,
            selectPlayer: selectPlayer,
            submitVote: submitVote,
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
