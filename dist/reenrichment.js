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
exports.startReEnricher = startReEnricher;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const utils_1 = require("./utils");
const enrichment_1 = require("./enrichment");
let isReEnriching = false;
function startReEnricher() {
    function reEnrichAll() {
        return __awaiter(this, void 0, void 0, function* () {
            isReEnriching = true;
            try {
                while (true) {
                    const res = yield fetch(`${utils_1.backendUrl}/stale_podcasts?page=${0}&limit=${1000}`);
                    const stalePodcasts = yield res.json();
                    // Extract podcast_index_ids from the received podcasts
                    const podcastIndexIds = stalePodcasts.items
                        .map((podcast) => podcast.podcast_index_id)
                        .filter((id) => id !== null);
                    // Fetch podcasts from the database using the extracted podcast_index_ids
                    const podcastsToReEnrich = yield utils_1.prisma.podcast.findMany({
                        where: {
                            id: {
                                in: podcastIndexIds,
                            },
                            dead: 0,
                        },
                    });
                    if (podcastsToReEnrich.length === 0) {
                        console.log("Re-enrichment process completed.");
                        break;
                    }
                    console.log(`Re-enriching ${podcastsToReEnrich.length} podcasts out of ${stalePodcasts.count} stale podcasts left.`);
                    const payloadSize = 4;
                    for (let i = 0; i < Math.ceil(podcastsToReEnrich.length / payloadSize); i++) {
                        const payload = [];
                        for (let j = 0; j < payloadSize; j++) {
                            const index = i * payloadSize + j;
                            payload.push(podcastsToReEnrich[index]);
                        }
                        const enrichedPayload = yield (0, enrichment_1.enrichPayload)(payload);
                        (0, enrichment_1.postEnrichedPodcasts)(enrichedPayload); //not awaiting this to optimize for speed
                    }
                }
            }
            catch (e) {
                console.log(`Re-enrichment exited with error: ${e}`);
            }
            isReEnriching = false;
        });
    }
    reEnrichAll();
    const app = (0, express_1.default)();
    const port = process.env.PORT;
    app.use(body_parser_1.default.json());
    // Endpoint to re-enrich podcasts
    app.post("/re-enrich", (_, res) => __awaiter(this, void 0, void 0, function* () {
        if (isReEnriching) {
            res.send("Re-enrichment is already running.");
        }
        else {
            reEnrichAll();
            res.send("Starting re-enrichment now...");
        }
    }));
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
