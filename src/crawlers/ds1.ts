import { makeWikiCrawler, saveItemImage } from '../util.js';

const GAME_ID = 'ds1';

const info = await makeWikiCrawler({
  gameId: GAME_ID,
});

const { crawler, router, dataset } = info;

await crawler.addRequests([
  { url: 'https://darksouls.wiki.fextralife.com/Items' },
]);

router.addDefaultHandler(async ({ enqueueLinks }) => {
  await enqueueLinks({
    label: 'CATEGORY',
    selector: 'div#sub-main div[id^="embedded"] a.btn',
  });
});

router.addHandler('CATEGORY', async ({ enqueueLinks, log, request }) => {
  log.info('category', { category: request.url.split('/').slice(-1)[0] });

  await enqueueLinks({
    label: 'ITEM',
    selector: 'table.wiki_table tr > td:nth-child(1) > a.wiki_link',
  });
});

router.addHandler('ITEM', async ({ log, $, request }) => {
  const name = $('a#page-title').text().split('|')[0].trim();
  const descBody = $('div#infobox tbody p');
  const desc =
    $('em', descBody).length === 0
      ? descBody.text()
      : $('em', descBody)
          .map((_, e) => $(e).text())
          .get()
          .join(' ')
          .trim();

  const sprite = $('div#infobox td img');
  const img = await saveItemImage(GAME_ID, name, request, sprite);

  log.info('item', { name, desc, file: img.filename });

  await dataset.pushData({
    url: request.url,
    name,
    flavor: desc,
    sprite: `./img/${name}.png`,
  });
});

export default info;
