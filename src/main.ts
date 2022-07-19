import { log } from 'crawlee';
import { mkdir, writeFile } from 'fs/promises';
import { importCrawler } from './util.js';
log.setLevel(log.LEVELS.INFO);

const gameId = process.env.ITEMSCRAPE_GAME_IDS;

if (!gameId) {
  throw Error('Failed to provide env variable ITEMSCRAPE_GAME_IDS');
}

gameId.split(',').forEach(async (id) => {
  const { crawler, dataset } = await importCrawler(id);

  await mkdir(`./data/${id}/img`, { recursive: true });

  log.info(`Starting crawl '${id}'.`);
  await crawler.run();
  log.info(`Crawl '${id}' finished.`);

  // Collect data
  const collectedItems = await dataset.getData();

  await writeFile(
    `./data/${id}/items.json`,
    JSON.stringify(collectedItems.items, undefined, 2),
  );
});
