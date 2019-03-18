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

  token_transaction_history: (tokenIdHex, address=null, limit=100, skip=0) => {
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
      }
    };

    if (address !== null) {
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
    /*"r": {
      "f": "[.[] | { outputs: .out, inputs: .in, tokenDetails: .slp, blk: .blk, tx: .tx } ]"
    }*/
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
  // TODO filter token balances with 0
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
  recent_transactions: (limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["c", "u"],
      "find": {
        "slp": {
          "$exists": true
        }
      },
      "sort": { "blk.i": -1 },
      "limit": limit,
      "skip": skip
    }
  }),
  transactions_by_slp_address: (address, limit=100, skip=0) => {
    let cash_address = address;
    try {
      cash_address = slpjs.Utils.toCashAddress(address).split(':')[1];
    } catch (e) {
      return app.init_404_page();
    }

    return {
      "v": 3,
      "q": {
        "db": ["c", "u"],
        "find": {
          "$or": [
            { "in.e.a":  cash_address },
            { "out.e.a": cash_address }
          ]
        },
        "sort": { "blk.i": -1 },
        "limit": limit,
        "skip": skip
      }
    };
  },
  tokens_by_slp_address: (address, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["a"],
      "find": {
        "address": address,
      },
      "sort": { "token_balance": -1 },
      "limit": limit,
      "skip": skip
    }
  }),
  tokengraph: (tokenIdHex, limit=10000, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["g"],
      "find": {
        "tokenDetails.tokenIdHex": tokenIdHex,
      },
      "limit": 10000
    }
  }),
};


app.get_tokens_from_transactions = (transactions, chunk_size=50) => {
  let token_ids = [];
  for (let m of transactions) {
    if (m.slp && m.slp.detail) token_ids.push(m.slp.detail.tokenIdHex);
  }
  token_ids = [...new Set(token_ids)]; // make unique

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

    return tx_tokens;
  });
};

app.extract_sent_amount_from_tx = (tx) => {
  const outer = [
    ...new Set(tx.in.map(v => {
      try      { return slpjs.Utils.toSlpAddress(v.e.a) }
      catch(e) { return null; }
  }))];

  return tx.slp.detail.sendOutputs
    .filter((e) => outer.indexOf(e.address) < 0)
    .map(v => +v.amount)
    .reduce((a, v) => a + v, 0);
};

app.create_cytoscape_context = (selector='.graph_container') => {
  let cy = cytoscape({
    container: $(selector),
    style: [
    {
      selector: "node",
      style: {
        "width": 10,
        "height": 10,
        "background-color": "transparent",
        "border-color": "data(color)",
        "border-width": 2,
        "padding": "data(padding)",
        "shape": "data(type)",
        "text-wrap": "wrap",
        "text-rotation": "-20deg",
        "font-size": 2,
        "text-halign": "right",
        "color": "rgba(0,0,0,0.5)",
        "label": "data(val)"
      }
    },
    {
      selector: ":selected",
      style: {
        "padding": 5,
        "background-color": "transparent",
        "border-color": app.cytoscape_select_color,
        "border-width": 4,
      }
    },
    {
      selector: "edge",
      style: {
        "width": 1,
        "label": "data(val)",
        "text-wrap": "wrap",
        "text-halign": "right",
        "font-size": 2,
        "line-color": "data(color)",
        "target-arrow-color": "data(color)",
        "text-background-opacity": 1,
        "text-background-color": "data(color)",
        "text-border-color": "data(color)",
        "text-border-width": 5,
        "text-border-style": "solid",
        "color": "white",
        "text-border-color": "data(color)",
        "text-rotation": "-20deg",
        "text-border-width": 5,
        "curve-style": "bezier",
        "target-arrow-shape": "triangle"
      }
    }],
    layout: {
      name: 'klay',
      animate: true
    }
  });

  cy.once('render', (e) => {
    cy.on('tap', (e) => {
      const tdata = e.target.json();

      if (tdata.data) switch(tdata.data.kind) {
        case 'tx':
          app.slpdb.query(app.slpdb.tx(tdata.data.id))
          .then((tx) => {
            let transactions = tx.u.concat(tx.c);
            console.log(transactions);

            app.get_tokens_from_transactions(transactions)
            .then((tx_tokens) => {
              console.log(tx_tokens);

              cy.json({ elements: app.cytoscape_extract_graph(tx_tokens, transactions) })
                .layout({ name: 'klay', animate: true })
                .run()
            });

            history.pushState({}, document.title, "/#txgraph/"+tdata.data.id);
          });

          break;
        case 'address':
          app.slpdb.query(app.slpdb.transactions_by_slp_address(tdata.data.id, 1000))
          .then((transactions) => {
            transactions = transactions.u.concat(transactions.c);

            app.get_tokens_from_transactions(transactions)
            .then((tx_tokens) => {
              console.log(tx_tokens);

              cy.json({ elements: app.cytoscape_extract_graph(tx_tokens, transactions) })
                .layout({ name: 'klay', animate: true })
                .run()

              history.pushState({}, document.title, "/#addressgraph/"+tdata.data.id);
            });
          });

          break;
      }
    });
  });

  return cy;
}

