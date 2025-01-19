import { computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { createGameAndRound } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
import Status from "@/views/Status.vue";
// Router i session store
const router = useRouter();
const sessionStore = useSessionStore();
// Komputowane właściwości z session store
const roomId = computed(() => sessionStore.roomId);
const players = computed(() => sessionStore.players);
const djId = computed(() => sessionStore.djId);
const gameStatus = computed(() => sessionStore.gameStatus); // Obserwacja statusu gry
const isDj = computed(() => sessionStore.playerId === djId.value);
const canStartGame = computed(() => Object.keys(players.value || {}).length > 1);
// Funkcja dołączania gracza do pokoju
const ensurePlayerInRoom = async () => {
    try {
        const { joinGame } = await import("@/services/gameService");
        if (roomId.value) {
            await joinGame(roomId.value); // Dodaj gracza do pokoju
        }
        else {
            throw new Error("Room ID is missing.");
        }
    }
    catch (error) {
        console.error(error);
        alert(error.message || "An error occurred.");
        router.push("/home"); // Jeśli nie można dołączyć, wróć do HomeView
    }
};
// Obsługa rozpoczęcia gry przez DJ-a
const handleStartGame = async () => {
    try {
        if (roomId.value) {
            await createGameAndRound(roomId.value); // Tworzenie gry i pierwszej rundy
            console.log("Game started and players are redirected to SongSelection");
        }
        else {
            throw new Error("Room ID is missing.");
        }
    }
    catch (error) {
        console.error("Error starting the game:", error);
        alert(error.message ||
            "An error occurred while starting the game. Please try again.");
    }
};
// Główna logika w onMounted
onMounted(async () => {
    await ensurePlayerInRoom(); // Upewnij się, że gracz jest w pokoju
});
// Funkcja reagująca na zmianę statusu gry
const handleGameStatusChange = (status) => {
    if (!status)
        return;
    if (status === "song_selection") {
        router.push({ name: "SongSelection", params: { roomId: roomId.value } });
    }
};
// Obserwacja `gameStatus` i reagowanie na jego zmiany
watch(gameStatus, (newStatus) => {
    handleGameStatusChange(newStatus);
});
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("lobby") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    // @ts-ignore
    /** @type { [typeof Status, ] } */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(Status, new Status({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.roomId);
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    for (const [player, id] of __VLS_getVForSourceType((__VLS_ctx.players))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: ((id)),
        });
        (player.name);
        (id === __VLS_ctx.djId ? "DJ" : "Player");
    }
    if (__VLS_ctx.isDj) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleStartGame) },
            disabled: ((!__VLS_ctx.canStartGame)),
        });
    }
    ['lobby',];
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
            Status: Status,
            roomId: roomId,
            players: players,
            djId: djId,
            isDj: isDj,
            canStartGame: canStartGame,
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
