import * as puppeteerCore from "puppeteer-core";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerExtra from "puppeteer-extra";

puppeteerExtra.use(StealthPlugin());

let browser: puppeteerCore.Browser | null = null;
let browserRequestPending = false;
let browserPromise: Promise<puppeteerCore.Browser> | null = null;

export async function waitForBrowser(): Promise<puppeteerCore.Browser> {
  if (!browser && !browserRequestPending) {
    browserRequestPending = true;
    browserPromise = puppeteerExtra
      .launch({
        headless: true,
        executablePath: process.env.CHROME_EXEC_PATH,
        userDataDir: process.env.CHROME_DATA_PATH,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-infobars",
          "--window-position=0,0",
          "--ignore-certificate-errors",
          "--ignore-certificate-errors-spki-list",
          "--disable-extensions",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1920,1080",
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      })
      .then(async (launchedBrowser) => {
        // Use type assertion here
        browser = launchedBrowser as unknown as puppeteerCore.Browser;
        const page = await browser.newPage();
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
        return browser;
      });
  }

  if (browserPromise) {
    return browserPromise;
  }

  throw new Error("Failed to initialize browser");
}
