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
        const request = await apiHelper(`/api/admin/login-attempt`, "POST", { emailAddress, password });
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
const usersColumnClasses = ["id", "uuid", "player-names", "play-again", "games-played", "first-visit"];
const statsColumnClasses = [
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
const buildStatsTable = (statsData) => {
    // Get headers
    const statsColumns = Object.keys(statsData[0]);
    const theadTRElement = document.createElement("tr");
    // Build <th> elements.
    statsColumns.forEach((column) => {
        const thElement = document.createElement("th");
        thElement.setAttribute("scope", "col");
        thElement.innerText = column;
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
            tdElement.innerHTML = cell;
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
const cleanStatsData = (data) => {
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
const handleLoginClick = async (event) => {
    event.preventDefault();
    const request = await attemptLogin(emailInputElement.value, passwordInputElement.value);
    if (request?.data.login) {
        cleanUpDom();
        const usersData = cleanUsersData(request.data.usersData);
        buildUsersTable(usersData);
        const statsData = cleanStatsData(request.data.statsData);
        buildStatsTable(statsData);
    }
    else {
        alert("You suck at hacking.");
    }
};
submitButtonElement.addEventListener("click", handleLoginClick);
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
export {};
