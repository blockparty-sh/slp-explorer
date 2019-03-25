const app = {};

app.util = {
  compress_txid: (txid) => `${txid.substring(0, 12)}...${txid.substring(59)}`
};

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
  recent_transactions: (limit=150, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["c", "u"],
      "find": {
        "slp.detail.transactionType": "SEND"
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
    results
    .map(v => v.t)
    .reduce((a, v) => a.concat(v), [])
    .forEach(v => tx_tokens[v.tokenDetails.tokenIdHex] = v)

    return tx_tokens;
  });
};

app.extract_sent_amount_from_tx = (tx) => {
  const outer = [
    ...new Set(tx.in.map(v => {
      try      { return slpjs.Utils.toSlpAddress(v.e.a) }
      catch(e) { return null; }
  }))];

  return tx.slp.detail.outputs
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
          // TODO load tokengraph if type is genesis
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


app.cytoscape_extract_graph = (tx_tokens, transactions, prune=false) => {
  let items     = [];
  let addresses = new Set();
  let addresses_out = new Set();

  for (let o of transactions) {
    if (! o.slp) {
      continue;
    }

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
      addresses.add(o.slp.detail.outputs[0].address);
      addresses_out.add(o.slp.detail.outputs[0].address);

      items.push({ data: {
        id:      o.slp.detail.outputs[0].address + "/" + o.tx.h + "/out",
        source:  o.tx.h,
        target:  o.slp.detail.outputs[0].address,
        color:   app.cytoscape_txout_color,
        kind:    "txout",
        val:     o.slp.detail.outputs[0].amount + " " + tx_tokens[o.slp.detail.tokenIdHex].tokenDetails.symbol,
        padding: 0
      }});
    } else if (o.slp.detail.transactionType === 'SEND') {
      for (let m of o.slp.detail.outputs) {
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
        .DataTable({searching:false,lengthChange:false,order: []}) // sort by transaction count

        resolve();
      })
    })
  )

