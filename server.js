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

  await page.goto(url, {
    waitUntil: "networkidle0"
  });

  let content = await page.content();

  // for bots we want them stuck in pre-rendered land
  if (isBot(req.headers['users-agent'])) {
    content = replaceLinks(content);
  }

  return res.send(content);
}

const router = express.Router();

router.get('/', (req,res) => {
  let html = fs.readFileSync(path.join(__dirname+'/public/index.html'), 'utf-8');

  // for bots we want them stuck in pre-rendered land
  if (isBot(req.headers['users-agent'])) {
    html = replaceLinks(html);
  }

  return res.send(html);
});

router.get('/alltokens', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?disablesse=1#alltokens`));

router.get('/dividend', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?disablesse=1#dividend`));

router.get('/tx/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?disablesse=1#tx/${req.params.item}`));

router.get('/bchtx/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?disablesse=1#bchtx/${req.params.item}`));

router.get('/token/:item', async (req, res) =>
  loadPage(res,`req, http://127.0.0.1:8000/?disablesse=1#token/${req.params.item}`));

router.get('/address/:item', async (req, res) =>
  loadPage(res, req, `http://127.0.0.1:8000/?disablesse=1#address/${req.params.item}`));

router.get('/block/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:8000/?disablesse=1#block/${req.params.item}`));

app.use('/', router);
app.use('/', express.static('public'));

(async () => {
  browser = await puppeteer.launch();

  const port = process.env.port || 8000;
  app.listen(port);
  console.log(`listening on port: ${port}`);
})();
