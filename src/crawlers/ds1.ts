import { Item } from '../types.js';
import { makeWikiCrawler, saveItemImage, trim } from '../util.js';

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
  const category = request.url.split('/').slice(-1)[0];
  log.info('category', { category });

  await enqueueLinks({
    label: 'ITEM',
    selector: 'table.wiki_table tr > td:nth-child(1) > a.wiki_link',
    userData: {
      category,
    },
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
    game: GAME_ID,
    category: request.userData.category,
    flavor: desc,
    sprite: `./img/${name}.png`,
  });
});

function sanitizer(item: Item): Item {
  if (item.name === 'Skull Lantern') {
    item.flavor =
      "Skull Lantern of the Catacombs necromancer. Drops from his long beard locks. This lantern alights the Tomb of the Giants, Nito's light-devouring domain of death. Also serves as a fire damage strike weapon.";
  }

  return {
    ...item,
    flavor: trim(item.flavor, '"').replaceAll(/([^\s]\.)([^\s])/g, '$1 $2'),
    category: item.category.replaceAll('+', ' '),
  };
}

export default { ...info, sanitizer };
