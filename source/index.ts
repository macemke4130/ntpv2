import { DBResponse, GameMode } from "./types";

const dbHost = "http://127.0.0.1:3002";

const totalPartsElement = document.querySelector(`#total-parts`)! as HTMLSpanElement;
const totalGamesElement = document.querySelector(`#total-games`)! as HTMLDivElement;
const dateUpdatedElement = document.querySelector(`#date-updated`)! as HTMLSpanElement;
const gameModeSwitchElements = document.querySelectorAll(`input[name="gameMode"]`)! as NodeListOf<HTMLInputElement>;

const fillGameData = async () => {
  try {
    const request = await fetch("./quiz.json");
    const jsonResponse = await request.json();

    totalPartsElement.innerText = jsonResponse.parts.length + "";
    dateUpdatedElement.innerText = jsonResponse.dateLastUpdated;
  } catch (e) {
    console.error(e);
  }
};

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

const getTotalGames = async () => {
  const request = await apiHelper(`${dbHost}/api/stats/total-games`);
  if (request?.status === 200) {
    const totalGames: number = request.data.total;
    totalGamesElement.innerText = `There have been ${totalGames.toLocaleString()} games played in total.`;
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
  if (!localStorage.getItem("gameMode")) {
    localStorage.setItem("gameMode", "r");
    setDOMGameSwitch(null, "r");
  }
};

determineGameMode();

fillGameData();
getTotalGames();
