"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** server handling **/
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
/** cron job **/
const cron = __importStar(require("node-cron"));
/** file handling **/
const fs = __importStar(require("fs"));
const SmeeClient = require("smee-client");
const smee = new SmeeClient({
    source: "https://smee.io/5t2udrZIR6gmuM",
    target: "http://localhost:3000/events/slo_beaver",
    logger: console,
});
const events = smee.start();
const { App } = require("@slack/bolt");
const message = "A new branch has been merged to main, run \`git pull origin main\` to update your local repository.\nUpdates:\n";
dotenv_1.default.config();
/**
// Initializes your app with your bot token and signing secret
const slack_app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
    // Start your app
    await slack_app.start(process.env.SLACK_PORT || 4000);

    console.log("⚡️ Bolt app is running!");
})();
**/
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
function executeLogMessage() {
    return __awaiter(this, void 0, void 0, function* () {
        // Read the file and send the message
        fs.readFile("mainLog.txt", "utf-8", (err, data) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                console.log("error");
            }
            else {
                if (process.env.SLACK_WEBHOOK_URL) {
                    console.log("Sending message to slack");
                    const res = yield fetch(process.env.SLACK_WEBHOOK_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            text: (message + data),
                        }),
                    });
                    if (res.ok) {
                        console.log("message sent");
                    }
                    else {
                        console.log("message failed");
                    }
                }
            }
        }));
    });
}
// schedule job
cron.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    yield executeLogMessage();
}));
app.get("/", (req, resp) => {
    resp.send("<p>Hi There!</p>");
});
/** process any teams webhook */
app.post("/events/slo_beaver", express_1.default.json({ type: "application/json" }), (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    /** return accepted response */
    resp.status(200).send("Accepted");
    /** get type of event and body */
    const body = req.body;
    const header = req.headers;
    console.log(body, header);
    /** log all data passed **/
    try {
        fs.writeFileSync("log.txt", `Header: \n ${JSON.stringify(header)}\nBody:\n${JSON.stringify(body)}`, { flag: 'a' });
        console.log("logged data");
    }
    catch (err) {
        console.log(err);
    }
    /** parse data and act accordingly */
    /** send message on slack */
    if (header["x-github-event"] === "pull_request") {
        /** access slack API and send message to tech leads */
    }
    else if (header["x-github-event"] === "push") {
        /** access slack API and alert everyone, saying to merge */
        /** TODO: create a list of pending merges, only
         *  alert once a day using cronjob
         */
        /** check if branch is main */
        console.log("ref: ", body.ref);
        if (body.ref === "refs/heads/main") {
            console.log(process.env.SLACK_WEBHOOK_URL);
            try {
                fs.appendFileSync("mainLog.txt", body.message);
                console.log("Logged data");
                yield executeLogMessage();
            }
            catch (err) {
                console.log(err);
            }
        }
    }
}));
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
