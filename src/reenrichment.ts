import { PodcastEnriched, PodcastsEnrichedPayload } from "./model";
import {
  backendToken,
  backendUrl,
  extractAppleLastEpisodeTitle,
  extractAppleReview,
  extractFromParentheses,
  fetchHydratedHtmlContentDirect,
  parseReviewCount,
  prisma,
} from "./utils";
import {
  addYoutubeInfo,
  enrichPayload,
  postEnrichedPodcasts,
} from "./enrichment";
import { getLastEpisodeTitle } from "./api.podcastindex";
import fs from "fs/promises";
import path from "path";

let isReEnriching = false;

export async function startReEnricher() {
  isReEnriching = true;
  try {
    while (true) {
      const res = await fetch(
        `${backendUrl}/api/podcasts/stale?page=${0}&limit=${1000}`,
        { headers: [["Authorization", `Bearer ${backendToken}`]] }
      );
      const stalePodcasts: { items: PodcastEnriched[]; count: number } =
        await res.json();

      if (!res.ok) {
        throw `status: ${res.status}, message: ${await res.text()}`;
      }

      // Extract podcast_index_ids from the received podcasts
      const podcastIndexIds = stalePodcasts.items
        .map((podcast) => podcast.podcast_index_id)
        .filter((id) => id !== null) as number[];

      // Fetch podcasts from the database using the extracted podcast_index_ids
      const podcastsToReEnrich = await prisma.podcast.findMany({
        where: {
          id: {
            in: podcastIndexIds,
          },
          dead: 0,
        },
      });

      if (podcastsToReEnrich.length === 0) {
        console.log("Re-enrichment process completed.");
        break;
      }

      console.log(
        `Re-enriching ${podcastsToReEnrich.length} podcasts out of ${stalePodcasts.count} stale podcasts left.`
      );

      const payloadSize = 4;
      const postPromises: Promise<any>[] = [];
      for (
        let i = 0;
        i < Math.ceil(podcastsToReEnrich.length / payloadSize);
        i++
      ) {
        const payload: typeof podcastsToReEnrich = [];
        for (let j = 0; j < payloadSize; j++) {
          const index = i * payloadSize + j;
          if (index >= podcastsToReEnrich.length) break;
          payload.push(podcastsToReEnrich[index]);
        }
        const enrichedPayload = await enrichPayload(payload);
        async function tryPost() {
          try {
            await postEnrichedPodcasts(enrichedPayload);
          } catch (e) {
            console.log(
              `Failed to post re-enriched: ${JSON.stringify(
                enrichedPayload
              )}. They will be retried. Error: ${e}`
            );
          }
        }
        postPromises.push(tryPost()); //delaying awaiting this to optimize for speed
      }

      await Promise.all(postPromises);
    }
  } catch (e) {
    console.log(`Re-enrichment exited with error: ${e}`);
  }
  isReEnriching = false;
}

export async function startYoutubeReEnricher() {
  isReEnriching = true;
  let currentPage = await loadYoutubePage();

  try {
    while (true) {
      const res = await fetch(
        `${backendUrl}/api/podcasts?page=${currentPage}&limit=${1000}`,
        { headers: [["Authorization", `Bearer ${backendToken}`]] }
      );

      if (!res.ok) {
        throw `status: ${res.status}, message: ${await res.text()}`;
      }

      const responseText = await res.text();
      if (responseText === "END") {
        // Reset page to 0 and save it
        currentPage = 0;
        await saveYoutubePage(currentPage);
        continue;
      }

      const stalePodcasts: { items: PodcastEnriched[]; count: number } =
        JSON.parse(responseText);

      const payloadSize = 4;
      const postPromises: Promise<any>[] = [];
      for (
        let i = 0;
        i < Math.ceil(stalePodcasts.items.length / payloadSize);
        i++
      ) {
        const payload: typeof stalePodcasts.items = [];
        for (let j = 0; j < payloadSize; j++) {
          const index = i * payloadSize + j;
          if (index >= stalePodcasts.items.length) break;
          payload.push(stalePodcasts.items[index]);
        }
        const enrichedPayload = await reEnrichPayloadYoutube(payload);
        async function tryPost() {
          try {
            await postEnrichedPodcasts(enrichedPayload);
          } catch (e) {
            console.log(
              `Failed to post youtube re-enriched: ${JSON.stringify(
                enrichedPayload
              )}`
            );
          }
        }
        postPromises.push(tryPost());
      }

      await Promise.all(postPromises);

      // Increment page and save it
      currentPage++;
      await saveYoutubePage(currentPage);
    }
  } catch (e) {
    console.log(`Youtube re-enrichment exited with error: ${e}`);
  }
  isReEnriching = false;
}

