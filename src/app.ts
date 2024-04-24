/** server handling **/
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

/** cron job **/
import * as cron from "node-cron";

/** file handling **/
import * as fs from "fs";

const SmeeClient = require("smee-client");

const smee = new SmeeClient({
    source: "https://smee.io/5t2udrZIR6gmuM",
    target: "http://localhost:3000/events/slo_beaver",
    logger: console,
});

const events = smee.start();
const { App } = require("@slack/bolt");
const message: string = "A new branch has been merged to main, run \`git pull origin main\` to update your local repository.\nUpdates:\n"

dotenv.config();

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

const app: Express = express();
const port = process.env.PORT || 3000;

async function executeLogMessage() {


    // Read the file and send the message
    fs.readFile("mainLog.txt", "utf-8", async (err, data) => {
        if (err){
			console.log("error");
		}
		else{
            let slack_webhook = null
            if (process.env.DEV_MODE = "true"){
                slack_webhook = process.env.DEV_URL
            }
            else{
                slack_webhook = process.env.PROD_URL
            }
			if (slack_webhook) {
			    console.log("Sending message to slack");
			    const res = await fetch(slack_webhook, {
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
			    } else {
				console.log("message failed");
			    }
			}
		}
    });
}

// schedule job
cron.schedule("* * * * *", async () => {
    await executeLogMessage();
});


app.get("/", (req: Request, resp: Response) => {
    resp.send("<p>Hi There!</p>");
});

/** process any teams webhook */
app.post(
    "/events/slo_beaver",
    express.json({ type: "application/json" }),
    async (req: Request, resp: Response) => {
        /** return accepted response */
        resp.status(200).send("Accepted");

        /** get type of event and body */
        const body = req.body;
        const header = req.headers;
        console.log(body, header);

	/** log all data passed **/
	try{
		fs.writeFileSync("log.txt", `Header: \n ${JSON.stringify(header)}\nBody:\n${JSON.stringify(body)}`, {flag: 'a'});
		console.log("logged data");
	}
	catch (err){
		console.log(err);
	}
        /** parse data and act accordingly */
        /** send message on slack */
        if (header["x-github-event"] === "pull_request") {
            /** access slack API and send message to tech leads */
        } else if (header["x-github-event"] === "push") {
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
                    await executeLogMessage();
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }
);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
