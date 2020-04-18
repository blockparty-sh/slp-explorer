require('dotenv').config();

const fs = require('fs');
const isBot = require('isbot');
const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const path = require('path');

let browser = null;

const replaceLinksIfBot = (html) => html.replace(/href="\/#/g, 'href="/');

const loadPage = async (res, req, url) => {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', req => {
    const whitelist = ['document', 'script', 'xhr', 'fetch', 'image'];
    if (! whitelist.includes(req.resourceType())) {
      return req.abort();
    }

    req.continue();
  });

  await page.goto(url, {
    waitUntil: "networkidle0"
  });

  let content = await page.content();

  // for bots we want them stuck in pre-rendered land
  if (isBot(req.headers['user-agent'])) {
    content = replaceLinksIfBot(content);
  }

  return res.send(content);
}

const router = express.Router();

// this is the normal website it is treated a bit differently to the others
// to allow for self-crawling without recursion hell
router.get('/', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname+'/public/index.html'), 'utf-8');
  console.log(req.headers['user-agent']);

  // for bots we want them stuck in pre-rendered land
  if (isBot(req.headers['user-agent'])) {
    html = replaceLinksIfBot(html);
  }

  return res.send(html);
});

router.get('/alltokens', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?isbot=${isBot(req.header['user-agent'])}#alltokens`));

router.get('/dividend', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?isbot=${isBot(req.header['user-agent'])}#dividend`));

router.get('/tx/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?isbot=${isBot(req.header['user-agent'])}#tx/${req.params.item}`));

router.get('/bchtx/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?isbot=${isBot(req.header['user-agent'])}#bchtx/${req.params.item}`));

router.get('/token/:item', async (req, res) =>
  loadPage(res, req, `http://127.0.0.1:8000/?isbot=${isBot(req.header['user-agent'])}#token/${req.params.item}`));

router.get('/address/:item', async (req, res) =>
  loadPage(res, req, `http://127.0.0.1:8000/?isbot=${isBot(req.header['user-agent'])}#address/${req.params.item}`));

router.get('/block/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?isbot=${isBot(req.header['user-agent'])}#block/${req.params.item}`));

app.use('/', router);
app.use('/', express.static('public'));

(async () => {
  browser = await puppeteer.launch();

  const port = process.env.port || 8000;
  app.listen(port);
  console.log(`listening on port: ${port}`);
})();
