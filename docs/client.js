var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Declaring Constants and Variables
const STATE = {};
let questions = [];
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const questionsId = urlParams.get("id");
// Getting a reference to the HTML elements
const startGameButton = document.querySelector("button.start-game-button");
const resetButton = document.querySelector("button.reset-button");
const titleScreenWindow = document.querySelector("main.title-screen");
const questionWindow = document.querySelector("main.question-window");
const finalResultsWindow = document.querySelector("main.final-results");
const turnIndicatorElement = document.querySelector("main.question-window > section.header > div.turn-indicator");
const questionElement = document.querySelector("main.question-window > section.header > div.question");
const choicesElement = document.querySelector("main.question-window > section.buttons");
const playerScoreValueElement = document.querySelector("main.question-window > section.score > div.player-score > span.player-score-value");
const sallyScoreValueElement = document.querySelector("main.question-window > section.score > div.sally-score > span.sally-score-value");
const winnerElement = document.querySelector("main.final-results > section.winner");
const playerFinalScoreValueElement = document.querySelector("main.final-results > section.scores > div.player-score > span.player-score-value");
const sallyFinalScoreValueElement = document.querySelector("main.final-results > section.scores > div.sally-score > span.sally-score-value");
// Declaring Functions
function sampleFromProbabilityList(logits) {
    let randomNumber = Math.random() * logits.reduce((acc, cur) => acc + cur, 0);
    let resultIndex = 0;
    logits.forEach((logit, index) => {
        if (randomNumber < logit && randomNumber > 0) {
            resultIndex = index;
        }
        randomNumber -= logit;
    });
    return resultIndex;
}
function delay(timeDelay) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeDelay);
        });
    });
}
function gameMainLoop() {
    return __awaiter(this, void 0, void 0, function* () {
        // Change the Visible Window
        titleScreenWindow.style.setProperty("--display", "none");
        questionWindow.style.setProperty("--display", "grid");
        let sallyScore = 0;
        let playerScore = 0;
        if (questions.length === 0) {
            try {
                questions = (yield fetch(`/questions/${questionsId}.json`).then(res => res.json()));
            }
            catch (_a) {
                console.error("There was an error in fetching the Questions");
                console.trace();
            }
        }
        // Iterate over all the questions
        for (let question of questions) {
            // Player's Turn
            turnIndicatorElement.innerText = "It is Your Turn";
            while (choicesElement.hasChildNodes()) {
                choicesElement.removeChild(choicesElement.firstChild);
            }
            questionElement.innerText = `${question.question} (${question.value} point${(question.value === 1 ? "" : "s")})`;
            question.choices.forEach((answerChoice, index) => {
                const button = document.createElement("button");
                button.classList.add("button");
                button.innerText = answerChoice;
                button.dataset.choiceIndex = `${index}`;
                choicesElement.appendChild(button);
            });
            let answerChoice = yield (function () {
                return __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve) => {
                        let choicesChildren = Array.from(choicesElement.childNodes);
                        function executor(ev) {
                            ev.target.blur();
                            for (let choiceElement of choicesChildren) {
                                choiceElement.removeEventListener("click", executor);
                            }
                            resolve(+ev.target.dataset.choiceIndex);
                        }
                        for (let choiceElement of choicesChildren) {
                            choiceElement.addEventListener("click", executor);
                        }
                    });
                });
            })();
            // Revealing right and wrong answers
            let choicesElementChildren = Array.from(choicesElement.childNodes);
            choicesElementChildren[answerChoice].classList.add("wrong-answer");
            choicesElementChildren[question.correctAnswer].classList.remove("wrong-answer");
            choicesElementChildren[question.correctAnswer].classList.add("correct-answer");
            if (answerChoice === question.correctAnswer) {
                playerScore += question.value;
            }
            console.log(playerScore);
            playerScoreValueElement.innerText = `${playerScore}`;
            yield delay(2000);
            // Sally's Turn
            turnIndicatorElement.innerText = "";
            questionElement.innerText = "Sally is Thinking of an Answer";
            choicesElementChildren.forEach((choiceElement) => {
                choiceElement.classList.remove("wrong-answer", "correct-answer");
            });
            yield delay(2000);
            let sallyAnswerChoice = sampleFromProbabilityList(question.choiceProbabilities);
            console.log(sallyAnswerChoice);
            choicesElementChildren[sallyAnswerChoice].classList.add("wrong-answer");
            choicesElementChildren[question.correctAnswer].classList.remove("wrong-answer");
            choicesElementChildren[question.correctAnswer].classList.add("correct-answer");
            if (sallyAnswerChoice === question.correctAnswer) {
                sallyScore += question.value;
            }
            console.log(sallyScore);
            sallyScoreValueElement.innerText = `${sallyScore}`;
            yield delay(2000);
        }
        // Switching to End Screen
        questionWindow.style.setProperty("--display", "none");
        finalResultsWindow.style.setProperty("--display", "grid");
        playerScoreValueElement.innerText = `0`;
        sallyScoreValueElement.innerText = `0`;
        playerFinalScoreValueElement.innerText = `${playerScore}`;
        sallyFinalScoreValueElement.innerText = `${sallyScore}`;
        if (playerScore > sallyScore) {
            winnerElement.innerText = "Hooray! You Won!";
        }
        else if (playerScore === sallyScore) {
            winnerElement.innerText = "We Tied. Good game!";
        }
        else {
            winnerElement.innerText = "I Won! Yay!";
        }
        yield (function () {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => {
                    let buttonResetExecutor = function () {
                        console.log("clicked!");
                        finalResultsWindow.style.setProperty("--display", "none");
                        titleScreenWindow.style.setProperty("--display", "grid");
                        resetButton.removeEventListener("click", buttonResetExecutor);
                        resolve();
                    };
                    resetButton.addEventListener("click", buttonResetExecutor);
                });
            });
        })();
        return;
    });
}
// Adding Event Listeners to the HTML elements
STATE.startGameButtonBusy = false;
startGameButton.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
    startGameButton.blur();
    if (!STATE.startGameButtonBusy) {
        STATE.startGameButtonBusy = true;
        yield gameMainLoop();
        STATE.startGameButtonBusy = false;
    }
}));
choicesElement.addEventListener("click", () => {
    for (let choiceElement of Array.from(choicesElement.childNodes)) {
        choiceElement.blur();
    }
});
