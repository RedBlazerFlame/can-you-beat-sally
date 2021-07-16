// Declaring Constants and Variables
const STATE: {[key: string]: any} = {};
type Question = {
    question: string,
    choices: Array<string>,
    choiceProbabilities: Array<number>,
    correctAnswer: number,
    value: number
}
let questions: Array<Question> = [];
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const questionsId = urlParams.get("id");

// Getting a reference to the HTML elements
const startGameButton: HTMLButtonElement = document.querySelector("button.start-game-button") as HTMLButtonElement;
const resetButton: HTMLButtonElement = document.querySelector("button.reset-button") as HTMLButtonElement;
const titleScreenWindow: HTMLElement = document.querySelector("main.title-screen") as HTMLElement;
const questionWindow: HTMLElement = document.querySelector("main.question-window") as HTMLElement;
const finalResultsWindow: HTMLElement = document.querySelector("main.final-results") as HTMLElement;

const turnIndicatorElement: HTMLDivElement = document.querySelector("main.question-window > section.header > div.turn-indicator") as HTMLDivElement;
const questionElement: HTMLDivElement = document.querySelector("main.question-window > section.header > div.question") as HTMLDivElement;
const choicesElement: HTMLElement = document.querySelector("main.question-window > section.buttons") as HTMLElement;
const playerScoreValueElement: HTMLSpanElement = document.querySelector("main.question-window > section.score > div.player-score > span.player-score-value") as HTMLSpanElement;
const sallyScoreValueElement: HTMLSpanElement = document.querySelector("main.question-window > section.score > div.sally-score > span.sally-score-value") as HTMLSpanElement;

const winnerElement: HTMLElement = document.querySelector("main.final-results > section.winner");
const playerFinalScoreValueElement: HTMLSpanElement = document.querySelector("main.final-results > section.scores > div.player-score > span.player-score-value") as HTMLSpanElement;
const sallyFinalScoreValueElement: HTMLSpanElement = document.querySelector("main.final-results > section.scores > div.sally-score > span.sally-score-value") as HTMLSpanElement;

// Declaring Functions
function sampleFromProbabilityList(logits: Array<number>): number {
    let randomNumber = Math.random() * logits.reduce((acc, cur) => acc + cur, 0);

    let resultIndex = 0;

    logits.forEach((logit, index) => {
        if(randomNumber < logit && randomNumber > 0) {
            resultIndex = index;
        }

        randomNumber -= logit;
    });

    return resultIndex;
}

async function delay(timeDelay: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeDelay);
    });
}

async function gameMainLoop(): Promise<void> {
    // Change the Visible Window
    titleScreenWindow.style.setProperty("--display", "none");
    questionWindow.style.setProperty("--display", "grid");

    let sallyScore = 0;
    let playerScore = 0;

    if(questions.length === 0) {
        try {
            questions = (await fetch(`/questions/${questionsId}.json`).then(res => res.json())) as Array<Question>;
        }
        catch {
            console.error("There was an error in fetching the Questions");
            console.trace();
        }
    }

    // Iterate over all the questions
    for(let question of questions) {
        // Player's Turn
        turnIndicatorElement.innerText = "It is Your Turn";

        while(choicesElement.hasChildNodes()) {
            choicesElement.removeChild(choicesElement.firstChild);
        }

        questionElement.innerText = `${question.question} (${question.value} point${(question.value === 1 ? "" : "s")})`;

        question.choices.forEach((answerChoice, index) => {
            const button: HTMLButtonElement = document.createElement("button");
            button.classList.add("button");
            button.innerText = answerChoice;
            button.dataset.choiceIndex = `${index}`;

            choicesElement.appendChild(button);
        });

        let answerChoice: number = await (async function(): Promise<number> {
            return new Promise((resolve) => {

                let choicesChildren: Array<HTMLButtonElement> = Array.from(choicesElement.childNodes) as Array<HTMLButtonElement>;

                function executor(ev) {
                    ev.target.blur();

                    for(let choiceElement of choicesChildren) {
                        choiceElement.removeEventListener("click", executor);
                    }

                    resolve(+ev.target.dataset.choiceIndex);
                }

                for(let choiceElement of choicesChildren) {
                    choiceElement.addEventListener("click", executor);
                }
            })
        })();
        
        // Revealing right and wrong answers
        let choicesElementChildren: Array<HTMLButtonElement> = Array.from(choicesElement.childNodes) as Array<HTMLButtonElement>;

        choicesElementChildren[answerChoice].classList.add("wrong-answer");

        choicesElementChildren[question.correctAnswer].classList.remove("wrong-answer");

        choicesElementChildren[question.correctAnswer].classList.add("correct-answer");

        if(answerChoice === question.correctAnswer) {
            playerScore += question.value;
        }

        console.log(playerScore);

        playerScoreValueElement.innerText = `${playerScore}`;

        await delay(2000);

        // Sally's Turn
        turnIndicatorElement.innerText = "";
        questionElement.innerText = "Sally is Thinking of an Answer";

        choicesElementChildren.forEach((choiceElement) => {
            choiceElement.classList.remove("wrong-answer", "correct-answer");
        });

        await delay(2000);

        let sallyAnswerChoice = sampleFromProbabilityList(question.choiceProbabilities);
        console.log(sallyAnswerChoice);

        choicesElementChildren[sallyAnswerChoice].classList.add("wrong-answer");

        choicesElementChildren[question.correctAnswer].classList.remove("wrong-answer");

        choicesElementChildren[question.correctAnswer].classList.add("correct-answer");

        if(sallyAnswerChoice === question.correctAnswer) {
            sallyScore += question.value;
        }

        console.log(sallyScore);

        sallyScoreValueElement.innerText = `${sallyScore}`;

        await delay(2000);
    }

    // Switching to End Screen
    questionWindow.style.setProperty("--display", "none");
    finalResultsWindow.style.setProperty("--display", "grid");

    playerScoreValueElement.innerText = `0`;
    sallyScoreValueElement.innerText = `0`;

    playerFinalScoreValueElement.innerText = `${playerScore}`;
    sallyFinalScoreValueElement.innerText = `${sallyScore}`;

    if(playerScore > sallyScore) {
        winnerElement.innerText = "Hooray! You Won!";
    }
    else if(playerScore === sallyScore) {
        winnerElement.innerText = "We Tied. Good game!";
    }
    else {
        winnerElement.innerText = "I Won! Yay!";
    }

    await (async function(): Promise<void> {
        return new Promise(
            (resolve) => {
                let buttonResetExecutor = function(){
                    console.log("clicked!");
                    finalResultsWindow.style.setProperty("--display", "none");
                    titleScreenWindow.style.setProperty("--display", "grid");
                    resetButton.removeEventListener("click", buttonResetExecutor);
                    resolve();
                };
        
                resetButton.addEventListener("click", buttonResetExecutor);
            }
        );
    })();

    return;
}

// Adding Event Listeners to the HTML elements
STATE.startGameButtonBusy = false;
startGameButton.addEventListener("click", async() => {
    startGameButton.blur();
    if(!STATE.startGameButtonBusy) {
        STATE.startGameButtonBusy = true;

        await gameMainLoop();

        STATE.startGameButtonBusy = false;
    }
})

choicesElement.addEventListener("click", () => {
    for(let choiceElement of Array.from(choicesElement.childNodes) as Array<HTMLElement>) {
        choiceElement.blur();
    }
});