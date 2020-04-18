const btoa = require('btoa');
const fetch = require('node-fetch');

const tokens_query = {
  "v": 3,
  "q": {
    "db": ["t"],
    "find": {
      "tokenStats.approx_txns_since_genesis": {
        "$gte": 100
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
    "limit": 1000
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
    "limit": 1000
  }
};

const slpdbQuery = (query) => fetch(`https://slpdb.fountainhead.cash/q/${btoa(JSON.stringify(query))}`)
.then((data) => data.json());

console.log(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://simpleledger.info/</loc></url>
<url><loc>https://simpleledger.info/alltokens</loc></url>
<url><loc>https://simpleledger.info/dividend</loc></url>
<url><loc>https://simpleledger.info/block/mempool</loc></url>`);


slpdbQuery(tokens_query)
.then((data) => {
  for (let m of data.t) {
    console.log(`<url><loc>https://simpleledger.info/token/${m.tokenDetails.tokenIdHex}</loc></url>`);
  }

  slpdbQuery(addresses_query)
  .then((data) => {
    for (let m of data.g) {
      console.log(`<url><loc>https://simpleledger.info/address/${m._id}</loc></url>`);
    }

    console.log(`</urlset>`);
  });
});
