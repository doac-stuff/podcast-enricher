import * as puppeteer from "puppeteer-core";
import crypto from "crypto";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import { PrismaClient } from "@prisma/client";
import env from "dotenv";
import { waitForDirectBrowser, waitForProxyBrowser } from "./browser";

env.config();

export const backendUrl = process.env.BACKEND_URL ?? "";
export const backendToken = process.env.BACKEND_TOKEN ?? "";

export const prisma = new PrismaClient();

export function sha1(str: string) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

export function extractSpotifyReview(html: string): (string | null)[] {
  const $ = cheerio.load(html);
  const spanCount = $(
    ".Type__TypeElement-sc-goli3j-0.dOtTDl.ret7iHkCxcJvsZU14oPY"
  ).first();
  const spanScore = $(
    '.Type__TypeElement-sc-goli3j-0.dDZCoe[dir="auto"]'
  ).first();

  return [
    spanCount.length ? spanCount.text() : null,
    spanScore.length ? spanScore.text() : null,
  ];
}

export function extractAppleReview(html: string): (string | null)[] {
  const $ = cheerio.load(html);

  const reviewInfo = $("li.svelte-123qhuj").first().text().trim();

  return [reviewInfo.length ? reviewInfo : null];
}

export function extractAppleLastEpisodeTitle(html: string): string | null {
  const $ = cheerio.load(html);

  const title = $(".episode-details__title-text").first().text();

  return title.length ? title : null;
}

export function extractFromParentheses(str: string): string | null {
  const match = str.match(/\((.*?)\)/);
  return match ? match[1] : null;
}

export function parseReviewCount(count: string | null): number {
  if (count === null) return 0;

  const cleanCount = count.trim();
  const multipliers: { [key: string]: number } = {
    k: 1000,
    m: 1000000,
    b: 1000000000,
  };

  if (/^[\d.]+[kmb]?$/i.test(cleanCount)) {
    const [, num, suffix] = cleanCount.match(/^([\d.]+)([kmb])?$/i) || [];
    const baseNumber = parseFloat(num);
    const multiplier = multipliers[suffix?.toLowerCase()] || 1;
    return Math.round(baseNumber * multiplier);
  }

  return parseInt(cleanCount) || 0;
}

export function extractYoutubeChannelHref(html: string): string | null {
  const $ = cheerio.load(html);

  const anchor = $("a.yt-simple-endpoint.style-scope.ytd-video-owner-renderer");

  return anchor.attr("href") || null;
}

export function extractSubscriberCount(html: string): number | null {
  const $ = cheerio.load(html);

  const spans = $(
    "span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text"
  );

  if (spans.length < 2) return null;
  const span = spans.eq(1);

  const text = span.text().trim();

  const match = text.match(/^([\d\.]+)([KMB])? subscriber(s)?$/i);

  if (!match) return null;

  let [, number, suffix] = match;

  let count = parseFloat(number);

  switch (suffix?.toUpperCase()) {
    case "K":
      count *= 1_000;
      break;
    case "M":
      count *= 1_000_000;
      break;
    case "B":
      count *= 1_000_000_000;
      break;
    default:
      break;
  }

  return Math.round(count);
}

export function extractTotalViews(html: string): number | null {
  const $ = cheerio.load(html);

  const elements = $("td.style-scope.ytd-about-channel-renderer");

  if (elements.length < 16) {
    return null;
  }

  const viewText = $(elements[15]).text();

  const viewNumber = viewText.replace(/,/g, "").match(/\d+/);

  return viewNumber ? parseInt(viewNumber[0], 10) : null;
}

export function extractTotalVideos(html: string): number | null {
  const $ = cheerio.load(html);

  const spans = $(
    "span.yt-core-attributed-string.yt-content-metadata-view-model-wiz__metadata-text"
  );

  if (spans.length < 3) return null;
  const span = spans.eq(2);

  const text = span.text().trim();

  const match = text.match(/^([\d\.]+)([KMB])? video(s)?$/i);

  if (!match) return null;

  let [, number, suffix] = match;

  let count = parseFloat(number);

  switch (suffix?.toUpperCase()) {
    case "K":
      count *= 1_000;
      break;
    case "M":
      count *= 1_000_000;
      break;
    case "B":
      count *= 1_000_000_000;
      break;
    default:
      break;
  }

  return Math.round(count);
}

export function extractAndRecentAverageViews(html: string): number {
  const $ = cheerio.load(html);

  const elements = $(
    "span.inline-metadata-item.style-scope.ytd-video-meta-block"
  );

  const viewCounts: number[] = [];

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
              multiplier = 1_000;
              break;
            case "M":
              multiplier = 1_000_000;
              break;
            case "B":
              multiplier = 1_000_000_000;
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

export function extractLastPublishedDate(html: string): Date | null {
  // Load the HTML into Cheerio
  const $ = cheerio.load(html);

  // Select all <span> elements with the specified class
  const elements = $(
    "span.inline-metadata-item.style-scope.ytd-video-meta-block"
  );

  // Ensure there is at least one element to process
  if (elements.length < 1) {
    return null;
  }

  // Get the text content of the first element (index 1)
  const timeText = $(elements[1]).text();

  // Use a regular expression to extract the number and time unit
  const match = timeText.match(
    /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i
  );

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

export function extractSpotifyHref(html: string): string | null {
  const $ = cheerio.load(html);

  const anchor = $('a.podcastsubscribe[aria-label="spotify-podcast"]');

  return anchor.attr("href") || null;
}

export async function fetchHydratedHtmlContentProxy(
  url: string,
  action: (page: puppeteer.Page) => Promise<void>
): Promise<string> {
  const browser = await waitForProxyBrowser();
  const page = await browser.newPage();
  try {
    await page.authenticate({
      username: "AoJ2oCvPOUY7ATbU",
      password: "TTXqhcEfjfLTKfWj",
    });
    await page.goto(url, { timeout: 15000 });

    if (action) {
      console.log("Running page action...");
      await action(page);
    }

    const html = await page.content();
    await page.close();
    return html;
  } catch (e) {
    await page.close();
    throw e;
  }
}

export async function fetchHydratedHtmlContentDirect(
  url: string,
  action: (page: puppeteer.Page) => Promise<void>
): Promise<string> {
  const browser = await waitForDirectBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { timeout: 15000 });

    if (action) {
      console.log("Running page action...");
      await action(page);
    }

    const html = await page.content();
    await page.close();
    return html;
  } catch (e) {
    await page.close();
    throw e;
  }
}

export async function clickMoreButtonAndWaitForPopup(page: puppeteer.Page) {
  const buttonSelector = "button.truncated-text-wiz__absolute-button";

  await page.waitForSelector(buttonSelector, { visible: true });

  await page.click(buttonSelector);

  const popupIndicatorSelector =
    'span.yt-core-attributed-string span[style=""]';
  await page.waitForSelector(popupIndicatorSelector, { visible: true });
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function savePage(page: number): Promise<void> {
  const data = { page: page };
  const jsonString = JSON.stringify(data);

  try {
    await fs.writeFile("page.json", jsonString);
  } catch (error) {
    console.error("Error saving page number:", error);
    throw error;
  }
}

export async function loadPage(): Promise<number> {
  try {
    const jsonString = await fs.readFile("page.json", "utf-8");
    const data = JSON.parse(jsonString);
    return data.page;
  } catch (error) {
    console.error("Error loading page number:", error);
    return 0; // Return default page number if file doesn't exist or is invalid
  }
}
