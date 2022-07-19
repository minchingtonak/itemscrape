import {
  CheerioCrawler,
  CheerioCrawlerOptions,
  createCheerioRouter,
  Dataset,
  Request,
  RequestQueue,
} from 'crawlee';
import { image } from 'image-downloader';
import isURL from 'validator/lib/isURL.js';
import { Item, ItemscrapeRoutesModule } from './types';

export async function makeWikiCrawler({
  gameId,
  options,
}: {
  gameId: string;
  options?: CheerioCrawlerOptions;
}) {
  const router = createCheerioRouter();
  const queue = await RequestQueue.open(gameId);
  const dataset = await Dataset.open<Item>(gameId);

  const crawler = new CheerioCrawler({
    maxConcurrency: 50,
    maxRequestRetries: 3,
    requestHandler: router,
    requestQueue: queue,
    ...options,
  });

  return {
    crawler,
    router,
    dataset,
  } as const;
}

export async function importCrawler(gameId: string) {
  return (await import(`./crawlers/${gameId}.js`))
    .default as ItemscrapeRoutesModule;
}

export async function saveItemImage(
  gameId: string,
  name: string,
  request: Request,
  element: cheerio.Cheerio,
) {
  const sprite = element.attr('src');

  return await image({
    url: isURL(sprite!, { require_protocol: true })
      ? sprite!
      : `${request.url.split('/').slice(0, -1).join('')}${sprite}`,
    dest: `${process.cwd()}/data/${gameId}/img/${name}.png`,
  });
}
