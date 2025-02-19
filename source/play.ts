const isDevSpace = false; // window.location.hostname.includes("localhost") || window.location.hostname.includes("192");

import { GameState, GameMode, RookieScoreObject, Stat, Part } from "./types";
import { apiHelper } from "./utils.js";

const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getDaySuffix = (dayOfMonth: number) => {
  const lastNumberInDay = Number(dayOfMonth.toString().charAt(dayOfMonth < 10 ? 0 : 1));

  if (lastNumberInDay === 0) return "th";
  if (lastNumberInDay === 1) return "st";
  if (lastNumberInDay === 2) return "nd";
  if (lastNumberInDay === 3) return "rd";
  if (lastNumberInDay >= 4) return "th";
};

const dom: Map<string, HTMLElement> = new Map();
const allNamedElements = document.querySelectorAll(`[id]`);

allNamedElements.forEach((element) => {
  dom.set(element.id, element as HTMLElement);
});

const quizImageElements = document.querySelectorAll(`[data-quiz-image]`)! as NodeListOf<HTMLImageElement>;
const quizButtonElements = document.querySelectorAll(`[data-quiz-button]`)! as NodeListOf<HTMLButtonElement>;
const preloadImageElements = document.querySelectorAll(`#preload img`)! as NodeListOf<HTMLImageElement>;
const gameOverScreenContainerElement = document.querySelector("[data-game-over]")! as HTMLDivElement;
const currentModeButton = document.querySelector(`[data-game-mode="${localStorage.getItem("gameMode") || "r"}"]`)! as HTMLButtonElement;
currentModeButton.classList.add("active");

const startPoints = 500;
const secondsPerTurn = 20;
const durationOfTurnMS = secondsPerTurn * 1000;
const pointDropPerInterval = 1;
const timerInterval = durationOfTurnMS / startPoints;
const updateDOMInterval = 3; // This value is arbitrary.

const state: GameState = {
  gameMode: "v",
  parts: [],
  wrongAnswers: [],
  rookieScore: [],
  correctAnswer: "",
  currentPart: 0,
  currentPoints: startPoints,
  currentPointsDOMValue: startPoints,
  totalPoints: 0,
  playTimer: 0,
  countdownTimer: 0,
  gameStartTimeMS: 0,
  databaseInsertId: 0,
  timerOff: isDevSpace,
  shortPartsList: false, // isDevSpace,
};

const imageLoadState = {
  one: false,
  two: false,
};

const determineGameMode = () => {
  if (!localStorage.getItem("gameMode")) localStorage.setItem("gameMode", "r");
  state.gameMode = localStorage.getItem("gameMode") as GameMode;
  document.body.setAttribute("data-game-mode", state.gameMode);
};

determineGameMode();

const buildSpeculationRules = (parts: Part[]) => {
  const speculationScriptElement = document.createElement("script");
  speculationScriptElement.setAttribute("type", "speculationrules");

  const allImages = parts
    .map((part: Part) => part.images)
    .flat()
    .map((image: string) => `/images/${image}`);

  const specRules = {
    prefetch: [
      {
        source: "list",
        urls: allImages,
      },
    ],
  };

  speculationScriptElement.textContent = JSON.stringify(specRules);
  document.body.appendChild(speculationScriptElement);
};

const frontLoadEasyParts = () => {
  const easyPartAnswers = ["Star Nut", "Straddle Cable Carrier", "Sturmey Archer Cable Adjuster", "Park Tool Truing Stand Arm Cap"];
  const shuffledEasyParts = new Set(easyPartAnswers.sort(() => 0.5 - Math.random()));

  const partsMapWithSortPriority: Part[] = [];

  state.parts.forEach((part) => {
    const correctAnswer = part.answers[0];
    const partIsEasy = shuffledEasyParts.has(correctAnswer);

    const partWithSortPriority = structuredClone(part);
    partWithSortPriority.sortPriority = partIsEasy ? 0 : 1;

    partsMapWithSortPriority.push(partWithSortPriority);
  });

  const allPartsWithEasyPartsFrontLoaded = partsMapWithSortPriority.toSorted((a, b) => {
    const aSort = a.sortPriority || 0;
    const bSort = b.sortPriority || 0;

    if (aSort > bSort) return 1;
    if (aSort < bSort) return -1;
    return -1;
  });

  state.parts = allPartsWithEasyPartsFrontLoaded;
};

