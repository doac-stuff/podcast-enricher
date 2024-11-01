import {
  backendUrl,
  extractAndRecentAverageViews,
  extractAppleReview,
  extractFromParentheses,
  extractLastPublishedDate,
  extractSpotifyReview,
  extractSubscriberCount,
  extractTotalVideos,
  extractTotalViews,
  extractYoutubeChannelHref,
  fetchHydratedHtmlContent,
  loadMeasurementState,
  parseReviewCount,
  prisma,
  saveMeasurementState,
} from "./utils";
import { searchSpotify } from "./api.spotify";
import { searchYouTube } from "./api.youtube";
import { Podcast } from "@prisma/client";
import {
  emptyEnriched as emptyPodcastEnriched,
  MeasurementState,
  PodcastEnriched,
  PodcastsEnrichedPayload,
} from "./model";
import { getLastEpisodeTitle } from "./api.podcastindex";

let measurementState: MeasurementState = {
  start: new Date(),
  count: 0,
  end: null,
};
export async function enrichPayload(
  podcasts: Podcast[]
): Promise<PodcastsEnrichedPayload> {
  console.log(`Enriching payload with ${podcasts.length} podcasts...`);
  const promises: Promise<any>[] = [];
  const payload: PodcastsEnrichedPayload = { items: [] };
  for (let i = 0; i < podcasts.length; i++) {
    const newReportRow = { ...emptyPodcastEnriched };
    const enrichRow = async () => {
      try {
        console.log(
          `Enriching podcast "${podcasts[i].title}" with popularity score = ${podcasts[i].popularityScore}`
        );
        await addBasicInfo(podcasts[i], newReportRow);
        //at least one enrichment must be successful to push the result
        let gotSpotify = await addSpotifyInfo(podcasts[i], newReportRow);
        let gotApple = await addAppleInfo(podcasts[i], newReportRow);
        let gotYoutube = await addYoutubeInfo(podcasts[i], newReportRow);
        if (gotSpotify || gotApple || gotYoutube) {
          payload.items.push(newReportRow);
          if (!measurementState.end) {
            measurementState = {
              ...measurementState,
              count: measurementState.count + 1,
            };
          }
        } else {
          console.log(
            `Error enriching podcast "${podcasts[i]?.title}". Skipping...`
          );
        }
      } catch (e: any) {
        console.log(
          `Error enriching podcast "${podcasts[i]?.title}". Skipping...`
        );
      }
    };
    promises.push(enrichRow());
  }
  await Promise.all(promises);
  saveMeasurementState(measurementState, "ms.json");
  return payload;
}

export async function postEnrichedPodcasts(payload: PodcastsEnrichedPayload) {
  let res = await fetch(`${backendUrl}/podcasts`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: [["Content-Type", "application/json"]],
  });
  if (res.ok) {
    console.log(
      `Posted ${
        payload.items.length
      } enriched podcasts. Result: ${await res.text()}`
    );
    return true;
  } else {
    console.log(
      `Failed to post ${
        payload.items.length
      } enriched podcast. Error: ${await res.text()}`
    );
    return false;
  }
}

async function filterUnseenPodcasts(podcasts: Podcast[]) {
  let res = await fetch(`${backendUrl}/enriched`, {
    method: "POST",
    body: JSON.stringify({ items: podcasts.map((podcast) => podcast.id) }),
    headers: [["Content-Type", "application/json"]],
  });
  const enrichedPodcasts: { items: number[]; error: string } = await res.json();
  if (enrichedPodcasts.error) {
    throw new Error(enrichedPodcasts.error);
  }
  return podcasts.filter(
    (podcast) => !enrichedPodcasts.items.includes(podcast.id)
  );
}

