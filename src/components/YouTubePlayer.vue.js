import { computed } from "vue";
const props = defineProps();
// Generujemy URL do osadzenia YouTube
// np. https://www.youtube.com/embed/<songId>?autoplay=1
const iframeSrc = computed(() => {
    return `https://www.youtube.com/embed/${props.songId}?autoplay=1`;
});
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("youtube-player") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.iframe, __VLS_intrinsicElements.iframe)({
        width: ("560"),
        height: ("315"),
        src: ((__VLS_ctx.iframeSrc)),
        frameborder: ("0"),
        allow: ("accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"),
        allowfullscreen: (true),
    });
    ['youtube-player',];
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
            iframeSrc: iframeSrc,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
