"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiHelper = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, method = "GET", data) {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    const options = { method, headers };
    if (data) {
        const body = JSON.stringify(data);
        options.body = body;
    }
    try {
        const request = yield fetch(url, options);
        const jsonResponse = yield request.json();
        return jsonResponse;
    }
    catch (e) {
        console.error(e);
    }
});
const dbHost = "";
const fetchScoreboardData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const statsFromDatabase = yield apiHelper(`${dbHost}/api/stats/scoreboard`);
        if (!statsFromDatabase)
            return null;
        return statsFromDatabase.data;
    }
    catch (error) {
        console.error(error);
    }
});
const buildScoreboard = () => __awaiter(void 0, void 0, void 0, function* () {
    const allStats = yield fetchScoreboardData();
    const tableBodyElement = document.querySelector(`#scoreboard tbody`);
    // Building rank numbers for scoreboard.
    // Useful for tie scores.
    let previousRank = 0;
    let previousScore = 0;
    let ranking = 0;
    const getRanking = (score) => {
        if (score === previousScore)
            return previousRank;
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
});
const buildDisclaimer = (finalRank) => {
    if (finalRank !== 100) {
        const scoreboardDisclaimerElement = document.querySelector("#scoreboard-disclaimer");
        scoreboardDisclaimerElement.innerText = "The last rank is not 100 because there are tie games in the scoreboard.";
    }
};
buildScoreboard();
