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
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const reenrichment_1 = require("./reenrichment");
const utils_1 = require("./utils");
const model_1 = require("./model");
function startServer() {
    const app = (0, express_1.default)();
    const port = process.env.PORT;
    app.use(body_parser_1.default.json());
    // Endpoint to re-enrich podcasts
    app.post("/re-enrich", (_, res) => __awaiter(this, void 0, void 0, function* () {
        if ((0, reenrichment_1.getIsReEnriching)()) {
            res.send("Re-enrichment is already running.");
        }
        else {
            (0, reenrichment_1.startReEnricher)();
            res.send("Starting re-enrichment now...");
        }
    }));
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    app.post("/rssurl-piid", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const stalePodcasts = req.body;
        try {
            const existingPodcasts = yield utils_1.prisma.podcast.findMany({
                orderBy: {
                    id: "asc",
                },
                where: {
                    url: {
                        in: stalePodcasts.items.map((podcast) => { var _a; return (_a = podcast.rss_feed_url) !== null && _a !== void 0 ? _a : ""; }),
                    },
                },
            });
            const stalePodcastsWithPiid = existingPodcasts.map((podcast) => {
                return Object.assign(Object.assign({}, model_1.emptyEnriched), { podcast_name: "Unknown", podcast_index_id: podcast.id, rss_feed_url: podcast.url });
            });
            const resBody = {
                items: stalePodcastsWithPiid,
            };
            res.json(resBody);
        }
        catch (e) {
            console.log(`Error getting PodcastIndex ids from RSS URLs. Error: ${e}`);
            res.send(`Error getting PodcastIndex ids from RSS URLs. ${e}`);
        }
    }));
}
