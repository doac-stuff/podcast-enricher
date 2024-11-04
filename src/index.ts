import {
  cleanupDatabase,
  downloadAndExtractDatabase,
  isPodcastDbOldOrMissing,
} from "./api.podcastindex";
import { enrichAll } from "./enrichment";
import { startReEnricher } from "./reenrichment";
import { prisma } from "./utils";

async function main() {
  try {
    if (isPodcastDbOldOrMissing()) {
      await downloadAndExtractDatabase();
      await cleanupDatabase();
    }
    startReEnricher();
    // enrichAll();
  } catch (e) {
    console.error(`Error starting up enricher: ${e}`);
  }
}

main();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
