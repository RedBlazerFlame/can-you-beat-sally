import { readdir, writeFile, readFile } from "fs/promises";
import { exec as execSync } from "node:child_process";
import { promisify } from "util";
import { watchFile } from "fs";
import path from "path";
import minimist from "minimist";

const exec = promisify(execSync);

// Declaring Constants and Variables
let fileCode = "";
let validChars: Array<string> =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_".split(
        ""
    );
const QUESTIONS_PATH = path.join(".", "static", "questions");

// Declaring Functions
function pickRandomItem<T>(array: Array<T>): T {
    return array[Math.floor(Math.random() * array.length)];
}

/// Lexer
const TOKENS = ["Q# ", "I# ", "C# ", "A# ", "V# "] as const;
type Token = typeof TOKENS[number];
type Lexemes = TokenizedLine[];
type TokenizedLine = {
    token: Token;
    content: string;
};
function lexer(text: string): Lexemes {
    const lines = text.split("\r\n");
    const semanticLines = lines.filter((line) =>
        TOKENS.some((token) => line.startsWith(token))
    );
    const tokenizedLines: TokenizedLine[] = semanticLines.map((line) => {
        const token = ((line) => {
            for (let token of TOKENS) {
                if (line.startsWith(token)) {
                    return token;
                }
            }
        })(line);

        const content = line.split(token)[1];

        return {
            token,
            content,
        };
    });
    return tokenizedLines;
}

/// Parser
type SemanticUnit = {
    question: {
        token: "Q# ";
        content: string;
    };
    choices: {
        token: "C# " | "A# ";
        content: string;
    }[];
    value?: {
        token: "V# ";
        content: number;
    };
    image?: {
        token: "I# ";
        content: string;
    };
};

type Semantics = SemanticUnit[];

function parser(lexemes: Lexemes): Semantics {
    const lexemesLength = lexemes.length;
    let semanticTokens: Semantics = [];

    let currentLastLexeme = -1;
    for (let i = 0; i < lexemesLength; i++) {
        let currentLexeme = lexemes[i];

        switch (currentLexeme.token) {
            case "Q# ":
                {
                    semanticTokens.push({
                        question: currentLexeme as {
                            token: "Q# ";
                            content: string;
                        },
                        choices: [],
                    });
                    currentLastLexeme++;
                }
                break;
            case "I# ":
                {
                    semanticTokens[currentLastLexeme].image = currentLexeme as {
                        token: "I# ";
                        content: string;
                    };
                }
                break;
            case "V# ":
                {
                    semanticTokens[currentLastLexeme].value = {
                        token: currentLexeme.token,
                        content: parseInt(currentLexeme.content),
                    } as {
                        token: "V# ";
                        content: number;
                    };
                }
                break;
            case "A# ":
            case "C# ":
                {
                    semanticTokens[currentLastLexeme].choices.push(
                        currentLexeme as {
                            token: "A# " | "C# ";
                            content: string;
                        }
                    );
                }
                break;
        }
    }

    return semanticTokens;
}

/// Converts Semantics to JSON
type Question = {
    question: string;
    choices: Array<string>;
    choiceProbabilities: Array<number>;
    correctAnswer: number;
    value: number;
    imageUrl?: string;
};

type SemanticsToJSONOptions = {
    defaultValue?: number;
    probabilityCorrect?: number;
};
function convertSemanticsToJSON(
    semantics: Semantics,
    options: SemanticsToJSONOptions = {}
): Question[] {
    const { defaultValue = 1, probabilityCorrect = 0.8 } = options;
    const questions: Question[] = [];
    const totalQuestions = semantics.length;

    for (let semanticUnit of semantics) {
        questions.push({
            question: semanticUnit.question.content,
            ...(semanticUnit?.image !== undefined
                ? { imageUrl: semanticUnit.image.content }
                : {}),
            choices: semanticUnit.choices.map((choice) => choice.content),
            correctAnswer: semanticUnit.choices.reduce(
                (acc: number, cur, index) =>
                    cur.token === "C# " ? index : acc,
                0
            ),
            value:
                semanticUnit?.value !== undefined
                    ? semanticUnit.value.content
                    : defaultValue,
            choiceProbabilities: semanticUnit.choices.map((choice) =>
                choice.token === "C# "
                    ? probabilityCorrect
                    : (1 - probabilityCorrect) /
                      (semanticUnit.choices.length - 1)
            ),
        });
    }

    return questions;
}

