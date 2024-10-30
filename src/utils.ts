import crypto from "crypto";
import * as cheerio from "cheerio";
import * as puppeteerns from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import { PrismaClient } from "@prisma/client";
import env from "dotenv";
import { MeasurementState } from "./model";

env.config();

export const backendUrl = process.env.BACKEND_URL ?? "";

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

  const reviewInfo = $("li.svelte-11a0tog").first().text().trim();

  return [reviewInfo.length ? reviewInfo : null];
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

  const match = text.match(/^([\d\.]+)([KMB])? subscribers$/i);

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

  const elements = $("td.style-scope.ytd-about-channel-renderer");

  if (elements.length < 14) {
    return null;
  }

  const viewText = $(elements[13]).text();

  const viewNumber = viewText.replace(/,/g, "").match(/\d+/);

  return viewNumber ? parseInt(viewNumber[0], 10) : null;
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

  return sum / count;
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

// Use the stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

let browser: puppeteerns.Browser | null = null;

export async function fetchHydratedHtmlContent(
  url: string,
  action: ((page: puppeteerns.Page) => Promise<void>) | null = null
): Promise<string> {
  if (!browser) {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  const page = await browser.newPage();
  await page.goto(url, { timeout: 120000, waitUntil: "networkidle2" });

  if (action) {
    console.log("running page action...");
    await action(page);
  }

  const html = await page.content();
  await page.close();
  return html;
}

export async function closeBrowser() {
  await browser?.close();
  browser = null;
}

export async function saveMeasurementState(
  state: MeasurementState,
  saveFileName: string
): Promise<void> {
  try {
    const jsonString = JSON.stringify(state, null, 2);
    await fs.writeFile(saveFileName, jsonString, "utf-8");
    console.log(`MeasurementState saved to ${saveFileName}`);
  } catch (error) {
    console.error("Error saving MeasurementState:", error);
    throw error;
  }
}

export async function loadMeasurementState(
  loadFileName: string
): Promise<MeasurementState> {
  try {
    const fileContent = await fs.readFile(loadFileName, "utf-8");
    const state: MeasurementState = JSON.parse(fileContent);
    console.log(`MeasurementState loaded from ${loadFileName}`);
    return state;
  } catch (error) {
    console.warn(
      `File not found: ${loadFileName}. Creating a new MeasurementState.`
    );
    const emptyState: MeasurementState = {
      start: new Date(),
      count: 0,
      end: null,
    };
    await saveMeasurementState(emptyState, loadFileName);
    return emptyState;
  }
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
