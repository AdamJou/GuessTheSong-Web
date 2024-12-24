export interface Player {
  id: string; // Unikalne ID gracza
  name: string; // Nazwa gracza
  score: number; // Wynik gracza
  ready: boolean; // Status gotowości
}
export type Players = Record<
  string,
  { name: string; score: number; ready: boolean }
>;

export interface Song {
  songId: string; // Unikalne ID utworu
  songTitle: string; // Tytuł utworu
  suggestedBy: string; // ID gracza, który zaproponował utwór
  wasPlayed: boolean;
}
export interface Song {
  songId: string; // Unikalne ID utworu
  songTitle: string; // Tytuł utworu
  suggestedBy: string; // ID gracza, który zaproponował utwór
  wasPlayed: boolean; // Czy utwór został już odtworzony
}

// Typy pochodne
export type PlayerSong = Omit<Song, "suggestedBy">; // Bez "suggestedBy"
export type RoundSong = Omit<Song, "wasPlayed">; // Bez "wasPlayed"
export interface Round {
  id: string; // Unikalne ID rundy
  song: Song; // Informacje o utworze
  votes: Record<string, string>; // Głosy: klucz - gracz, wartość - głosowany gracz
  status: "voting" | "completed"; // Status rundy
}

export interface Game {
  id: string; // Unikalne ID gry
  djId: string; // DJ odpowiedzialny za grę
  playerSongs: Record<string, string>; // Wybrane piosenki przez graczy (klucz - playerId, wartość - songId)
  rounds: Record<string, Round>; // Rundy w ramach gry
}

export interface Room {
  id: string; // ID pokoju
  players: Record<string, Player>; // Lista graczy
  currentGame: string; // ID obecnej gry
  currentRound: string; // ID obecnej rundy
  djId: string; // ID obecnego DJ-a
  status: "waiting" | "song_selection" | "voting" | "summary"; // Status gry
  games: Record<string, Game>; // Gry w ramach pokoju
}
