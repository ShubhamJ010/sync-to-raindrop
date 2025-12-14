import "dotenv/config";
import { syncGithubStars } from "./github.js";
import { syncTwitterBookmarks } from "./twitter.js";

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
