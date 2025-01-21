import {
  cleanupDatabase,
  downloadAndExtractDatabase,
  isPodcastDbOldOrMissing,
} from "./api.podcastindex";
import { enrichAll } from "./enrichment";
import { startReEnricher } from "./reenrichment";
import { startServer } from "./server";
import { backendToken, backendUrl, prisma } from "./utils";

async function main() {
  try {
    if (isPodcastDbOldOrMissing()) {
      await downloadAndExtractDatabase();
      await cleanupDatabase();
    }
    startServer();
    startEnricherIfActive();
  } catch (e) {
    console.error(`Error starting up enricher: ${e}`);
  }
}

async function startEnricherIfActive() {
  try {
    const res = await fetch(`${backendUrl}/api/enricher`, {
      headers: [["Authorization", `Bearer ${backendToken}`]],
    });

    const myLabel = process.env.ENRICHER_LABEL;
    const activeLabel = await res.text();

    console.log(
      `Enricher Label: ${myLabel}, Active Enricher Label: ${activeLabel}`
    );

    if (myLabel === activeLabel) {
      console.log("Starting enricher now because it is currently active...");
      startReEnricher();
      enrichAll();
    } else {
      //Start youtube only re-enrichment
    }
  } catch (e) {
    console.log(
      `Could not ascertain the state of the enricher. Error: ${e}. Waiting...`
    );
  }
}

main();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
