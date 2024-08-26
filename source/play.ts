import { Part, Stat, DBResponse } from "./types";

const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getDaySuffix = (dayOfMonth: number) => {
  if (dayOfMonth === 1) return "st";
  if (dayOfMonth === 2) return "nd";
  if (dayOfMonth === 3) return "rd";
  if (dayOfMonth >= 4) return "th";
};

const dbHost = "http://127.0.0.1:3002";

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
let playerReachedScoreboard = false;

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
    losing_part: type !== "win" ? correctAnswer : null,
    final_score: totalPoints,
    total_parts: parts.length,
    game_duration_in_seconds: totalGameDuration(),
    game_end_type: type.charAt(0),
    uuid: isReturningUser() ? getLocalUUID() : createLocalUUID(),
  };

  // Log game in database.
  await logGame(gameStats);

  const gameCurtain = document.querySelector(`[data-game-curtain]`)! as HTMLElement;
  gameCurtain.setAttribute("data-game-curtain", "down");

  const gameOverScreenElement = document.querySelector(`[data-game-end-type="${type === "win" ? "win" : "loss"}"]`)! as HTMLElement;
  gameOverScreenElement.setAttribute("data-screen-active", "true");

  const finalScoreElement = document.querySelector(`[data-screen-active="true"] .final-score`)! as HTMLDivElement;
  finalScoreElement.innerText = totalPoints.toLocaleString();

  const playAgainButton = document.querySelector(`[data-screen-active="true"] .play-again`)! as HTMLButtonElement;
  playAgainButton.addEventListener("click", () => window.location.reload());

  // Clean up and build.
  removeButtonListeners();
  removeImageListeners();
  buildScoreboard();
  buildShareButton();
  checkFunScore();
};

const checkFunScore = () => {
  const funScoreElement = document.querySelector(`[data-screen-active="true"] .fun-score`)! as HTMLDivElement;

  if (totalPoints === 13) {
    funScoreElement.innerText = "Bad Luck.";
    return;
  }

  if (totalPoints === 69) {
    funScoreElement.innerText = "Nice.";
    return;
  }

  if (totalPoints === 420) {
    funScoreElement.innerText = "Blaze It.";
    return;
  }

  if (totalPoints === 666) {
    funScoreElement.innerText = "Hail Satan.";
    return;
  }

  // Suggested by Brennan
  if (totalPoints === 777) {
    funScoreElement.innerText = "Jackpot.";
    return;
  }
};

const buildShareButton = () => {
  // There are two buttons at the moment, so we need to grab the button in the active section.
  const shareButtonElement = document.querySelector(`[data-screen-active="true"] .share`)! as HTMLButtonElement;

  const canShare = navigator.canShare;

  if (!canShare) {
    shareButtonElement.remove();
    return;
  }

  const shareData = {
    url: "https://www.namethatpart.com",
    text: `Think you're a real bicycle nerd? Test your skills with "Name That Part"!`,
    title: "Name That Part - Bicycle Game",
  };

  const shareGame = async () => {
    try {
      await window.navigator.share(shareData);
    } catch (e) {
      console.error(e);
    }
  };

  shareButtonElement.addEventListener("click", shareGame);
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
};

// Updates users table with the current players names at local machine.
const updateDatabaseUserNamesList = async () => {
  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const playerData = {
    uuid: getLocalUUID(),
    player_names: getLocalPlayerNames(),
  };

  const body = JSON.stringify(playerData);
  const options = { method, headers, body };

  try {
    const request = await fetch(`${dbHost}/api/users/new-players`, options);
    const jsonResponse: DBResponse = await request.json();

    if (jsonResponse.status !== 200) throw new Error("Error updating player_names");
  } catch (e) {
    console.error(e);
  }
};

