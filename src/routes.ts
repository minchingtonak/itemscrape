import { createCheerioRouter, Dataset, RequestQueue } from 'crawlee';
import { image } from 'image-downloader';
import isURL from 'validator/lib/isURL.js';

export const router = createCheerioRouter();
export const queue = await RequestQueue.open();

await queue.addRequest({ url: 'https://darksouls.wiki.fextralife.com/Items' });

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
  const sprite = $('div#infobox td img').attr('src');

  const img = await image({
    url: isURL(sprite!, { require_protocol: true })
      ? sprite!
      : `${request.url.split('/').slice(0, -1).join('')}${sprite}`,
    dest: `${process.cwd()}/img/${request.url.split('/').slice(-1)[0]}.png`,
  });

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

  log.info('item', { name, desc, file: img.filename });

  await Dataset.pushData({ url: request.url, name, desc });
});
