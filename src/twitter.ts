
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import _ from "lodash";
import { raindropAxios } from "./raindrop-client.js";

const COLLECTION_ID = process.env.RAINDROP_TWITTER_COLLECTION_ID;
const CSV_PREFIX = "twitter-Bookmarks-";

interface TwitterBookmark {
  id: string;
  created_at: string;
  full_text: string;
  media: string;
  screen_name: string;
  name: string;
  profile_image_url: string;
  user_id: string;
  in_reply_to: string;
  retweeted_status: string;
  quoted_status: string;
  media_tags: string;
  favorite_count: string;
  retweet_count: string;
  bookmark_count: string;
  quote_count: string;
  reply_count: string;
  views_count: string;
  favorited: string;
  retweeted: string;
  bookmarked: string;
  url: string;
}

export const syncTwitterBookmarks = async () => {
    // 1. Find CSV file
    const files = fs.readdirSync(".");
    const csvFile = files.find(f => f.startsWith(CSV_PREFIX) && f.endsWith(".csv"));

    if (!csvFile) {
        console.log(new Date(), "No Twitter bookmark CSV found.");
        return;
    }

    console.log(new Date(), `Found CSV file: ${csvFile}`);
    
    // Extract timestamp from filename: twitter-Bookmarks-1765735080303.csv
    const timestampMatch = csvFile.match(/twitter-Bookmarks-(\d+)\.csv/);
    if (!timestampMatch) {
         console.error(new Date(), "Could not parse timestamp from filename.");
         return;
    }
    const fileTimestamp = parseInt(timestampMatch[1]);
    const readableDate = new Date(fileTimestamp).toLocaleString();

    // 2. Parse CSV
    const csvContent = fs.readFileSync(csvFile, "utf-8");
    const bookmarks: TwitterBookmark[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
    });

    console.log(new Date(), `Parsed ${bookmarks.length} bookmarks from CSV.`);

    // 3. Process Raindrops
    // We need to:
    // a. Add new items (checking duplicates)
    // b. Find items in Raindrop that are NOT in CSV -> Update note

    // Implementation Detail: 
    // For (a), we can use /import/url/exists for efficiency.
    // For (b), we MUST fetch all existing Raindrops in this collection.
    
    console.log(new Date(), "Fetching existing Raindrops...");
    let allRaindrops: any[] = [];
    let page = 0;
    while(true) {
        const res = await raindropAxios.get(`/raindrops/${COLLECTION_ID}`, {
            params: {
                page,
                perpage: 50, // Max is 50 usually
                search: JSON.stringify([{key: 'tag', val: 'twitter-bookmark'}]) // Only fetch our managed items to be safe? 
                // Wait, if we only fetch tagged ones, we might miss duplicates if they weren't tagged before?
                // But generally we only want to manage "removed" status for items WE synced.
                // User said: "if some bookmark is removed from the source (csv) update the note"
                // This implies we should track items that match the CSV content. 
            }
        });
        
        const items = res.data.items;
        if (items.length === 0) break;
        allRaindrops = [...allRaindrops, ...items];
        page++;
    }
    console.log(new Date(), `Fetched ${allRaindrops.length} existing Raindrops in collection.`);

    // 3a. Add New
    const chunks = _.chunk(bookmarks, 100);
    console.log(new Date(), `Processing ${chunks.length} chunks for addition...`);
    
    for (const chunk of chunks) {
        // Prepare Raindrop items
        const raindropsToAdd = chunk.map(bm => ({
            collectionId: COLLECTION_ID,
            title: `${bm.name} (@${bm.screen_name}): ${bm.full_text.substring(0, 50)}...`,
            link: bm.url,
            created: new Date(bm.created_at).toISOString(),
            excerpt: bm.full_text,
            tags: ["twitter-bookmark", "twitter", bm.screen_name],
            type: "link"
        }));

        // Check duplicates
        const existingUrlsRes = await raindropAxios.post("/import/url/exists", {
            urls: raindropsToAdd.map(r => r.link)
        });
        const existingResult = existingUrlsRes.data; // { result: boolean, duplicates: [] }
    
        // Filter out duplicates
        const toImport = raindropsToAdd.filter(r => {
             return !existingResult.duplicates.some((d: any) => d.link === r.link);
        });

        if (toImport.length > 0) {
            await raindropAxios.post("/raindrops", { items: toImport });
            console.log(new Date(), `Added ${toImport.length} bookmarks.`);
        } else {
             console.log(new Date(), `Chunk skipped (all duplicates).`);
        }
    }

    // 3b. Handle Removed
    // Identify items in allRaindrops that are NOT in bookmarks (CSV)
    // We match by URL (link)
    const csvUrls = new Set(bookmarks.map(b => b.url));
    
    const removedItems = allRaindrops.filter(r => !csvUrls.has(r.link));
    
    if (removedItems.length > 0) {
        console.log(new Date(), `Found ${removedItems.length} items removed from source.`);
        
        // Update them
        // Raindrop API allows single update or batch? 
        // /raindrop/{id} PUT
        // Batch update is /raindrops PUT (collectionId, etc) but maybe not arbitrary fields per item?
        // Let's do one by one or check batch docs.
        // Batch update usually updates ALL to same value. We want to append note? 
        // Or just set note if empty? 
        // "update the note ... "Removed from Bookmark {timestamp|readable}""
        
        // We will process sequentially to be safe.
        for (const item of removedItems) {
            // Check if note already contains the specific removal message to avoid re-updating?
            // "Removed from Bookmark"
            if (item.note && item.note.includes("Removed from Bookmark")) {
                continue; 
            }
            
            const newNote = item.note ? `${item.note}\n\nRemoved from Bookmark ${readableDate}` : `Removed from Bookmark ${readableDate}`;
            
            try {
                await raindropAxios.put(`/raindrop/${item._id}`, {
                    note: newNote
                });
                console.log(new Date(), `Updated note for ${item._id} (Removed).`);
            } catch (e) {
                console.error(new Date(), `Failed to update ${item._id}`, e);
            }
        }
    } else {
        console.log(new Date(), "No items detected as removed.");
    }
    
    console.log(new Date(), "Twitter Sync Complete.");
};
