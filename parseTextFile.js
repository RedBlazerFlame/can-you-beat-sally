var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { writeFile, readFile } from "fs/promises";
import { exec as execSync } from "node:child_process";
import { promisify } from "util";
import { watchFile } from "fs";
import path from "path";
import minimist from "minimist";
const exec = promisify(execSync);
// Declaring Constants and Variables
let fileCode = "";
let validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_".split("");
const QUESTIONS_PATH = path.join(".", "static", "questions");
// Declaring Functions
function pickRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}
/// Lexer
const TOKENS = ["Q# ", "I# ", "C# ", "A# ", "V# "];
function lexer(text) {
    const lines = text.split("\r\n");
    const semanticLines = lines.filter((line) => TOKENS.some((token) => line.startsWith(token)));
    const tokenizedLines = semanticLines.map((line) => {
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
function parser(lexemes) {
    const lexemesLength = lexemes.length;
    let semanticTokens = [];
    let currentLastLexeme = -1;
    for (let i = 0; i < lexemesLength; i++) {
        let currentLexeme = lexemes[i];
        switch (currentLexeme.token) {
            case "Q# ":
                {
                    semanticTokens.push({
                        question: currentLexeme,
                        choices: [],
                    });
                    currentLastLexeme++;
                }
                break;
            case "I# ":
                {
                    semanticTokens[currentLastLexeme].image = currentLexeme;
                }
                break;
            case "V# ":
                {
                    semanticTokens[currentLastLexeme].value = {
                        token: currentLexeme.token,
                        content: parseInt(currentLexeme.content),
                    };
                }
                break;
            case "A# ":
            case "C# ":
                {
                    semanticTokens[currentLastLexeme].choices.push(currentLexeme);
                }
                break;
        }
    }
    return semanticTokens;
}
function convertSemanticsToJSON(semantics, options = {}) {
    const { defaultValue = 1, probabilityCorrect = 0.8 } = options;
    const questions = [];
    const totalQuestions = semantics.length;
    for (let semanticUnit of semantics) {
        questions.push(Object.assign(Object.assign({ question: semanticUnit.question.content }, ((semanticUnit === null || semanticUnit === void 0 ? void 0 : semanticUnit.image) !== undefined
            ? { imageUrl: semanticUnit.image.content }
            : {})), { choices: semanticUnit.choices.map((choice) => choice.content), correctAnswer: semanticUnit.choices.reduce((acc, cur, index) => cur.token === "C# " ? index : acc, 0), value: (semanticUnit === null || semanticUnit === void 0 ? void 0 : semanticUnit.value) !== undefined
                ? semanticUnit.value.content
                : defaultValue, choiceProbabilities: semanticUnit.choices.map((choice) => choice.token === "C# "
                ? probabilityCorrect
                : (1 - probabilityCorrect) /
                    (semanticUnit.choices.length - 1)) }));
    }
    return questions;
}
function convertTextToJSON(text, semanticsToJSONOptions = {}) {
    // Tokenizing Contents
    const tokenizedContents = lexer(text);
    // Parsing Contents
    const parsedContents = parser(tokenizedContents);
    // Converting to JSON
    const JSONContents = convertSemanticsToJSON(parsedContents, semanticsToJSONOptions);
    return JSONContents;
}
// Type Guards
function valueIsUndefined(value) {
    return typeof value === "undefined";
}
const { "input-file": inputFile, "default-value": rawDefaultValue = "1", "probability-correct": rawProbabilityCorrect = "0.8", watch: watchForFile = false, } = minimist(process.argv.slice(2));
// Generating File Code
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Validating Inputs
    if (valueIsUndefined(inputFile)) {
        console.error(`[ERR] Input file path is undefined`);
        return;
    }
    const fileExtension = path.extname(inputFile);
    const fileName = path.basename(inputFile, fileExtension);
    if (fileExtension !== ".txt") {
        console.error(`[ERR] The file extension "${fileExtension}" is not recognized as a text file`);
        return;
    }
    let defaultValue;
    try {
        defaultValue = parseInt(rawDefaultValue);
    }
    catch (e) {
        console.error(`[ERR] The inputted default question value, "${rawDefaultValue}", is invalid`);
        return;
    }
    let probabilityCorrect;
    try {
        probabilityCorrect = parseFloat(rawProbabilityCorrect);
    }
    catch (e) {
        console.error(`[ERR] The inputted probability correct, "${rawProbabilityCorrect}", is invalid`);
        return;
    }
    // File Paths
    const fullFilePath = path.join(QUESTIONS_PATH, inputFile);
    const targetFilePath = path.join(QUESTIONS_PATH, `${fileName}.json`);
    // Retrieving File Contents
    if (watchFile) {
        yield exec("cls");
        console.log(`[LOG] Performing Initial Compilation`);
    }
    let contents;
    try {
        contents = yield readFile(fullFilePath, { encoding: "utf-8" });
    }
    catch (e) {
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
    yield writeFile(targetFilePath, JSON.stringify(JSONContents));
    console.log(`[LOG] File "${inputFile}" Successfully Compiled`);
    if (watchForFile) {
        // Watching File
        console.log(`[LOG] Watching "${fullFilePath}"`);
        watchFile(fullFilePath, (curr, prev) => __awaiter(void 0, void 0, void 0, function* () {
            // Clearing console
            yield exec("cls");
            // Retrieving File Contents
            let contents;
            try {
                contents = yield readFile(fullFilePath, { encoding: "utf-8" });
            }
            catch (e) {
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
            yield writeFile(targetFilePath, JSON.stringify(JSONContents));
            console.log(`[LOG] File "${inputFile}" Successfully Compiled`);
        }));
    }
}))();
