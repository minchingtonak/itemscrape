// For more information, see https://crawlee.dev/
import { CheerioCrawler, log } from 'crawlee';
import { router, queue } from './routes.js';

// interface InputSchema {
//   startUrls: string[];
//   debug?: boolean;
// }

// Get startup parameters from on-disk kv store
// const { startUrls = [], debug } =
//   (await KeyValueStore.getInput<InputSchema>()) ?? {};

log.setLevel(log.LEVELS.INFO);
// if (debug) {
//   log.setLevel(log.LEVELS.DEBUG);
// }

const crawler = new CheerioCrawler({
  maxConcurrency: 50,
  requestHandler: router,
  maxRequestRetries: 3,
  navigationTimeoutSecs: 100,
  requestQueue: queue,
});

// await crawler.addRequests(startUrls);

log.info('Starting the crawl.');
await crawler.run();
log.info('Crawl finished.');
