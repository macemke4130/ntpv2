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

// Gets all parts data, shuffles the order, sets to state
// and calls first part for user. This is the first function
// called to start the game.
const getParts = async () => {
  try {
    const request = await fetch("./quiz.json");
    const jsonData = await request.json();

    const shuffledParts = [...jsonData.parts].sort(() => 0.5 - Math.random());
    parts = shuffledParts;
  } catch (e) {
    console.error(e);
  }
};

// Called after every correct answer from imageLoaded().
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

// Loads the next two photos (1 next part) into the cache.
const preloadNextPart = () => {
  const nextPart = parts[currentPart + 1];

  if (nextPart) {
    preloadImageElements.forEach((preload, index) => {
      preload.src = `./images/${nextPart.images[index]}`;
    });
  }
};

// User has chosen an answer.
const answerClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLButtonElement;
  const answer = target.innerHTML;

  // Correct answer was chosen.
  if (answer === correctAnswer) {
    // Game Win if this was the final part.
    if (currentPart === parts.length - 1) {
      gameOver("win");
      return;
    }

    // More parts remain in [parts].
    // Prepare state for next turn.
    currentPart++;
    updateTotalPoints();
    clearInterval(playTimer);
    clearAnswers();
    clearCurrentPoints();
    blurPartImages(true);
    addImageLoadListeners();
    loadPartImages(currentPart);
  } else {
    // Wrong answer was chosen.
    gameOver("selection");
  }
};

// Clear DOM element.
const clearCurrentPoints = () => {
  currentPartPointsElement.innerText = "";
};

// Blank out current button answers.
const clearAnswers = () => {
  quizButtonElements.forEach((answer) => (answer.innerText = ""));
};

// Mostly useful for slower connections.
const blurPartImages = (blur: boolean) => {
  quizImageElements.forEach((image) => {
    image.setAttribute("data-blur", blur ? "true" : "false");
  });
};

// Update the <img> elements with the currentPart src attributes.
// There are two <img> load listeners waiting for the load event
// to continue with the game. This is mostly useful for slower
// connections, but provides seamless play with fast connections.
const loadPartImages = (partNumber: number) => {
  const part = parts[partNumber];

  part.images.forEach((imageSource, index) => {
    quizImageElements[index].src = `./images/${imageSource}`;
  });

  preloadNextPart();
};

// Populate all answer buttons with currentPart answers.
const loadAnswers = (partNumber: number) => {
  const part = parts[partNumber];

  // Store correct value to state before shuffle.
  correctAnswer = part.answers[0];

  const shuffledAnswers = [...part.answers].sort(() => 0.5 - Math.random());

  shuffledAnswers.forEach((answer, index) => {
    const button = quizButtonElements[index];
    button.innerText = answer;
    button.setAttribute("data-quiz-button", index + "");
  });
};

// On correct answer, update totalPoints state.
const updateTotalPoints = () => {
  totalPoints = totalPoints + currentPoints;
  totalPointsElement.innerText = totalPoints.toLocaleString();
};

// Logs duration of game in seconds.
// Used for stat table in database.
const totalGameDuration = () => {
  const rightNow = Date.now();
  const totalMS = rightNow - gameStartTimeMS;
  const totalSeconds = Math.floor(totalMS / 1000);
  return totalSeconds;
};

// Used for stat table in database.
const getDeviceInfo = () => {
  const nav = window.navigator;

  return {
    device: nav.userAgent,
    lang: nav.language,
    screenSize: `${window.innerWidth} x ${window.innerHeight}`,
  };
};

// Builds human readable string for the scoreboard table.
const getHumanReadableLocalTime = () => {
  const rightNow = new Date();
  const dayOfWeek = daysOfWeek[rightNow.getDay()];
  const month = monthsOfYear[rightNow.getMonth()];
  const date = rightNow.getDate();
  const suffix = getDaySuffix(date);
  const year = rightNow.getFullYear();

  return `${dayOfWeek}, ${month} ${date}${suffix} ${year}`;
};

// Called when a user selects a wrong answer, their time runs
// out, or when they win the game.
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

  // Sets database insertId to state for use if the user
  // hits the scoreboard and logs the game to the database.
  databaseInsertId = (await logGame(gameStats)) || 0;

  const gameCurtain = document.querySelector(`[data-game-curtain]`)! as HTMLElement;
  gameCurtain.setAttribute("data-game-curtain", "down");

  const gameOverScreenElement = document.querySelector(`[data-game-end-type="${type === "win" ? "win" : "loss"}"]`)! as HTMLElement;
  gameOverScreenElement.setAttribute("data-screen-active", "true");

  const finalScoreElement = document.querySelector(`[data-screen-active="true"] .final-score`)! as HTMLDivElement;
  finalScoreElement.innerText = totalPoints.toLocaleString();

  const playAgainButton = document.querySelector(`[data-screen-active="true"] .play-again`)! as HTMLButtonElement;
  playAgainButton.addEventListener("click", () => window.location.reload());

  // Clean up listeners and build scoreboard.
  removeButtonListeners();
  removeImageListeners();
  buildScoreboard();
};