function convertTextToJSON(
    text: string,
    semanticsToJSONOptions: SemanticsToJSONOptions = {}
): Question[] {
    // Tokenizing Contents
    const tokenizedContents = lexer(text);
    // Parsing Contents
    const parsedContents = parser(tokenizedContents);

    // Converting to JSON
    const JSONContents = convertSemanticsToJSON(
        parsedContents,
        semanticsToJSONOptions
    );

    return JSONContents;
}

// Type Guards
function valueIsUndefined(value): value is undefined {
    return typeof value === "undefined";
}

// Getting Command Parameters
type CommandArguments = {
    "input-file": string | undefined;
    "default-value": string | undefined;
    "probability-correct": string | undefined;
    watch: boolean;
};
const {
    "input-file": inputFile,
    "default-value": rawDefaultValue = "1",
    "probability-correct": rawProbabilityCorrect = "0.8",
    watch: watchForFile = false,
} = minimist(process.argv.slice(2)) as unknown as CommandArguments;

// Generating File Code
(async () => {
    // Validating Inputs
    if (valueIsUndefined(inputFile)) {
        console.error(`[ERR] Input file path is undefined`);
        return;
    }

    const fileExtension = path.extname(inputFile);
    const fileName = path.basename(inputFile, fileExtension);
    if (fileExtension !== ".txt") {
        console.error(
            `[ERR] The file extension "${fileExtension}" is not recognized as a text file`
        );
        return;
    }

    let defaultValue;

    try {
        defaultValue = parseInt(rawDefaultValue);
    } catch (e) {
        console.error(
            `[ERR] The inputted default question value, "${rawDefaultValue}", is invalid`
        );
        return;
    }

    let probabilityCorrect;

    try {
        probabilityCorrect = parseFloat(rawProbabilityCorrect);
    } catch (e) {
        console.error(
            `[ERR] The inputted probability correct, "${rawProbabilityCorrect}", is invalid`
        );
        return;
    }

    // File Paths
    const fullFilePath = path.join(QUESTIONS_PATH, inputFile);
    const targetFilePath = path.join(QUESTIONS_PATH, `${fileName}.json`);

    // Retrieving File Contents

    if (watchFile) {
        await exec("cls");
        console.log(`[LOG] Performing Initial Compilation`);
    }

    let contents;
    try {
        contents = await readFile(fullFilePath, { encoding: "utf-8" });
    } catch (e) {
        if (e.code === "ENOENT") {
            console.error(`[ERR] The file "${inputFile}" does not exist`);
            return;
        }
    }

    // Converting to JSON
    const JSONContents = convertTextToJSON(contents, {
        defaultValue,
        probabilityCorrect,
    });

    await writeFile(targetFilePath, JSON.stringify(JSONContents));

    console.log(`[LOG] File "${inputFile}" Successfully Compiled`);

    if (watchForFile) {
        // Watching File

        console.log(`[LOG] Watching "${fullFilePath}"`);

        watchFile(fullFilePath, async (curr, prev) => {
            // Clearing console
            await exec("cls");

            // Retrieving File Contents

            let contents;
            try {
                contents = await readFile(fullFilePath, { encoding: "utf-8" });
            } catch (e) {
                if (e.code === "ENOENT") {
                    console.error(
                        `[ERR] The file "${inputFile}" does not exist`
                    );
                    return;
                }
            }

            // Converting to JSON
            const JSONContents = convertTextToJSON(contents, {
                defaultValue,
                probabilityCorrect,
            });

            await writeFile(targetFilePath, JSON.stringify(JSONContents));

            console.log(`[LOG] File "${inputFile}" Successfully Compiled`);
        });
    }
})();
