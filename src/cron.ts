import "dotenv/config";
import { CronJob } from "cron";
import { syncGithubStars } from "./github.js";
import { syncTwitterBookmarks } from "./twitter.js";

console.log("Starting cron");
new CronJob("0 * * * *", async () => {
  try {
    await syncGithubStars();
  } catch (e) {
    console.error("GitHub sync failed:", e);
  }
  try {
    await syncTwitterBookmarks();
  } catch (e) {
    console.error("Twitter sync failed:", e);
  }
}).start();
