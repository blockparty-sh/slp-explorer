const app = {};

app.slpdb = {
  query: (query) => new Promise((resolve, reject) => {
    const b64 = btoa(JSON.stringify(query));
    const url = "https://slpdb.fountainhead.cash/q/" + b64;

    console.log(url)
    resolve(
        fetch(url)
        .then((r) => r.json())
    );
  }),

  all_tokens: (limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "find": {},
      "limit": limit,
      "skip": skip
    }
  }),

  token_transaction_history: (tokenIdHex, address, limit=100, skip=0) => {
    let q = {
      "v": 3,
      "q": {
        "db": ["c", "u"],
        "find": {
          "$query": {
            "slp.detail.tokenIdHex": tokenIdHex
          }
        },
        "sort": { "blk.i": -1 },
        "limit": limit,
        "skip": skip
      },
      "r": {
        "f": "[.[] | { tx: .tx, tokenDetails: .slp, blk: .blk } ]"
      }
    };

    if (typeof address !== 'undefined') {
      q['q']['find']['$query']['$or'] = [
        { "in.e.a":  address },
        { "out.e.a": address }
      ];
    }

    return q;
  },

  tx: (txid) => ({
    "v": 3,
    "q": {
      "db": ["c", "u"],
      "find": {
        "$query": {
          "tx.h": txid
        },
      },
      "sort": { "blk.i": -1 }
    },
    "r": {
      "f": "[.[] | { outputs: .out, inputs: .in, tokenDetails: .slp, blk: .blk, tx: .tx } ]"
    }
  }),

  token: (tokenIdHex) => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "find": {
        "tokenDetails.tokenIdHex": tokenIdHex
      },
      "limit": 1
    }
  }),
  tokens: (tokenIdHexs) => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "find": {
        "tokenDetails.tokenIdHex": {
          "$in": tokenIdHexs
        }
      },
      "limit": tokenIdHexs.length
    }
  }),
  token_addresses: (tokenIdHex, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["a"],
      "find": {
        "tokenDetails.tokenIdHex": tokenIdHex
      },
      "limit": limit,
      "skip": skip
    }
  }),
  transactions_by_cash_address: (address, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["c", "u"],
      "find": {
        "$or": [
          { "in.e.a":  address },
          { "out.e.a": address }
        ]
      },
      "sort": { "blk.i": -1 },
      "limit": limit,
      "skip": skip
    }
  }),
  tokens_by_slp_address: (address, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "find": {
        "addresses.address": address,
      },
      "sort": { "tokenStats.block_created": -1 },
      "limit": limit,
      "skip": skip
    }
  }),
};

app.init_404_page = () => {
  $('main[role=main]').html(app.template.error_404_page());
  $('body').removeClass('loading');
};

app.init_all_tokens_page = () =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.all_tokens(1000))
    .then((data) => {
      $('main[role=main]')
        .html(app.template.all_tokens_page(data))
        .find('#tokens-table').DataTable()

      $('body').removeClass('loading')
    })
  )

app.init_tx_page = (txid) =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.tx(txid))
    .then((data) => {
      const tmp = (tx) => new Promise((resolve, reject) => {
        return app.slpdb.query(app.slpdb.token(tx.tokenDetails.detail.tokenIdHex))
        .then((data) => {
          tx['tokenDetails']['full'] = data.t[0].tokenDetails;
          $('main[role=main]').html(app.template.tx_page(tx));

          $('body').removeClass('loading');
        });
      });

           if (data.u.length > 0) return tmp(data.u[0]);
      else if (data.c.length > 0) return tmp(data.c[0]);
      else                        return app.init_404_page();
    })
  )

app.init_token_page = (tokenIdHex) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.token(tokenIdHex)),
      app.slpdb.query(app.slpdb.token_addresses(tokenIdHex)),
      app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex))
    ])
    .then(([token, addresses, transactions]) => {
      console.log(token);
      console.log(addresses);
      console.log(transactions);

      if (token.t.length == 0) {
        return app.init_404_page()
      } 

      $('main[role=main]').html(app.template.token_page({
        token:        token.t[0],
        addresses:    addresses.a,
        transactions: transactions
      }));

      $('#token-transactions-table').DataTable();
      $('#token-addresses-table').DataTable();
      $('body').removeClass('loading');
    })
  )


app.init_address_page = (address) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.tokens_by_slp_address(address, 1000)),
      app.slpdb.query(app.slpdb.transactions_by_cash_address(
        slpjs.Utils.toCashAddress(address).split(':')[1], 1000
      ))
    ]).then(([tokens, transactions]) => {
      console.log(tokens);
      console.log(transactions);

      let token_ids = [];
      for (let m of transactions.c) {
        if (m.slp) token_ids.push(m.slp.detail.tokenIdHex);
      }
      for (let m of transactions.u) {
        if (m.slp) token_ids.push(m.slp.detail.tokenIdHex);
      }

      const chunk_size = 50;

      let reqs = [];
      for (let i=0; i<Math.ceil(token_ids.length / chunk_size); ++i) {
        reqs.push(app.slpdb.query(
          app.slpdb.tokens(token_ids.slice(chunk_size*i, (chunk_size*i)+chunk_size))
        ));
      }

      return Promise.all(reqs)
      .then((results) => {
        let tx_tokens = [];
        results.map(v => v.t).flat().forEach(v => {
          tx_tokens[v.tokenDetails.tokenIdHex] = v;
        })

        console.log(tx_tokens);
        console.log(transactions);

        $('main[role=main]').html(app.template.address_page({
          address:      address,
          tokens:       tokens.t,
          transactions: transactions,
          tx_tokens:    tx_tokens
        }));
        $('#address-tokens-table').DataTable();
        $('#address-transactions-table').DataTable();

        $('body').removeClass('loading');
      })
    })
  )


app.router = (whash, push_history = true) => {
  if (! whash) {
    whash = window.location.hash.substring(1);
  }

  console.log('app.router', whash, whash.split('/'));

  if (push_history) {
    history.pushState({}, "some title", whash);
  }

  const [_, path, key] = whash.split('/');


  let method = null;

  switch (path) {
    case '':
    case '#':
      document.title = 'All Tokens | slp-explorer';
      method = () => app.init_all_tokens_page();
      break;
    case '#tx':
      document.title = 'Tx(' + key + ') | slp-explorer';
      method = () => app.init_tx_page(key);
      break;
    case '#token':
      document.title = 'Token(' + key + ') | slp-explorer';
      method = () => app.init_token_page(key);
      break;
    case '#address':
      document.title = 'Address(' + key + ') | slp-explorer';
      method = () => app.init_address_page(key);
      break;
    default:
      document.title = '404 | slp-explorer';
      console.error('app.router path not found', whash);
      return;
  }

  $('body').addClass('loading');
  method();
}

$(document).ready(() => {
  $(window).on('popstate', (e) => {
    console.log('pop', window.location.pathname);
    app.router(window.location.pathname+window.location.hash, false);
  });


  const views = [
    'all_tokens_page',
    'tx_page',
    'token_page',
    'address_page',
    'error_404_page',
  ];

  app.template = {}

  console.time('loading views');
  Promise.all(views.map(v => {
    const url = 'views/' + v + '.ejs';
    console.info('downloading view: ' + url);
    return fetch(url).then(v => v.text())
  }))
  .then(texts => {
    texts.forEach((v, i) => {
      console.info('compiling: ' + views[i]);
      app.template[views[i]] = ejs.compile(v);
    });
  })
  .then(() => {
    console.timeEnd('loading views');
    app.router(window.location.pathname+window.location.hash, false);
  });
});
