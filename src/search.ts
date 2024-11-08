import * as cheerio from "cheerio";
import { fetchHydratedHtmlContent } from "./utils";
import { shuffle } from "lodash";

// Google (already provided)
export function generateGoogleSearchUrl(query: string): string {
  const baseUrl = "https://www.google.com/search";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?q=${encodedQuery}`;
}

// Bing
export function generateBingSearchUrl(query: string): string {
  const baseUrl = "https://www.bing.com/search";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?q=${encodedQuery}`;
}

// Yahoo
export function generateYahooSearchUrl(query: string): string {
  const baseUrl = "https://search.yahoo.com/search";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?p=${encodedQuery}`;
}

// Baidu
export function generateBaiduSearchUrl(query: string): string {
  const baseUrl = "https://www.baidu.com/s";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?wd=${encodedQuery}`;
}

// Yandex
export function generateYandexSearchUrl(query: string): string {
  const baseUrl = "https://yandex.com/search/";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?text=${encodedQuery}&lr=87`;
}

// DuckDuckGo
export function generateDuckDuckGoSearchUrl(query: string): string {
  const baseUrl = "https://html.duckduckgo.com/html/";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?q=${encodedQuery}`;
}

// Ask.com
export function generateAskSearchUrl(query: string): string {
  const baseUrl = "https://www.ask.com/web";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?q=${encodedQuery}`;
}

// Naver
export function generateNaverSearchUrl(query: string): string {
  const baseUrl = "https://search.naver.com/search.naver";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?where=web&query=${encodedQuery}`;
}

// AOL
export function generateAOLSearchUrl(query: string): string {
  const baseUrl = "https://search.aol.com/aol/search";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?q=${encodedQuery}`;
}

// Ecosia
export function generateEcosiaSearchUrl(query: string): string {
  const baseUrl = "https://www.ecosia.org/search";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?q=${encodedQuery}`;
}

// Google (already provided)
export function extractFirstGoogleResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult = $("div.yuRUbf a").first().attr("href");
  return firstResult || null;
}

// Bing
export function extractFirstBingResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult = $("li.b_algo h2 a").first().attr("href");
  return firstResult || null;
}

// Yahoo
export function extractFirstYahooResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult = $("div.algo-sr h3.title a").first().attr("href");
  return firstResult || null;
}

// Baidu
export function extractFirstBaiduResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult = $("div.result h3.t a").first().attr("href");
  return firstResult || null;
}

// Yandex
export function extractFirstYandexResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult =
    $("li.serp-item h2 a").first().attr("href") ||
    $("div.organic__url-text").first().parent("a").attr("href") ||
    $("div.organic__title a").first().attr("href");
  return firstResult || null;
}

// DuckDuckGo
export function extractFirstDuckDuckGoResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult =
    $("div.result__body h2.result__title a").first().attr("href") ||
    $("div.links_main h2 a").first().attr("href") ||
    $("div.result__title a").first().attr("href");
  return firstResult || null;
}

// Ask.com
export function extractFirstAskResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult =
    $("div.PartialSearchResults-item h2.PartialSearchResults-item-title a")
      .first()
      .attr("href") ||
    $("div.result-link a").first().attr("href") ||
    $("div.web-result a.result-link").first().attr("href");
  return firstResult || null;
}

// Naver
export function extractFirstNaverResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult =
    $("li.sp_website a.link_tit").first().attr("href") ||
    $("div.total_wrap a.link_tit").first().attr("href");
  return firstResult || null;
}

// AOL
export function extractFirstAOLResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult =
    $("div.algo-sr h3.title a").first().attr("href") ||
    $("div.dd.algo.algo-sr a.fz-l").first().attr("href") ||
    $("div.compTitle h3.title a").first().attr("href");
  return firstResult || null;
}

// Ecosia
export function extractFirstEcosiaResultLink(html: string): string | null {
  const $ = cheerio.load(html);
  const firstResult =
    $("div.result-body h2 a").first().attr("href") ||
    $("div.result a.result-title").first().attr("href") ||
    $("div.mainline-results div.result a.js-result-title").first().attr("href");
  return firstResult || null;
}