const pullData = async () => {
  try {
    const allPartsRequest = await apiHelper("/api/parts");
    state.parts = allPartsRequest?.data.parts;
    state.wrongAnswers = allPartsRequest?.data.wrongAnswers;

    if (HTMLScriptElement.supports("speculationrules")) {
      buildSpeculationRules(allPartsRequest?.data.parts);
    }

    if (state.shortPartsList) state.parts.length = 5;

    const flag = isDevSpace;

    // First time user.
    if (!getLocalStorageUUID()) {
      frontLoadEasyParts();
    }

    // Rookie Game or DevSpace Veteran Game.
    if (state.gameMode === "r" || flag) {
      removeCountdownElement();
      startGame();
    } else {
      // Verteran Game.
      beginCountdownToStart();
    }
  } catch (error) {
    console.error(error);
  }
};

pullData();

const updateGameProgressBar = () => {
  if (state.currentPart === 0) {
    dom.get("progress-bar")!.setAttribute("max", state.parts.length + "");
  }

  dom.get("progress-text")!.innerText = `${state.currentPart + 1} out of ${state.parts.length}`;
  dom.get("progress-bar")!.setAttribute("value", state.currentPart + 1 + "");

  dom.get("fake-progress-bar")!.style.width = `${(state.currentPart / state.parts.length) * 100}%`;
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
  dom.get("current-points")!.innerText = startPoints + "";
  state.currentPoints = startPoints;
  state.currentPointsDOMValue = startPoints;
  dom.get("current-points")!.classList.remove("flare");
  state.playTimer = setInterval(() => {
    if (state.timerOff) return; // For Dev.

    if (state.currentPoints <= 0) {
      gameOver("timer");
      return;
    }

    state.currentPoints = state.currentPoints - pointDropPerInterval;
    updateCurrentPointsDOM(state.currentPoints);
  }, timerInterval);
};

// Throttle expensive DOM updates for currentPoints.
const updateCurrentPointsDOM = (currentPoints: number) => {
  if (currentPoints < state.currentPointsDOMValue - updateDOMInterval) {
    state.currentPointsDOMValue = currentPoints;
    dom.get("current-points")!.innerText = state.currentPointsDOMValue + "";

    // Low point warning.
    if (state.currentPointsDOMValue < 150) {
      dom.get("current-points")!.classList.add("flare");
    }
  }
};

// Loads the next two photos (1 next part) into the cache.
const preloadNextPart = () => {
  const nextPart = state.parts[state.currentPart + 1];

  if (nextPart) {
    preloadImageElements.forEach((preload, index) => {
      preload.src = `./images/${nextPart.images[index]}`;
    });
  }
};

const handleRookieAnswer = (answer: string) => {
  const rookieScoreTemp: RookieScoreObject = {
    correct: answerWasCorrect(answer),
    images: state.parts[state.currentPart].images.join(" && "),
  };

  state.rookieScore.push(rookieScoreTemp);

  if (state.currentPart === state.parts.length - 1) {
    gameOver("win");
    return;
  }

  state.currentPart++;
  clearAnswers();
  blurPartImages(true);
  imageLoadListeners("add");
  loadPartImages(state.currentPart);
};

const answerWasCorrect = (selectedAnswer: string) => {
  return selectedAnswer === state.correctAnswer;
};

// After first correct answer, remove hint and glows.
// I'm only removing text content to avoid layout shift.
const removeGlowAndHint = () => {
  const hintElement = document.querySelector("#hint")! as HTMLDivElement;
  hintElement.innerText = "";

  quizButtonElements.forEach((answer) => {
    answer.classList.remove("glow");
  });
};

const handleEnterKey = (event: KeyboardEvent) => {
  const enterKeyPressed = event.key === "Enter" || event.key === " ";
  if (!enterKeyPressed) return;

  const target = document.activeElement;
  if (target) {
    const answerButtonHasFocus = target.hasAttribute("data-quiz-button");
    if (answerButtonHasFocus) {
      const targetButton = target as HTMLButtonElement;
      verifyAnswer(targetButton.innerText, targetButton);
    }
  }
};

const handleAnswerClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLButtonElement;
  const answer = target.innerText;
  verifyAnswer(answer, target);
};

