import axios from "axios";
import { YouTubeVideo } from "@/types/types";
import he from "he";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

const cleanTitle = (title: string, channelTitle: string): string => {
  let decodedTitle = he.decode(title);

  decodedTitle = decodedTitle.replace(
    /(\(|\[)?\s*(Official\s*(Music)?\s*Video|Lyrics\s*Video|HD|4K|Audio|Remastered|Visualizer|Full Album)\s*(Version)?(\)|\])?/gi,
    ""
  );

  const channelNamePattern = new RegExp(
    `\\s*${channelTitle.replace(/\s+/g, "").toLowerCase()}\\s*$`,
    "i"
  );
  decodedTitle = decodedTitle.replace(channelNamePattern, "");

  return decodedTitle.replace(/\s{2,}/g, " ").trim();
};

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

    const videos: YouTubeVideo[] = response.data.items;
    for (const video of videos) {
      console.log("Title:", video.snippet.title);
      console.log("Channel:", video.snippet.channelTitle);
      video.snippet.title = cleanTitle(
        video.snippet.title,
        video.snippet.channelTitle
      );
    }
    return videos;
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    throw error;
  }
};