// Google
export async function firstGoogleResultLink(query: string) {
  const searchUrl = generateGoogleSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector = "div.yuRUbf";
    await page.waitForSelector(resultSelector, { visible: true });
  });
  const link = extractFirstGoogleResultLink(html);
  return link;
}

// Bing
export async function firstBingResultLink(query: string) {
  const searchUrl = generateBingSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector = "li.b_algo h2 a";
    await page.waitForSelector(resultSelector, { visible: true });
  });
  const link = extractFirstBingResultLink(html);
  return link;
}

// Yahoo
export async function firstYahooResultLink(query: string) {
  const searchUrl = generateYahooSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector = "div.algo-sr h3.title a";
    await page.waitForSelector(resultSelector, { visible: true });
  });
  const link = extractFirstYahooResultLink(html);
  return link;
}

// Baidu
export async function firstBaiduResultLink(query: string) {
  const searchUrl = generateBaiduSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector = "div.result h3.t a";
    await page.waitForSelector(resultSelector, { visible: true });
  });
  const link = extractFirstBaiduResultLink(html);
  return link;
}

// Yandex
export async function firstYandexResultLink(query: string) {
  const searchUrl = generateYandexSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector =
      "li.serp-item h2 a, div.organic__url-text, div.organic__title a";
    await page.waitForSelector(resultSelector, {
      visible: true,
    });
  });
  const link = extractFirstYandexResultLink(html);
  return link;
}

// DuckDuckGo
export async function firstDuckDuckGoResultLink(query: string) {
  const searchUrl = generateDuckDuckGoSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector =
      "div.result__body h2.result__title a, div.links_main h2 a, div.result__title a";
    await page.waitForSelector(resultSelector, {
      visible: true,
    });
  });
  const link = extractFirstDuckDuckGoResultLink(html);
  return link;
}

// Ask.com
export async function firstAskResultLink(query: string) {
  const searchUrl = generateAskSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector =
      "div.PartialSearchResults-item h2.PartialSearchResults-item-title a, div.result-link a, div.web-result a.result-link";
    await page.waitForSelector(resultSelector, {
      visible: true,
    });
  });
  const link = extractFirstAskResultLink(html);
  return link;
}

// Naver
export async function firstNaverResultLink(query: string) {
  const searchUrl = generateNaverSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector =
      "li.sp_website a.link_tit, div.total_wrap a.link_tit";
    await page.waitForSelector(resultSelector, {
      visible: true,
    });
  });
  const link = extractFirstNaverResultLink(html);
  return link;
}

// AOL
export async function firstAOLResultLink(query: string) {
  const searchUrl = generateAOLSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector =
      "div.algo-sr h3.title a, div.dd.algo.algo-sr a.fz-l, div.compTitle h3.title a";
    await page.waitForSelector(resultSelector, {
      visible: true,
    });
  });
  const link = extractFirstAOLResultLink(html);
  return link;
}

// Ecosia
export async function firstEcosiaResultLink(query: string) {
  const searchUrl = generateEcosiaSearchUrl(query);
  let html = await fetchHydratedHtmlContent(searchUrl, async (page) => {
    const resultSelector =
      "div.result-body h2 a, div.result a.result-title, div.mainline-results div.result a.js-result-title";
    await page.waitForSelector(resultSelector, {
      visible: true,
    });
  });
  const link = extractFirstEcosiaResultLink(html);
  return link;
}

type SearchFunction = (query: string) => Promise<string | null>;

const searchFunctions: SearchFunction[] = [
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

export async function distributedSearch(query: string): Promise<string | null> {
  // Shuffle the array of search functions
  const shuffledFunctions = shuffle(searchFunctions);

  // Try each function in the shuffled order
  for (const searchFunction of shuffledFunctions) {
    try {
      const link = await searchFunction(query);
      if (link) {
        return link; // Return the first successful result
      }
    } catch (error) {
      console.error(`Error with search function: ${error}`);
      // Continue to the next function if there's an error
    }
  }

  // If no function succeeded, return null
  return null;
}
