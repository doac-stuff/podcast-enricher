import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { PodcastEnriched, PodcastsEnrichedPayload } from "./model";
import { backendUrl, prisma } from "./utils";
import { enrichPayload, postEnrichedPodcasts } from "./enrichment";

let isReEnriching = false;

export function startReEnricher() {
  async function reEnrichAll() {
    isReEnriching = true;
    try {
      while (true) {
        const res = await fetch(
          `${backendUrl}/stale_podcasts?page=${0}&limit=${1000}`
        );
        const stalePodcasts: { items: PodcastEnriched[]; count: number } =
          await res.json();

        // Extract podcast_index_ids from the received podcasts
        const podcastIndexIds = stalePodcasts.items
          .map((podcast) => podcast.podcast_index_id)
          .filter((id) => id !== null) as number[];

        // Fetch podcasts from the database using the extracted podcast_index_ids
        const podcastsToReEnrich = await prisma.podcast.findMany({
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

        console.log(
          `Re-enriching ${podcastsToReEnrich.length} podcasts out of ${stalePodcasts.count} stale podcasts left.`
        );

        const payloadSize = 4;
        const postPromises: Promise<any>[] = [];
        for (
          let i = 0;
          i < Math.ceil(podcastsToReEnrich.length / payloadSize);
          i++
        ) {
          const payload: typeof podcastsToReEnrich = [];
          for (let j = 0; j < payloadSize; j++) {
            const index = i * payloadSize + j;
            payload.push(podcastsToReEnrich[index]);
          }
          const enrichedPayload = await enrichPayload(payload);
          async function tryPost() {
            try {
              await postEnrichedPodcasts(enrichedPayload);
            } catch (e) {
              console.log(
                `Failed to post re-enriched: ${JSON.stringify(
                  enrichedPayload
                )}. They will be retried. Error: ${e}`
              );
            }
          }
          postPromises.push(tryPost()); //delaying awaiting this to optimize for speed
        }

        await Promise.all(postPromises);
      }
    } catch (e) {
      console.log(`Re-enrichment exited with error: ${e}`);
    }
    isReEnriching = false;
  }

  reEnrichAll();

  const app = express();
  const port = process.env.PORT;

  app.use(bodyParser.json());

  // Endpoint to re-enrich podcasts
  app.post("/re-enrich", async (_: Request, res: Response) => {
    if (isReEnriching) {
      res.send("Re-enrichment is already running.");
    } else {
      reEnrichAll();
      res.send("Starting re-enrichment now...");
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
