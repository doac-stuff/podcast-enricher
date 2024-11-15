"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForProxyBrowser = waitForProxyBrowser;
exports.waitForDirectBrowser = waitForDirectBrowser;
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const promises_1 = require("fs/promises");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
// Proxy browser variables
let proxyBrowser = null;
let proxyBrowserRequestPending = false;
let proxyBrowserPromise = null;
// Direct browser variables
let directBrowser = null;
let directBrowserRequestPending = false;
let directBrowserPromise = null;
const PROXY_BROWSER_LT = 1 * 60 * 1000; // 1 minute
function waitForProxyBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!proxyBrowser && !proxyBrowserRequestPending) {
            proxyBrowserRequestPending = true;
            const userDataPath = `${process.env.CHROME_DATA_PATH}_proxy${Math.random()}`;
            proxyBrowserPromise = puppeteer_extra_1.default
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
                .then((launchedBrowser) => __awaiter(this, void 0, void 0, function* () {
                proxyBrowser = launchedBrowser;
                const page = yield proxyBrowser.newPage();
                yield page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
                yield page.evaluateOnNewDocument(() => {
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
                yield page.close();
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    proxyBrowser = null;
                    proxyBrowserRequestPending = false;
                    yield launchedBrowser.close();
                    yield deleteUserDataFolder(userDataPath);
                }), PROXY_BROWSER_LT);
                return proxyBrowser;
            }));
        }
        if (proxyBrowserPromise) {
            return proxyBrowserPromise;
        }
        throw new Error("Failed to initialize proxy browser");
    });
}
function waitForDirectBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!directBrowser && !directBrowserRequestPending) {
            directBrowserRequestPending = true;
            directBrowserPromise = puppeteer_extra_1.default
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
                .then((launchedBrowser) => __awaiter(this, void 0, void 0, function* () {
                directBrowser = launchedBrowser;
                const page = yield directBrowser.newPage();
                yield page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
                yield page.evaluateOnNewDocument(() => {
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
                yield page.close();
                return directBrowser;
            }));
        }
        if (directBrowserPromise) {
            return directBrowserPromise;
        }
        throw new Error("Failed to initialize direct browser");
    });
}
function deleteUserDataFolder(userDataPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, promises_1.rm)(userDataPath, { recursive: true, force: true });
        }
        catch (error) {
            console.error(`Error deleting folder at ${userDataPath}:`, error);
            throw error;
        }
    });
}
