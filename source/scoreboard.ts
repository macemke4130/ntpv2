import { DBResponse } from "./types";

const getTotalGames = async () => {
  const totalGamesElement = document.querySelector(`#total-games`)! as HTMLDivElement;

  const request = await apiHelper(`${dbHost}/api/stats/total-games`);
  if (request?.status === 200) {
    const totalGames: number = request.data.total;
    totalGamesElement.innerText = `There have been ${totalGames.toLocaleString()} games played in total.`;
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

const dbHost = "";

const buildScoreboard = async () => {
  const statsFromDatabase = await apiHelper(`${dbHost}/api/stats/scoreboard`);
  if (!statsFromDatabase) return;

  const allStats = statsFromDatabase.data;

  const tableBodyElement = document.querySelector(`#scoreboard tbody`)! as HTMLTableElement;

  // Building rank numbers for scoreboard.
  // Useful for tie scores.
  let previousRank = 0;
  let previousScore = 0;

  const getRanking = (score: number) => {
    if (score === previousScore) return previousRank;
    return previousRank + 1;
  };

  for (const stat of allStats) {
    const tr = document.createElement("tr");
    tr.setAttribute("id", `scoreboard-${stat.id}`);

    const rankCell = document.createElement("td");
    const nameCell = document.createElement("td");
    const scoreCell = document.createElement("td");
    const partsCell = document.createElement("td");
    const dateCell = document.createElement("td");

    const ranking = getRanking(stat.final_score);

    rankCell.classList.add("rank");
    nameCell.classList.add("player-name");
    scoreCell.classList.add("score");
    partsCell.classList.add("parts");
    dateCell.classList.add("date");

    rankCell.innerText = ranking + "";
    nameCell.innerText = stat.display_name;
    scoreCell.innerText = stat.final_score.toLocaleString();
    partsCell.innerText = `${stat.correct_answers} out of ${stat.total_parts}`;
    dateCell.innerText = stat.game_end_local_time;

    tr.appendChild(rankCell);
    tr.appendChild(nameCell);
    tr.appendChild(scoreCell);
    tr.appendChild(partsCell);
    tr.appendChild(dateCell);
    tableBodyElement.appendChild(tr);

    previousScore = stat.final_score;
    previousRank = ranking;
  }

  tableBodyElement.setAttribute("data-active", "true");
};

buildScoreboard();
getTotalGames();