app.cytoscape_txin_color   = "#DE35E9";
app.cytoscape_txout_color  = "#35C1E9";
app.cytoscape_select_color = "#E9358F";


app.cytoscape_extract_graph = (tx_tokens, transactions, prune=true) => {
  let items     = [];
  let addresses = new Set();
  let addresses_out = new Set();

  for (let o of transactions) {
    let tcolor = "#333";
    let ttype = "diamond";

    if (o.slp.detail.transactionType === 'GENESIS') {
      tcolor = "#E9C335";
      ttype  = "star";
    }
    if (o.slp.detail.transactionType === 'MINT') {
      tcolor = "#4DE935";
      ttype  = "octagon";
    }

    items.push({ data: {
      id:      o.tx.h,
      color:   tcolor,
      type:    ttype,
      kind:    "tx",
      val:     o.tx.h,
      padding: 0
    }});

    for (let m of o.in) {
      const slp_addr = slpjs.Utils.toSlpAddress(m.e.a);
      addresses.add(slp_addr);

      items.push({ data: {
        id:      m.e.a + "/" + o.tx.h + "/in",
        source:  slp_addr,
        target:  o.tx.h,
        color:   app.cytoscape_txin_color,
        kind:    "txin",
        val:     '',
        padding: 0
      }});
    }

    if (o.slp.detail.transactionType === 'GENESIS' || o.slp.detail.transactionType === 'MINT') {
      console.log('genesis', o);
      addresses.add(o.slp.detail.genesisOrMintQuantity.address);
      addresses_out.add(o.slp.detail.genesisOrMintQuantity.address);

      items.push({ data: {
        id:      o.slp.detail.genesisOrMintQuantity.address + "/" + o.tx.h + "/out",
        source:  o.tx.h,
        target:  o.slp.detail.genesisOrMintQuantity.address,
        color:   app.cytoscape_txout_color,
        kind:    "txout",
        val:     o.slp.detail.genesisOrMintQuantity.amount + " " + tx_tokens[o.slp.detail.tokenIdHex].tokenDetails.symbol,
        padding: 0
      }});
    } else if (o.slp.detail.transactionType === 'SEND') {
      for (let m of o.slp.detail.sendOutputs) {
        addresses.add(m.address);
        addresses_out.add(m.address);

        items.push({ data: {
          id:      m.address + "/" + o.tx.h + "/out",
          source:  o.tx.h,
          target:  m.address,
          color:   app.cytoscape_txout_color,
          kind:    "txout",
          val:     m.amount + " " + tx_tokens[o.slp.detail.tokenIdHex].tokenDetails.symbol,
          padding: 0
        }});
      }
    }
  }

  // remove addresses without slp outputs to them
  if (prune) {
    let difference = new Set([...addresses].filter(v => ! addresses_out.has(v)));
    items = items.filter(v => {
      if (v.data.kind === 'txin' && difference.has(v.data.source)) {
        return false;
      }
      return true;
    });

    difference.forEach(v => addresses.delete(v));
  }

  addresses.forEach(v => {
    items.push({ data: {
      id:    v,
      color: "#AAA",
      type: "square",
      kind:  "address",
      val:   v,
      padding: 0
    }});
  });

  return items;
};


app.init_404_page = () => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_404_page());
  resolve();
});

app.init_index_page = () =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.recent_transactions())
    .then((data) => {

      const transactions =  data.u.concat(data.c);

      app.get_tokens_from_transactions(transactions)
      .then((tx_tokens) => {
        console.log(tx_tokens);

        $('main[role=main]')
        .html(app.template.index_page({
          transactions: transactions,
          tx_tokens: tx_tokens
        }))
        .find('#recent-transactions-table')
        .DataTable({order: []}) // sort by transaction count

        resolve();
      })
    })
  )

app.init_all_tokens_page = () =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.all_tokens(1000))
    .then((data) => {
      $('main[role=main]')
        .html(app.template.all_tokens_page(data))
        .find('#tokens-table').DataTable({order: [7, 'desc']}) // sort by transaction count
      resolve();
    })
  )

