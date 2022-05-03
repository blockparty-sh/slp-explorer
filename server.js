require('dotenv').config();

const fs = require('fs');
const isBot = require('isbot');
const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const btoa = require('btoa');
const fetch = require('node-fetch');

const port = process.env.port || 8000;
const host = process.env.port || "localhost";

const app = express();
let browser = null;

const replaceLinksIfBot = (html) => html.replace(/href="\/#/g, 'href="/');

const maxPageLifeTime = 1000*60 // close pages older than 60 seconds
const pageScanFrequency = 1000*60 // scan pages every 60 seconds

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms)
  })
}

const closeOldPages = async () => {
  if (browser) {
    for (const page of await browser.pages()) {
      if (!await page.isClosed()) {
        const pageTimestamp = await page.evaluate(`window.performance.now()`)
        if (pageTimestamp > maxPageLifeTime) {
          await page.close();
        }
      }
    }
  }
}

setIntervalAsync(closeOldPages, pageScanFrequency)


const loadPage = async (res, req, url) => {
  let page = null;
  let content = null;

  try {
    page = await browser.newPage();

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

    content = await page.content();
    page.close();
  } catch(e) {
    if(page) {
      page.close();
    }
    console.log(e);
    res.status(500);
    res.render('error', {error: e});
    return;
  }
  try {
    page.close();
  } catch (e) {}


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

const genUrlParams = (req) => `?isbot=${isBot(req.header['user-agent'])}&lng=${req.query.lng || 'en'}`;

router.get('/alltokens', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:${port}/${genUrlParams(req)}#alltokens`));

router.get('/dividend', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:${port}/${genUrlParams(req)}#dividend`));

router.get('/tx/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:${port}/${genUrlParams(req)}#tx/${req.params.item}`));

router.get('/bchtx/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:${port}/${genUrlParams(req)}#bchtx/${req.params.item}`));

router.get('/token/:item', async (req, res) =>
  loadPage(res, req, `http://127.0.0.1:${port}/${genUrlParams(req)}#token/${req.params.item}`));

router.get('/address/:item', async (req, res) =>
  loadPage(res, req, `http://127.0.0.1:${port}/${genUrlParams(req)}#address/${req.params.item}`));

router.get('/block/:item', async (req, res) => 
  loadPage(res, req, `http://127.0.0.1:${port}/${genUrlParams(req)}#block/${req.params.item}`));

router.get('/sitemap.xml', async (req, res) => {
  const tokens_query = {
    "v": 3,
    "q": {
      "db": ["t"],
      "find": {
        "tokenStats.approx_txns_since_genesis": {
          "$gte": 10
        }
      },
      "sort": {
        "tokenStats.approx_txns_since_genesis": -1
      },
      "project": {
        "_id": 0,
        "tokenDetails.tokenIdHex": 1,
        "tokenStats": 1
      },
      "limit": 10000
    }
  };
  
  const addresses_query = {
    "v": 3,
    "db": ["g"],
    "q": {
      "aggregate": [
        {
          "$match": {}
        },
        {
          "$limit": 1000000
        },
        {
          "$unwind": "$graphTxn.outputs"
        },
        {
          "$group": {
            "_id": "$graphTxn.outputs.address",
            "cnt": {
              "$sum": 1
            }
          }
        },
        {
          "$sort": {
            "cnt": -1
          }
        }
      ],
      "sort": {
        "cnt": -1
      },
      "limit": 10000
    }
  };

  const transactions_query = {
    "v": 3,
    "q": {
      "db": ["c"],
      "find": {},
      "sort": {
        "blk.i": -1
      },
      "project": {
        "_id": -1,
        "tx.h": 1
      },
      "limit": 10000
    }
  };


  let response = "";
  
  const slpdbQuery = (query) => fetch(`https://slpdb.bitcoin.com/q/${btoa(JSON.stringify(query))}`)
  .then((data) => data.json());
  
  response += `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://simpleledger.info/</loc></url>
<url><loc>https://simpleledger.info/alltokens</loc></url>
<url><loc>https://simpleledger.info/dividend</loc></url>
<url><loc>https://simpleledger.info/block/mempool</loc></url>`;
  
  
  return slpdbQuery(tokens_query)
  .then((data) => {
    for (let m of data.t) {
      response += `<url><loc>https://simpleledger.info/token/${m.tokenDetails.tokenIdHex}</loc></url>\n`;
    }
  
    return slpdbQuery(addresses_query)
    .then((data) => {
      for (let m of data.g) {
        response += `<url><loc>https://simpleledger.info/address/${m._id}</loc></url>\n`;
      }

      return slpdbQuery(transactions_query)
      .then((data) => {
        for (let m of data.c) {
          response += `<url><loc>https://simpleledger.info/tx/${m.tx.h}</loc></url>\n`;
        }
  
        response += `</urlset>`;

        res.set('Content-Type', 'application/xml');
        return res.send(response);
      });
    });
  });
});

app.use('/', router);
app.use('/', express.static('public'));

async function resetBrowser() {
  browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
    headless: true
  });
}

(async () => {
  await resetBrowser();
  app.listen(port);
  console.log(`listening on port: ${port}`);

  setInterval(async () => {
    await resetBrowser();
  }, 1000*60*60);
})();
