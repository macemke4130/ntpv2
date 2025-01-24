// Secure redirect.
// if (!window.location.hostname.includes("localhost")) {
//   if (!window.location.protocol.includes("s")) {
//     window.location.replace("https://www.namethatpart.com/");
//   }
// }

import { DBResponse, GameMode } from "./types";

const totalPartsElement = document.querySelector(`#total-parts`)! as HTMLSpanElement;
const totalGamesElement = document.querySelector(`#total-games`)! as HTMLDivElement;
const dateUpdatedElement = document.querySelector(`#date-updated`)! as HTMLSpanElement;
const gameModeSwitchElements = document.querySelectorAll(`input[name="gameMode"]`)! as NodeListOf<HTMLInputElement>;

const apiHelper = async (url: string, method: "GET" | "POST" = "GET", data?: any) => {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const options: { method: string; headers: typeof headers; body?: any } = { method, headers };

  if (data) {
    const body = JSON.stringify(data);
    options.body = body;
  }

  try {
    const request = await fetch(url, options);
    const jsonResponse: DBResponse = await request.json();
    return jsonResponse;
  } catch (e) {
    console.error(e);
  }
};

const fillGameData = async () => {
  try {
    const request = await apiHelper(`api/parts/info`);

    if (request?.status === 200) {
      totalPartsElement.innerText = request.data.size;
      dateUpdatedElement.innerText = request.data.dateLastUpdated;
    }
  } catch (e) {
    console.error(e);
  }
};

const getTotalGames = async () => {
  const request = await apiHelper(`/api/stats/total-games`);
  if (request?.status === 200) {
    const totalGames: number = request.data;
    totalGamesElement.innerText = totalGames + "";
  }
};

const showGameRules = (gameMode: GameMode) => {
  const rulesContainerElement = document.querySelector(`#rules-container`)! as HTMLDivElement;
  const rulesWrapperElement = document.querySelector(`#rules-wrapper`)! as HTMLDivElement;

  const containerElementStyles = window.getComputedStyle(rulesContainerElement);
  const containerElementWidth = containerElementStyles.width;

  rulesWrapperElement.style.transform = `translateX(-${gameMode === "v" ? containerElementWidth : 0})`;
};

const setDOMGameSwitch = (event: Event | null, gameMode: GameMode) => {
  const target = event?.target as HTMLInputElement | null;

  const newGameMode = target ? target.value : gameMode;
  const input = document.querySelector(`input[value="${newGameMode}"]`)! as HTMLInputElement;
  input.checked = true;

  localStorage.setItem("gameMode", newGameMode);

  showGameRules(newGameMode as GameMode);
};

// Switch with input.
gameModeSwitchElements.forEach((input) => {
  input.addEventListener("change", function (event: Event) {
    setDOMGameSwitch(event, "r");
  });
});

// Determine on load.
const determineGameMode = () => {
  const currentGameMode = localStorage.getItem("gameMode") as GameMode | undefined;
  setDOMGameSwitch(null, currentGameMode || "r");
};

determineGameMode();

fillGameData();
getTotalGames();