// User has chosen an answer.
const verifyAnswer = (answer: string, target: HTMLButtonElement) => {
  // It's possible to use the keyboard to focus and click
  // the answer buttons before the game begins, while the
  // curtain is still blurred. This can result in an "Out
  // of range for column" for game_duration_in_seconds
  // error. So if the gameStartTimeMS isn't set, exit function.
  if (!state.gameStartTimeMS) return;

  // Prevent double clicks.
  answerButtonListeners("remove");

  if (state.currentPart === 0) {
    removeGlowAndHint();
  }

  // Interrupt for Rookie Mode.
  if (state.gameMode === "r") {
    handleRookieAnswer(answer);
    return;
  }

  // Correct answer was chosen.
  if (answerWasCorrect(answer) || isDevSpace) {
    // Game Win if this was the final part.
    if (state.currentPart === state.parts.length - 1) {
      updateTotalPoints();
      gameOver("win");
      return;
    }

    // More parts remain in parts[].
    // Prepare state for next turn.
    target.classList.add("reward");
    state.currentPart++;
    updateTotalPoints();
    clearInterval(state.playTimer);
    clearAnswers();
    clearCurrentPoints();
    blurPartImages(true);
    imageLoadListeners("add");
    loadPartImages(state.currentPart);
  } else {
    // Wrong answer was chosen.
    gameOver("selection");
  }
};

// Clear DOM element.
const clearCurrentPoints = () => {
  dom.get("current-points")!.innerText = "";
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
  const part = state.parts[partNumber];

  part.images.forEach((imageSource, index) => {
    quizImageElements[index].src = `./images/${imageSource}`;
  });

  preloadNextPart();
};

const getRandomWrongAnswer = () => {
  const randomInteger = Math.floor(Math.random() * state.wrongAnswers.length);
  return state.wrongAnswers[randomInteger];
};

// Populate all answer buttons with currentPart answers.
const fillAnswerButtons = (partNumber: number) => {
  const part = state.parts[partNumber];

  // Store correct value to state before shuffle.
  state.correctAnswer = part.answers[0];

  const shuffledAnswers = [...part.answers].sort(() => 0.5 - Math.random());

  // Source to search for unique button answers.
  const validAnswers = new Set(shuffledAnswers.filter((answer) => !!answer));

  shuffledAnswers.forEach((answer, index) => {
    const button = quizButtonElements[index];

    // getRandomWrongAnswer() could return the same part for multiple buttons.
    // Here I'm using a while loop and a temporary validAnswers[] to determine
    // if the new proposedWrongAnswer already exists in the answer list.
    if (!answer) {
      let proposedWrongAnswer = getRandomWrongAnswer();
      let validAnswersContainsProposedWrongAnswer = validAnswers.has(proposedWrongAnswer);

      while (validAnswersContainsProposedWrongAnswer) {
        proposedWrongAnswer = getRandomWrongAnswer();
        validAnswersContainsProposedWrongAnswer = validAnswers.has(proposedWrongAnswer);
      }

      const acceptedWrongAnswer = proposedWrongAnswer;

      validAnswers.add(acceptedWrongAnswer);
      button.innerText = acceptedWrongAnswer;
    } else {
      button.innerText = answer;
    }
  });
};

// On correct answer, update totalPoints state.
const updateTotalPoints = () => {
  state.totalPoints = state.totalPoints + state.currentPoints;
  dom.get("total-points")!.innerText = state.totalPoints.toLocaleString();
};

