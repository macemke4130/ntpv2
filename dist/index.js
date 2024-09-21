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
const dbHost = "http://127.0.0.1:3002";
const totalPartsElement = document.querySelector(`#total-parts`);
const totalGamesElement = document.querySelector(`#total-games`);
const dateUpdatedElement = document.querySelector(`#date-updated`);
const gameModeSwitchElements = document.querySelectorAll(`input[name="gameMode"]`);
const fillGameData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const request = yield fetch("./quiz.json");
        const jsonResponse = yield request.json();
        totalPartsElement.innerText = jsonResponse.parts.length + "";
        dateUpdatedElement.innerText = jsonResponse.dateLastUpdated;
    }
    catch (e) {
        console.error(e);
    }
});
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
const getTotalGames = () => __awaiter(void 0, void 0, void 0, function* () {
    const request = yield apiHelper(`${dbHost}/api/stats/total-games`);
    if ((request === null || request === void 0 ? void 0 : request.status) === 200) {
        const totalGames = request.data.total;
        totalGamesElement.innerText = `There have been ${totalGames.toLocaleString()} games played in total.`;
    }
});
const showGameRules = (gameMode) => {
    const rulesContainerElement = document.querySelector(`#rules-container`);
    const rulesWrapperElement = document.querySelector(`#rules-wrapper`);
    const containerElementStyles = window.getComputedStyle(rulesContainerElement);
    const containerElementWidth = containerElementStyles.width;
    rulesWrapperElement.style.transform = `translateX(-${gameMode === "v" ? containerElementWidth : 0})`;
};
const setDOMGameSwitch = (event, gameMode) => {
    const target = event === null || event === void 0 ? void 0 : event.target;
    const newGameMode = target ? target.value : gameMode;
    const input = document.querySelector(`input[value="${newGameMode}"]`);
    input.checked = true;
    localStorage.setItem("gameMode", newGameMode);
    showGameRules(newGameMode);
};
// Switch with input.
gameModeSwitchElements.forEach((input) => {
    input.addEventListener("change", function (event) {
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