export async function enrichAll() {
  measurementState = await loadMeasurementState("ms.json");
  //be careful to ensure that the filters for this count are the same as the filters for the podcasts that get enriched
  const totalCount = await prisma.podcast.count({
    where: {
      dead: 0,
    },
  });

  let page = 0;
  const limit = 10000;
  let seenCount = 0;

  while (true) {
    try {
      const podcasts = await prisma.podcast.findMany({
        where: {
          dead: 0,
        },
        orderBy: [
          { popularityScore: "desc" },
          { newestItemPubdate: "desc" },
          { id: "asc" },
        ],
        skip: page * limit,
        take: limit,
      });
      console.log(
        `Started processing batch ${page + 1} with ${podcasts.length} items...`
      );
      if (podcasts.length == 0) {
        break;
      }
      const unseenPodcasts = await filterUnseenPodcasts(podcasts);
      console.log(
        `Found ${unseenPodcasts.length} unseen podcasts in this batch. Only unseen podcasts will be enriched and posted.`
      );
      const payloadSize = 4;
      for (let i = 0; i < Math.ceil(unseenPodcasts.length / payloadSize); i++) {
        const payload: typeof unseenPodcasts = [];
        for (let j = 0; j < payloadSize; j++) {
          const index = i * payloadSize + j;
          payload.push(unseenPodcasts[index]);
        }
        const enrichedPayload = await enrichPayload(payload);
        postEnrichedPodcasts(enrichedPayload); //not awaiting this to optimize for speed
      }
      console.log(
        `Finished processing batch ${page + 1} with ${podcasts.length} items`
      );
      seenCount = page * limit + podcasts.length;
      console.log(
        `Processed ${seenCount} podcasts so far out of ${totalCount}`
      );
      page++;
    } catch (e) {
      console.log(
        `An error occured. Stopped at batch ${page + 1}. Error: ${e}`
      );
      process.exit(1);
    }
  }

  console.log("All enrichments complete.");
}

async function addBasicInfo(podcast: Podcast, row: PodcastEnriched) {
  row.podcast_index_id = podcast.id;
  row.podcast_name = podcast.title ?? "";
  row.language = podcast.language ?? "";
  row.podcast_description = podcast.description ?? "";
  row.rss_feed_url = podcast.url ?? "";
  row.rss_categories = [
    podcast.category1,
    podcast.category2,
    podcast.category3,
    podcast.category4,
    podcast.category5,
    podcast.category6,
    podcast.category7,
    podcast.category8,
    podcast.category9,
    podcast.category10,
  ]
    .filter((category) => category && category.trim() !== "")
    .join(", ");
  row.rss_total_episodes = podcast.episodeCount ?? 0;
  row.host = podcast.host;
  row.author = podcast.itunesAuthor;
  row.owner = podcast.itunesOwnerName;
}

async function addSpotifyInfo(
  podcast: Podcast,
  row: PodcastEnriched
): Promise<boolean> {
  try {
    let searchResults = await searchSpotify(
      `${podcast.title} ${podcast.itunesAuthor}`
    );
    if (searchResults.shows.items.length < 1 && podcast.title) {
      // If there are no results on title + name, then the podcast is obscurely named and the title only should be unique enough to find it.
      searchResults = await searchSpotify(podcast.title);
    }
    for (let i = 0; i < searchResults.shows.items.length; i++) {
      const show = searchResults.shows.items[i];
      if (!show) continue;
      if (
        show.name.includes(podcast.title ?? "null%") ||
        podcast?.title?.includes(show.name)
      ) {
        console.log(
          `Found name title match on Spotify show "${show.name}". Adding corresponding Spotify info...`
        );
        row.spotify_url = show.external_urls.spotify;
        const html = await fetchHydratedHtmlContent(
          row.spotify_url,
          async (page) => {
            const reviewSelector =
              ".Type__TypeElement-sc-goli3j-0.dOtTDl.ret7iHkCxcJvsZU14oPY";
            await page.waitForSelector(reviewSelector, { visible: true });
          }
        );
        console.log(
          `Fetched Spotify html for "${podcast.title}". It has ${html.length} characters.`
        );
        const rating = extractSpotifyReview(html) ?? ["0", "0"];
        console.log(
          `Extracted Spotify rating ${rating} for "${podcast.title}".`
        );
        row.spotify_review_count = parseReviewCount(
          extractFromParentheses(rating[0] ?? "")
        );
        row.spotify_review_score = parseFloat(rating[1] ?? "0");
        return true;
      }
    }
    return false;
  } catch (e: any) {
    if (e?.response?.status === 429) {
      measurementState.end = new Date();
    }
    console.log(
      `Failed to add Spotify info to podcast "${podcast.title}". Error: ${e}`
    );
    return false;
  }
}

