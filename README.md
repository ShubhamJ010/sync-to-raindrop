# Starry Raindrop: Sync GitHub stars & Twitter Bookmarks to Raindrop.io

Based off [azedo/raindrop-io-github-starred-repos](https://github.com/azedo/raindrop-io-github-starred-repos/)

## Features
- Syncs GitHub Starred Repositories to a Raindrop Collection.
- Syncs Twitter Bookmarks (from CSV) to a Raindrop Collection.
- Handles duplicate detection.
- Marks items as "Removed" in Raindrop if they are removed from the source (Twitter CSV).

# Requirements

- Node 18+

# Environment variables

- `GH_TOKEN` = a GitHub token with the `read:user` scope
  - See <https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token>
- `RAINDROP_TOKEN` = a Raindrop.io API token
  1.  Go to -> <https://app.raindrop.io/settings/integrations>
  2.  Then click `+ Create a new app` under the `For Developers` section
  3.  Now, click on the name of your newly generated app and then click in `Create test token`
  4.  Grab that token

## Collection IDs
You need to provide the Collection ID for where you want to store the items.
1.  Open the Raindrop.io app in a browser, browse to the collection you want to use and grab its id from the URL
2.  `https://app.raindrop.io/my/26677018` -> `26677018` is the collection ID

- `RAINDROP_GITHUB_COLLECTION_ID` = Collection ID for GitHub Stars
- `RAINDROP_TWITTER_COLLECTION_ID` = Collection ID for Twitter Bookmarks

# Twitter Sync Setup

1. Place your Twitter Bookmarks CSV file in the root directory.
   - The file must be named `twitter-Bookmarks-<timestamp>.csv` (e.g., `twitter-Bookmarks-1765735080303.csv`).
   - **Tip**: You can use [twitter-web-exporter](https://github.com/prinsss/twitter-web-exporter) userscript to export your bookmarks to CSV without using the X API.
2. The script will automatically pick up this file and sync it.

# Running (self-hosted)

1. Copy and rename the `.env.example` to `.env`
2. Paste in the token values and collection IDs you generated before
3. Run `npm run build` and then:
   - `npm run cron` for hourly runs
   - `npm start` for a single run

# Running (self-hosted with Docker)

1. Copy and rename the `.env.example` to `.env`
2. Paste in the token values you generated before
3. Run `docker compose up -d`

# Running (GitHub Actions)

1. Fork this repository
2. Set up the following secrets in your GitHub repository settings:
   - `GH_TOKEN`
   - `RAINDROP_TOKEN`
   - `RAINDROP_GITHUB_COLLECTION_ID`
   - `RAINDROP_TWITTER_COLLECTION_ID`
3. Commit your `twitter-Bookmarks-*.csv` file to the root of the repository.
4. The workflow will run every hour, or you can trigger it manually.
