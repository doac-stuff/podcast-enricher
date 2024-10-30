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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.prisma = exports.backendUrl = void 0;
exports.sha1 = sha1;
exports.extractSpotifyReview = extractSpotifyReview;
exports.extractAppleReview = extractAppleReview;
exports.extractFromParentheses = extractFromParentheses;
exports.parseReviewCount = parseReviewCount;
exports.extractYoutubeChannelHref = extractYoutubeChannelHref;
exports.extractSubscriberCount = extractSubscriberCount;
exports.extractTotalViews = extractTotalViews;
exports.extractTotalVideos = extractTotalVideos;
exports.extractAndRecentAverageViews = extractAndRecentAverageViews;
exports.extractLastPublishedDate = extractLastPublishedDate;
exports.extractSpotifyHref = extractSpotifyHref;
exports.fetchHydratedHtmlContent = fetchHydratedHtmlContent;
exports.clickMoreButtonAndWaitForPopup = clickMoreButtonAndWaitForPopup;
exports.closeBrowser = closeBrowser;
exports.saveMeasurementState = saveMeasurementState;
exports.loadMeasurementState = loadMeasurementState;
const crypto_1 = __importDefault(require("crypto"));
const cheerio = __importStar(require("cheerio"));
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const promises_1 = __importDefault(require("fs/promises"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.backendUrl = (_a = process.env.BACKEND_URL) !== null && _a !== void 0 ? _a : "";
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
    const match = text.match(/^([\d\.]+)([KMB])? subscribers$/i);
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
    const elements = $("td.style-scope.ytd-about-channel-renderer");
    if (elements.length < 14) {
        return null;
    }
    const viewText = $(elements[13]).text();
    const viewNumber = viewText.replace(/,/g, "").match(/\d+/);
    return viewNumber ? parseInt(viewNumber[0], 10) : null;
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
// Use the stealth plugin to avoid detection
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
let browser = null;
function fetchHydratedHtmlContent(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, action = null) {
        if (!browser) {
            browser = yield puppeteer_extra_1.default.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
        }
        const page = yield browser.newPage();
        yield page.goto(url, { timeout: 120000, waitUntil: "networkidle2" });
        if (action) {
            console.log("running page action...");
            try {
                yield action(page);
            }
            catch (e) {
                console.log(e);
            }
            // await page.screenshot({
            //   path: path.resolve(process.cwd(), `screenshot-${url.split("@")[1]}.png`),
            // });
        }
        const html = yield page.content();
        yield page.close();
        return html;
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
function closeBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (browser === null || browser === void 0 ? void 0 : browser.close());
        browser = null;
    });
}
function saveMeasurementState(state, saveFileName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const jsonString = JSON.stringify(state, null, 2);
            yield promises_1.default.writeFile(saveFileName, jsonString, "utf-8");
            console.log(`MeasurementState saved to ${saveFileName}`);
        }
        catch (error) {
            console.error("Error saving MeasurementState:", error);
            throw error;
        }
    });
}
function loadMeasurementState(loadFileName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileContent = yield promises_1.default.readFile(loadFileName, "utf-8");
            const state = JSON.parse(fileContent);
            console.log(`MeasurementState loaded from ${loadFileName}`);
            return state;
        }
        catch (error) {
            console.warn(`File not found: ${loadFileName}. Creating a new MeasurementState.`);
            const emptyState = {
                start: new Date(),
                count: 0,
                end: null,
            };
            yield saveMeasurementState(emptyState, loadFileName);
            return emptyState;
        }
    });
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
