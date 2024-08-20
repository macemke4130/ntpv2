import { Part, Stat } from "./types";

const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getDaySuffix = (dayOfMonth: number) => {
  if (dayOfMonth === 1) return "st";
  if (dayOfMonth === 2) return "nd";
  if (dayOfMonth === 3) return "rd";
  if (dayOfMonth >= 4) return "th";
};

const quizImageElements = document.querySelectorAll(`[data-quiz-image]`)! as NodeListOf<HTMLImageElement>;
const quizButtonElements = document.querySelectorAll(`[data-quiz-button]`)! as NodeListOf<HTMLButtonElement>;
const preloadImageElements = document.querySelectorAll(`#preload img`)! as NodeListOf<HTMLImageElement>;

const currentPartPointsElement = document.querySelector(`#current-points`)! as HTMLDivElement;
const totalPointsElement = document.querySelector(`#total-points`)! as HTMLDivElement;

const startPoints = 500;
const secondsPerTurn = 20;
const durationOfTurnMS = secondsPerTurn * 1000;
const pointDropPerInterval = 1;
const timerInterval = durationOfTurnMS / startPoints;

// State
let parts: Part[] = [];
let correctAnswer = "";
let currentPart = 0;
let currentPoints = startPoints;
let totalPoints = 0;
let playTimer = 0;
let gameStartTimeMS = 0;
let databaseInsertId = 0;

const imageLoadState = {
  one: false,
  two: false,
};

const getParts = async () => {
  try {
    const request = await fetch("./quiz.json");
    const jsonData = await request.json();

    const shuffledParts = [...jsonData.parts].sort(() => 0.5 - Math.random());
    parts = shuffledParts;

    loadPartImages(0);
  } catch (e) {
    console.error(e);
  }
};

const resetTimer = () => {
  currentPartPointsElement.innerText = startPoints + "";
  currentPoints = startPoints;

  playTimer = setInterval(() => {
    if (currentPoints <= 0) {
      gameOver("timer");
      return;
    }

    currentPoints = currentPoints - pointDropPerInterval;
    currentPartPointsElement.innerText = currentPoints + "";
  }, timerInterval);
};

const preloadNextPart = () => {
  const nextPart = parts[currentPart + 1];

  if (nextPart) {
    preloadImageElements.forEach((preload, index) => {
      preload.src = `./images/${nextPart.images[index]}`;
    });
  }
};

const answerClick = (event: MouseEvent) => {
  if (!correctAnswer) return;

  const target = event.currentTarget as HTMLButtonElement;
  const answer = target.innerHTML;

  if (answer === correctAnswer) {
    if (currentPart === parts.length - 1) {
      gameOver("win");
      return;
    }

    currentPart++;
    updateTotalPoints();
    clearInterval(playTimer);
    clearAnswers();
    clearCurrentPoints();
    blurPartImages(true);
    addImageLoadListeners();
    loadPartImages(currentPart);
  } else {
    gameOver("selection");
  }
};

const clearCurrentPoints = () => {
  currentPartPointsElement.innerText = "";
};

const clearAnswers = () => {
  quizButtonElements.forEach((answer) => (answer.innerText = ""));
};

const blurPartImages = (blur: boolean) => {
  quizImageElements.forEach((image) => {
    image.setAttribute("data-blur", blur ? "true" : "false");
  });
};

const loadPartImages = (partNumber: number) => {
  const part = parts[partNumber];

  part.images.forEach((imageSource, index) => {
    quizImageElements[index].src = `./images/${imageSource}`;
  });

  preloadNextPart();
};

const loadAnswers = (partNumber: number) => {
  const part = parts[partNumber];

  // Store correct value string before shuffle.
  correctAnswer = part.answers[0];

  const shuffledAnswers = [...part.answers].sort(() => 0.5 - Math.random());

  shuffledAnswers.forEach((answer, index) => {
    const button = quizButtonElements[index];
    button.innerText = answer;
    button.setAttribute("data-quiz-button", index + "");
  });
};

const updateTotalPoints = () => {
  totalPoints = totalPoints + currentPoints;
  totalPointsElement.innerText = totalPoints.toLocaleString();
};

