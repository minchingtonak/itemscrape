import { log } from 'crawlee';
import { mkdir, writeFile } from 'fs/promises';
import { importCrawler } from './util.js';
log.setLevel(log.LEVELS.INFO);

const gameId = process.env.ITEMSCRAPE_GAME_IDS;

if (!gameId) {
  throw Error('Failed to provide env variable ITEMSCRAPE_GAME_IDS');
}

gameId.split(',').forEach(async (id) => {
  function _log(mes: string) {
    log.info(`[${id}] ${mes}`);
  }

  const { crawler, dataset, sanitizer } = await importCrawler(id);

  await mkdir(`./data/${id}/img`, { recursive: true });

  _log('Starting crawl.');
  await crawler.run();
  _log('Crawl finished.');

  _log('Processing data');
  const collectedItems = await dataset.getData(),
    sanitized = collectedItems.items.map(sanitizer),
    itemsPath = `./data/${id}/items.json`;
  await writeFile(itemsPath, JSON.stringify(sanitized, undefined, 2));
  _log('Data processed.');
  _log(`Wrote ${itemsPath}`);
});