const submitPlayerNameToDatabase = async () => {
  const playerNameInputElement = document.querySelector(`#player-name-text`)! as HTMLInputElement;

  // @ts-ignore - replaceAll()
  const playerName: string = playerNameInputElement.value.trim().replaceAll(",", "");

  updateLocalPlayerNameList(playerName);

  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const playerData = {
    display_name: playerName,
    id: databaseInsertId,
  };

  const body = JSON.stringify(playerData);
  const options = { method, headers, body };

  try {
    const request = await fetch(`${dbHost}/api/stats/display-name`, options);
    const jsonResponse: DBResponse = await request.json();

    if (jsonResponse.status === 200) displayFakePlayerName(playerName);
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
    player_names: getLocalPlayerNames(),
  };

  const body = JSON.stringify(playerData);
  const options = { method, headers, body };

  try {
    const request = await fetch(`${dbHost}/api/users/new-user`, options);
    const jsonResponse: DBResponse = await request.json();

    return jsonResponse.data.insertId;
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
    const request = await fetch(`${dbHost}/api/users/exists/${getLocalUUID()}`, options);
    const jsonResponse: DBResponse = await request.json();

    const uuidExistsInDatabase = jsonResponse.data;

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

// I only care about game_end_local_time if user reached scoreboard, so I have a
// separate API call here that handles this conditionally.
const logLocalTime = async () => {
  const method = "POST";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const data = {
    id: databaseInsertId,
    game_end_local_time: getHumanReadableLocalTime(),
  };

  const body = JSON.stringify(data);
  const options = { method, headers, body };

  try {
    const request = await fetch(`${dbHost}/api/stats/local-time`, options);
    const jsonResponse: DBResponse = await request.json();
  } catch (e) {
    console.error(e);
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
      showInputPlayerNameModal();

      // Check 2nd row for equal score
      const secondRowScore = allStats[1].final_score;
      const secondRowIsEqual = secondRowScore === totalPoints;
      calculatePointDifference(secondRowIsEqual ? "first-tie" : "new-first", secondRowIsEqual ? 0 : secondRowScore);
      logLocalTime();
    } else if (totalPoints >= lowestHighScore) {
      showInputPlayerNameModal();
      calculatePointDifference("on-scoreboard", highestScore);
      logLocalTime();
    } else {
      calculatePointDifference("off-scoreboard", lowestHighScore);
      checkUserInDatabase();
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
    highlightMyScore();
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
    const request = await fetch(`${dbHost}/api/stats/log-game`, options);
    const jsonResponse: DBResponse = await request.json();

    // Sets database insertId to state for use if the user hits the scoreboard.
    databaseInsertId = jsonResponse.data.insertId;
  } catch (e) {
    console.error(e);
  }
};

const getStats = async () => {
  const method = "GET";
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const options = { method, headers };

  try {
    const request = await fetch(`${dbHost}/api/stats/scoreboard`, options);
    const jsonResponse: DBResponse = await request.json();

    return jsonResponse.data;
  } catch (e) {
    console.error(e);
  }
};

// I don't need or want 36 characters.
// A lenth of 8 gives over 218 trillion possibilites.
const createUUID = () => crypto.randomUUID().substring(0, 8);
const getLocalUUID = () => localStorage.getItem("uuid") || "";
const isReturningUser = () => !!localStorage.getItem("uuid");
const getLocalPlayerNames = () => localStorage.getItem("playerNames") || "";

const createLocalUUID = () => {
  const uuidNew = createUUID();
  localStorage.setItem("uuid", uuidNew);
  return uuidNew;
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
      focusStage();
    }

    secondsUntilStart--;
    countdownSecondsElement.innerText = secondsUntilStart + "";
  }, 1000);
};

const focusStage = () => {
  const blurryElements = document.querySelectorAll(`[data-blur="true"]`)! as NodeListOf<HTMLDListElement>;

  for (const element of blurryElements) {
    element.removeAttribute("data-blur");
  }
};

addImageLoadListeners();
addAnswerButtonListeners();
getParts();
beginCountdownToStart();

// ---------- TEST FUNCTIONS ----------

const testFunction = () => {
  submitPlayerNameToDatabase();
};

const testButton = document.querySelector(`#testing`)! as HTMLButtonElement;
testButton.addEventListener("click", testFunction);