const totalGameDuration = () => {
  const rightNow = Date.now();
  const totalMS = rightNow - gameStartTimeMS;
  const totalSeconds = Math.floor(totalMS / 1000);
  return totalSeconds;
};

const getDeviceInfo = () => {
  const nav = window.navigator;

  return {
    device: nav.userAgent,
    lang: nav.language,
    screenSize: `${window.innerWidth} x ${window.innerHeight}`,
  };
};

const getHumanReadableLocalTime = () => {
  const rightNow = new Date();
  const dayOfWeek = daysOfWeek[rightNow.getDay()];
  const month = monthsOfYear[rightNow.getMonth()];
  const date = rightNow.getDate();
  const suffix = getDaySuffix(date);
  const year = rightNow.getFullYear();

  return `${dayOfWeek}, ${month} ${date}${suffix} ${year}`;
};

const updateUsersDatabase = async (uuid: string) => {
  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const body = JSON.stringify(uuid);
  const options = { method, headers, body };

  try {
    const request = await fetch("http://localhost:3001/api/user", options);
    const jsonData: any = await request.json();
    return jsonData.insertId;
  } catch (e) {
    console.error(e);
  }
};

const gameOver = async (type: "selection" | "timer" | "win") => {
  // Clear timer first to prevent duplicate gameOver("timer") calls.
  clearInterval(playTimer);

  const gameStats = {
    correct_answers: type === "win" ? parts.length : currentPart,
    final_score: totalPoints,
    total_parts: parts.length,
    game_duration_in_seconds: totalGameDuration(),
    device_info: JSON.stringify(getDeviceInfo()),
    display_name: "",
    game_end_type: type.charAt(0),
    local_time: getHumanReadableLocalTime(),
    uuid: isReturningUser() ? getLocalUUID() : createLocalUUID(),
  };

  databaseInsertId = (await logGame(gameStats)) || 0;

  const gameCurtain = document.querySelector(`[data-game-curtain]`)! as HTMLElement;
  gameCurtain.setAttribute("data-game-curtain", "down");

  const gameOverScreenElement = document.querySelector(`[data-game-end-type="${type === "win" ? "win" : "loss"}"]`)! as HTMLElement;
  gameOverScreenElement.setAttribute("data-screen-active", "true");

  const finalScoreElement = document.querySelector(`[data-screen-active="true"] .final-score`)! as HTMLDivElement;
  finalScoreElement.innerText = totalPoints.toLocaleString();

  const playAgainButton = document.querySelector(`[data-screen-active="true"] .play-again`)! as HTMLButtonElement;
  playAgainButton.addEventListener("click", () => window.location.reload());

  removeButtonListeners();
  removeImageListeners();
  buildScoreboard();
};

const showInputPlayerNameModal = () => {
  window.addEventListener("keydown", submitPlayerNameWithEnterKey);

  const playerNameDialogElement = document.querySelector(`#player-name`)! as HTMLDialogElement;
  playerNameDialogElement.showModal();

  const submitPlayerNameButton = document.querySelector(`#submit-player-name`)! as HTMLButtonElement;
  submitPlayerNameButton.addEventListener("click", submitPlayerNameToDatabase);

  const cancelPlayerNameButton = document.querySelector(`#cancel-player-name`)! as HTMLButtonElement;
  cancelPlayerNameButton.addEventListener("click", () => playerNameDialogElement.close());
};

const submitPlayerNameWithEnterKey = (event: KeyboardEvent) => {
  if (event.key !== "Enter") return;
  submitPlayerNameToDatabase();
};

const updateLocalPlayerNameList = (playerName: string) => {
  const localPlayers = localStorage.getItem("playerNames");
  let playerNames = playerName;

  if (localPlayers) {
    const nameList = localPlayers.split(", ");
    const uniqueNames: Set<string> = new Set();

    for (const name of nameList) uniqueNames.add(name);
    uniqueNames.add(playerName);

    playerNames = Array.from(uniqueNames).join(", ");
  }

  localStorage.setItem("playerNames", playerNames);

  updateDatabaseUserNamesList();
};

const updateDatabaseUserNamesList = async () => {
  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const playerData = {
    uuid: getLocalUUID(),
    playerNames: getLocalPlayerNames(),
  };

  const body = JSON.stringify(playerData);
  const options = { method, headers, body };

  try {
    const request = await fetch("http://localhost:3001/api/user/players", options);
    const jsonData: any = await request.json();

    if (jsonData !== "Success") throw new Error("Error updating player names with UUID.");
  } catch (e) {
    console.error(e);
  }
};

