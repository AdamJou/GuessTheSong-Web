import { ref, computed, onBeforeUnmount, watch } from "vue";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";
// Usługi/aplikacje
import { fetchYouTubeVideos } from "@/yt";
import { updatePlayerSong } from "@/services/songService";
import { useSessionStore } from "@/stores/session";
// 1. Pobieramy dane z sessionStore
const sessionStore = useSessionStore();
const roomId = sessionStore.roomId;
const playerId = sessionStore.playerId;
const currentGame = computed(() => sessionStore.currentGame);
// 2. Stan wyszukiwania YouTube
const query = ref("");
const videos = ref([]);
const loading = ref(false);
const error = ref("");
const selectedSong = ref(null);
// 3. Stan piosenek w Firebase
//    Struktura: { player1: { songId: "...", songTitle: "..." }, player2: { ... }, ... }
const playerSongs = ref({});
// 4. Flaga, czy wciąż czekamy na dane z Firebase
const fetchingPlayerSongs = ref(true);
// 5. Czy aktualny gracz (playerId) ma już wybraną piosenkę?
const hasSubmitted = computed(() => {
    return !!playerSongs.value[playerId];
});
// 6. Subskrypcja do zmian w bazie
let unsubscribe = null;
function subscribeToPlayerSongs() {
    const db = getDatabase();
    const path = `rooms/${roomId}/games/${currentGame.value}/playerSongs`;
    const songsRef = dbRef(db, path);
    // Na wszelki wypadek, jeśli było wcześniej zarejestrowane "onValue", odpinamy
    unsubscribeFromPlayerSongs();
    // Ustawiamy subskrypcję
    const offFn = onValue(songsRef, (snapshot) => {
        playerSongs.value = snapshot.exists() ? snapshot.val() : {};
        // Gdy tylko mamy dane (po raz pierwszy lub przy każdej zmianie), możemy powiedzieć:
        fetchingPlayerSongs.value = false;
    });
    // Zapamiętujemy funkcję do odsubskrybowania
    unsubscribe = () => {
        off(songsRef, "value", offFn);
    };
}
function unsubscribeFromPlayerSongs() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}
// 7. Gdy zmienia się currentGame, odpinamy poprzednią subskrypcję i ustawiamy nową
watch(currentGame, (newGame) => {
    // Reset flagi ładowania
    fetchingPlayerSongs.value = true;
    // Odsubskrybowujemy starą
    unsubscribeFromPlayerSongs();
    // Subskrybujemy nową
    if (newGame) {
        subscribeToPlayerSongs();
    }
}, { immediate: true });
// 8. Przy odmontowaniu komponentu odpinamy się od Firebase
onBeforeUnmount(() => {
    unsubscribeFromPlayerSongs();
});
// 9. Funkcje logiki wyszukiwania i wyboru piosenki
async function search() {
    if (!query.value.trim()) {
        error.value = "Enter a song title.";
        return;
    }
    try {
        loading.value = true;
        error.value = "";
        // Możesz zmienić liczbę wyników (tu: 10)
        videos.value = await fetchYouTubeVideos(query.value, import.meta.env.VITE_YOUTUBE_API_KEY, 2);
    }
    catch (err) {
        console.error("Search failed:", err);
        error.value = "Failed to fetch videos. Please try again.";
    }
    finally {
        loading.value = false;
    }
}
function selectSong(video) {
    if (hasSubmitted.value) {
        alert("You have already submitted a song.");
        return;
    }
    selectedSong.value = video;
}
async function submitSelectedSong() {
    if (!selectedSong.value) {
        alert("No song selected.");
        return;
    }
    try {
        await updatePlayerSong(roomId, currentGame.value, playerId, selectedSong.value.id.videoId, selectedSong.value.snippet.title);
        alert("Song submitted successfully!");
    }
    catch (err) {
        console.error("Error saving song:", err);
        alert("Failed to save the song. Please try again.");
    }
}
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['video-item', 'video-item',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("song-search") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    if (__VLS_ctx.fetchingPlayerSongs) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else if (__VLS_ctx.hasSubmitted) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.playerSongs[__VLS_ctx.playerId].songTitle);
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("search-bar") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            ...{ onKeyup: (__VLS_ctx.search) },
            value: ((__VLS_ctx.query)),
            type: ("text"),
            placeholder: ("Enter song title..."),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.search) },
            disabled: ((__VLS_ctx.loading)),
        });
        if (__VLS_ctx.error) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("error") },
            });
            (__VLS_ctx.error);
        }
        if (__VLS_ctx.loading) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        }
        if (!__VLS_ctx.loading && __VLS_ctx.videos.length) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
            for (const [video] of __VLS_getVForSourceType((__VLS_ctx.videos))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.fetchingPlayerSongs))))
                                return;
                            if (!(!((__VLS_ctx.hasSubmitted))))
                                return;
                            if (!((!__VLS_ctx.loading && __VLS_ctx.videos.length)))
                                return;
                            __VLS_ctx.selectSong(video);
                        } },
                    key: ((video.id.videoId)),
                    ...{ class: ("video-item") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((video.snippet.thumbnails.default.url)),
                    alt: ("Thumbnail"),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
                (video.snippet.title);
                __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
                (video.snippet.channelTitle);
            }
        }
        if (__VLS_ctx.selectedSong) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.selectedSong.snippet.title);
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.submitSelectedSong) },
            });
        }
    }
    ['song-search', 'search-bar', 'error', 'video-item',];
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
            playerId: playerId,
            query: query,
            videos: videos,
            loading: loading,
            error: error,
            selectedSong: selectedSong,
            playerSongs: playerSongs,
            fetchingPlayerSongs: fetchingPlayerSongs,
            hasSubmitted: hasSubmitted,
            search: search,
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
