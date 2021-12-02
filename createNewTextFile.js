var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { readdir, writeFile } from "fs/promises";
import path from "path";
// Declaring Constants and Variables
let fileCode = "";
let validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_".split("");
const QUESTIONS_PATH = path.join(".", "static", "questions");
// Declaring Functions
function pickRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}
// Generating File Code
(() => __awaiter(void 0, void 0, void 0, function* () {
    // let filesInDirectory = await (async function(): Promise<Array<string>>{
    //     return new Promise((resolve) => {
    //         readdir(QUESTIONS_PATH, function(err, files) {
    //             if(err) {
    //                 throw err;
    //             } else {
    //                 resolve(files)
    //             }
    //         })
    //     });
    // })();
    let filesInDirectory = yield readdir(QUESTIONS_PATH, { encoding: "utf-8" });
    let processedFileNames = filesInDirectory.map((i) => i.split(".")[0]);
    do {
        fileCode = [...Array(16)]
            .map((_) => pickRandomItem(validChars))
            .join("");
    } while (processedFileNames.includes(fileCode));
    yield writeFile(path.join(QUESTIONS_PATH, `${fileCode}.txt`), "");
    console.log(`Created File with Code ${fileCode}`);
}))();
