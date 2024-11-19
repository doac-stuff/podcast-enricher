import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { getIsReEnriching, startReEnricher } from "./reenrichment";
import { prisma } from "./utils";
import { Podcast } from "@prisma/client";
import { emptyEnriched, PodcastsEnrichedPayload } from "./model";

export function startServer() {
  const app = express();
  const port = process.env.PORT;

  app.use(bodyParser.json());

  // Endpoint to re-enrich podcasts
  app.post("/re-enrich", async (_: Request, res: Response) => {
    if (getIsReEnriching()) {
      res.send("Re-enrichment is already running.");
    } else {
      startReEnricher();
      res.send("Starting re-enrichment now...");
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  app.post("/rssurl-piid", async (req: Request, res: Response) => {
    const stalePodcasts: PodcastsEnrichedPayload = req.body;
    try {
      const existingPodcasts = await prisma.podcast.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          url: {
            in: stalePodcasts.items.map(
              (podcast) => podcast.rss_feed_url ?? ""
            ),
          },
        },
      });
      const stalePodcastsWithPiid = existingPodcasts.map((podcast) => {
        return {
          ...emptyEnriched,
          podcast_name: "Unknown",
          podcast_index_id: podcast.id,
          rss_feed_url: podcast.url,
        };
      });
      const resBody: PodcastsEnrichedPayload = {
        items: stalePodcastsWithPiid,
      };
      res.json(resBody);
    } catch (e) {
      console.log(`Error getting PodcastIndex ids from RSS URLs. Error: ${e}`);
      res.send(`Error getting PodcastIndex ids from RSS URLs. ${e}`);
    }
  });
}