app.init_tx_page = (txid) =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.tx(txid))
    .then((tx) => {
      tx = tx.u.concat(tx.c);
      if (tx.length == 0) {
        return app.init_404_page();
      }

      tx = tx[0];

      app.slpdb.query(app.slpdb.token(tx.slp.detail.tokenIdHex))
      .then((token) => {
        console.log(tx);
        $('main[role=main]').html(app.template.tx_page({
          tx:    tx,
          token: token.t[0]
        }));

        resolve();
      });
    })
  )

app.init_tokengraph_page = (tokenIdHex) =>
  new Promise((resolve, reject) => 
    Promise.all([
      app.slpdb.query(app.slpdb.token(tokenIdHex)),
      app.slpdb.query(app.slpdb.tokengraph(tokenIdHex)),
      app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex, null, 1000)),
    ]).then(([token, graph, transactions]) => {
      if (token.t.length === 0) {
        return resolve(app.init_404_page());
      }
      transactions = transactions.u.concat(transactions.c);
      token = token.t[0];

      $('main[role=main]').html(app.template.tokengraph_page({
        token: token
      }));

      const reload = () => {
        cy.json({ elements: app.cytoscape_extract_graph({[token.tokenDetails.tokenIdHex]: token}, transactions) })
          .layout({ name: 'klay', animate: true })
          .run()
      };

      $('#reset-button').click(() => {
        history.pushState({}, document.title, "/#tokengraph/"+tokenIdHex);
        reload();
      });

      let cy = app.create_cytoscape_context();
      reload();

      resolve();
    })
  )

app.init_addressgraph_page = (address) =>
  app.slpdb.query(app.slpdb.transactions_by_slp_address(address, 1000))
  .then((transactions) => {
    transactions = transactions.u.concat(transactions.c);

    return app.get_tokens_from_transactions(transactions)
    .then((tx_tokens) => {
      console.log(tx_tokens);

      $('main[role=main]').html(app.template.addressgraph_page({
        address: address
      }));

      const reload = () => {
        cy.json({ elements: app.cytoscape_extract_graph(tx_tokens, transactions) })
          .layout({ name: 'klay', animate: true })
          .run()
      };

      $('#reset-button').click(() => {
        history.pushState({}, document.title, "/#addressgraph/"+address);
        reload();
      });

      let cy = app.create_cytoscape_context();
      reload();
    })
  })

app.init_txgraph_page = (txid) =>
  app.slpdb.query(app.slpdb.tx(txid))
  .then((tx) => {
    let transactions = tx.u.concat(tx.c);
    console.log('TX TX', transactions);

    if (transactions.length === 0) {
      return app.init_404_page();
    }

    app.get_tokens_from_transactions(transactions)
    .then((tx_tokens) => {
      console.log(tx_tokens);

      $('main[role=main]').html(app.template.txgraph_page({
        tx: transactions[0]
      }));

      const reload = () => {
        cy.json({ elements: app.cytoscape_extract_graph(tx_tokens, transactions, false) })
          .layout({ name: 'klay', animate: true })
          .run()
      };

      $('#reset-button').click(() => {
        history.pushState({}, document.title, "/#txgraph/"+txid);
        reload();
      });

      let cy = app.create_cytoscape_context();
      reload();
    });
  })

app.init_token_page = (tokenIdHex) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.token(tokenIdHex)),
      app.slpdb.query(app.slpdb.token_addresses(tokenIdHex, 1000)),
      app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex, null, 1000))
    ])
    .then(([token, addresses, transactions]) => {
      console.log(token);
      console.log(addresses);
      console.log(transactions);

      if (token.t.length == 0) {
        return resolve(app.init_404_page());
      } 

      $('main[role=main]').html(app.template.token_page({
        token:        token.t[0],
        addresses:    addresses.a,
        transactions: transactions.u.concat(transactions.c)
      }));

      $('#token-transactions-table').DataTable({order: []});
      $('#token-addresses-table').DataTable({order: [[1, 'desc']]}); // sort by token balance

      resolve();
    })
  )


