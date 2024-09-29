import { GameMode, Part, DBResponse } from "./types";

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

// Game Over Screen Elements.
const gameOverScreenElement = document.querySelector("#game-over-screen")! as HTMLDivElement;
const scoreboardOffsetElement = document.querySelector("#scoreboard-offset")! as HTMLDivElement;
const gameOverTitleElement = document.querySelector("#game-over-title")! as HTMLHeadingElement;
const finalScoreElement = document.querySelector("#final-score")! as HTMLDivElement;
const correctElement = document.querySelector("#correct")! as HTMLDivElement;
const playAgainButton = document.querySelector("#play-again")! as HTMLButtonElement;

const startPoints = 500;
const secondsPerTurn = 20;
const durationOfTurnMS = secondsPerTurn * 1000;
const pointDropPerInterval = 1;
const timerInterval = durationOfTurnMS / startPoints;
const updateDOMInterval = 3; // This value is arbitrary.

// State
let gameMode: GameMode = "r";
let parts: Part[] = [];
let correctAnswer = "";
let currentPart = 0;
let currentPoints = startPoints;
let currentPointsDOMValue = startPoints;
let totalPoints = 0;
let playTimer = 0;
let gameStartTimeMS = 0;
let databaseInsertId = 0;
const timerOff = false;

const imageLoadState = {
  one: false,
  two: false,
};

const determineGameMode = () => {
  if (!localStorage.getItem("gameMode")) localStorage.setItem("gameMode", "r");
  gameMode = localStorage.getItem("gameMode") as GameMode;
};

determineGameMode();

const apiHelper = async (url: string, method: "GET" | "POST" = "GET", data?: any) => {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  const options: { method: string; headers: typeof headers; body?: any } = { method, headers };

  if (data) {
    const body = JSON.stringify(data);
    options.body = body;
  }

  try {
    const request = await fetch(url, options);
    const jsonResponse: DBResponse = await request.json();
    return jsonResponse;
  } catch (e) {
    console.error(e);
  }
};

// Gets all parts data, shuffles the order and sets to state.
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

const explode = () => {
  quizButtonElements.forEach((button) => {
    button.setAttribute("data-boom", "true");
  });

  // Either "selection" or "timer" would work as a parameter here.
  quizButtonElements[quizButtonElements.length - 1].addEventListener("transitionend", (event) => {
    // Important to only listen for one property to finish to
    // prevent multiple calls to clearPlayScreen();
    if (event.propertyName === "transform") clearPlayScreen("selection");
  });
};

// Called after every correct answer from imageLoaded().
// Double check: Maybe not after final correct answer.
const resetTimer = () => {
  currentPartPointsElement.innerText = startPoints + "";
  currentPoints = startPoints;
  currentPointsDOMValue = startPoints;
  playTimer = setInterval(() => {
    if (timerOff) return; // For Dev.
    if (currentPoints <= 0) {
      gameOver("timer");
      return;
    }
    currentPoints = currentPoints - pointDropPerInterval;
    updateCurrentPointsDOM(currentPoints);
  }, timerInterval);
};

