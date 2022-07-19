import { makeWikiCrawler, saveItemImage } from '../util.js';

const GAME_ID = 'ds2';

const info = await makeWikiCrawler({
  gameId: GAME_ID,
});

const { crawler, router, dataset } = info;

await crawler.addRequests([
  { url: 'https://darksouls2.wiki.fextralife.com/Items' },
]);

router.addDefaultHandler(async ({ enqueueLinks, crawler }) => {
  await enqueueLinks({
    label: 'CATEGORY',
    selector:
      'div#wiki-content-block > div[id^="embedded"] > div > div.btn-group > a',
  });

  // special case items
  await crawler.addRequests([
    {
      url: 'https://darksouls2.wiki.fextralife.com/Illusory+Ring+of+the+Vengeful',
      label: 'ITEM',
    },
    {
      url: 'https://darksouls2.wiki.fextralife.com/Illusory+Ring+of+the+Guilty',
      label: 'ITEM',
    },
    {
      url: 'https://darksouls2.wiki.fextralife.com/Soul+of+Alsanna',
      label: 'ALSANNA',
    },
  ]);
});

router.addHandler('CATEGORY', async ({ enqueueLinks, log, request, $ }) => {
  if (/unused/i.test(request.url.split('/').slice(-1)[0])) {
    return;
  }

  let nameColIdx = '2';
  //   await writeFile(`./${request.url.split('/').slice(-1)[0]}.html`, $.html({ normalizeWhitespace: true }));

  $('table.wiki_table > tbody th').each((idx, elt) => {
    if (/name/i.test($(elt).text())) {
      nameColIdx = (idx + 1).toString();
      return false;
    }
    return true;
  });

  log.info('category', {
    // idx: nameColIdx,
    category: request.url.split('/').slice(-1)[0],
    // text: $(`table.wiki_table > tbody tr > td:nth-child(${nameColIdx}) a`).text(),
  });

  await enqueueLinks({
    label: 'ITEM',
    selector: `table.wiki_table > tbody tr > td:nth-child(${nameColIdx}) a`,
  });
});

router.addHandler('ITEM', async ({ log, request, $ }) => {
  const name = $('a#page-title').text().split('|')[0].trim();

  const descBody =
    $('blockquote').length !== 0
      ? $('blockquote')
      : $('table.wiki_table tr > td > p');

  const desc = (
    $('em', descBody).length === 0
      ? descBody.text()
      : $('em', descBody)
          .map((_, e) => $(e).text())
          .get()
          .join(' ')
          .trim()
  )
    .replaceAll(/\n/g, '')
    .replaceAll(/ +/g, ' ')
    // .replace(/^"?(.+?)"?$/g, '$1')
    .trim();

  // if (name.length === 0) {
  //   log.warning('empty name', { url: request.url });
  // }
  // if (desc.length === 0) {
  //   log.warning('empty desc', { name });
  // }

  const sprite = $('table.wiki_table tbody > tr > td img');
  if (!sprite.length) {
    log.warning('empty img', { name });
  }
  const img = await saveItemImage(GAME_ID, name, request, sprite);

  log.info('item', { name, flavor: desc, img: img.filename });

  await dataset.pushData({
    name,
    flavor: desc,
    sprite: `./img/${name}.png`,
    url: request.url,
  });
});

router.addHandler('ALSANNA', async ({ log, request, $ }) => {
  const name = $('a#page-title').text().split('|')[0].trim();

  const desc = $('div#wiki-content-block > em')
    .map((_, e) => $(e).text())
    .get()
    .join(' ')
    .trim()
    .replaceAll(/\n/g, '')
    .replaceAll(/ +/g, ' ');

  const sprite = $('div#wiki-content-block > h1 + img');
  if (!sprite.length) {
    log.warning('empty img', { name });
  }
  const img = await saveItemImage(GAME_ID, name, request, sprite);

  log.info('alsanna', { name, flavor: desc, file: img.filename });

  await dataset.pushData({
    name,
    flavor: desc,
    sprite: `./img/${name}.png`,
    url: request.url,
  });
});

export default info;
