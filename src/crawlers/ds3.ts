import { exit } from 'process';
import { Item } from '../types.js';
import { makeWikiCrawler, saveItemImage, trim } from '../util.js';

const GAME_ID = 'ds3';

const info = await makeWikiCrawler({
  gameId: GAME_ID,
});

const { crawler, router, dataset } = info;

await crawler.addRequests([
  { url: 'https://darksouls3.wiki.fextralife.com/Items' },
]);

router.addDefaultHandler(async ({ enqueueLinks, crawler }) => {
  await enqueueLinks({
    label: 'CATEGORY',
    selector:
      'div#wiki-content-block > div[id^="embedded"] > div > div.btn-group > a',
  });

  // special case item
  await crawler.addRequests([
    {
      url: "https://darksouls3.wiki.fextralife.com/Greirat's+Ashes",
      label: 'ITEM',
      userData: {
        category: 'Ashes',
      },
    },
  ]);
});

router.addHandler('CATEGORY', async ({ enqueueLinks, log, request, $ }) => {
  let nameColIdx = '1';
  //   await writeFile(`./${request.url.split('/').slice(-1)[0]}.html`, $.html({ normalizeWhitespace: true }));

  $('table.wiki_table > tbody th').each((idx, elt) => {
    if (/name|soul/i.test($(elt).text())) {
      nameColIdx = (idx + 1).toString();
      return false;
    }
    return true;
  });

  const category = request.url.split('/').slice(-1)[0];
  log.info('category', { category });

  await enqueueLinks({
    label: 'ITEM',
    selector: `table.wiki_table > tbody tr > td:nth-child(${nameColIdx}) a`,
    userData: {
      category,
    },
  });
});

router.addHandler('ITEM', async ({ log, request, $ }) => {
  const name = $('a#page-title').text().split('|')[0].trim();

  if (name.length === 0) {
    return;
  }

  const descBody =
    $('blockquote').length !== 0
      ? $('blockquote')
      : $('table.wiki_table tr > td > p');

  const desc = ($('em', descBody).length === 0 ? descBody : $('em', descBody))
    .map((_, e) => $(e).text())
    .get()
    .join(' ')
    .trim()
    .replaceAll(/\n/g, '')
    .replaceAll(/ +/g, ' ')
    .trim();

  const sprite = $('table.wiki_table tbody > tr > td img');
  if (!sprite.length) {
    log.warning('empty img', { name });
  }
  const img = await saveItemImage(GAME_ID, name, request, sprite);

  log.info('item', { name, flavor: desc, img: img.filename });

  await dataset.pushData({
    name,
    flavor: desc,
    category: request.userData.category,
    game: GAME_ID,
    sprite: `./img/${name}.png`,
    url: request.url,
  });
});

function sanitizer(item: Item): Item {
  return {
    ...item,
    category: item.category.replaceAll('+', ' '),
    flavor: trim(
      item.flavor
        .replaceAll(/\u00a0/g, '')
        .replaceAll(/([^\s]\.|,)([^\s])/g, '$1 $2'),
      '"',
    ),
  };
}

export default { ...info, sanitizer };
