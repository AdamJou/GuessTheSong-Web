export interface Player {
  id: string; // Unikalne ID gracza
  name: string; // Nazwa gracza
  score: number; // Wynik gracza
  ready: boolean; // Status gotowości
}

export interface Song {
  songId: string; // Unikalne ID utworu
  songTitle: string; // Tytuł utworu
  suggestedBy: string; // ID gracza, który zaproponował utwór
}

export interface Round {
  id: string; // Unikalne ID rundy
  song: Song; // Informacje o utworze
  votes: Record<string, string>; // Głosy: klucz - gracz, wartość - głosowany gracz
  status: "voting" | "completed"; // Status rundy
}

export interface Game {
  id: string; // Unikalne ID gry
  djId: string; // DJ odpowiedzialny za grę
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