export async function reEnrichPayloadYoutube(
  podcasts: PodcastEnriched[]
): Promise<PodcastsEnrichedPayload> {
  console.log(
    `Re-enriching (Youtube) payload with ${podcasts.length} podcasts...`
  );
  const promises: Promise<any>[] = [];
  const payload: PodcastsEnrichedPayload = { items: [] };
  for (let i = 0; i < podcasts.length; i++) {
    const reportRow = { ...podcasts[i] };
    const enrichRow = async () => {
      try {
        console.log(
          `Re-enriching (Youtube) podcast "${podcasts[i].podcast_name}" with Youtube channel = ${podcasts[i].youtube_channel_url}`
        );
        //at least one enrichment must be successful to push the result
        let { result: gotApple, epTitle } = await refreshAppleInfo(
          podcasts[i].rss_feed_url ?? "",
          podcasts[i].podcast_name ?? "",
          reportRow
        );
        if (!epTitle) {
          console.log(
            `Did not get last episode title from podcast ${podcasts[i].podcast_name}. Trying RSS feed at ${podcasts[i].rss_feed_url}...`
          );
          epTitle = await getLastEpisodeTitle(podcasts[i].rss_feed_url ?? "");
        }
        if (!epTitle || epTitle === "") {
          throw new Error(
            `Failed to find an episode on podcast "${podcasts[i].podcast_name}. Will skip."`
          );
        }
        let gotYoutube = await addYoutubeInfo(
          { title: podcasts[i].podcast_name ?? "" },
          reportRow,
          epTitle
        );
        if (gotApple || gotYoutube) {
          payload.items.push(reportRow);
        } else {
          console.log(
            `Error enriching podcast "${podcasts[i]?.podcast_name}". Skipping...`
          );
        }
      } catch (e: any) {
        console.log(
          `Error enriching podcast "${podcasts[i]?.podcast_name}". Skipping...`
        );
      }
    };
    promises.push(enrichRow());
  }
  await Promise.all(promises);
  return payload;
}

async function refreshAppleInfo(
  url: string,
  podcastTitle: string,
  row: PodcastEnriched
): Promise<{ result: boolean; epTitle: string | null }> {
  let result = false;
  try {
    row.apple_podcast_url = url;
    const html = await fetchHydratedHtmlContentDirect(url, async (page) => {
      const reviewSelector = "li.svelte-123qhuj";
      await page.waitForSelector(reviewSelector, {
        visible: true,
        timeout: 15000,
      });
      try {
        const epTitleSelector = ".episode-details__title-text";
        await page.waitForSelector(epTitleSelector, {
          visible: true,
          timeout: 1000, //already waited 15 seconds, this should already be on the page if it is available
        });
      } catch (e) {
        console.log(
          `Failed to get episode title for "${podcastTitle}" from Apple podcast. Will try RSS...`
        );
      }
    });
    console.log(
      `Fetched Apple podcast html for ${podcastTitle}. It has ${html.length} characters.`
    );
    const rating = extractAppleReview(html) ?? ["No Rating"];
    const epTitle = extractAppleLastEpisodeTitle(html);
    console.log(
      `Extracted Apple podcast rating ${rating} for ${podcastTitle}.`
    );
    console.log(
      `Extracted last episode title "${epTitle}" for podcast "${podcastTitle}".`
    );
    row.apple_review_count = parseReviewCount(
      extractFromParentheses(rating[0] ?? "")
    );
    row.apple_review_score = parseInt((rating[0] ?? "0").split("(")[0]);
    return { result, epTitle: epTitle };
  } catch (e) {
    console.log(
      `Failed to add Apple info to podcast "${podcastTitle}". Error: ${e}`
    );
    if (`${e}`.toLowerCase().includes("protocol error")) {
      console.log(
        "Protocol error is most likely caused by a browser crash. Exiting app..."
      );
      process.exit(1);
    }
    return { result, epTitle: null };
  }
}

export function getIsReEnriching() {
  return isReEnriching;
}

const YT_PAGE_FILE = "yt_page.json";

async function saveYoutubePage(page: number) {
  try {
    await fs.writeFile(YT_PAGE_FILE, JSON.stringify({ page }));
  } catch (e) {
    console.log(`Failed to save Youtube page: ${e}`);
  }
}

async function loadYoutubePage(): Promise<number> {
  try {
    const data = await fs.readFile(YT_PAGE_FILE, "utf-8");
    return JSON.parse(data).page;
  } catch (e) {
    // If file doesn't exist or is invalid, start from page 0
    return 0;
  }
}