// Shows <dialog> for inputing player name and assigns functions to buttons.
const showInputPlayerNameModal = () => {
  window.addEventListener("keydown", submitPlayerNameWithEnterKey);

  const playerNameDialogElement = document.querySelector(`#player-name`)! as HTMLDialogElement;
  playerNameDialogElement.showModal();

  const submitPlayerNameButton = document.querySelector(`#submit-player-name`)! as HTMLButtonElement;
  submitPlayerNameButton.addEventListener("click", submitPlayerNameToDatabase);

  const cancelPlayerNameButton = document.querySelector(`#cancel-player-name`)! as HTMLButtonElement;
  cancelPlayerNameButton.addEventListener("click", closePlayerNameModal);
};

// Close <dialog> for player name and clean up listener.
const closePlayerNameModal = () => {
  const playerNameDialogElement = document.querySelector(`#player-name`)! as HTMLDialogElement;
  playerNameDialogElement.close();
  window.removeEventListener("keydown", submitPlayerNameWithEnterKey);
};

// Name is already updated in the database, but here we are just finding
// the corresponding table cell and updating its innerText property.
const displayFakePlayerName = (playerName: string) => {
  const recordNameCell = document.querySelector(`#scoreboard-${databaseInsertId} .playerName`)! as HTMLTableCellElement;
  recordNameCell.innerText = playerName;
  closePlayerNameModal();
};

// Only listening for this event when the input play name <dialog> is open.
const submitPlayerNameWithEnterKey = (event: KeyboardEvent) => {
  if (event.key !== "Enter") return;
  submitPlayerNameToDatabase();
};

// Update the list of player names on this machine in localStorage.
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

// Updates users table with the current players names at this machine.
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

const submitPlayerNameToDatabase = async () => {
  const playerNameInputElement = document.querySelector(`#player-name-text`)! as HTMLInputElement;

  // @ts-ignore - replaceAll()
  const playerName = playerNameInputElement.value.trim().replaceAll(",", "");

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

// If api endpoint returns false we will add the new UUID to the database,
// otherwise we update the existing user's player_name column.
const checkUserInDatabase = async () => {
  const method = "GET";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const options = { method, headers };

  try {
    const request = await fetch(`http://localhost:3001/api/user/${getLocalUUID()}`, options);
    const uuidExistsInDatabase = await request.json();

    if (uuidExistsInDatabase) {
      updateDatabaseUserNamesList();
    } else {
      insertUserInDatabase();
    }
  } catch (e) {
    console.error(e);
  }
};

// Builds a motivational string based on what place a user is closest to getting.
const calculatePointDifference = (type: "new-first" | "first-tie" | "on-scoreboard" | "off-scoreboard", score: number) => {
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

// Builds DOM <table> with stats after the game is saved in the database.
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

      calculatePointDifference(secondRowIsEqual ? "first-tie" : "new-first", secondRowIsEqual ? 0 : secondRowScore);
    } else if (totalPoints >= lowestHighScore) {
      if (totalPoints > 0) showInputPlayerNameModal();
      calculatePointDifference("on-scoreboard", highestScore);
    } else {
      calculatePointDifference("off-scoreboard", lowestHighScore);
    }

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

// Shows user where their score is on the database.
// TODO: Add scrollTo()
const highlightMyScore = () => {
  const myRow = document.querySelector(`#scoreboard-${databaseInsertId}`) as HTMLTableRowElement;
  if (myRow) {
    myRow.style.outline = `2px solid red`;
  }
};

// Answer choice buttons.
const removeButtonListeners = () => {
  for (const quizButton of quizButtonElements) {
    quizButton.removeEventListener("click", answerClick);
  }
};

const addAnswerButtonListeners = () => {
  for (const quizButton of quizButtonElements) {
    quizButton.addEventListener("click", answerClick);
  }
};

const removeImageListeners = () => {
  quizImageElements.forEach((image) => {
    image.removeEventListener("load", imageLoaded);
  });
};

// Function is important for moving the game forward.
// Will be called each time both part images are finished loading.
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

// For calculating total game time.
const logStartTime = () => {
  gameStartTimeMS = Date.now();
};

const addImageLoadListeners = () => {
  quizImageElements.forEach((image) => {
    image.addEventListener("load", imageLoaded);
  });
};

// Game over. Log game stats to database.
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

// Removing HTML comments from DOM just because.
const removeCommentsFromDOM = () => {
  const commentSpans = document.querySelectorAll(".comment") as NodeListOf<HTMLSpanElement>;

  if (commentSpans.length) {
    for (const comment of commentSpans) comment.remove();
  }
};

const beginCountdownToStart = () => {
  let secondsUntilStart = 3;
  const countdownToStartCurtainElement = document.querySelector("#countdown-to-start")! as HTMLDivElement;
  const countdownSecondsElement = document.querySelector("#countdown-seconds")! as HTMLSpanElement;
  countdownSecondsElement.innerText = secondsUntilStart + "";

  const countdownTimer = setInterval(() => {
    if (secondsUntilStart === 1) {
      clearInterval(countdownTimer);
      countdownToStartCurtainElement.remove();

      // Start game.
      loadPartImages(0);
    }

    secondsUntilStart--;
    countdownSecondsElement.innerText = secondsUntilStart + "";
  }, 1000);
};

addImageLoadListeners();
addAnswerButtonListeners();
removeCommentsFromDOM();
getParts();
beginCountdownToStart();

// ---------- TEST FUNCTIONS ----------

const testFunction = () => {
  // totalPoints = 3682;
  // gameOver("win");

  updateDatabaseUserNamesList();
};

const testButton = document.querySelector(`#testing`)! as HTMLButtonElement;
testButton.addEventListener("click", testFunction);
