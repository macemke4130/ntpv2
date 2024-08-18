import { Part } from "./types";

const cameraElement = document.querySelector(`#camera`)! as HTMLDivElement;
const filmStripElement = document.querySelector(`#filmstrip`)! as HTMLDivElement;

const filmStripImages: string[] = [];
const filmStripNumberOfImages = 4;

const getRandomPartImages = async () => {
  try {
    const request = await fetch("./quiz.json");
    const jsonData = await request.json();

    const allParts: Part[] = jsonData.parts;
    buildFilmStrip(allParts);
  } catch (e) {
    console.error(e);
  }
};

const buildFilmStrip = (allParts: Part[]) => {
  for (let index = 0; index < filmStripNumberOfImages; index++) {
    filmStripImages.push(allParts[index].images[0]);
  }

  fillFilmStripDOM();
};

const fillFilmStripDOM = () => {
  for (const imageSrc of filmStripImages) {
    const imageElement = document.createElement("img");
    imageElement.setAttribute("src", `images/${imageSrc}`);
    imageElement.setAttribute("alt", "");
    filmStripElement.appendChild(imageElement);
  }

  // Fill twice for loop.
  for (const imageSrc of filmStripImages) {
    const imageElement = document.createElement("img");
    imageElement.setAttribute("src", `images/${imageSrc}`);
    imageElement.setAttribute("alt", "");
    filmStripElement.appendChild(imageElement);
  }
};

const createAnimation = () => {
  const keyFrames = [{ transform: `translateX(0)` }, { transform: `translateX(-${cameraElement.offsetWidth}px)` }];

  const animOptions: KeyframeAnimationOptions = {
    duration: 20000,
    easing: "linear",
    delay: 0,
    iterations: Infinity,
    direction: "normal",
    fill: "forwards",
  };

  filmStripElement.animate(keyFrames, animOptions);
};

filmStripElement.addEventListener("animationiteration", (event) => {
  console.log(event);
});

getRandomPartImages();
createAnimation();
