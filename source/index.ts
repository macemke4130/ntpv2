import { DBResponse } from "./types";

const dbHost = "http://127.0.0.1:3002";

const totalPartsElement = document.querySelector(`#total-parts`)! as HTMLSpanElement;
const totalGamesElement = document.querySelector(`#total-games`)! as HTMLDivElement;
const dateUpdatedElement = document.querySelector(`#date-updated`)! as HTMLSpanElement;

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

fillGameData();
getTotalGames();
