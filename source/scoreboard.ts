import { apiHelper } from "./utils.js";

const fetchScoreboardData = async () => {
  try {
    const statsFromDatabase = await apiHelper(`/api/stats/scoreboard`);
    if (!statsFromDatabase) return null;

    return statsFromDatabase.data;
  } catch (error) {
    console.error(error);
  }
};

const buildScoreboard = async () => {
  const allStats = await fetchScoreboardData();

  const tableBodyElement = document.querySelector(`#scoreboard tbody`)! as HTMLTableElement;

  // Building rank numbers for scoreboard.
  // Useful for tie scores.
  let previousRank = 0;
  let previousScore = 0;
  let ranking = 0;

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

    ranking = getRanking(stat.final_score);

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
  buildDisclaimer(ranking);
};

const buildDisclaimer = (finalRank: number) => {
  if (finalRank !== 100) {
    const scoreboardDisclaimerElement = document.querySelector("#scoreboard-disclaimer")! as HTMLDivElement;
    scoreboardDisclaimerElement.innerText = "The last rank is not 100 because there are tie games in the scoreboard.";
  }
};

buildScoreboard();
