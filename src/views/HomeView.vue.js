import { ref } from "vue";
import { useRouter } from "vue-router";
import { createGame, joinGame } from "@/services/gameService";
import { useSessionStore } from "@/stores/session";
const router = useRouter();
const sessionStore = useSessionStore();
const showJoinGameModal = ref(false);
const roomIdInput = ref("");
const handleStartGame = async () => {
    try {
        const roomId = await createGame();
        sessionStore.setRoomId(roomId); // Synchronizuj pokój w store
        router.push(`/lobby/${roomId}`); // Przekierowanie do lobby
    }
    catch (error) {
        console.error("Error starting game:", error);
        alert("An error occurred while creating the game. Please try again.");
    }
};
const handleJoinGame = async () => {
    try {
        if (!roomIdInput.value.trim()) {
            alert("Please enter a valid room code.");
            return;
        }
        await joinGame(roomIdInput.value.trim());
        sessionStore.setRoomId(roomIdInput.value.trim()); // Synchronizuj pokój w store
        router.push(`/lobby/${roomIdInput.value.trim()}`); // Przekierowanie do lobby
        showJoinGameModal.value = false;
    }
    catch (error) {
        console.error("Error joining game:", error);
        alert("An error occurred while joining the game. Please try again.");
    }
};
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("home-view") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleStartGame) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.showJoinGameModal = true;
            } },
    });
    if (__VLS_ctx.showJoinGameModal) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.roomIdInput)),
            type: ("text"),
            placeholder: ("Enter Room Code"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleJoinGame) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showJoinGameModal)))
                        return;
                    __VLS_ctx.showJoinGameModal = false;
                } },
        });
    }
    ['home-view', 'modal', 'modal-content', 'modal-actions',];
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
            showJoinGameModal: showJoinGameModal,
            roomIdInput: roomIdInput,
            handleStartGame: handleStartGame,
            handleJoinGame: handleJoinGame,
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
