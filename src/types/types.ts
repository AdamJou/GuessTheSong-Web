export interface Player {
  id: string;
  name: string;
  score: number;
  ready: boolean;
}
export type Players = Record<
  string,
  { name: string; score: number; ready: boolean }
>;
export type GameMode = "together" | "separate";

export interface Song {
  songId: string;
  songTitle: string;
  suggestedBy: string;
  wasPlayed: boolean;
}
export interface Song {
  songId: string;
  songTitle: string;
  suggestedBy: string;
  wasPlayed: boolean;
}

export type PlayerSong = Omit<Song, "suggestedBy">;
export type RoundSong = Omit<Song, "wasPlayed">;

export interface Round {
  id: string;
  song: Song;
  votes: Record<string, string>;
  status: "voting" | "completed" | "waiting";
}

export interface Game {
  id: string;
  djId: string;
  playerSongs: Record<string, string>;
  rounds: Record<string, Round>;
}

export interface Room {
  id: string;
  players: Record<string, Player>;
  currentGame: string;
  currentRound: string;
  djId: string;
  status: "waiting" | "song_selection" | "voting" | "summary" | "finished";
  games: Record<string, Game>;
  justFinishedGame: string | undefined;
  gameMode: GameMode;
}

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  items: YouTubeVideo[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}
