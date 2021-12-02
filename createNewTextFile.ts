import { readdir, writeFile } from "fs/promises";
import path from "path";

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

// Generating File Code
(async () => {
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
    let filesInDirectory = await readdir(QUESTIONS_PATH, { encoding: "utf-8" });

    let processedFileNames = filesInDirectory.map((i) => i.split(".")[0]);

    do {
        fileCode = [...Array(16)]
            .map((_) => pickRandomItem(validChars))
            .join("");
    } while (processedFileNames.includes(fileCode));

    await writeFile(path.join(QUESTIONS_PATH, `${fileCode}.txt`), "");

    console.log(`Created File with Code ${fileCode}`);
})();
