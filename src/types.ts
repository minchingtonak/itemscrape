import { makeWikiCrawler } from './util';

export type Item = {
  name: string;
  flavor: string;
  sprite: string;
  url: string;
};

export type ItemscrapeRoutesModule = Awaited<
  ReturnType<typeof makeWikiCrawler>
>;
