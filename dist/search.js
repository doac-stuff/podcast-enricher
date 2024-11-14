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
exports.extractFirstGoogleResultLink = extractFirstGoogleResultLink;
exports.extractFirstBingResultLink = extractFirstBingResultLink;
exports.firstGoogleResultLink = firstGoogleResultLink;
exports.firstBingResultLink = firstBingResultLink;
exports.distributedSearch = distributedSearch;
const cheerio = __importStar(require("cheerio"));
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
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
// Google
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
// Google
function firstGoogleResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateGoogleSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContentProxy)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "div.yuRUbf";
            yield page.waitForSelector(resultSelector, {
                visible: true,
                timeout: 15000,
            });
        }));
        const link = extractFirstGoogleResultLink(html);
        return link;
    });
}
// Bing
function firstBingResultLink(query) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchUrl = generateBingSearchUrl(query);
        let html = yield (0, utils_1.fetchHydratedHtmlContentProxy)(searchUrl, (page) => __awaiter(this, void 0, void 0, function* () {
            const resultSelector = "li.b_algo h2 a";
            yield page.waitForSelector(resultSelector, {
                visible: true,
                timeout: 15000,
            });
        }));
        const link = extractFirstBingResultLink(html);
        return link;
    });
}
const searchFunctions = [
    firstGoogleResultLink,
    // firstBingResultLink,
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
