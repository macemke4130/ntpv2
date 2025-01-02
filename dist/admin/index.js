"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbHost = "";
const apiHelper = async (url, method = "GET", data) => {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    const options = { method, headers };
    if (data) {
        const body = JSON.stringify(data);
        options.body = body;
    }
    try {
        const request = await fetch(url, options);
        const jsonResponse = await request.json();
        return jsonResponse;
    }
    catch (e) {
        console.error(e);
    }
};
const attemptLogin = async (emailAddress, password) => {
    try {
        const request = await apiHelper(`${dbHost}/api/admin/login-attempt`, "POST", { emailAddress, password });
        return request;
    }
    catch (error) {
        console.error(error);
    }
};
const emailInputElement = document.querySelector("#email-address");
const passwordInputElement = document.querySelector("#password");
const submitButtonElement = document.querySelector("#submit-login");
const usersTheadElement = document.querySelector("#users-table thead");
const usersTbodyElement = document.querySelector("#users-table tbody");
const statsTheadElement = document.querySelector("#stats-table thead");
const statsTbodyElement = document.querySelector("#stats-table tbody");
const usersColumnNames = ["ID", "UUID", "Player Names", "Device Info", "Play Again Count", "Created At", "Games Played"];
const usersColumnClasses = ["id", "uuid", "player-names", "device-info", "play-again", "created-at", "games-played"];
const statsColumnNames = [
    "ID",
    "Connection",
    "Game Mode",
    "Correct Answers",
    "Final Score",
    "Total Parts",
    "Game Seconds",
    "Display Name",
    "Game End Type",
    "Losing Part",
    "Game End Local Time",
    "Game End Date Time",
    "UUID",
];
const statsColumnClasses = [
    "id",
    "connection",
    "correct-answers",
    "final-score",
    "total-parts",
    "game-duration-in-seconds",
    "display-name",
    "game-end-type",
    "losing-part",
    "game-end-local-time",
    "game-end-date-time",
    "uuid",
    "game-mode",
];
const buildUsersTable = (usersData) => {
    // Get headers
    const usersColumns = Object.keys(usersData[0]);
    const theadTRElement = document.createElement("tr");
    // Build <th> elements.
    usersColumns.forEach((column, index) => {
        const thElement = document.createElement("th");
        thElement.setAttribute("scope", "col");
        thElement.classList.add(usersColumnClasses[index]);
        thElement.innerText = usersColumnNames[index];
        theadTRElement.appendChild(thElement);
    });
    usersTheadElement.appendChild(theadTRElement);
    // Build <tbody>
    for (const row of usersData) {
        const trElement = document.createElement("tr");
        const rowData = Object.values(row);
        rowData.forEach((cell, index) => {
            const tdElement = document.createElement("td");
            tdElement.classList.add(usersColumnClasses[index]);
            tdElement.innerText = cell + "";
            trElement.appendChild(tdElement);
        });
        usersTbodyElement.appendChild(trElement);
    }
};
const buildStatsTable = (statsData) => {
    // Get headers
    const statsColumns = Object.keys(statsData[0]);
    const theadTRElement = document.createElement("tr");
    // Build <th> elements.
    statsColumns.forEach((column, index) => {
        const thElement = document.createElement("th");
        thElement.setAttribute("scope", "col");
        thElement.classList.add(statsColumnClasses[index]);
        thElement.innerText = statsColumnNames[index];
        theadTRElement.appendChild(thElement);
    });
    statsTheadElement.appendChild(theadTRElement);
    // Build <tbody>
    for (const row of statsData) {
        const trElement = document.createElement("tr");
        const rowData = Object.values(row);
        rowData.forEach((cell, index) => {
            const tdElement = document.createElement("td");
            tdElement.classList.add(statsColumnClasses[index]);
            tdElement.innerText = cell || "";
            trElement.appendChild(tdElement);
        });
        statsTbodyElement.appendChild(trElement);
    }
};
const cleanUpDom = () => {
    const loginSection = document.querySelector(`section[aria-labelledby="login-title"]`);
    loginSection.remove();
    document.body.setAttribute("data-logged-in", "true");
};
const handleLoginClick = async (event) => {
    event.preventDefault();
    const request = await attemptLogin(emailInputElement.value, passwordInputElement.value);
    if (request === null || request === void 0 ? void 0 : request.data.login) {
        cleanUpDom();
        buildUsersTable(request.data.usersData);
        buildStatsTable(request.data.statsData);
    }
    else {
        alert("You suck at hacking.");
    }
};
submitButtonElement.addEventListener("click", handleLoginClick);