app.init_address_page = (address) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.tokens_by_slp_address(address, 1000)),
      app.slpdb.query(app.slpdb.transactions_by_slp_address(address, 1000))
    ]).then(([tokens, transactions]) => {
      console.log(tokens);
      console.log(transactions);

      transactions = transactions.u.concat(transactions.c);

      app.get_tokens_from_transactions(transactions)
      .then((tx_tokens) => {
        console.log(tx_tokens);
        console.log(transactions);

        $('main[role=main]').html(app.template.address_page({
          address:      address,
          tokens:       tokens.a,
          transactions: transactions,
          tx_tokens:    tx_tokens
        }));

        $('#address-tokens-table').DataTable({order: []});
        $('#address-transactions-table').DataTable({order: []});

        resolve();
      })
    })
  )

app.router = (whash, push_history = true) => {
  if (! whash) {
    whash = window.location.hash.substring(1);
  }

  console.log('app.router', whash, whash.split('/'));

  const [_, path, key] = whash.split('/');


  let method = null;

  switch (path) {
    case '':
    case '#':
      document.title = 'slp-explorer';
      method = () => app.init_index_page();
      break;
    case '#alltokens':
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
    case '#tokengraph':
      document.title = 'TokenGraph(' + key + ') | slp-explorer';
      method = () => app.init_tokengraph_page(key);
      break;
    case '#addressgraph':
      document.title = 'AddressGraph(' + key + ') | slp-explorer';
      method = () => app.init_addressgraph_page(key);
      break;
    case '#txgraph':
      document.title = 'TxGraph(' + key + ') | slp-explorer';
      method = () => app.init_txgraph_page(key);
      break;
    default:
      document.title = '404 | slp-explorer';
      console.error('app.router path not found', whash);
      method = () => app.init_404_page();
      break;
  }

  $('body').addClass('loading');
  $('html').scrollTop(0);
  method().then(() => {
    console.log('done')
    $('body').removeClass('loading');

    if (push_history) {
      history.pushState({}, document.title, whash);
    }
  });
}

$(document).ready(() => {
  $(window).on('popstate', (e) => {
    console.log('pop', window.location.pathname);
    app.router(window.location.pathname+window.location.hash, false);
  });

  $('#header-nav form').submit(false);

  $('#main-search').autocomplete({
    groupBy: 'category',
    preventBadQueries: false, // retry query in case slpdb hasnt yet indexed something
    triggerSelectOnValidInput: false, // disables reload on clicking into box again
    width: 'flex',
    lookup: function (query, done) {
      let search_value = $('#main-search').val().trim();

      try {
        if (slpjs.Utils.isCashAddress(search_value)) {
          search_value = slpjs.Utils.toSlpAddress(search_value);
        }
      } catch (e) { /* this is to work around https://github.com/simpleledger/slpjs/issues/10 */ }

      Promise.all([
        app.slpdb.query({
          "v": 3,
          "q": {
            "db": ["t"],
            "find": {
              "$or": [
                {
                  "tokenDetails.tokenIdHex": search_value
                },
                {
                  "tokenDetails.name": {
                    "$regex": "^"+search_value+".*",
                    "$options": "i"
                  }
                },
                {
                  "tokenDetails.symbol": {
                    "$regex": "^"+search_value+".*",
                    "$options": "i"
                  }
                }
              ]
            },
            "limit": 10
          }
        }),
        app.slpdb.query({
          "v": 3,
          "q": {
            "db": ["u", "c"],
            "find": {"tx.h": search_value},
            "limit": 1
          }
        }),
        app.slpdb.query({
          "v": 3,
          "q": {
            "db": ["a"],
            "find": {"address": search_value},
            "limit": 1
          }
        })
      ]).then(([tokens, transactions, addresses]) => {
          console.log(addresses);
        let sugs = [];

        for (let m of tokens.t) {
          sugs.push({
            value: m.tokenDetails.symbol,
            data: {
              url: '/#token/'+m.tokenDetails.tokenIdHex,
              category: 'Tokens'
            }
          });
        }
        for (let m of transactions.u) {
          sugs.push({
            value: m.tx.h,
            data: {
              url: '/#tx/'+m.tx.h,
              category: 'Tx'
            }
          });
        }
        for (let m of transactions.c) {
          sugs.push({
            value: m.tx.h,
            data: {
              url: '/#tx/'+m.tx.h,
              category: 'Tx'
            }
          });
        }
        for (let m of addresses.a) {
          sugs.push({
            value: m.address,
            data: {
              url: '/#address/'+m.address,
              category: 'Address'
            }
          });
        }

        done({ suggestions: sugs });
      });
    },
    onSelect: function (sug) {
      app.router(sug.data.url);
    }
  });

  const views = [
    'index_page',
    'all_tokens_page',
    'tx_page',
    'token_page',
    'address_page',
    'tokengraph_page',
    'addressgraph_page',
    'txgraph_page',
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
