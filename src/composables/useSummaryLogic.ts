import { ref, computed, watch } from "vue";
import type { Room, Game } from "@/types/types"; // dostosuj ścieżkę

/**
 * Composable do logiki Summary.
 * Oczekuje:
 * - roomData (Ref<Room | null>) - zawiera info o grze/pokoju.
 *
 * Zwraca:
 * - displayedGameId: Ref<string> → ID gry, którą należy pokazać w GameSummary
 * - isLastGame: boolean → czy currentGame to ostatnia gra przy założeniu "playerCount = maxGames"
 * - allGameIds: string[] → lista "game1", "game2", "game3", posortowana
 * - setDisplayedGame(id: string): ustawia ręcznie, którą grę wyświetlamy
 */
export function useSummaryLogic(roomData: { value: Room | null }) {
  // Pomocnicze: wyciągamy numer "gameX" => X
  function extractNumber(gameId: string): number {
    return parseInt(gameId.replace("game", ""));
  }

  /**
   * Lista wszystkich gier w danym roomie, posortowana po numerze
   * np. ["game1", "game2"]
   */
  const allGameIds = computed<string[]>(() => {
    if (!roomData.value) return [];
    const gamesObj = roomData.value.games || {};
    const ids = Object.keys(gamesObj); // np. ["game1", "game2"]
    ids.sort((a, b) => extractNumber(a) - extractNumber(b));
    return ids;
  });

  /**
   * Aktualnie w bazie zdefiniowana gra, np. "game2".
   */
  const currentGameId = computed(() => roomData.value?.currentGame || "");

  /**
   * Podgląd obiektu Game z roomData (zwraca Game lub undefined).
   */
  const currentGameObj = computed<Game | undefined>(() => {
    if (!roomData.value) return undefined;
    return roomData.value.games?.[currentGameId.value];
  });

  /**
   * Liczba graczy = maxGames (wg Twojego założenia).
   */
  const playerCount = computed(() => {
    const players = roomData.value?.players || {};
    return Object.keys(players).length;
  });

  /**
   * Numer obecnej gry, np. "game2" -> 2.
   */
  const currentGameNumber = computed(() => {
    return extractNumber(currentGameId.value);
  });

  /**
   * Czy ta gra *docelowo* miałaby być ostatnia (bo currentGameNumber == playerCount)?
   * Uwaga: to nie znaczy, że jest *faktycznie zakończona*.
   */
  const isPotentiallyLastGame = computed(() => {
    return currentGameNumber.value === playerCount.value;
  });

  /**
   * Czy obecna gra jest faktycznie zakończona?
   * - Możesz sprawdzać, czy w "currentGameObj" jest np. "rounds" w statusie completed,
   *   albo czy game ma status "completed"/"summary" w bazie (w zależności od Twojej struktury).
   * - Tu załóżmy, że w "roomData.status" może być "summary" lub "finished" =>
   *   i to oznacza koniec obecnej gry.
   */
  const roomStatus = computed(() => roomData.value?.status || "waiting");
  const currentGameIsFinished = computed(() => {
    return roomStatus.value === "summary" || roomStatus.value === "finished";
  });

  /**
   * Podobnie, w samym "currentGameObj" można mieć "rounds" => sprawdzamy, czy wszystkie completed?
   * Na potrzeby przykładu wystarczy sprawdzenie "roomStatus".
   */

  /**
   * Ostatecznie: "isLastGame" => tak, jeśli jest to gra nr X = playerCount
   * i jest faktycznie ukończona.
   */
  const isLastGame = computed(() => {
    return isPotentiallyLastGame.value && currentGameIsFinished.value;
  });

  /**
   * displayedGameId => gra, którą faktycznie pokazujemy w podsumowaniu.
   */
  const displayedGameId = ref("");

  /**
   * Inicjalizacja:
   * - Jeśli "currentGame" nie jest jeszcze ukończona, to wnioskujemy, że
   *   należy pokazać poprzednią (gameX-1).
   * - Jeśli "currentGame" jest ukończona, to pokazujemy ją samą.
   */
  function initDisplayedGameId() {
    if (!currentGameId.value) {
      displayedGameId.value = "";
      return;
    }

    // currentGame np. "game2"
    // Sprawdzamy, czy jest ukończona (finished/summary)
    if (!currentGameIsFinished.value) {
      // Nie jest ukończona => weź poprzednią
      const prevNum = currentGameNumber.value - 1;
      if (prevNum >= 1) {
        displayedGameId.value = "game" + prevNum;
      } else {
        // Jeśli np. "game1" też nie jest zakończona,
        // to może i tak musimy pokazać "game1"?
        displayedGameId.value = currentGameId.value; // fallback
      }
    } else {
      // currentGame jest ukończona => domyślnie pokazujemy bieżącą
      displayedGameId.value = currentGameId.value;
    }
  }

  // Uruchamiamy na starcie
  initDisplayedGameId();

  /**
   * Gdy roomData się zmieni (np. asynchronicznie się wczyta),
   * ponawiamy logikę.
   */
  watch(
    () => roomData.value,
    () => {
      initDisplayedGameId();
    }
  );

  /**
   * Możliwość ręcznego przełączenia (jeśli chcemy w UI klikać).
   */
  function setDisplayedGame(id: string) {
    displayedGameId.value = id;
  }

  return {
    displayedGameId,
    isLastGame, // Pokazuje, że "gameX" jest już faktycznie ostatnia i ukończona
    allGameIds,
    setDisplayedGame,
  };
}