// Throttle expensive DOM updates for currentPoints.
const updateCurrentPointsDOM = (currentPoints: number) => {
  if (currentPoints < currentPointsDOMValue - updateDOMInterval) {
    currentPointsDOMValue = currentPoints;
    currentPartPointsElement.innerText = currentPointsDOMValue + "";

    // Low point warning.
    if (currentPointsDOMValue < 150) {
      currentPartPointsElement.style.color = "red";
    }
  }
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
  // It's possible to use the keyboard to focus and click
  // the answer buttons before the game begins, while the
  // curtain is still blurred. This can result in an "Out
  // of range for column" for game_duration_in_seconds
  // error. So if the gameStartTimeMS isn't set, exit function.
  if (!gameStartTimeMS) return;

  const target = event.currentTarget as HTMLButtonElement;
  const answer = target.innerHTML;

  // Correct answer was chosen.
  if (answer === correctAnswer) {
    // Game Win if this was the final part.
    if (currentPart === parts.length - 1) {
      gameOver("win");
      return;
    }

    // After first correct answer, remove hint and glows.
    // I'm only removing text content to avoid layout shift.
    if (currentPart === 0) {
      const hintElement = document.querySelector("#hint")! as HTMLDivElement;
      hintElement.innerText = "";

      quizButtonElements.forEach((answer) => {
        answer.classList.remove("glow");
      });
    }

    // More parts remain in [parts].
    // Prepare state for next turn.
    target.classList.add("reward");
    currentPart++;
    updateTotalPoints();
    clearInterval(playTimer);
    clearAnswers();
    clearCurrentPoints();
    blurPartImages(true);
    imageLoadListeners("add");
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
  const nav = window.navigator as any;

  const deviceInfo = {
    lang: nav.language,
    mobile: "ontouchstart" in window,
    screenSize: `${window.innerWidth} x ${window.innerHeight}`,
  };

  return JSON.stringify(deviceInfo);
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

const getConnectionSpeed = () => {
  const nav = navigator as any;
  return nav.connection?.effectiveType || null;
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
    connection: getConnectionSpeed(),
    uuid: isReturningUser() ? getLocalUUID() : createLocalUUID(),
  };

  if (type === "selection" || type === "timer") explode();

  // Log game in database.
  await logGame(gameStats);

  if (type === "win") clearPlayScreen("win");
};

// Function is called by the end of the explode() transition or by a game win.
const clearPlayScreen = (type: "selection" | "timer" | "win") => {
  const gameCurtain = document.querySelector(`[data-game-curtain]`)! as HTMLElement;
  gameCurtain.setAttribute("data-game-curtain", "down");

  // Clean up and build.
  answerButtonListeners("remove");
  imageLoadListeners("remove");
  buildGameOverScreen(type);
  buildScoreboard();
  buildShareButton();
  checkFunScore();
};

const checkFunScore = () => {
  const funScoreElement = document.querySelector("#fun-score")! as HTMLDivElement;

  if (totalPoints === 0) {
    funScoreElement.innerText = "Don't Give Up!";
    return;
  }

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

// Builds logic for share api or removes if browser does not support.
const buildShareButton = () => {
  const shareButtonElement = document.querySelector("#share")! as HTMLButtonElement;
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
const displayFakeData = (playerName: string) => {
  const recordNameCell = document.querySelector(`#scoreboard-${databaseInsertId} .playerName`)! as HTMLTableCellElement;
  const recordDateCell = document.querySelector(`#scoreboard-${databaseInsertId} .date`)! as HTMLTableCellElement;

  recordNameCell.innerText = playerName;
  recordDateCell.innerText = getHumanReadableLocalTime();

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

    playerNames = Array.from(uniqueNames).sort().join(", ");
  }

  localStorage.setItem("playerNames", playerNames);
};

// Updates users table with the current players names at local machine.
const updateDatabaseUserNamesList = async () => {
  const playerData = {
    uuid: getLocalUUID(),
    player_names: getLocalPlayerNames(),
  };

  const updateUserNames = await apiHelper(`${dbHost}/api/users/new-players`, "POST", playerData);
  if (updateUserNames?.status !== 200) throw new Error("Updating player names failed.");
};

const submitPlayerNameToDatabase = async () => {
  const playerNameInputElement = document.querySelector(`#player-name-text`)! as HTMLInputElement;

  // @ts-ignore - replaceAll()
  const playerName: string = playerNameInputElement.value.trim().replaceAll(",", "");

  updateLocalPlayerNameList(playerName);

  const playerData = {
    display_name: playerName,
    id: databaseInsertId,
  };

  const submitPlayerNames = await apiHelper(`${dbHost}/api/stats/display-name`, "POST", playerData);

  if (submitPlayerNames?.status === 200) {
    displayFakeData(playerName);
    checkUserInDatabase();
  }
};

const insertUserInDatabase = async () => {
  const playerData = {
    uuid: getLocalUUID(),
    player_names: getLocalPlayerNames(),
    device_info: getDeviceInfo(),
  };

  const request = await apiHelper(`${dbHost}/api/users/new-user`, "POST", playerData);
  if (request?.status !== 200) throw new Error("Error inserting user in database.");
};

// If api endpoint returns false we will add the new UUID to the database,
// otherwise we update the existing user's player_name column.
const checkUserInDatabase = async () => {
  const checkUUID = await apiHelper(`${dbHost}/api/users/exists/${getLocalUUID()}`);
  if (checkUUID?.status === 200) {
    const uuidExistsInDatabase = checkUUID.data;

    if (uuidExistsInDatabase) {
      updateDatabaseUserNamesList();
    } else {
      insertUserInDatabase();
    }
  }
};

// Builds a motivational string based on what place a user is closest to getting.
const calculatePointDifference = (type: "new-first" | "first-tie" | "on-scoreboard" | "off-scoreboard", score: number) => {
  switch (type) {
    case "first-tie": {
      const tiedFirstTimeDifference = timerInterval / 1000;

      scoreboardOffsetElement.innerText = `Tied for first place! 
      1 point (${tiedFirstTimeDifference.toFixed(2)} seconds) away from being alone in first place!`;
      break;
    }

    case "new-first": {
      const aheadOfSecondPlace = totalPoints - score;
      const newFirstScoreTimeDifference = (aheadOfSecondPlace * timerInterval) / 1000;

      scoreboardOffsetElement.innerText = `New first place! 
      ${aheadOfSecondPlace.toLocaleString()} point${aheadOfSecondPlace === 1 ? "" : "s"} (${newFirstScoreTimeDifference.toFixed(
        2
      )} seconds) ahead of previous first place!`;

      break;
    }

    case "on-scoreboard": {
      const pointDifference = score + 1 - totalPoints;
      const timeDifference = (pointDifference * timerInterval) / 1000;

      scoreboardOffsetElement.innerText = `${pointDifference.toLocaleString()} points (${timeDifference.toFixed(2)} seconds) from first place!`;
      break;
    }

    case "off-scoreboard": {
      const pointDifference = score + 1 - totalPoints;
      const timeDifference = (pointDifference * timerInterval) / 1000;

      scoreboardOffsetElement.innerText = `${pointDifference.toLocaleString()} points (${timeDifference.toFixed(2)} seconds) from the scoreboard!`;
      break;
    }

    default:
      break;
  }
};

// I only care about game_end_local_time if user reached scoreboard, so I have a
// separate API call here that is called conditionally.
const logLocalTime = async () => {
  const data = {
    id: databaseInsertId,
    game_end_local_time: getHumanReadableLocalTime(),
  };

  const request = await apiHelper(`${dbHost}/api/stats/local-time`, "POST", data);
  if (request?.status !== 200) throw new Error("Error setting local time.");
};

const buildGameOverScreen = (type: "selection" | "timer" | "win") => {
  gameOverScreenElement.setAttribute("data-game-end-type", type);
  gameOverScreenElement.setAttribute("data-screen-active", "true");

  gameOverTitleElement.innerText = `You ${type === "win" ? "Win" : "Lose"}!`;
  finalScoreElement.innerText = totalPoints.toLocaleString();

  // currentPart does not advance after last part on gameOver("win")
  // so I check here before displaying the score.
  correctElement.innerText = `${type === "win" ? currentPart + 1 : currentPart} out of ${parts.length}`;

  playAgainButton.addEventListener("click", playAgainClick);
};

// This API adds 1 to the current play_again column when a user clicks the Play Again <button>.
const playAgainClick = async () => {
  const data = {
    uuid: getLocalUUID(),
  };

  const request = await apiHelper(`${dbHost}/api/users/play-again`, "POST", data);
  if (request?.status === 200) {
    window.location.reload();
  }
};

// Builds DOM <table> with stats after the game is saved in the database.
const buildScoreboard = async () => {
  const statsFromDatabase = await apiHelper(`${dbHost}/api/stats/scoreboard`);
  if (!statsFromDatabase) return;

  const allStats = statsFromDatabase.data;
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
    logLocalTime();
  } else if (totalPoints >= lowestHighScore) {
    if (totalPoints > 0) showInputPlayerNameModal();
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
  getTotalGames();
};

const getTotalGames = async () => {
  const totalGamesElement = document.querySelector(`#total-games`)! as HTMLDivElement;

  const request = await apiHelper(`${dbHost}/api/stats/total-games`);
  if (request?.status === 200) {
    const totalGames: number = request.data.total;
    totalGamesElement.innerText = `There have been ${totalGames.toLocaleString()} games played in total.`;
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
    imageLoadListeners("remove");

    // First part, set start time.
    if (currentPart === 0) logStartTime();
  }
};

// For calculating total game time.
const logStartTime = () => {
  gameStartTimeMS = Date.now();
};

// Game over. Log game stats to database.
const logGame = async (gameData: any) => {
  const loggingGame = await apiHelper(`${dbHost}/api/stats/log-game`, "POST", gameData);
  if (loggingGame?.status === 200) databaseInsertId = loggingGame.data.insertId;
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
    const bgColor = secondsUntilStart === 3 ? "red" : secondsUntilStart === 2 ? "yellow" : "green";
    countdownSecondsElement.innerText = secondsUntilStart + "";
    countdownSecondsElement.setAttribute("data-color", bgColor);
  }, 1250);
};

