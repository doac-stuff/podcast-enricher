import * as puppeteerCore from "puppeteer-core";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerExtra from "puppeteer-extra";
import { rm } from "fs/promises";

puppeteerExtra.use(StealthPlugin());

// Proxy browser variables
let proxyBrowser: puppeteerCore.Browser | null = null;
let proxyBrowserRequestPending = false;
let proxyBrowserPromise: Promise<puppeteerCore.Browser> | null = null;

// Direct browser variables
let directBrowser: puppeteerCore.Browser | null = null;
let directBrowserRequestPending = false;
let directBrowserPromise: Promise<puppeteerCore.Browser> | null = null;

const PROXY_BROWSER_LT = 1 * 60 * 1000; // 1 minute

export async function waitForProxyBrowser(): Promise<puppeteerCore.Browser> {
  if (!proxyBrowser && !proxyBrowserRequestPending) {
    proxyBrowserRequestPending = true;
    const userDataPath = `${
      process.env.CHROME_DATA_PATH
    }_proxy${Math.random()}`;
    proxyBrowserPromise = puppeteerExtra
      .launch({
        headless: true,
        executablePath: process.env.CHROME_EXEC_PATH,
        userDataDir: userDataPath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-infobars",
          "--window-position=0,0",
          "--disable-extensions",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1920,1080",
          `--proxy-server=http://geo.iproyal.com:12321`,
          "--no-first-run",
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      })
      .then(async (launchedBrowser) => {
        proxyBrowser = launchedBrowser as unknown as puppeteerCore.Browser;
        const page = await proxyBrowser.newPage();
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, "webdriver", {
            get: () => undefined,
          });
          Object.defineProperty(navigator, "languages", {
            get: () => ["en-US", "en"],
          });
          Object.defineProperty(navigator, "plugins", {
            get: () => [1, 2, 3, 4, 5],
          });
        });
        await page.close();
        setTimeout(async () => {
          proxyBrowser = null;
          proxyBrowserRequestPending = false;
          await launchedBrowser.close();
          await deleteUserDataFolder(userDataPath);
        }, PROXY_BROWSER_LT);
        return proxyBrowser;
      });
  }

  if (proxyBrowserPromise) {
    return proxyBrowserPromise;
  }

  throw new Error("Failed to initialize proxy browser");
}

export async function waitForDirectBrowser(): Promise<puppeteerCore.Browser> {
  if (!directBrowser && !directBrowserRequestPending) {
    directBrowserRequestPending = true;
    directBrowserPromise = puppeteerExtra
      .launch({
        headless: true,
        executablePath: process.env.CHROME_EXEC_PATH,
        userDataDir: `${process.env.CHROME_DATA_PATH}`,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-infobars",
          "--window-position=0,0",
          "--disable-extensions",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1920,1080",
          "--no-first-run",
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      })
      .then(async (launchedBrowser) => {
        directBrowser = launchedBrowser as unknown as puppeteerCore.Browser;
        const page = await directBrowser.newPage();
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, "webdriver", {
            get: () => undefined,
          });
          Object.defineProperty(navigator, "languages", {
            get: () => ["en-US", "en"],
          });
          Object.defineProperty(navigator, "plugins", {
            get: () => [1, 2, 3, 4, 5],
          });
        });
        await page.close();
        return directBrowser;
      });
  }

  if (directBrowserPromise) {
    return directBrowserPromise;
  }

  throw new Error("Failed to initialize direct browser");
}

async function deleteUserDataFolder(userDataPath: string): Promise<void> {
  try {
    await rm(userDataPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error deleting folder at ${userDataPath}:`, error);
    throw error;
  }
}