async function addAppleInfo(
  podcast: Podcast,
  row: PodcastEnriched
): Promise<boolean> {
  try {
    if (!podcast.itunesId) return false;
    const url = `https://podcasts.apple.com/podcast/id${podcast.itunesId}`;
    row.apple_podcast_url = url;
    const html = await fetchHydratedHtmlContent(url, async (page) => {
      const reviewSelector = "li.svelte-11a0tog";
      await page.waitForSelector(reviewSelector, { visible: true });
    });
    console.log(
      `Fetched Apple podcast html for ${podcast.title}. It has ${html.length} characters.`
    );
    const rating = extractAppleReview(html) ?? ["No Rating"];
    console.log(
      `Extracted Apple podcast rating ${rating} for ${podcast.title}.`
    );
    row.apple_review_count = parseReviewCount(
      extractFromParentheses(rating[0] ?? "")
    );
    row.apple_review_score = parseInt((rating[0] ?? "0").split("(")[0]);
    return true;
  } catch (e) {
    console.log(
      `Failed to add Apple info to podcast "${podcast.title}". Error: ${e}`
    );
    return false;
  }
}

async function addYoutubeInfo(
  podcast: Podcast,
  row: PodcastEnriched
): Promise<boolean> {
  try {
    const lastEpisodeTitle = await getLastEpisodeTitle(podcast.url);
    if (!lastEpisodeTitle) {
      throw new Error(
        `Failed to find an episode on podcast "${podcast.title}"`
      );
    }
    let searchResults = await searchYouTube(
      `${lastEpisodeTitle} ${podcast.title}`
    );
    if (!searchResults || !searchResults.items) {
      throw new Error(
        `Youtube search for episode "${lastEpisodeTitle}" on podcast "${podcast.title}"  failed`
      );
    }
    if (searchResults.items.length < 1) {
      // If there are no results on ep title + feed title, then the podcast is obscure and the ep title only should be unique enough to find it.
      searchResults = await searchYouTube(lastEpisodeTitle);
    }
    for (let i = 0; i < (searchResults.items?.length ?? 0); i++) {
      const result = searchResults.items[i];
      if (!result) continue;

      if (
        (result?.channelTitle?.includes(podcast.title ?? "null%") ||
          podcast?.title?.includes(result?.channelTitle ?? "null%")) &&
        (result?.title?.includes(lastEpisodeTitle) ||
          lastEpisodeTitle.includes(result?.title ?? "null%"))
      ) {
        console.log(
          `Found name title match on Youtube "${result?.channelTitle}". Adding corresponding Youtube info...`
        );
        let html = await fetchHydratedHtmlContent(
          `https://www.youtube.com/watch?v=${result?.id}`,
          async (page) => {
            const hrefSelector =
              "a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer";
            await page.waitForSelector(hrefSelector, { visible: true });
          }
        );
        row.youtube_channel_url = `https://www.youtube.com${extractYoutubeChannelHref(
          html
        )}`;
        //don't bother with the popup for now. we won't get total views but that is okay
        html = await fetchHydratedHtmlContent(
          row.youtube_channel_url,
          async (page) => {
            const detailsSelector =
              "span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text";
            await page.waitForSelector(detailsSelector, { visible: true });
          }
          //clickMoreButtonAndWaitForPopup
        );
        row.youtube_subscribers = extractSubscriberCount(html) ?? 0;
        const totalViews = extractTotalViews(html);
        const videoCount = extractTotalVideos(html);
        row.youtube_total_episodes = videoCount ?? 0;
        row.youtube_average_views =
          (totalViews ?? 0) / Math.max(videoCount ?? 0, 1);

        html = await fetchHydratedHtmlContent(
          `${row.youtube_channel_url}/videos`,
          async (page) => {
            const ravSelector =
              "span.inline-metadata-item.style-scope.ytd-video-meta-block";
            await page.waitForSelector(ravSelector, { visible: true });
          }
        );
        row.youtube_recent_average_views = extractAndRecentAverageViews(html);
        row.youtube_last_published_at =
          extractLastPublishedDate(html) ?? new Date("1970-01-01T00:00:00Z");

        console.log(
          `Extracted youtube channel url for ${result.channelTitle}, url: ${row.youtube_channel_url}, subscribers: ${row.youtube_subscribers}, total eps: ${videoCount}, total views: ${totalViews}, rav: ${row.youtube_recent_average_views}, lpd: ${row.youtube_last_published_at}`
        );

        return true;
      }
    }
    return true;
  } catch (e) {
    console.log(
      `Failed to add Youtube info to podcast "${podcast.title}". Error: ${e}`
    );
    return false;
  }
}
