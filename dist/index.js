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
Object.defineProperty(exports, "__esModule", { value: true });
const api_podcastindex_1 = require("./api.podcastindex");
const enrichment_1 = require("./enrichment");
const reenrichment_1 = require("./reenrichment");
const server_1 = require("./server");
const utils_1 = require("./utils");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if ((0, api_podcastindex_1.isPodcastDbOldOrMissing)()) {
                yield (0, api_podcastindex_1.downloadAndExtractDatabase)();
                yield (0, api_podcastindex_1.cleanupDatabase)();
            }
            (0, server_1.startServer)();
            startEnricherIfActive();
        }
        catch (e) {
            console.error(`Error starting up enricher: ${e}`);
        }
    });
}
function startEnricherIfActive() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`${utils_1.backendUrl}/api/enricher`, {
                headers: [["Authorization", `Bearer ${utils_1.backendToken}`]],
            });
            const myLabel = process.env.ENRICHER_LABEL;
            const activeLabel = yield res.text();
            console.log(`Enricher Label: ${myLabel}, Active Enricher Label: ${activeLabel}`);
            if (myLabel === activeLabel) {
                console.log("Starting enricher now because it is currently active...");
                (0, reenrichment_1.startReEnricher)();
                (0, enrichment_1.enrichAll)();
            }
        }
        catch (e) {
            console.log(`Could not ascertain the state of the enricher. Error: ${e}. Waiting...`);
        }
    });
}
main();
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    yield utils_1.prisma.$disconnect();
    process.exit(0);
}));