// TODO: Strip Commas from name input value
const submitPlayerNameToDatabase = async () => {
  const playerNameInputElement = document.querySelector(`#player-name-text`)! as HTMLInputElement;
  const playerName = playerNameInputElement.value.trim();

  updateLocalPlayerNameList(playerName);

  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const playerData = {
    playerName,
    databaseRecord: databaseInsertId,
  };

  const body = JSON.stringify(playerData);
  const options = { method, headers, body };

  try {
    const request = await fetch("http://localhost:3001/api/player-name", options);
    const jsonData: any = await request.json();

    if (jsonData === "Success") displayFakePlayerName(playerName);
  } catch (e) {
    console.error(e);
  }

  checkUserInDatabase();
};

const insertUserInDatabase = async () => {
  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const playerData = {
    uuid: getLocalUUID(),
    playerNames: getLocalPlayerNames(),
  };

  const body = JSON.stringify(playerData);
  const options = { method, headers, body };

  try {
    const request = await fetch("http://localhost:3001/api/user/new-user", options);
    const jsonData: any = await request.json();
    return jsonData.insertId;
  } catch (e) {
    console.error(e);
  }
};

const checkUserInDatabase = async () => {
  const method = "GET";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const options = { method, headers };

  try {
    const request = await fetch(`http://localhost:3001/api/user/${getLocalUUID()}`, options);

    if (request.status === 404) {
      insertUserInDatabase();
    } else {
      updateDatabaseUserNamesList();
    }
  } catch (e) {
    console.error(e);
  }
};

const displayFakePlayerName = (playerName: string) => {
  const recordNameCell = document.querySelector(`#scoreboard-${databaseInsertId} .playerName`)! as HTMLTableCellElement;
  recordNameCell.innerText = playerName;
  closePlayerNameModal();
};

const closePlayerNameModal = () => {
  const playerNameDialogElement = document.querySelector(`#player-name`)! as HTMLDialogElement;
  playerNameDialogElement.close();
  window.removeEventListener("keydown", submitPlayerNameWithEnterKey);
};

const calculateOffset = (type: "new-first" | "first-tie" | "on-scoreboard" | "off-scoreboard", score: number) => {
  const scoreboardOffsetElement = document.querySelector(`[data-screen-active="true"] .scoreboard-offset`)! as HTMLDivElement;

  switch (type) {
    case "first-tie": {
      const tiedFirstTimeDifference = timerInterval / 1000;

      scoreboardOffsetElement.innerText = `Tied for first place! 
      1 point away from being alone in first place. 
      That's a difference of ${tiedFirstTimeDifference.toFixed(2)} seconds!`;
      break;
    }

    case "new-first": {
      const aheadOfSecondPlace = totalPoints - score;
      const newFirstScoreTimeDifference = (aheadOfSecondPlace * timerInterval) / 1000;

      scoreboardOffsetElement.innerText = `New first place! 
      ${aheadOfSecondPlace.toLocaleString()} point${aheadOfSecondPlace === 1 ? "" : "s"} ahead of previous first place. 
      That's a difference of ${newFirstScoreTimeDifference.toFixed(2)} seconds!`;

      break;
    }

    case "on-scoreboard": {
      const pointDifference = score + 1 - totalPoints;
      const timeDifference = (pointDifference * timerInterval) / 1000;

      scoreboardOffsetElement.innerText = `${pointDifference.toLocaleString()} points from first place!
      That's a difference of ${timeDifference.toFixed(2)} seconds!`;
      break;
    }

    case "off-scoreboard": {
      const pointDifference = score + 1 - totalPoints;
      const timeDifference = (pointDifference * timerInterval) / 1000;

      scoreboardOffsetElement.innerText = `${pointDifference.toLocaleString()} points from the scoreboard!
      That's a difference of ${timeDifference.toFixed(2)} seconds!`;
      break;
    }

    default:
      break;
  }
};

