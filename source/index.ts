const totalPartsElement = document.querySelector(`#total-parts`)! as HTMLSpanElement;
const dateUpdatedElement = document.querySelector(`#date-updated`)! as HTMLSpanElement;

const fillGameData = async () => {
  try {
    const request = await fetch("./quiz.json");
    const jsonData = await request.json();

    totalPartsElement.innerText = jsonData.parts.length + "";
    dateUpdatedElement.innerText = jsonData.dateLastUpdated;
  } catch (e) {
    console.error(e);
  }
};

fillGameData();
