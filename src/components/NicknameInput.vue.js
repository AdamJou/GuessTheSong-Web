import { ref } from "vue";
import { useRouter } from "vue-router";
import { getAuth, signInAnonymously } from "firebase/auth"; // Firebase auth
import { getDatabase, ref as dbRef, set } from "firebase/database"; // Firebase database
import { useSessionStore } from "@/stores/session"; // Session store
import { simulateUnauthorizedUpdate } from "@/services/gameService";
const testUnauthorizedUpdate = async () => {
    try {
        await simulateUnauthorizedUpdate("103745");
    }
    catch (error) {
        console.error("Test failed:", error);
    }
};
const router = useRouter();
const sessionStore = useSessionStore();
const nickname = ref(sessionStore.nickname || ""); // Pobranie istniejącego nicku (jeśli jest)
const error = ref(""); // Do przechowywania błędów
const saveNickname = async () => {
    error.value = ""; // Reset error
    if (nickname.value.trim().length < 3) {
        error.value = "Nickname must be at least 3 characters long.";
        return;
    }
    try {
        // Jeśli użytkownik nie jest zalogowany, zaloguj anonimowo
        const auth = getAuth();
        let userId = sessionStore.playerId;
        if (!userId) {
            const result = await signInAnonymously(auth);
            userId = result.user.uid;
            console.log("Anonymous user created with ID:", userId);
        }
        // Zapisz nick i currentGame w Firebase Realtime Database
        const db = getDatabase();
        const playerRef = dbRef(db, `players/${userId}`);
        await set(playerRef, {
            nickname: nickname.value.trim(),
            currentGame: "", // Początkowo puste
        });
        console.log("Player data saved:", userId);
        // Zapisanie w session store
        sessionStore.setNickname(nickname.value.trim());
        sessionStore.setPlayerId(userId);
        // Przekierowanie na stronę docelową, jeśli istnieje
        const redirectPath = sessionStorage.getItem("redirectAfterNickname");
        if (redirectPath) {
            sessionStorage.removeItem("redirectAfterNickname");
            await router.push(redirectPath);
            console.log("Redirected to saved path:", redirectPath);
        }
        else {
            await router.push("/home");
            console.log("Redirected to /home");
        }
    }
    catch (err) {
        console.error("Error saving nickname:", err);
        error.value = "An error occurred. Please try again.";
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
        ...{ class: ("nickname-input") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.saveNickname) },
        novalidate: (true),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
        value: ((__VLS_ctx.nickname)),
        type: ("text"),
        placeholder: ("Your nickname"),
        required: (true),
    });
    if (__VLS_ctx.error) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("error-message") },
        });
        (__VLS_ctx.error);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.testUnauthorizedUpdate) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: ("submit"),
    });
    ['nickname-input', 'error-message',];
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
            testUnauthorizedUpdate: testUnauthorizedUpdate,
            nickname: nickname,
            error: error,
            saveNickname: saveNickname,
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
