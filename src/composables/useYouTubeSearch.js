import { ref } from "vue";
import { fetchYouTubeVideos } from "@/yt";
export function useYouTubeSearch() {
    const query = ref("");
    const videos = ref([]);
    const loading = ref(false);
    const error = ref("");
    const searchVideos = async (searchQuery, apiKey) => {
        try {
            loading.value = true;
            error.value = "";
            videos.value = await fetchYouTubeVideos(searchQuery, apiKey);
        }
        catch (err) {
            error.value = "Wystąpił błąd podczas wyszukiwania.";
            console.error(err);
        }
        finally {
            loading.value = false;
        }
    };
    return {
        query,
        videos,
        loading,
        error,
        searchVideos,
    };
}