// Logs duration of game in seconds.
// Used for stat table in database.
const totalGameDuration = () => {
  const rightNow = Date.now();
  const totalMS = rightNow - state.gameStartTimeMS;
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
    userAgentInfo: nav.userAgent,
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

const printRookieScore = () => {
  const rookieCorrectAnswers: number = state.rookieScore.reduce((acc, current) => {
    return acc + Number(current.correct);
  }, 0);

  const rookieScoreElement = document.querySelector("#rookie-score")! as HTMLDivElement;
  rookieScoreElement.innerText = `${rookieCorrectAnswers} correct out of ${state.parts.length}`;
};

const reportScoreToPlayer = () => {
  printRookieScore();

  // Build photos <ol>
  state.rookieScore.forEach((part) => {
    const liElement = document.createElement("li");
    liElement.classList.add("rookie-answer");
    liElement.classList.add(part.correct ? "correct" : "incorrect");

    const imagesContainerElement = document.createElement("div");
    imagesContainerElement.classList.add("rookie-images");

    const imageOneElement = document.createElement("img");
    const imageTwoElement = document.createElement("img");

    const imageSources = part.images.split(" && ");

    imageOneElement.src = `./images/${imageSources[0]}`;
    imageTwoElement.src = `./images/${imageSources[1]}`;

    imageOneElement.setAttribute("width", "400");
    imageOneElement.setAttribute("height", "300");
    imageTwoElement.setAttribute("width", "400");
    imageTwoElement.setAttribute("height", "300");

    imagesContainerElement.appendChild(imageOneElement);
    imagesContainerElement.appendChild(imageTwoElement);

    const answerContainerElement = document.createElement("div");
    answerContainerElement.classList.add("answer-container");

    const answerTextOutputElement = document.createElement("div");
    answerTextOutputElement.classList.add("answer");
    answerTextOutputElement.innerText = part.correct ? "Correct" : "Wrong";

    const answerBackgroundElement = document.createElement("div");
    answerBackgroundElement.classList.add("answer-background");

    answerContainerElement.appendChild(answerBackgroundElement);
    answerContainerElement.appendChild(answerTextOutputElement);

    liElement.appendChild(imagesContainerElement);
    liElement.appendChild(answerContainerElement);

    dom.get("rookie-results")!.appendChild(liElement);
  });

  // Hide address bar on mobile.
  window.scrollTo(0, 1);
};

// Function is called by the end of the explode() transition or by a game win.
const clearPlayScreen = (type: "selection" | "timer" | "win") => {
  const gameCurtain = document.querySelector(`[data-game-curtain]`)! as HTMLElement;
  gameCurtain.setAttribute("data-game-curtain", "down");

  // Clean up and build.
  answerButtonListeners("remove");
  imageLoadListeners("remove");
  buildGameOverScreen(type);
  dom.get("rookie-mode")!.addEventListener("click", handleModeSwitchClick);
  dom.get("veteran-mode")!.addEventListener("click", handleModeSwitchClick);
  buildShareButton();

  if (state.gameMode === "v") {
    buildScoreboard();
    checkFunScore();
  } else {
    reportScoreToPlayer();
  }
};

const checkFunScore = () => {
  const funScoreElement = document.querySelector("#fun-score")! as HTMLDivElement;

  if (state.totalPoints === 0) {
    funScoreElement.innerText = "Don't Give Up!";
    return;
  }

  if (state.totalPoints === 13) {
    funScoreElement.innerText = "Bad Luck.";
    return;
  }

  if (state.totalPoints === 69) {
    funScoreElement.innerText = "Nice.";
    return;
  }

  if (state.totalPoints === 420) {
    funScoreElement.innerText = "Blaze It.";
    return;
  }

  if (state.totalPoints === 666) {
    funScoreElement.innerText = "Hail Satan.";
    return;
  }

  // Suggested by Brennan
  if (state.totalPoints === 777) {
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
  submitPlayerNameButton.addEventListener("click", submitPlayerNameToDatabaseFromModal);

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
  const recordNameCell = document.querySelector(`#scoreboard-${state.databaseInsertId} .player-name`)! as HTMLTableCellElement;
  const recordDateCell = document.querySelector(`#scoreboard-${state.databaseInsertId} .date`)! as HTMLTableCellElement;

  recordNameCell.innerText = playerName;
  recordDateCell.innerText = getHumanReadableLocalTime();

  closePlayerNameModal();
  recordNameCell.scrollIntoView({ behavior: "smooth", block: "center" });
};

// Only listening for this event when the input play name <dialog> is open.
const submitPlayerNameWithEnterKey = (event: KeyboardEvent) => {
  if (event.key !== "Enter") return;
  submitPlayerNameToDatabaseFromModal();
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

// Called when a user selects a wrong answer, their time runs
// out, or when they win the game.
const gameOver = async (type: "selection" | "timer" | "win") => {
  // Clear timer first to prevent duplicate gameOver("timer") calls.
  clearInterval(state.playTimer);

  const gameStats: Stat = {
    correct_answers: type === "win" ? state.parts.length : state.currentPart,
    losing_part: type !== "win" ? state.correctAnswer : "",
    final_score: state.totalPoints,
    total_parts: state.parts.length,
    game_duration_in_seconds: totalGameDuration(),
    game_end_type: type.charAt(0) as "s" | "t" | "w",
    connection: getConnectionSpeed(),
    uuid: isReturningUser() ? getLocalStorageUUID() : createLocalUUID(),
    game_mode: state.gameMode,
    device_info: getDeviceInfo(),
  };

  await createUserOrIncrementUserGamePlayed(gameStats.uuid);

  if (type === "selection" || type === "timer") explode();

  if (state.gameMode === "v") {
    // Log game in database.
    await logGameToStatsTable(gameStats);
  } else {
    await logRookieGame(gameStats);
  }

  gameOverScreenContainerElement.setAttribute("data-game-over", "true");
  if (type === "win") clearPlayScreen("win");
};

// Updates users table with the current players names at local machine.
const updateDatabaseUserNamesList = async () => {
  const playerData = {
    uuid: getLocalStorageUUID(),
    player_names: getLocalPlayerNames(),
  };

  try {
    const updateUserNames = await apiHelper(`/api/users/new-players`, "POST", playerData);
    if (updateUserNames?.status !== 200) throw new Error("Updating player names failed.");
  } catch (e) {
    console.error(e);
  }
};

const submitPlayerNameToDatabaseFromModal = async () => {
  const playerNameInputElement = document.querySelector(`#player-name-text`)! as HTMLInputElement;

  // @ts-ignore - replaceAll()
  const playerName: string = playerNameInputElement.value.trim().replaceAll(",", "");

  updateLocalPlayerNameList(playerName);
  updateDatabaseUserNamesList();

  const playerData = {
    display_name: playerName,
    id: state.databaseInsertId,
  };

  const submitPlayerNames = await apiHelper(`/api/stats/display-name`, "POST", playerData);

  if (submitPlayerNames?.status === 200) {
    displayFakeData(playerName);
  }
};

// Called from gameOver().
const createUserOrIncrementUserGamePlayed = async (uuid: string) => {
  try {
    const checkUUID = await apiHelper(`/api/users/exists/${uuid}`);

    if (checkUUID?.data === true) {
      // User exists. Increment games_played
      const request = await apiHelper(`/api/users/game-played`, "POST", { uuid });
    } else {
      // User doesn't exist. Create user.

      const playerData = {
        uuid,
        player_names: getLocalPlayerNames(),
      };

      const request = await apiHelper(`/api/users/new-user`, "POST", playerData);
    }
  } catch (error) {
    console.error(error);
  }

  try {
  } catch (error) {
    console.error(error);
  }
};

// Builds a motivational string based on what place a user is closest to getting.
const calculatePointDifference = (type: "new-first" | "first-tie" | "on-scoreboard" | "off-scoreboard", score: number) => {
  switch (type) {
    case "first-tie": {
      const tiedFirstTimeDifference = timerInterval / 1000;

      dom.get("scoreboard-offset")!.innerText = `Tied for first place! 
      1 point (${tiedFirstTimeDifference.toFixed(2)} seconds) away from being alone in first place!`;
      break;
    }

    case "new-first": {
      const aheadOfSecondPlace = state.totalPoints - score;
      const newFirstScoreTimeDifference = (aheadOfSecondPlace * timerInterval) / 1000;

      dom.get("scoreboard-offset")!.innerText = `New first place! 
      ${aheadOfSecondPlace.toLocaleString()} point${aheadOfSecondPlace === 1 ? "" : "s"} (${newFirstScoreTimeDifference.toFixed(
        2
      )} seconds) ahead of previous first place!`;

      break;
    }

    case "on-scoreboard": {
      const pointDifference = score + 1 - state.totalPoints;
      const timeDifference = (pointDifference * timerInterval) / 1000;

      dom.get("scoreboard-offset")!.innerText = `${pointDifference.toLocaleString()} points (${timeDifference.toFixed(2)} seconds) from first place!`;
      break;
    }

    case "off-scoreboard": {
      const pointDifference = score + 1 - state.totalPoints;
      const timeDifference = (pointDifference * timerInterval) / 1000;

      dom.get("scoreboard-offset")!.innerText = `${pointDifference.toLocaleString()} points (${timeDifference.toFixed(2)} seconds) from the scoreboard!`;
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
    id: state.databaseInsertId,
    game_end_local_time: getHumanReadableLocalTime(),
  };

  const request = await apiHelper(`/api/stats/local-time`, "POST", data);
  if (request?.status !== 200) throw new Error("Error setting local time.");
};

const buildGameOverScreen = (type: "selection" | "timer" | "win") => {
  dom.get("game-over-screen")!.setAttribute("data-game-end-type", type);
  dom.get("game-over-screen")!.setAttribute("data-screen-active", "true");

  dom.get("game-over-title")!.innerText = `You ${type === "win" ? "Win" : "Lose"}!`;
  dom.get("final-score")!.innerText = state.totalPoints.toLocaleString();

  // currentPart does not advance after last part on gameOver("win")
  // so I check here before displaying the score.
  dom.get("correct")!.innerText = `${type === "win" ? state.currentPart + 1 : state.currentPart} out of ${state.parts.length}`;

  dom.get("play-again")!.addEventListener("click", playAgainClick);
};

// This API adds 1 to the current play_again column when a user clicks the Play Again <button>.
const playAgainClick = async () => {
  const data = {
    uuid: getLocalStorageUUID(),
  };

  const request = await apiHelper(`/api/users/play-again`, "POST", data);
  if (request?.status === 200) {
    window.location.reload();
  }
};

// Builds DOM <table> with stats after the game is saved in the database.
const buildScoreboard = async () => {
  const statsFromDatabase = await apiHelper(`/api/stats/scoreboard`);
  if (!statsFromDatabase) return;

  const allStats = statsFromDatabase.data;
  const lowestHighScore = allStats[allStats.length - 1].final_score;
  const highestScore = allStats[0].final_score;

  // The ended game is logged first. So [allStats] will have the current score
  // in place already. Remember this when doing math for first and last place.

  if (state.totalPoints === highestScore) {
    // Tied for first or new first place
    if (state.totalPoints > 0) showInputPlayerNameModal();

    // Check 2nd row for equal score
    const secondRowScore = allStats[1].final_score;
    const secondRowIsEqual = secondRowScore === state.totalPoints;
    calculatePointDifference(secondRowIsEqual ? "first-tie" : "new-first", secondRowIsEqual ? 0 : secondRowScore);
    logLocalTime();
  } else if (state.totalPoints >= lowestHighScore) {
    // On Scoreboard
    if (state.totalPoints > 0) showInputPlayerNameModal();
    calculatePointDifference("on-scoreboard", highestScore);
    logLocalTime();
  } else {
    // Off Scoreboard
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
  highlightMyScore();
};

// Shows user where their score is on the database.
// TODO: Add scrollTo()
const highlightMyScore = () => {
  const myRow = document.querySelector(`#scoreboard-${state.databaseInsertId}`) as HTMLTableRowElement;
  if (myRow) {
    myRow.style.outline = `2px solid red`;
  }
};

const continueGameAfterPartsLoaded = () => {
  imageLoadState.one = false;
  imageLoadState.two = false;

  if (state.gameMode === "v") resetTimer();
  fillAnswerButtons(state.currentPart);
  answerButtonListeners("add");
  blurPartImages(false);
  imageLoadListeners("remove");
  updateGameProgressBar();

  // First part, set start time.
  if (state.currentPart === 0) logStartTime();
};

// Function is important for moving the game forward.
// Will be called each time both part images are finished loading.
const imageLoaded = (event: Event) => {
  const target = event.target as HTMLImageElement;
  const imageName = target.dataset.quizImage as keyof typeof imageLoadState;

  imageLoadState[imageName] = true;

  // Both images are loaded, continue gameplay.
  const bothPartImagesLoaded = imageLoadState.one && imageLoadState.two;
  if (bothPartImagesLoaded) continueGameAfterPartsLoaded();
};

// For calculating total game time.
const logStartTime = () => {
  state.gameStartTimeMS = Date.now();
};

const logRookieGame = async (gameStats: Stat) => {
  // Removing some unapplicable game data from stats by creating new object.
  const gameData: Stat = {
    correct_answers: state.rookieScore.reduce((acc, part) => acc + (part.correct ? 1 : 0), 0),
    total_parts: gameStats.total_parts,
    connection: gameStats.connection,
    game_duration_in_seconds: gameStats.game_duration_in_seconds,
    game_mode: "r",
    uuid: gameStats.uuid,
    final_score: 0,
    device_info: gameStats.device_info,
  };

  try {
    const loggingRookieGame = await apiHelper(`/api/stats/log-rookie-game`, "POST", gameData);
    if (loggingRookieGame?.status === 200) state.databaseInsertId = loggingRookieGame.data.insertId;
  } catch (error) {
    console.error(error);
  }
};

// Game over. Log game stats to database.
const logGameToStatsTable = async (gameData: any) => {
  try {
    const loggingGame = await apiHelper(`/api/stats/log-game`, "POST", gameData);
    if (loggingGame?.status === 200) state.databaseInsertId = loggingGame.data.insertId;
  } catch (error) {
    console.error(error);
  }
};

// I don't need or want 36 characters.
// A lenth of 8 gives over 218 trillion possibilites.
const createUUID = () => crypto.randomUUID().substring(0, 8);
const getLocalStorageUUID = () => localStorage.getItem("uuid") || "";
const isReturningUser = () => !!localStorage.getItem("uuid");
const getLocalPlayerNames = () => localStorage.getItem("playerNames") || "";

const createLocalUUID = () => {
  const uuidNew = createUUID();
  localStorage.setItem("uuid", uuidNew);
  return uuidNew;
};

const startGame = () => {
  loadPartImages(0);
  focusStage();
  updateGameProgressBar();
};

const removeCountdownElement = () => {
  dom.get("countdown-to-start")!.remove();
  clearInterval(state.countdownTimer);
};

const beginCountdownToStart = () => {
  let secondsUntilStart = 3;

  dom.get("countdown-seconds")!.innerText = secondsUntilStart + "";

  state.countdownTimer = setInterval(() => {
    if (secondsUntilStart === 1) {
      removeCountdownElement();

      // Start game.
      startGame();
    }

    secondsUntilStart--;
    const bgColor = secondsUntilStart === 3 ? "red" : secondsUntilStart === 2 ? "yellow" : "green";
    dom.get("countdown-seconds")!.innerText = secondsUntilStart + "";
    dom.get("countdown-seconds")!.setAttribute("data-color", bgColor);
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

const answerButtonListeners = (type: "add" | "remove") => {
  for (const quizButton of quizButtonElements) {
    if (type === "add") {
      quizButton.addEventListener("mousedown", handleAnswerClick);
      window.addEventListener("keydown", handleEnterKey);
      quizButton.addEventListener("animationend", removeRewardClass);
    } else {
      quizButton.removeEventListener("mousedown", handleAnswerClick);
      window.removeEventListener("keydown", handleEnterKey);
      quizButton.removeEventListener("animationend", removeRewardClass);
    }
  }
};

const handleModeSwitchClick = async (event: Event) => {
  const target = event.currentTarget as HTMLButtonElement;
  const eventGameMode = target.getAttribute("data-game-mode") as GameMode;

  localStorage.setItem("gameMode", eventGameMode);

  const data = {
    uuid: getLocalStorageUUID(),
  };

  try {
    const request = await apiHelper(`/api/users/play-again`, "POST", data);
    if (request?.status === 200) {
      window.location.reload();
    }
  } catch (error) {
    console.error(error);
  }
};

// This is overengineered. I don't care.
const sizeImageHeight = () => {
  const answerButtonsContainerElement = document.querySelector(`[aria-label="Answers"]`)! as HTMLElement;
  const imagesContainerElement = document.querySelector(`[aria-label="Images"]`)! as HTMLElement;
  const scoreContainerElement = document.querySelector(`[aria-label="Score"]`)! as HTMLDivElement;

  const answerButtonsHeight = answerButtonsContainerElement.offsetHeight;
  const imagesHeight = imagesContainerElement.offsetHeight;
  const scoreHeight = scoreContainerElement.offsetHeight;
  const footerHeight = footerElement.offsetHeight;

  const totalElementHeight = answerButtonsHeight + imagesHeight + scoreHeight + footerHeight;

  if (totalElementHeight > window.innerHeight) {
    const heightDifference = totalElementHeight - window.innerHeight;

    for (const image of quizImageElements) {
      const currentImageHeight = image.offsetHeight;
      image.style.maxHeight = `${currentImageHeight - heightDifference - scoreHeight}px`;
    }
  }
};

sizeImageHeight();
imageLoadListeners("add");
answerButtonListeners("add");

// Veteran mode starts countdown. Rookie mode starts on parts[] loaded.
// if (state.gameMode === "v") {
//   beginCountdownToStart();
// }
