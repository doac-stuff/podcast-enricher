"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichPayload = enrichPayload;
exports.postEnrichedPodcasts = postEnrichedPodcasts;
exports.enrichAll = enrichAll;
const utils_1 = require("./utils");
const api_spotify_1 = require("./api.spotify");
const api_youtube_1 = require("./api.youtube");
const model_1 = require("./model");
const api_podcastindex_1 = require("./api.podcastindex");
function enrichPayload(podcasts) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Enriching payload with ${podcasts.length} podcasts...`);
        const promises = [];
        const payload = { items: [] };
        for (let i = 0; i < podcasts.length; i++) {
            const newReportRow = Object.assign({}, model_1.emptyEnriched);
            const enrichRow = () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    console.log(`Enriching podcast "${podcasts[i].title}" with popularity score = ${podcasts[i].popularityScore}`);
                    yield addBasicInfo(podcasts[i], newReportRow);
                    //at least one enrichment must be successful to push the result
                    let gotSpotify = yield addSpotifyInfo(podcasts[i], newReportRow);
                    let gotApple = yield addAppleInfo(podcasts[i], newReportRow);
                    let gotYoutube = yield addYoutubeInfo(podcasts[i], newReportRow);
                    if (gotSpotify || gotApple || gotYoutube) {
                        payload.items.push(newReportRow);
                    }
                    else {
                        console.log(`Error enriching podcast "${(_a = podcasts[i]) === null || _a === void 0 ? void 0 : _a.title}". Skipping...`);
                    }
                }
                catch (e) {
                    console.log(`Error enriching podcast "${(_b = podcasts[i]) === null || _b === void 0 ? void 0 : _b.title}". Skipping...`);
                }
            });
            promises.push(enrichRow());
        }
        yield Promise.all(promises);
        return payload;
    });
}
function postEnrichedPodcasts(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch(`${utils_1.backendUrl}/podcasts`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: [["Content-Type", "application/json"]],
        });
        if (res.ok) {
            console.log(`Posted ${payload.items.length} enriched podcasts. Result: ${yield res.text()}`);
            return true;
        }
        else {
            console.log(`Failed to post ${payload.items.length} enriched podcast. Error: ${yield res.text()}`);
            return false;
        }
    });
}
function filterUnseenPodcasts(podcasts) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield fetch(`${utils_1.backendUrl}/enriched`, {
            method: "POST",
            body: JSON.stringify({ items: podcasts.map((podcast) => podcast.id) }),
            headers: [["Content-Type", "application/json"]],
        });
        const enrichedPodcasts = yield res.json();
        if (enrichedPodcasts.error) {
            throw new Error(enrichedPodcasts.error);
        }
        return podcasts.filter((podcast) => !enrichedPodcasts.items.includes(podcast.id));
    });
}
function enrichAll() {
    return __awaiter(this, void 0, void 0, function* () {
        //be careful to ensure that the filters for this count are the same as the filters for the podcasts that get enriched
        const totalCount = yield utils_1.prisma.podcast.count({
            where: {
                dead: 0,
            },
        });
        let page = 0;
        const limit = 10000;
        let seenCount = 0;
        while (true) {
            try {
                const podcasts = yield utils_1.prisma.podcast.findMany({
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
                console.log(`Started processing batch ${page + 1} with ${podcasts.length} items...`);
                if (podcasts.length == 0) {
                    break;
                }
                const unseenPodcasts = yield filterUnseenPodcasts(podcasts);
                console.log(`Found ${unseenPodcasts.length} unseen podcasts in this batch. Only unseen podcasts will be enriched and posted.`);
                const payloadSize = 4;
                for (let i = 0; i < Math.ceil(unseenPodcasts.length / payloadSize); i++) {
                    const payload = [];
                    for (let j = 0; j < payloadSize; j++) {
                        const index = i * payloadSize + j;
                        payload.push(unseenPodcasts[index]);
                    }
                    const enrichedPayload = yield enrichPayload(payload);
                    postEnrichedPodcasts(enrichedPayload); //not awaiting this to optimize for speed
                }
                console.log(`Finished processing batch ${page + 1} with ${podcasts.length} items`);
                seenCount = page * limit + podcasts.length;
                console.log(`Processed ${seenCount} podcasts so far out of ${totalCount}`);
                page++;
                yield (0, utils_1.closeBrowser)();
            }
            catch (e) {
                console.log(`An error occured. Stopped at batch ${page + 1}. Error: ${e}`);
                process.exit(1);
            }
        }
        console.log("All enrichments complete.");
    });
}
function addBasicInfo(podcast, row) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        row.podcast_index_id = podcast.id;
        row.podcast_name = (_a = podcast.title) !== null && _a !== void 0 ? _a : "";
        row.language = (_b = podcast.language) !== null && _b !== void 0 ? _b : "";
        row.podcast_description = (_c = podcast.description) !== null && _c !== void 0 ? _c : "";
        row.rss_feed_url = (_d = podcast.url) !== null && _d !== void 0 ? _d : "";
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
        row.rss_total_episodes = (_e = podcast.episodeCount) !== null && _e !== void 0 ? _e : 0;
        row.host = podcast.host;
        row.author = podcast.itunesAuthor;
        row.owner = podcast.itunesOwnerName;
    });
}
function addSpotifyInfo(podcast, row) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            let searchResults = yield (0, api_spotify_1.searchSpotify)(`${podcast.title} ${podcast.itunesAuthor}`);
            if (searchResults.shows.items.length < 1 && podcast.title) {
                // If there are no results on title + name, then the podcast is obscurely named and the title only should be unique enough to find it.
                searchResults = yield (0, api_spotify_1.searchSpotify)(podcast.title);
            }
            for (let i = 0; i < searchResults.shows.items.length; i++) {
                const show = searchResults.shows.items[i];
                if (!show)
                    continue;
                if (show.name.includes((_a = podcast.title) !== null && _a !== void 0 ? _a : "null%") ||
                    ((_b = podcast === null || podcast === void 0 ? void 0 : podcast.title) === null || _b === void 0 ? void 0 : _b.includes(show.name))) {
                    console.log(`Found name title match on Spotify show "${show.name}". Adding corresponding Spotify info...`);
                    row.spotify_url = show.external_urls.spotify;
                    const html = yield (0, utils_1.fetchHydratedHtmlContent)(row.spotify_url);
                    console.log(`Fetched Spotify html for "${podcast.title}". It has ${html.length} characters.`);
                    const rating = (_c = (0, utils_1.extractSpotifyReview)(html)) !== null && _c !== void 0 ? _c : ["0", "0"];
                    console.log(`Extracted Spotify rating ${rating} for "${podcast.title}".`);
                    row.spotify_review_count = (0, utils_1.parseReviewCount)((0, utils_1.extractFromParentheses)((_d = rating[0]) !== null && _d !== void 0 ? _d : ""));
                    row.spotify_review_score = parseFloat((_e = rating[1]) !== null && _e !== void 0 ? _e : "0");
                    return true;
                }
            }
            return false;
        }
        catch (e) {
            console.log(`Failed to add Spotify info to podcast "${podcast.title}". Error: ${e}`);
            return false;
        }
    });
}
function addAppleInfo(podcast, row) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            if (!podcast.itunesId)
                return false;
            const url = `https://podcasts.apple.com/podcast/id${podcast.itunesId}`;
            row.apple_podcast_url = url;
            const html = yield (0, utils_1.fetchHydratedHtmlContent)(url);
            console.log(`Fetched Apple podcast html for ${podcast.title}. It has ${html.length} characters.`);
            const rating = (_a = (0, utils_1.extractAppleReview)(html)) !== null && _a !== void 0 ? _a : ["No Rating"];
            console.log(`Extracted Apple podcast rating ${rating} for ${podcast.title}.`);
            row.apple_review_count = (0, utils_1.parseReviewCount)((0, utils_1.extractFromParentheses)((_b = rating[0]) !== null && _b !== void 0 ? _b : ""));
            row.apple_review_score = parseInt(((_c = rating[0]) !== null && _c !== void 0 ? _c : "0").split("(")[0]);
            return true;
        }
        catch (e) {
            console.log(`Failed to add Apple info to podcast "${podcast.title}". Error: ${e}`);
            return false;
        }
    });
}
function addYoutubeInfo(podcast, row) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        try {
            const lastEpisodeTitle = yield (0, api_podcastindex_1.getLastEpisodeTitle)(podcast.url);
            if (!lastEpisodeTitle) {
                throw new Error(`Failed to find an episode on podcast "${podcast.title}"`);
            }
            let searchResults = yield (0, api_youtube_1.searchYouTube)(`${lastEpisodeTitle} ${podcast.title}`);
            if (!searchResults || !searchResults.items) {
                throw new Error(`Youtube search for episode "${lastEpisodeTitle}" on podcast "${podcast.title}"  failed`);
            }
            if (searchResults.items.length < 1) {
                // If there are no results on ep title + feed title, then the podcast is obscure and the ep title only should be unique enough to find it.
                searchResults = yield (0, api_youtube_1.searchYouTube)(lastEpisodeTitle);
            }
            for (let i = 0; i < ((_b = (_a = searchResults.items) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0); i++) {
                const result = searchResults.items[i];
                if (!result)
                    continue;
                if ((((_c = result === null || result === void 0 ? void 0 : result.channelTitle) === null || _c === void 0 ? void 0 : _c.includes((_d = podcast.title) !== null && _d !== void 0 ? _d : "null%")) ||
                    ((_e = podcast === null || podcast === void 0 ? void 0 : podcast.title) === null || _e === void 0 ? void 0 : _e.includes((_f = result === null || result === void 0 ? void 0 : result.channelTitle) !== null && _f !== void 0 ? _f : "null%"))) &&
                    (((_g = result === null || result === void 0 ? void 0 : result.title) === null || _g === void 0 ? void 0 : _g.includes(lastEpisodeTitle)) ||
                        lastEpisodeTitle.includes((_h = result === null || result === void 0 ? void 0 : result.title) !== null && _h !== void 0 ? _h : "null%"))) {
                    console.log(`Found name title match on Youtube "${result === null || result === void 0 ? void 0 : result.channelTitle}". Adding corresponding Youtube info...`);
                    let html = yield (0, utils_1.fetchHydratedHtmlContent)(`https://www.youtube.com/watch?v=${result === null || result === void 0 ? void 0 : result.id}`);
                    row.youtube_channel_url = `https://www.youtube.com${(0, utils_1.extractYoutubeChannelHref)(html)}`;
                    html = yield (0, utils_1.fetchHydratedHtmlContent)(row.youtube_channel_url, (page) => __awaiter(this, void 0, void 0, function* () {
                        yield page.evaluate(() => {
                            const button = document.querySelector('button.truncated-text-wiz__inline-button[aria-disabled="true"]');
                            if (button) {
                                button.click();
                            }
                        });
                        yield (0, utils_1.sleep)(5000);
                    }));
                    console.log(`Youtube hmtl for "${result === null || result === void 0 ? void 0 : result.channelTitle}": ${html}`);
                    row.youtube_subscribers = (_j = (0, utils_1.extractSubscriberCount)(html)) !== null && _j !== void 0 ? _j : 0;
                    const totalViews = (0, utils_1.extractTotalViews)(html);
                    const videoCount = (0, utils_1.extractTotalVideos)(html);
                    row.youtube_total_episodes = videoCount !== null && videoCount !== void 0 ? videoCount : 0;
                    row.youtube_average_views =
                        (totalViews !== null && totalViews !== void 0 ? totalViews : 0) / Math.max(videoCount !== null && videoCount !== void 0 ? videoCount : 0, 1);
                    html = yield (0, utils_1.fetchHydratedHtmlContent)(`${row.youtube_channel_url}/videos`);
                    row.youtube_recent_average_views = (0, utils_1.extractAndRecentAverageViews)(html);
                    row.youtube_last_published_at =
                        (_k = (0, utils_1.extractLastPublishedDate)(html)) !== null && _k !== void 0 ? _k : new Date("1970-01-01T00:00:00Z");
                    console.log(`Extracted youtube channel url for ${result.channelTitle}, url: ${row.youtube_channel_url}, subscribers: ${row.youtube_subscribers}, total eps: ${videoCount}, total views: ${totalViews}, rav: ${row.youtube_recent_average_views}, lpd: ${row.youtube_last_published_at}`);
                    return true;
                }
            }
            return true;
        }
        catch (e) {
            console.log(`Failed to add Youtube info to podcast "${podcast.title}". Error: ${e}`);
            return false;
        }
    });
}
