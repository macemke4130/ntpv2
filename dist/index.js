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
const totalPartsElement = document.querySelector(`#total-parts`);
const dateUpdatedElement = document.querySelector(`#date-updated`);
const fillGameData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const request = yield fetch("./quiz.json");
        const jsonData = yield request.json();
        totalPartsElement.innerText = jsonData.parts.length + "";
        dateUpdatedElement.innerText = jsonData.dateLastUpdated;
    }
    catch (e) {
        console.error(e);
    }
});
fillGameData();
