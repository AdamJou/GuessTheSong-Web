import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, update } from "firebase/database";
// Komponenty
import Scoreboard from "@/components/Scoreboard.vue";
import Status from "@/views/Status.vue";
// Store
import { useSessionStore } from "@/stores/session";
const sessionStore = useSessionStore();
const router = useRouter();
// Identyfikatory bieżącego pokoju i gry
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
// Czy nasz gracz to DJ?
const isDj = computed(() => {
    return sessionStore.playerId === sessionStore.djId;
});
/**
 * (Nowe) Czy pokój jest już zakończony?
 * Zakładam, że w store mamy 'roomStatus'.
 * Jeśli przechowujesz informację o zakończonej grze pod inną nazwą,
 * zmień warunek w środku.
 */
const isRoomFinished = computed(() => {
    return sessionStore.gameStatus === "finished";
});
/**
 * (Nowe) Funkcja, która przenosi gracza (i/lub wszystkich) na "/"
 */
function goHome() {
    router.push("/");
}
/**
 * Funkcja zmienia status pokoju (rooms/{roomId}/status) na "song_selection".
 * Wywoływana WYŁĄCZNIE przez DJ-a.
 */
async function setSongSelection() {
    if (!roomId.value)
        return;
    try {
        const db = getDatabase();
        const roomRef = dbRef(db, `rooms/${roomId.value}`);
        await update(roomRef, {
            status: "song_selection",
        });
        console.log("Status pokoju zmieniony na 'song_selection'");
    }
    catch (error) {
        console.error("Błąd przy zmianie statusu na 'song_selection':", error);
    }
}
/**
 * Gdy status w store zmieni się na "song_selection",
 * przekierowujemy WSZYSTKICH (nie tylko DJ-a) na SongSelection.vue
 */
watch(() => sessionStore.gameStatus, (newStatus) => {
    if (newStatus === "song_selection") {
        router.push({
            name: "SongSelection",
            params: { roomId: roomId.value },
        });
    }
});
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    if (!__VLS_ctx.roomId || !__VLS_ctx.currentGame) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        // @ts-ignore
        /** @type { [typeof Scoreboard, ] } */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(Scoreboard, new Scoreboard({}));
        const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
        // @ts-ignore
        /** @type { [typeof Status, ] } */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(Status, new Status({}));
        const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
        if (__VLS_ctx.isDj && !__VLS_ctx.isRoomFinished) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("dj-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.setSongSelection) },
            });
        }
        if (__VLS_ctx.isRoomFinished) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("finished-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goHome) },
            });
        }
    }
    ['dj-controls', 'finished-controls',];
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
            Scoreboard: Scoreboard,
            Status: Status,
            roomId: roomId,
            currentGame: currentGame,
            isDj: isDj,
            isRoomFinished: isRoomFinished,
            goHome: goHome,
            setSongSelection: setSongSelection,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
