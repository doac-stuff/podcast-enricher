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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGoogleSearchUrl = generateGoogleSearchUrl;
exports.generateBingSearchUrl = generateBingSearchUrl;
exports.generateYahooSearchUrl = generateYahooSearchUrl;
exports.generateBaiduSearchUrl = generateBaiduSearchUrl;
exports.generateYandexSearchUrl = generateYandexSearchUrl;
exports.generateDuckDuckGoSearchUrl = generateDuckDuckGoSearchUrl;
exports.generateAskSearchUrl = generateAskSearchUrl;
exports.generateNaverSearchUrl = generateNaverSearchUrl;
exports.generateAOLSearchUrl = generateAOLSearchUrl;
exports.generateEcosiaSearchUrl = generateEcosiaSearchUrl;
exports.extractFirstGoogleResultLink = extractFirstGoogleResultLink;
exports.extractFirstBingResultLink = extractFirstBingResultLink;
exports.extractFirstYahooResultLink = extractFirstYahooResultLink;
exports.extractFirstBaiduResultLink = extractFirstBaiduResultLink;
exports.extractFirstYandexResultLink = extractFirstYandexResultLink;
exports.extractFirstDuckDuckGoResultLink = extractFirstDuckDuckGoResultLink;
exports.extractFirstAskResultLink = extractFirstAskResultLink;
exports.extractFirstNaverResultLink = extractFirstNaverResultLink;
exports.extractFirstAOLResultLink = extractFirstAOLResultLink;
exports.extractFirstEcosiaResultLink = extractFirstEcosiaResultLink;
exports.firstGoogleResultLink = firstGoogleResultLink;
exports.firstBingResultLink = firstBingResultLink;
exports.firstYahooResultLink = firstYahooResultLink;
exports.firstBaiduResultLink = firstBaiduResultLink;
exports.firstYandexResultLink = firstYandexResultLink;
exports.firstDuckDuckGoResultLink = firstDuckDuckGoResultLink;
exports.firstAskResultLink = firstAskResultLink;
exports.firstNaverResultLink = firstNaverResultLink;
exports.firstAOLResultLink = firstAOLResultLink;
exports.firstEcosiaResultLink = firstEcosiaResultLink;
exports.distributedSearch = distributedSearch;
const cheerio = __importStar(require("cheerio"));
const utils_1 = require("./utils");
const lodash_1 = require("lodash");
// Google (already provided)
function generateGoogleSearchUrl(query) {
    const baseUrl = "https://www.google.com/search";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?q=${encodedQuery}`;
}
// Bing
function generateBingSearchUrl(query) {
    const baseUrl = "https://www.bing.com/search";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?q=${encodedQuery}`;
}
// Yahoo
function generateYahooSearchUrl(query) {
    const baseUrl = "https://search.yahoo.com/search";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?p=${encodedQuery}`;
}
// Baidu
function generateBaiduSearchUrl(query) {
    const baseUrl = "https://www.baidu.com/s";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?wd=${encodedQuery}`;
}
// Yandex
function generateYandexSearchUrl(query) {
    const baseUrl = "https://yandex.com/search/";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?text=${encodedQuery}&lr=87`;
}
// DuckDuckGo
function generateDuckDuckGoSearchUrl(query) {
    const baseUrl = "https://html.duckduckgo.com/html/";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?q=${encodedQuery}`;
}
// Ask.com
function generateAskSearchUrl(query) {
    const baseUrl = "https://www.ask.com/web";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?q=${encodedQuery}`;
}
// Naver
function generateNaverSearchUrl(query) {
    const baseUrl = "https://search.naver.com/search.naver";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?where=web&query=${encodedQuery}`;
}
// AOL
function generateAOLSearchUrl(query) {
    const baseUrl = "https://search.aol.com/aol/search";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?q=${encodedQuery}`;
}
// Ecosia
function generateEcosiaSearchUrl(query) {
    const baseUrl = "https://www.ecosia.org/search";
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}?q=${encodedQuery}`;
}
// Google (already provided)
function extractFirstGoogleResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("div.yuRUbf a").first().attr("href");
    return firstResult || null;
}
// Bing
function extractFirstBingResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("li.b_algo h2 a").first().attr("href");
    return firstResult || null;
}
// Yahoo
function extractFirstYahooResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("div.algo-sr h3.title a").first().attr("href");
    return firstResult || null;
}
// Baidu
function extractFirstBaiduResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("div.result h3.t a").first().attr("href");
    return firstResult || null;
}
// Yandex
function extractFirstYandexResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("li.serp-item h2 a").first().attr("href") ||
        $("div.organic__url-text").first().parent("a").attr("href") ||
        $("div.organic__title a").first().attr("href");
    return firstResult || null;
}
// DuckDuckGo
function extractFirstDuckDuckGoResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("div.result__body h2.result__title a").first().attr("href") ||
        $("div.links_main h2 a").first().attr("href") ||
        $("div.result__title a").first().attr("href");
    return firstResult || null;
}
// Ask.com
function extractFirstAskResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("div.PartialSearchResults-item h2.PartialSearchResults-item-title a")
        .first()
        .attr("href") ||
        $("div.result-link a").first().attr("href") ||
        $("div.web-result a.result-link").first().attr("href");
    return firstResult || null;
}
// Naver
function extractFirstNaverResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("li.sp_website a.link_tit").first().attr("href") ||
        $("div.total_wrap a.link_tit").first().attr("href");
    return firstResult || null;
}
// AOL
function extractFirstAOLResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("div.algo-sr h3.title a").first().attr("href") ||
        $("div.dd.algo.algo-sr a.fz-l").first().attr("href") ||
        $("div.compTitle h3.title a").first().attr("href");
    return firstResult || null;
}
// Ecosia
function extractFirstEcosiaResultLink(html) {
    const $ = cheerio.load(html);
    const firstResult = $("div.result-body h2 a").first().attr("href") ||
        $("div.result a.result-title").first().attr("href") ||
        $("div.mainline-results div.result a.js-result-title").first().attr("href");
    return firstResult || null;
}
// Google
function firstGoogleResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateGoogleSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.yuRUbf";
            yield page.waitForSelector(resultSelector, { visible: true });
        }));
        const link = extractFirstGoogleResultLink(html);
        return link;
    });
}
// Bing
function firstBingResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateBingSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "li.b_algo h2 a";
            yield page.waitForSelector(resultSelector, { visible: true });
        }));
        const link = extractFirstBingResultLink(html);
        return link;
    });
}
// Yahoo
function firstYahooResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateYahooSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.algo-sr h3.title a";
            yield page.waitForSelector(resultSelector, { visible: true });
        }));
        const link = extractFirstYahooResultLink(html);
        return link;
    });
}
// Baidu
function firstBaiduResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateBaiduSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.result h3.t a";
            yield page.waitForSelector(resultSelector, { visible: true });
        }));
        const link = extractFirstBaiduResultLink(html);
        return link;
    });
}
// Yandex
function firstYandexResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateYandexSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "li.serp-item h2 a, div.organic__url-text, div.organic__title a";
            yield page.waitForSelector(resultSelector, {
                visible: true,
            });
        }));
        const link = extractFirstYandexResultLink(html);
        return link;
    });
}
// DuckDuckGo
function firstDuckDuckGoResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateDuckDuckGoSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.result__body h2.result__title a, div.links_main h2 a, div.result__title a";
            yield page.waitForSelector(resultSelector, {
                visible: true,
            });
        }));
        const link = extractFirstDuckDuckGoResultLink(html);
        return link;
    });
}
// Ask.com
function firstAskResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateAskSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.PartialSearchResults-item h2.PartialSearchResults-item-title a, div.result-link a, div.web-result a.result-link";
            yield page.waitForSelector(resultSelector, {
                visible: true,
            });
        }));
        const link = extractFirstAskResultLink(html);
        return link;
    });
}
// Naver
function firstNaverResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateNaverSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "li.sp_website a.link_tit, div.total_wrap a.link_tit";
            yield page.waitForSelector(resultSelector, {
                visible: true,
            });
        }));
        const link = extractFirstNaverResultLink(html);
        return link;
    });
}
// AOL
function firstAOLResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateAOLSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.algo-sr h3.title a, div.dd.algo.algo-sr a.fz-l, div.compTitle h3.title a";
            yield page.waitForSelector(resultSelector, {
                visible: true,
            });
        }));
        const link = extractFirstAOLResultLink(html);
        return link;
    });
}
// Ecosia
function firstEcosiaResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateEcosiaSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContent)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.result-body h2 a, div.result a.result-title, div.mainline-results div.result a.js-result-title";
            yield page.waitForSelector(resultSelector, {
                visible: true,
            });
        }));
        const link = extractFirstEcosiaResultLink(html);
        return link;
    });
}
const searchFunctions = [
    firstGoogleResultLink,
    firstBingResultLink,
    firstYahooResultLink,
    //firstBaiduResultLink,
    //firstYandexResultLink,
    // firstDuckDuckGoResultLink,
    //firstAskResultLink,
    //firstNaverResultLink,
    //firstAOLResultLink,
    //firstEcosiaResultLink,
];
function distributedSearch(query) {
    return __awaiter(this, void 0, void 0, function* () {
        // Shuffle the array of search functions
        const shuffledFunctions = (0, lodash_1.shuffle)(searchFunctions);
        // Try each function in the shuffled order
        for (const searchFunction of shuffledFunctions) {
            try {
                const link = yield searchFunction(query);
                if (link) {
                    return link; // Return the first successful result
                }
            }
            catch (error) {
                console.error(`Error with search function: ${error}`);
                // Continue to the next function if there's an error
            }
        }
        // If no function succeeded, return null
        return null;
    });
}
