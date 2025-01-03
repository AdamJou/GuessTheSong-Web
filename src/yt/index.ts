import axios from "axios";
import { YouTubeVideo } from "@/types/types";
import he from "he";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

export const fetchYouTubeVideos = async (
  query: string,
  apiKey: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> => {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        q: query,
        key: apiKey,
        part: "snippet",
        type: "video",
        maxResults,
      },
    });

    // Zakładamy, że axios zwraca obiekt z polami, m.in. data.items
    const videos: YouTubeVideo[] = response.data.items;

    // Odczytany tytuł często jest w formie z encjami HTML => dekodujemy
    // (Można to zrobić tutaj, jeśli chcesz mieć czysty wynik w całej aplikacji)
    for (const video of videos) {
      video.snippet.title = he.decode(video.snippet.title);
      // ewentualnie: video.snippet.description = he.decode(video.snippet.description);
      // if you want decode channelTitle too:
      // video.snippet.channelTitle = he.decode(video.snippet.channelTitle);
    }

    return videos;
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    throw error;
  }
};