const focusStage = () => {
  // Grabs blurry elements except for the product images. Those will focus on image load.
  const blurryElements = document.querySelectorAll(`[data-blur="true"]:not(img[data-blur="true"])`)! as NodeListOf<HTMLDListElement>;

  for (const element of blurryElements) {
    element.removeAttribute("data-blur");
  }
};

// Part images.
const imageLoadListeners = (type: "add" | "remove") => {
  // Where else am i using this nodelist?
  quizImageElements.forEach((image) => {
    if (type === "add") {
      image.addEventListener("load", imageLoaded);
    } else {
      image.removeEventListener("load", imageLoaded);
    }
  });
};

const removeRewardClass = (event: Event) => {
  const target = event.target as HTMLButtonElement;
  target.classList.remove("reward");
};

// Answer buttons.
const answerButtonListeners = (type: "add" | "remove") => {
  for (const quizButton of quizButtonElements) {
    if (type === "add") {
      quizButton.addEventListener("click", answerClick);
      quizButton.addEventListener("animationend", removeRewardClass);
    } else {
      quizButton.removeEventListener("click", answerClick);
      quizButton.removeEventListener("animationend", removeRewardClass);
    }
  }
};

imageLoadListeners("add");
answerButtonListeners("add");
getParts();
beginCountdownToStart();

// ---------- TEST FUNCTIONS ----------

// const testFunction = () => {
//   submitPlayerNameToDatabase();
// };

// const testButton = document.querySelector(`#testing`)! as HTMLButtonElement;
// testButton.addEventListener("click", testFunction);