const buildScoreboard = async () => {
  try {
    const allStats: Stat[] = await getStats();
    const lowestHighScore = allStats[allStats.length - 1].final_score;
    const highestScore = allStats[0].final_score;

    // The ended game is logged first. So [allStats] will have the current score
    // in place already. Remember this when doing math for first and last place.

    if (totalPoints === highestScore) {
      // Tied for first or new first place
      if (totalPoints > 0) showInputPlayerNameModal();

      // Check 2nd row for equal score
      const secondRowScore = allStats[1].final_score;
      const secondRowIsEqual = secondRowScore === totalPoints;

      calculateOffset(secondRowIsEqual ? "first-tie" : "new-first", secondRowIsEqual ? 0 : secondRowScore);
    } else if (totalPoints >= lowestHighScore) {
      if (totalPoints > 0) showInputPlayerNameModal();
      calculateOffset("on-scoreboard", highestScore);
    } else {
      calculateOffset("off-scoreboard", lowestHighScore);
    }

    const tableBodyElement = document.querySelector(`#scoreboard tbody`)! as HTMLTableElement;

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
      nameCell.classList.add("playerName");
      scoreCell.classList.add("score");
      partsCell.classList.add("parts");
      dateCell.classList.add("date");

      rankCell.innerText = ranking + "";
      nameCell.innerText = stat.display_name;
      scoreCell.innerText = stat.final_score.toLocaleString();
      partsCell.innerText = `${stat.correct_answers} out of ${stat.total_parts}`;
      dateCell.innerText = stat.local_time;

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
    if (totalPoints > 0) highlightMyScore();
  } catch (e) {
    console.error(e);
  }
};

const highlightMyScore = () => {
  const myRow = document.querySelector(`#scoreboard-${databaseInsertId}`) as HTMLTableRowElement;
  if (myRow) {
    myRow.style.outline = `2px solid red`;
  }
};

const removeButtonListeners = () => {
  for (const quizButton of quizButtonElements) {
    quizButton.removeEventListener("click", answerClick);
  }
};

const removeImageListeners = () => {
  quizImageElements.forEach((image) => {
    image.removeEventListener("load", imageLoaded);
  });
};

const imageLoaded = (event: Event) => {
  const target = event.target as HTMLImageElement;
  const imageName = target.dataset.quizImage as keyof typeof imageLoadState;

  imageLoadState[imageName] = true;

  // Both images are loaded, continue gameplay.
  if (imageLoadState.one && imageLoadState.two) {
    imageLoadState.one = false;
    imageLoadState.two = false;

    resetTimer();
    loadAnswers(currentPart);
    blurPartImages(false);
    removeImageListeners();

    if (currentPart === 0) logStartTime();
  }
};

const logStartTime = () => {
  gameStartTimeMS = Date.now();
};

const addImageLoadListeners = () => {
  quizImageElements.forEach((image) => {
    image.addEventListener("load", imageLoaded);
  });
};

const logGame = async (gameData: any) => {
  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const body = JSON.stringify(gameData);
  const options = { method, headers, body };

  try {
    const request = await fetch("http://localhost:3001/api/loggame", options);
    const jsonData: any = await request.json();
    return jsonData.insertId;
  } catch (e) {
    console.error(e);
  }
};

const getStats = async () => {
  const method = "GET";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const options = { method, headers };

  try {
    const request = await fetch("http://localhost:3001/api/stats", options);
    const jsonData = await request.json();
    return jsonData;
  } catch (e) {
    console.error(e);
  }
};

// I don't need or want 36 characters.
const createUUID = () => crypto.randomUUID().substring(0, 13);
const getLocalUUID = () => localStorage.getItem("uuid") || "";
const isReturningUser = () => !!localStorage.getItem("uuid");
const getLocalPlayerNames = () => localStorage.getItem("playerNames") || "";

const createLocalUUID = () => {
  const uuidNew = createUUID();
  localStorage.setItem("uuid", uuidNew);
  return uuidNew;
};

for (const quizButton of quizButtonElements) {
  quizButton.addEventListener("click", answerClick);
}

addImageLoadListeners();
getParts();

const testFunction = () => {
  // totalPoints = 3682;
  // gameOver("win");

  updateDatabaseUserNamesList();
};

const testButton = document.querySelector(`#testing`)! as HTMLButtonElement;
testButton.addEventListener("click", testFunction);
