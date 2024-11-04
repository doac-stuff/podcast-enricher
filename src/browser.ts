import * as puppeteer from "puppeteer-core";

let browser: puppeteer.Browser | null = null;
let browserRequestPending = false;
let browserPromise: Promise<puppeteer.Browser> | null = null;

export async function waitForBrowser(): Promise<puppeteer.Browser> {
  if (!browser && !browserRequestPending) {
    browserRequestPending = true;
    browserPromise = puppeteer
      .launch({
        headless: false,
        executablePath: process.env.CHROME_EXEC_PATH,
        userDataDir: process.env.CHROME_DATA_PATH,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      .then((launchedBrowser) => {
        browser = launchedBrowser;
        return browser;
      });
  }

  if (browserPromise) {
    return browserPromise;
  }

  throw new Error("Failed to initialize browser");
}
