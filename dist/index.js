import { apiHelper } from "./utils.js";
const totalPartsElement = document.querySelector(`#total-parts`);
const totalGamesElement = document.querySelector(`#total-games`);
const dateUpdatedElement = document.querySelector(`#date-updated`);
const gameModeSwitchElements = document.querySelectorAll(`input[name="gameMode"]`);
const fillGameData = async () => {
    try {
        const request = await apiHelper(`api/parts/info`);
        if (request?.status === 200) {
            totalPartsElement.innerText = request.data.size;
            dateUpdatedElement.innerText = request.data.dateLastUpdated;
        }
    }
    catch (e) {
        console.error(e);
    }
};
const getTotalGames = async () => {
    const request = await apiHelper(`/api/stats/total-games`);
    if (request?.status === 200) {
        const totalGames = request.data;
        totalGamesElement.innerText = totalGames + "";
    }
};
const showGameRules = (gameMode) => {
    const rulesContainerElement = document.querySelector(`#rules-container`);
    const rulesWrapperElement = document.querySelector(`#rules-wrapper`);
    const containerElementStyles = window.getComputedStyle(rulesContainerElement);
    const containerElementWidth = containerElementStyles.width;
    rulesWrapperElement.style.transform = `translateX(-${gameMode === "v" ? containerElementWidth : 0})`;
};
const setDOMGameSwitch = (event, gameMode) => {
    const target = event?.target;
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
    const currentGameMode = localStorage.getItem("gameMode");
    setDOMGameSwitch(null, currentGameMode || "r");
};
determineGameMode();
fillGameData();
getTotalGames();
