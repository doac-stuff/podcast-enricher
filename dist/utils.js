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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.prisma = exports.backendToken = exports.backendUrl = void 0;
exports.sha1 = sha1;
exports.extractSpotifyReview = extractSpotifyReview;
exports.extractAppleReview = extractAppleReview;
exports.extractAppleLastEpisode = extractAppleLastEpisode;
exports.extractFromParentheses = extractFromParentheses;
exports.parseReviewCount = parseReviewCount;
exports.extractYoutubeChannelHref = extractYoutubeChannelHref;
exports.extractSubscriberCount = extractSubscriberCount;
exports.extractTotalViews = extractTotalViews;
exports.extractTotalVideos = extractTotalVideos;
exports.extractAndRecentAverageViews = extractAndRecentAverageViews;
exports.extractLastPublishedDate = extractLastPublishedDate;
exports.extractSpotifyHref = extractSpotifyHref;
exports.fetchHydratedHtmlContentProxy = fetchHydratedHtmlContentProxy;
exports.fetchHydratedHtmlContentDirect = fetchHydratedHtmlContentDirect;
exports.clickMoreButtonAndWaitForPopup = clickMoreButtonAndWaitForPopup;
exports.savePage = savePage;
exports.loadPage = loadPage;
const crypto_1 = __importDefault(require("crypto"));
const cheerio = __importStar(require("cheerio"));
const promises_1 = __importDefault(require("fs/promises"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const browser_1 = require("./browser");
dotenv_1.default.config();
exports.backendUrl = (_a = process.env.BACKEND_URL) !== null && _a !== void 0 ? _a : "";
exports.backendToken = (_b = process.env.BACKEND_TOKEN) !== null && _b !== void 0 ? _b : "";
exports.prisma = new client_1.PrismaClient();
function sha1(str) {
    return crypto_1.default.createHash("sha1").update(str).digest("hex");
}
function extractSpotifyReview(html) {
    const $ = cheerio.load(html);
    const spanCount = $(".Type__TypeElement-sc-goli3j-0.dOtTDl.ret7iHkCxcJvsZU14oPY").first();
    const spanScore = $('.Type__TypeElement-sc-goli3j-0.dDZCoe[dir="auto"]').first();
    return [
        spanCount.length ? spanCount.text() : null,
        spanScore.length ? spanScore.text() : null,
    ];
}
function extractAppleReview(html) {
    const $ = cheerio.load(html);
    const reviewInfo = $("li.svelte-11a0tog").first().text().trim();
    return [reviewInfo.length ? reviewInfo : null];
}
function extractAppleLastEpisode(html) {
    const $ = cheerio.load(html);
    const title = $(".episode-details__title-text").first().text();
    return title.length ? title : null;
}
function extractFromParentheses(str) {
    const match = str.match(/\((.*?)\)/);
    return match ? match[1] : null;
}
function parseReviewCount(count) {
    if (count === null)
        return 0;
    const cleanCount = count.trim();
    const multipliers = {
        k: 1000,
        m: 1000000,
        b: 1000000000,
    };
    if (/^[\d.]+[kmb]?$/i.test(cleanCount)) {
        const [, num, suffix] = cleanCount.match(/^([\d.]+)([kmb])?$/i) || [];
        const baseNumber = parseFloat(num);
        const multiplier = multipliers[suffix === null || suffix === void 0 ? void 0 : suffix.toLowerCase()] || 1;
        return Math.round(baseNumber * multiplier);
    }
    return parseInt(cleanCount) || 0;
}
function extractYoutubeChannelHref(html) {
    const $ = cheerio.load(html);
    const anchor = $("a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer");
    return anchor.attr("href") || null;
}
function extractSubscriberCount(html) {
    const $ = cheerio.load(html);
    const spans = $("span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text");
    if (spans.length < 2)
        return null;
    const span = spans.eq(1);
    const text = span.text().trim();
    const match = text.match(/^([\d\.]+)([KMB])? subscriber(s)?$/i);
    if (!match)
        return null;
    let [, number, suffix] = match;
    let count = parseFloat(number);
    switch (suffix === null || suffix === void 0 ? void 0 : suffix.toUpperCase()) {
        case "K":
            count *= 1000;
            break;
        case "M":
            count *= 1000000;
            break;
        case "B":
            count *= 1000000000;
            break;
        default:
            break;
    }
    return Math.round(count);
}
function extractTotalViews(html) {
    const $ = cheerio.load(html);
    const elements = $("td.style-scope.ytd-about-channel-renderer");
    if (elements.length < 16) {
        return null;
    }
    const viewText = $(elements[15]).text();
    const viewNumber = viewText.replace(/,/g, "").match(/\d+/);
    return viewNumber ? parseInt(viewNumber[0], 10) : null;
}
function extractTotalVideos(html) {
    const $ = cheerio.load(html);
    const spans = $("span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text");
    if (spans.length < 3)
        return null;
    const span = spans.eq(2);
    const text = span.text().trim();
    const match = text.match(/^([\d\.]+)([KMB])? video(s)?$/i);
    if (!match)
        return null;
    let [, number, suffix] = match;
    let count = parseFloat(number);
    switch (suffix === null || suffix === void 0 ? void 0 : suffix.toUpperCase()) {
        case "K":
            count *= 1000;
            break;
        case "M":
            count *= 1000000;
            break;
        case "B":
            count *= 1000000000;
            break;
        default:
            break;
    }
    return Math.round(count);
}
function extractAndRecentAverageViews(html) {
    const $ = cheerio.load(html);
    const elements = $("span.inline-metadata-item.style-scope.ytd-video-meta-block");
    const viewCounts = [];
    elements.each((index, element) => {
        if (index % 2 === 0) {
            const viewText = $(element).text();
            const match = viewText.match(/([\d.]+)([KMB])?/i);
            if (match) {
                const number = parseFloat(match[1]);
                let multiplier = 1;
                if (match[2]) {
                    switch (match[2].toUpperCase()) {
                        case "K":
                            multiplier = 1000;
                            break;
                        case "M":
                            multiplier = 1000000;
                            break;
                        case "B":
                            multiplier = 1000000000;
                            break;
                    }
                }
                viewCounts.push(Math.round(number * multiplier));
            }
        }
    });
    const limitedViewCounts = viewCounts.slice(0, 10);
    const sum = limitedViewCounts.reduce((acc, val) => acc + val, 0);
    const count = limitedViewCounts.length;
    return sum / Math.max(count, 1);
}
function extractLastPublishedDate(html) {
    // Load the HTML into Cheerio
    const $ = cheerio.load(html);
    // Select all <span> elements with the specified class
    const elements = $("span.inline-metadata-item.style-scope.ytd-video-meta-block");
    // Ensure there is at least one element to process
    if (elements.length < 1) {
        return null;
    }
    // Get the text content of the first element (index 1)
    const timeText = $(elements[1]).text();
    // Use a regular expression to extract the number and time unit
    const match = timeText.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i);
    if (!match) {
        return null;
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    // Get the current date
    const currentDate = new Date();
    // Calculate the past date based on the unit
    switch (unit) {
        case "second":
            currentDate.setSeconds(currentDate.getSeconds() - amount);
            break;
        case "minute":
            currentDate.setMinutes(currentDate.getMinutes() - amount);
            break;
        case "hour":
            currentDate.setHours(currentDate.getHours() - amount);
            break;
        case "day":
            currentDate.setDate(currentDate.getDate() - amount);
            break;
        case "week":
            currentDate.setDate(currentDate.getDate() - amount * 7);
            break;
        case "month":
            currentDate.setMonth(currentDate.getMonth() - amount);
            break;
        case "year":
            currentDate.setFullYear(currentDate.getFullYear() - amount);
            break;
        default:
            return null;
    }
    return currentDate;
}
function extractSpotifyHref(html) {
    const $ = cheerio.load(html);
    const anchor = $('a.podcastsubscribe[aria-label="spotify-podcast"]');
    return anchor.attr("href") || null;
}
function fetchHydratedHtmlContentProxy(url, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield (0, browser_1.waitForProxyBrowser)();
        const page = yield browser.newPage();
        try {
            yield page.authenticate({
                username: "AoJ2oCvPOUY7ATbU",
                password: "TTXqhcEfjfLTKfWj",
            });
            yield page.goto(url, { timeout: 15000 });
            if (action) {
                console.log("Running page action...");
                yield action(page);
            }
            const html = yield page.content();
            yield page.close();
            return html;
        }
        catch (e) {
            yield page.close();
            throw e;
        }
    });
}
function fetchHydratedHtmlContentDirect(url, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield (0, browser_1.waitForDirectBrowser)();
        const page = yield browser.newPage();
        try {
            yield page.goto(url, { timeout: 15000 });
            if (action) {
                console.log("Running page action...");
                yield action(page);
            }
            const html = yield page.content();
            yield page.close();
            return html;
        }
        catch (e) {
            yield page.close();
            throw e;
        }
    });
}
function clickMoreButtonAndWaitForPopup(page) {
    return __awaiter(this, void 0, void 0, function* () {
        const buttonSelector = "button.truncated-text-wiz__absolute-button";
        yield page.waitForSelector(buttonSelector, { visible: true });
        yield page.click(buttonSelector);
        const popupIndicatorSelector = 'span.yt-core-attributed-string span[style=""]';
        yield page.waitForSelector(popupIndicatorSelector, { visible: true });
    });
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
function savePage(page) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = { page: page };
        const jsonString = JSON.stringify(data);
        try {
            yield promises_1.default.writeFile("page.json", jsonString);
        }
        catch (error) {
            console.error("Error saving page number:", error);
            throw error;
        }
    });
}
function loadPage() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const jsonString = yield promises_1.default.readFile("page.json", "utf-8");
            const data = JSON.parse(jsonString);
            return data.page;
        }
        catch (error) {
            console.error("Error loading page number:", error);
            return 0; // Return default page number if file doesn't exist or is invalid
        }
    });
}
