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
exports.startReEnricher = startReEnricher;
exports.getIsReEnriching = getIsReEnriching;
const utils_1 = require("./utils");
const enrichment_1 = require("./enrichment");
let isReEnriching = false;
function startReEnricher() {
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
                const postPromises = [];
                for (let i = 0; i < Math.ceil(podcastsToReEnrich.length / payloadSize); i++) {
                    const payload = [];
                    for (let j = 0; j < payloadSize; j++) {
                        const index = i * payloadSize + j;
                        if (index >= podcastsToReEnrich.length)
                            break;
                        payload.push(podcastsToReEnrich[index]);
                    }
                    const enrichedPayload = yield (0, enrichment_1.enrichPayload)(payload);
                    function tryPost() {
                        return __awaiter(this, void 0, void 0, function* () {
                            try {
                                yield (0, enrichment_1.postEnrichedPodcasts)(enrichedPayload);
                            }
                            catch (e) {
                                console.log(`Failed to post re-enriched: ${JSON.stringify(enrichedPayload)}. They will be retried. Error: ${e}`);
                            }
                        });
                    }
                    postPromises.push(tryPost()); //delaying awaiting this to optimize for speed
                }
                yield Promise.all(postPromises);
            }
        }
        catch (e) {
            console.log(`Re-enrichment exited with error: ${e}`);
        }
        isReEnriching = false;
    });
}
function getIsReEnriching() {
    return isReEnriching;
}
