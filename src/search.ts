import * as cheerio from "cheerio";
import { shuffle } from "lodash";
import { fetchHydratedHtmlContentProxy } from "./utils";

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

// Google
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

// Google
export async function firstGoogleResultLink(query: string) {
  const searchUrl = generateGoogleSearchUrl(query);
  let html = await fetchHydratedHtmlContentProxy(searchUrl, async (page) => {
    const resultSelector = "div.yuRUbf";
    await page.waitForSelector(resultSelector, {
      visible: true,
      timeout: 5000,
    });
  });
  const link = extractFirstGoogleResultLink(html);
  return link;
}

// Bing
export async function firstBingResultLink(query: string) {
  const searchUrl = generateBingSearchUrl(query);
  let html = await fetchHydratedHtmlContentProxy(searchUrl, async (page) => {
    const resultSelector = "li.b_algo h2 a";
    await page.waitForSelector(resultSelector, {
      visible: true,
      timeout: 5000,
    });
  });
  const link = extractFirstBingResultLink(html);
  return link;
}

type SearchFunction = (query: string) => Promise<string | null>;

const searchFunctions: SearchFunction[] = [
  firstGoogleResultLink,
  firstBingResultLink,
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
