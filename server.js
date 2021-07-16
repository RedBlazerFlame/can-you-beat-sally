var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Importing Libraries
import http from "http";
import express from "express";
import { readFile } from "fs/promises";
import path from "path";
// Declaring Constants and Variables
const PORT = process.env.PORT || 6900;
const FILE_READ_OPTIONS_BASE = {
    root: "./"
};
const QUESTIONS_PATH = path.join(".", "docs", "questions");
// Declaring Functions
// Setting up Express Server
const app = express();
const httpServer = http.createServer(app);
// Creating Server Routes
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let fileId = req.query.id;
    console.log(fileId);
    try {
        yield readFile(path.join(QUESTIONS_PATH, `${fileId}.json`), { encoding: "utf-8" });
    }
    catch (_a) {
        res.status(403).send(`Error: No such file ${fileId}.json. Please Check the Link that you have Inputted.`);
        res.end();
        return;
    }
    res.sendFile("./docs/index.html", Object.assign(Object.assign({}, FILE_READ_OPTIONS_BASE), { encoding: "utf-8", "content-type": "text/html" }), (err) => {
        if (err) {
            console.error(err);
            console.trace();
        }
    });
}));
app.get("/:fileName", (req, res) => {
    let fileExtension = req.params.fileName.split(".").reverse()[0];
    res.sendFile(`./docs/${req.params.fileName}`, Object.assign(Object.assign({}, FILE_READ_OPTIONS_BASE), { encoding: "utf-8", "content-type": `${(function (fileExtension) {
            switch (fileExtension) {
                default:
                case "css":
                case "html":
                case "js":
                case "json":
                    return "text";
                case "png":
                case "jpg":
                case "jpeg":
                    return "image";
            }
        })(fileExtension)}/${fileExtension}` }), (err) => {
        if (err) {
            console.error(err);
            console.trace();
        }
    });
});
app.get("/:dir1/:fileName", (req, res) => {
    let fileExtension = req.params.fileName.split(".").reverse()[0];
    res.sendFile(`./docs/${req.params.dir1}/${req.params.fileName}`, Object.assign(Object.assign({}, FILE_READ_OPTIONS_BASE), { encoding: "utf-8", "content-type": `${(function (fileExtension) {
            switch (fileExtension) {
                default:
                case "css":
                case "html":
                case "js":
                case "json":
                    return "text";
                case "png":
                case "jpg":
                case "jpeg":
                    return "image";
            }
        })(fileExtension)}/${fileExtension}` }), (err) => {
        if (err) {
            console.error(err);
            console.trace();
        }
    });
});
// Listening to a port
httpServer.listen(PORT, () => {
    console.log(`http://127.0.0.1:${PORT}`);
});
