// Importing Libraries
import http from "http";
import express from "express";
import { readFile } from "fs/promises";
import path from "path";

// Declaring Constants and Variables
const PORT = process.env.PORT || 6900;
const FILE_READ_OPTIONS_BASE = {
    root: "./",
};
type FileExtension = "html" | "css" | "js" | "json" | "png" | "jpg" | "jpeg";
type FileType = "text" | "image" | "application";
const QUESTIONS_PATH = path.join(".", "docs", "questions");

// Declaring Functions

// Setting up Express Server
const app = express();
const httpServer = http.createServer(app);

// Creating Server Routes
app.use(express.static("static"));

// app.get("/", async(req, res) => {
//     let fileId = req.query.id;
//     console.log(fileId);
//     try {
//         await readFile(path.join(QUESTIONS_PATH, `${fileId}.json`), { encoding: "utf-8" })
//     }
//     catch {
//         res.status(403).send(`Error: No such file ${fileId}.json. Please Check the Link that you have Inputted.`);
//         res.end();
//         return;
//     }

//     res.sendFile("./docs/index.html", { ...FILE_READ_OPTIONS_BASE, encoding: "utf-8", "content-type": "text/html"}, (err) => {
//         if(err) {
//             console.error(err);
//             console.trace();
//         }
//     });
// });

// app.get("/:fileName", (req, res) => {
//     let fileExtension: FileExtension = req.params.fileName.split(".").reverse()[0] as FileExtension;
//     res.sendFile(`./docs/${req.params.fileName}`, { ...FILE_READ_OPTIONS_BASE, encoding: "utf-8", "content-type": `${(
//         function(fileExtension): FileType {
//             switch(fileExtension) {
//                 default:
//                 case "css":
//                 case "html":
//                 case "js":
//                 case "json":
//                     return "text";
//                 case "png":
//                 case "jpg":
//                 case "jpeg":
//                     return "image";
//             }
//         }
//     )(fileExtension)}/${fileExtension}` }, (err) => {
//         if(err) {
//             console.error(err);
//             console.trace();
//         }
//     });
// })

// app.get("/:dir1/:fileName", (req, res) => {
//     let fileExtension: FileExtension = req.params.fileName.split(".").reverse()[0] as FileExtension;
//     res.sendFile(`./docs/${req.params.dir1}/${req.params.fileName}`, { ...FILE_READ_OPTIONS_BASE, encoding: "utf-8", "content-type": `${(
//         function(fileExtension): FileType {
//             switch(fileExtension) {
//                 default:
//                 case "css":
//                 case "html":
//                 case "js":
//                 case "json":
//                     return "text";
//                 case "png":
//                 case "jpg":
//                 case "jpeg":
//                     return "image";
//             }
//         }
//     )(fileExtension)}/${fileExtension}` }, (err) => {
//         if(err) {
//             console.error(err);
//             console.trace();
//         }
//     });
// })

// Listening to a port
httpServer.listen(PORT, () => {
    console.log(`http://127.0.0.1:${PORT}`);
});
