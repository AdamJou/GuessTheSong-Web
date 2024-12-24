<template>DJ panel {{ songs }}</template>
<script setup lang="ts">
import { useSessionStore } from "@/stores/session";
import { onMounted, ref } from "vue";
import { onValue } from "firebase/database";
const sessionStore = useSessionStore();
const songs = ref(null);
</script>
