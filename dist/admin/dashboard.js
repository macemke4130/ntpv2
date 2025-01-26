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
const unauthorizedRedirect = () => {
    localStorage.removeItem("jwt");
    window.location.href = "./?unauthorized=1";
};
const verifyJWT = async () => {
    try {
        const request = await apiHelper(`/api/admin/jwt`, "POST", { token: localStorage.getItem("jwt") });
        if (!request?.data.valid) {
            unauthorizedRedirect();
        }
        else {
            console.log("Cool brah");
        }
    }
    catch (error) {
        console.error(error);
    }
};
verifyJWT();
const usersTheadElement = document.querySelector("#users-table thead");
const usersTbodyElement = document.querySelector("#users-table tbody");
const gamesTheadElement = document.querySelector("#games-table thead");
const gamesTbodyElement = document.querySelector("#games-table tbody");
const usersColumnClasses = ["id", "uuid", "player-names", "play-again", "games-played", "first-visit"];
const gamesColumnClasses = [
    "id",
    "uuid",
    "game-mode",
    "correct-answers",
    "final-score",
    "game-duration-in-seconds",
    "display-name",
    "game-end-type",
    "losing-part",
    "game-end-central-time",
    "device-info",
];
const buildUsersTable = (usersData) => {
    // Get headers
    const usersColumns = Object.keys(usersData[0]);
    const theadTRElement = document.createElement("tr");
    // Build <th> elements.
    usersColumns.forEach((column) => {
        const thElement = document.createElement("th");
        thElement.setAttribute("scope", "col");
        thElement.innerText = column;
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
            tdElement.innerHTML = cell;
            trElement.appendChild(tdElement);
        });
        usersTbodyElement.appendChild(trElement);
    }
};
const buildGamesTable = (gamesData) => {
    // Get headers
    const gamesColumns = Object.keys(gamesData[0]);
    const theadTRElement = document.createElement("tr");
    // Build <th> elements.
    gamesColumns.forEach((column) => {
        const thElement = document.createElement("th");
        thElement.setAttribute("scope", "col");
        thElement.innerText = column;
        theadTRElement.appendChild(thElement);
    });
    gamesTheadElement.appendChild(theadTRElement);
    // Build <tbody>
    for (const row of gamesData) {
        const trElement = document.createElement("tr");
        const rowData = Object.values(row);
        rowData.forEach((cell, index) => {
            const tdElement = document.createElement("td");
            tdElement.classList.add(gamesColumnClasses[index]);
            tdElement.innerHTML = cell;
            trElement.appendChild(tdElement);
        });
        gamesTbodyElement.appendChild(trElement);
    }
};
const cleanUsersData = (data) => {
    const newOrderData = data.map((item) => {
        return {
            ID: item.id,
            UUID: item.uuid,
            "Player Names": item.player_names,
            "Play Again": item.play_again_count,
            "Games Played": item.games_played,
            "First Visit": `<span>${convertToCentralTime(item.created_at).replace(", ", "<br />")}</span>`,
        };
    });
    return newOrderData;
};
const cleanGamesData = (data) => {
    const newOrderData = data.map((item) => {
        return {
            ID: item.id,
            UUID: item.uuid,
            "Game Mode": item.game_mode,
            Correct: `${item.correct_answers} / ${item.total_parts}`,
            "Final Score": item.final_score.toLocaleString(),
            "Game Seconds": item.game_duration_in_seconds,
            "Display Name": item.display_name,
            "Game End": item.game_end_type,
            "Losing Part": item.losing_part,
            "Game End Central Time": `<span>${convertToCentralTime(item.game_end_date_time).replace(", ", "<br />")}</span>`,
            "Device Info": renderDeviceInfoHTML(item.device_info),
        };
    });
    return newOrderData;
};
const deviceColumnNames = {
    lang: "Language",
    mobile: "Mobile?",
    screenSize: "Screen Size",
    ipAddress: "IP Address",
    browserName: "Browser",
    browserVersion: "Browser Version",
    device: "Device",
    engine: "Engine",
    os: "OS",
};
const renderDeviceInfoHTML = (deviceInfo) => {
    if (!deviceInfo)
        return "";
    const device = JSON.parse(deviceInfo);
    let html = "<span>";
    for (const [col, value] of Object.entries(device)) {
        const keyFix = col;
        html = html + `${deviceColumnNames[keyFix] || col}: ${value} <br /> `;
    }
    html = html + "</span>";
    return html;
};
// An LLM wrote this function. It seems to work well.
// I don't like messing with time. Too many consequences.
const convertToCentralTime = (utcDateTimeString) => {
    const utcDate = new Date(utcDateTimeString);
    // Use toLocaleString with the IANA time zone name for Central Time.
    // This handles Daylight Saving Time automatically.
    const centralTimeString = utcDate.toLocaleString("en-US", {
        timeZone: "America/Chicago", // IANA time zone for Central Time
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    return centralTimeString;
};
const getData = async () => {
    const request = await apiHelper(`../api/admin/games`, "POST", { token: localStorage.getItem("jwt") });
    if (request?.data.valid) {
        const gameData = request.data.games;
        buildGamesTable(cleanGamesData(gameData));
        const userData = request.data.users;
        buildUsersTable(cleanUsersData(userData));
    }
    else {
        unauthorizedRedirect();
    }
    // const usersData = cleanUsersData(request.data.usersData);
    // buildUsersTable(usersData);
    // const statsData = cleanStatsData(request.data.statsData);
    // buildGamesTable(statsData);
};
getData();
export {};