app.init_charts_page = () =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query({
        "v": 3,
        "q": {
          "db": ["c"],
          "aggregate": [
            {
              "$match": {
                "slp.valid": true,
                "blk.t": {
                  "$gte": (+(new Date) / 1000) - (60*60*24*30),
                  "$lte": (+(new Date) / 1000)
                }
              }
            },
            {
              "$group": {
                 "_id" : "$blk.t",
                "count": {"$sum": 1}
              }
            }
          ],
          "limit": 10000
        },
        "r": {
          "f": "[ .[] | {block_epoch: ._id, txs: .count} ]"
        }
      }),
      app.slpdb.query({
        "v": 3,
        "q": {
          "aggregate": [
            {
              "$match": {
                "blk.t": {
                  "$gte": (+(new Date) / 1000) - (60*60*24*30),
                  "$lte": (+(new Date) / 1000),
                }
              }
            },
            {
              "$group": {
                "_id": "$slp.detail.name",
                "count": {
                  "$sum": 1
                }
              }
            },
            {
              "$sort": {
                "count": -1
              }
            },
              {
              "$limit": 20
            }
          ]
        },
        "r": {
          "f": "[ .[] | {token_name: ._id, txs: .count} ]"
        }
      }),
    ]).then(([monthly_usage, token_usage]) => {

      console.log(monthly_usage)
      $('main[role=main]')
      .html(app.template.chart_page())

      for (let o of monthly_usage.c) {
        o.block_epoch = new Date(o.block_epoch * 1000);
      }
      monthly_usage.c.sort((a, b) => a.block_epoch - b.block_epoch);

      const monthly_usage_block = monthly_usage.c;

      let monthly_usage_day_t = [];
      {
        let ts = +(monthly_usage.c[0].block_epoch);
        let dayset = [];

        for (let m of monthly_usage.c) {
          if (+(m.block_epoch) > ts + (60*60*24*1000)) {
            ts = +(m.block_epoch);
            monthly_usage_day_t.push(dayset);
            dayset = [];
          }
          dayset.push(m);
        }

        monthly_usage_day_t.push(dayset);
      }
      const monthly_usage_day = monthly_usage_day_t
      .map(m =>
        m.reduce((a, v) =>
          ({
            block_epoch: a.block_epoch || v.block_epoch,
            txs: a.txs + v.txs
          }), {
            block_epoch: null,
            txs: 0
          }
        )
      );


      Plotly.newPlot('plot-monthly-usage', [
        {
          x: monthly_usage_block.map(v => v.block_epoch),
          y: monthly_usage_block.map(v => v.txs),
          fill: 'tozeroy',
          type: 'scatter',
          name: 'Per Block',
        },
        {
          x: monthly_usage_day.map(v => v.block_epoch),
          y: monthly_usage_day.map(v => v.txs),
          fill: 'tonexty',
          type: 'scatter',
          name: 'Daily',
        }
      ], {
        title: 'SLP Usage',
        yaxis: {
          title: 'Transactions'
        }
      })

    
      let token_usage_monthly = token_usage.c;
      const total_slp_tx_month = monthly_usage_day.reduce  ((a, v) => a + v.txs, 0);

      token_usage_monthly.push({
        token_name: 'Other',
        txs: total_slp_tx_month - token_usage_monthly.reduce((a, v) => a + v.txs, 0)
      })
      Plotly.newPlot('plot-token-usage', [{
        labels: token_usage_monthly.map(v => v.token_name),
        values: token_usage_monthly.map(v => v.txs),
        type: 'pie',
     }], {
        title: 'Popular Tokens This Month',
     })


      resolve();
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
        cy.json({ elements: app.cytoscape_extract_graph({[token.tokenDetails.tokenIdHex]: token}, transactions) }, true)
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
        cy.json({ elements: app.cytoscape_extract_graph(tx_tokens, transactions) })
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

      $('#token-transactions-table').DataTable({searching:false,order: []});
      $('#token-addresses-table').DataTable({searching:false,order: [[1, 'desc']]}); // sort by token balance

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
        console.log(tokens)
        console.log(transactions);

        $('main[role=main]').html(app.template.address_page({
          address:      address,
          tokens:       tokens.a,
          transactions: transactions,
          tx_tokens:    tx_tokens
        }));

        $('#address-tokens-table').DataTable({searching:false,order: []});
        $('#address-transactions-table').DataTable({searching:false,order: []});

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
      document.title = 'SLP Explorer';
      method = () => app.init_index_page();
      break;
    case '#charts':
      method = () => app.init_charts_page();
      break;
    case '#alltokens':
      document.title = 'All Tokens - SLP Explorer';
      method = () => app.init_all_tokens_page();
      break;
    case '#tx':
      document.title = 'Transaction ' + key + ' - SLP Explorer';
      method = () => app.init_tx_page(key);
      break;
    case '#token':
      document.title = 'Token ' + key + ' - SLP Explorer';
      method = () => app.init_token_page(key);
      break;
    case '#address':
      document.title = 'Address ' + key + ' - SLP Explorer';
      method = () => app.init_address_page(key);
      break;
    case '#tokengraph':
      document.title = 'TokenGraph ' + key + ' - SLP Explorer';
      method = () => app.init_tokengraph_page(key);
      break;
    case '#addressgraph':
      document.title = 'AddressGraph ' + key + ' - SLP Explorer';
      method = () => app.init_addressgraph_page(key);
      break;
    case '#txgraph':
      document.title = 'TxGraph ' + key + ' - SLP Explorer';
      method = () => app.init_txgraph_page(key);
      break;
    default:
      document.title = '404 | slp-explorer';
      console.error('app.router path not found', whash);
      method = () => app.init_404_page();
      break;
  }

  $('html').addClass('loading');
  $('html').scrollTop(0);
  method().then(() => {
    console.log('done')
    $('html').removeClass('loading');

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

  const views = [
    'index_page',
    'all_tokens_page',
    'chart_page',
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
