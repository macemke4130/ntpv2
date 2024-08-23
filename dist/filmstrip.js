"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cameraElement = document.querySelector(`#camera`);
const filmStripElement = document.querySelector(`#filmstrip`);
const filmStripImages = [];
const filmStripNumberOfImages = 4;
const getRandomPartImages = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const request = yield fetch("./quiz.json");
        const jsonData = yield request.json();
        const allParts = jsonData.parts;
        buildFilmStrip(allParts);
    }
    catch (e) {
        console.error(e);
    }
});
const buildFilmStrip = (allParts) => {
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
    const animOptions = {
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
