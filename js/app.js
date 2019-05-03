const app = {};

app.util = {
  compress_txid: (txid) => `${txid.substring(0, 12)}...${txid.substring(59)}`,
  compress_tokenid: (tokenid) => `${tokenid.substring(0, 12)}...${tokenid.substring(59)}`,
  compress_string: (str, len=25) => str.substring(0, len) + ((str.length > len) ? '...' : ''),
  format_balance_class: (balance) => {
    balance = String(balance);
    const splitted = balance.split('.');
    let len = 0;
    if (splitted.length === 1) {
      return 'format-balance' + 10;
    } else {
      return 'format-balance' + (9-splitted[1].length);
    }
  },
  document_link: (doc) => {
    const email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const url_regex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

    if (email_regex.test(doc)) {
      return `mailto:${doc}`;
    }

    if (url_regex.test(doc)) {
      if (doc.startsWith('http') || doc.startsWith('https')) {
        return doc;
      }

      return `http://${doc}`;
    }

    if (doc.split(':').length === 2) {
      return doc;
    }

    return '';
  },

  create_pagination: ($el, page=0, max_page=10, fn) => {
    $paginator = $el.find('.pagination');
    $paginator.html('');

    $el.addClass('loading');
    fn(page, () => {
      $el.removeClass('loading');
    });

    // no need for paginator with 1 page
    if (max_page <= 1) {
      return;
    }

    let poffstart = page >= 2 ? page-2 : 0;
    let poffend   = Math.min(poffstart+5, max_page);

    if (poffend === max_page) {
      poffstart = Math.max(0, poffend - 5);
    }

    const row_tobeginning = $(`<li><a>«</a></li>`);
    row_tobeginning.click(() => app.util.create_pagination($el, 0, max_page, fn));
    $paginator.append(row_tobeginning);

    for (let poff=poffstart; poff<poffend; ++poff) {
      const row = $(`<li data-page="${poff}"><a>${poff+1}</a></li>`);

      row.click(function() {
        const page = parseInt($(this).data('page'));
        app.util.create_pagination($el, page, max_page, fn);
      });

      $paginator.append(row);
    }

    const row_toend = $(`<li><a>»</a></li>`);
    row_toend.click(() => app.util.create_pagination($el, max_page-1, max_page, fn));
    $paginator.append(row_toend);

    $paginator
      .find(`li[data-page="${page}"]`)
      .addClass('active');
  },

  extract_total: (o, key="count") => {
    if (! o) {
      return {
        u: 0,
        c: 0,
        g: 0,
        a: 0,
        t: 0,
      };
    }

    return {
      u: o.u ? (o.u.length ? o.u[0][key] : 0) : 0,
      c: o.c ? (o.c.length ? o.c[0][key] : 0) : 0,
      g: o.g ? (o.g.length ? o.g[0][key] : 0) : 0,
      a: o.a ? (o.a.length ? o.a[0][key] : 0) : 0,
      t: o.t ? (o.t.length ? o.t[0][key] : 0) : 0,
    };
  }
};

app.slpdb = {
  query: (query) => new Promise((resolve, reject) => {
    if (! query) {
      return resolve(false);
    }
    const b64 = btoa(JSON.stringify(query));
    const url = "https://slpdb.fountainhead.cash/q/" + b64;

    console.log(url)

    fetch(url)
    .then((r) => r = r.json())
    .then((r) => {
      if (r.hasOwnProperty('error')) {
        reject(new Error(r['error']));
      }
      resolve(r);
    });
  }),

  all_tokens: (limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "find": {},
      "sort": {
        "tokenStats.qty_valid_txns_since_genesis": -1
      },
      "limit": limit,
      "skip": skip
    }
  }),

  count_all_tokens: () => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "aggregate": [
        {
          "$match": {}
        },
        {
          "$group": {
            "_id": null,
            "count": { "$sum": 1 }
          }
        }
      ]
    },
    "r": {
      "f": "[ .[] | {count: .count } ]"
    }
  }),

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

  token_transaction_history: (tokenIdHex, address=null, limit=100, skip=0) => {
    let q = {
      "v": 3,
      "q": {
        "db": ["c", "u"],
        "find": {
          "$and": [
            { "slp.valid": true },
            { "slp.detail.tokenIdHex": tokenIdHex },
          ]
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
        "tx.h": txid,
      },
      "sort": { "blk.i": -1 }
    }
  }),

  count_txs_by_block: (height) => ({
    "v": 3,
    "q": {
      "db": ["c"],
      "aggregate": [
        {
          "$match": {
            "$and": [
              { "slp.valid": true },
              { "blk.i": height }
            ]
          }
        },
        {
          "$group": {
            "_id": null,
            "count": { "$sum": 1 }
          }
        }
      ]
    },
    "r": {
      "f": "[ .[] | {count: .count } ]"
    }
  }),

  count_txs_in_mempool: () => ({
    "v": 3,
    "q": {
      "db": ["u"],
      "aggregate": [
        {
          "$match": {
            "slp.valid": true
          }
        },
        {
          "$group": {
            "_id": null,
            "count": { "$sum": 1 }
          }
        }
      ]
    },
    "r": {
      "f": "[ .[] | {count: .count } ]"
    }
  }),

  txs_by_block: (height, limit=150, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["c"],
      "find": {
        "$and": [
          { "slp.valid": true },
          { "blk.i": height }
        ]
      },
      "limit": limit,
      "skip": skip
    }
  }),

  txs_in_mempool: (limit=150, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["u"],
      "find": {
        "slp.valid": true
      },
      "limit": limit,
      "skip": skip
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
        "tokenDetails.tokenIdHex": tokenIdHex,
        /* https://github.com/simpleledger/SLPDB/issues/23
        "token_balance": {
          "$ne": 0
        }
        */
      },
      "sort": { "token_balance": -1 },
      "limit": limit,
      "skip": skip
    }
  }),
  token_mint_history: (tokenIdHex, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["u", "c"],
      "find": {
        "slp.valid": true,
        "slp.detail.tokenIdHex": tokenIdHex,
        "$or": [
          {
            "slp.detail.transactionType": "GENESIS"
          },
          {
            "slp.detail.transactionType": "MINT"
          }
        ]
      },
      "sort": {
        "blk.i": 1
      },
      "limit": limit,
      "skip": skip
    }
  }),
  count_token_mint_transactions: (tokenIdHex) => ({
    "v": 3,
    "q": {
      "db": ["c"],
      "aggregate": [
        {
          "$match": {
            "slp.valid": true,
            "slp.detail.tokenIdHex": tokenIdHex,
            "$or": [
              {
                "slp.detail.transactionType": "GENESIS"
              },
              {
                "slp.detail.transactionType": "MINT"
              }
            ]
          }
        },
        {
          "$group": {
            "_id": null,
            "count": { "$sum": 1 }
          }
        }
      ]
    },
    "r": {
      "f": "[ .[] | {count: .count } ]"
    }
  }),

  recent_transactions: (limit=150, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["c", "u"],
      "find": {
        "$and": [
          { "slp.valid": true },
          { "slp.detail.transactionType": "SEND" },
        ]
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
      return false;
    }

    return {
      "v": 3,
      "q": {
        "db": ["c", "u"],
        "find": {
          "$and": [
            {
              "$or": [
                { "in.e.a":  cash_address },
                { "out.e.a": cash_address }
              ]
            },
            { "slp.valid": true }
          ]
        },
        "sort": { "blk.i": -1 },
        "limit": limit,
        "skip": skip
      }
    };
  },
  count_total_transactions_by_slp_address: (address) => {
    let cash_address = address;
    try {
      cash_address = slpjs.Utils.toCashAddress(address).split(':')[1];
    } catch (e) {
      return false;
    }

    return {
      "v": 3,
      "q": {
        "db": [
          "c",
          "u"
        ],
        "aggregate": [
          {
            "$match": {
              "$and": [
                {
                  "$or": [
                    { "in.e.a":  cash_address },
                    { "out.e.a": cash_address }
                  ]
                },
                { "slp.valid": true }
              ]
            }
          },
          {
            "$group": {
              "_id": null,
              "count": { "$sum": 1 }
            }
          }
        ]
      },
      "r": {
        "f": "[ .[] | {count: .count } ]"
      }
    };
  },
  count_tokens_by_slp_address: (address) => ({
    "v": 3,
    "q": {
      "db": ["a"],
      "aggregate": [
        {
          "$match": {
            "address": address
          }
        },
        {
          "$group": {
            "_id": null,
            "count": { "$sum": 1 }
          }
        }
      ]
    },
    "r": {
      "f": "[ .[] | {count: .count } ]"
    }
  }),


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

app.slpsocket = {
  init_listener: (query, fn) => {
    if (! query) {
      return resolve(false);
    }
    const b64 = btoa(JSON.stringify(query));
    const url = "https://slpsocket.fountainhead.cash/s/" + b64;

    const sse = new EventSource(url);
    sse.onmessage = (e) => fn(JSON.parse(e.data));
    return sse;
  },
};

app.get_tokens_from_tokenids = (token_ids, chunk_size=50) => {
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

app.get_tokens_from_transactions = (transactions, chunk_size=50) => {
  let token_ids = [];
  for (let m of transactions) {
    if (m.slp && m.slp.detail) token_ids.push(m.slp.detail.tokenIdHex);
  }
  token_ids = [...new Set(token_ids)]; // make unique

  return app.get_tokens_from_tokenids(token_ids, chunk_size);
};

app.extract_sent_amount_from_tx = (tx) => {
  // check if in and out are all same addresses
  while (true) {
    const chk = new Set();

    for (let v of tx.in) {
      chk.add(v.e.a);
    }

    for (let v of tx.out) {
      if (! chk.has(v.e.a)) {
        break;
      }
    }

    return tx.slp.detail.outputs
      .map(v => +v.amount)
      .reduce((a, v) => a + v, 0);
  }

  const outer = [
    ...new Set(tx.in.map(v => {
      try      { return slpjs.Utils.toSlpAddress(v.e.a) }
      catch(e) { return null; }
  }))];


  let ret = tx.slp.detail.outputs
    .filter((e) => outer.indexOf(e.address) < 0)
    .map(v => +v.amount)
    .reduce((a, v) => a + v, 0);

  const splitted = String(ret).split('.');
  if (splitted.length === 2 && splitted[1].length > 9) {
    return ret.toFixed(9);
  }

  return ret;
};

app.extract_recv_amount_from_tx = (tx, addr) =>
  tx.slp.detail.outputs
    .filter((e) => e.address === addr)
    .map(v => +v.amount)
    .reduce((a, v) => a + v, 0);

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
            const transactions = tx.u.concat(tx.c);

            app.get_tokens_from_transactions(transactions)
            .then((tx_tokens) => {
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
    if (! o.slp.detail) {
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

app.init_error_nonslp_tx_page = (txid) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_nonslp_tx_page({
    txid: txid
  }));
  resolve();
});

app.init_index_page = () =>
  new Promise((resolve, reject) => {
    $('main[role=main]')
    .html(app.template.index_page());

    app.attach_search_handler('#main-search');

    app.slpdb.query(app.slpdb.recent_transactions(10))
    .then((data) => {
      const transactions =  data.u.concat(data.c);

      app.get_tokens_from_transactions(transactions)
      .then((tx_tokens) => {
        $('#recent-transactions-table tbody').html('');

        for (let i=0; i<transactions.length && i<10; ++i) {
          $('#recent-transactions-table').append(
            app.template.latest_transactions_tx({
              tx: transactions[i],
              tx_tokens: tx_tokens
            })
          );
        }

        resolve();
      });
    });


    // load graphs in background
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
    ])
    .then(([monthly_usage, token_usage]) => {
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
    });

    app.slpsocket.init_listener({
      "v": 3,
      "q": {
        "db": ["u"],
        "find": {
          "slp.valid": true
        }
      }
    }, (data) => {
      if (data.type !== 'mempool' || data.data.length !== 1) {
        return;
      }
      const sna = data.data[0];

      app.slpdb.query(app.slpdb.token(sna.slp.detail.tokenIdHex))
      .then((token_data) => {
        if (token_data.t.length === 0) {
          console.error('slpsocket token not found');
          return;
        }
        const token = token_data.t[0];
        const data = {
          'txid': sna.tx.h,
          'symbol': token.tokenDetails.symbol,
          'amount': app.extract_sent_amount_from_tx(sna),
        };

        $('#recent-transactions-table tbody').prepend(
          app.template.latest_transactions_tx({
            tx: sna,
            tx_tokens: {
              [token.tokenDetails.tokenIdHex]: token
            }
          })
        );

        $('#recent-transactions-table').find('tbody tr:last').remove();
      });
    });
  })
  
app.init_all_tokens_page = () =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.count_all_tokens())
    .then((all_tokens_count) => {
      all_tokens_count = app.util.extract_total(all_tokens_count);

      $('main[role=main]').html(app.template.all_tokens_page());

      const load_paginated_tokens = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.all_tokens(limit, skip))
        .then((tokens) => {
          tokens = tokens.t;

          const tbody = $('#all-tokens-table tbody');
          tbody.html('');

          tokens.forEach((token) => {
            tbody.append(
              app.template.all_tokens_token({
                token: token
              })
            );
          });

          done();
        });
      };


      if (all_tokens_count.t === 0) {
        $('#all-tokens-table tbody').html('<tr><td>No tokens found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#all-tokens-table-container'),
          0,
          Math.ceil(all_tokens_count.t / 15),
          (page, done) => {
            load_paginated_tokens(15, 15*page, done);
          }
        );
      }

      resolve();
    })
  )

app.init_tx_page = (txid) =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.tx(txid))
    .then((tx) => {
      tx = tx.u.concat(tx.c);
      if (tx.length == 0) {
        return resolve(app.init_error_nonslp_tx_page(txid));
      }

      tx = tx[0];

      if (! tx.slp.valid) {
        $('main[role=main]').html(app.template.error_invalid_tx_page({
          tx: tx,
        }));

        return resolve();
      }

      app.slpdb.query(app.slpdb.token(tx.slp.detail.tokenIdHex))
      .then((token) => {
        $('main[role=main]').html(app.template.tx_page({
          tx:    tx,
          token: token.t[0]
        }));

        resolve();
      });
    })
  )

app.init_block_page = (height) =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.count_txs_by_block(height))
    .then((total_txs_by_block) => {
      total_txs_by_block = app.util.extract_total(total_txs_by_block);

      $('main[role=main]').html(app.template.block_page({
        height: height,
        total_txs: total_txs_by_block.c,
      }));

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.txs_by_block(height, limit, skip))
        .then((transactions) => {
          transactions = transactions.c;

          app.get_tokens_from_transactions(transactions)
          .then((tx_tokens) => {
            const tbody = $('#block-transactions-table tbody');
            tbody.html('');

            transactions.forEach((tx) => {
              tbody.append(
                app.template.block_tx({
                  tx: tx,
                  tx_tokens: tx_tokens,
                })
              );
            });

            done();
          });
        });
      };


      if (total_txs_by_block.c === 0) {
        $('#block-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#block-transactions-table-container'),
          0,
          Math.ceil(total_txs_by_block.c / 15),
          (page, done) => {
            load_paginated_transactions(15, 15*page, done);
          }
        );
      }

      resolve();
    })
  )

app.init_block_mempool_page = (height) =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.count_txs_in_mempool())
    .then((total_txs_in_mempool) => {
      total_txs_in_mempool = app.util.extract_total(total_txs_in_mempool);

      $('main[role=main]').html(app.template.block_page({
        height: "mempool",
        total_txs: total_txs_in_mempool.u,
      }));

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.txs_in_mempool(limit, skip))
        .then((transactions) => {
          transactions = transactions.u;

          app.get_tokens_from_transactions(transactions)
          .then((tx_tokens) => {
            const tbody = $('#block-transactions-table tbody');
            tbody.html('');

            transactions.forEach((tx) => {
              tbody.append(
                app.template.block_tx({
                  tx: tx,
                  tx_tokens: tx_tokens,
                })
              );
            });

            done();
          });
        });
      };

      if (total_txs_in_mempool.u === 0) {
        $('#block-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#block-transactions-table-container'),
          0,
          Math.ceil(total_txs_in_mempool.u / 15),
          (page, done) => {
            load_paginated_transactions(15, 15*page, done);
          }
        );
      }

      app.slpsocket.init_listener({
        "v": 3,
        "q": {
          "db": ["u"],
          "find": {
            "slp.valid": true
          }
        }
      }, (data) => {
        if (data.type !== 'mempool' || data.data.length !== 1) {
          return;
        }
        const sna = data.data[0];

        app.slpdb.query(app.slpdb.token(sna.slp.detail.tokenIdHex))
        .then((token_data) => {
          if (! token_data || ! token_data.t || token_data.t.length === 0) {
            console.error('slpsocket token not found');
            return;
          }
          const token = token_data.t[0];
          const data = {
            'txid': sna.tx.h,
            'symbol': token.tokenDetails.symbol,
            'amount': app.extract_sent_amount_from_tx(sna),
          };

          $('#block-transactions-table tbody').prepend(
            app.template.block_tx({
              tx: sna,
              tx_tokens: {
                [token.tokenDetails.tokenIdHex]: token
              }
            })
          );
        });
      });

      resolve();
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
    if (transactions.length === 0) {
      return app.init_404_page();
    }

    app.get_tokens_from_transactions(transactions)
    .then((tx_tokens) => {
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
      app.slpdb.query(app.slpdb.count_token_mint_transactions(tokenIdHex)),
      /* app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex, null, 10))*/
    ])
    .then(([token, total_token_mint_transactions]) => {
      total_token_mint_transactions = app.util.extract_total(total_token_mint_transactions);

      if (token.t.length == 0) {
        return resolve(app.init_404_page());
      } 

      token = token.t[0];

      $('main[role=main]').html(app.template.token_page({
        token: token
      }));

      const load_paginated_token_addresses = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.token_addresses(tokenIdHex, limit, skip))
        .then((addresses) => {
         const tbody = $('#token-addresses-table tbody');
         tbody.html('');

          addresses.a.forEach((address) => {
            tbody.append(
              app.template.token_address({
                address: address
              })
            );
          });

          done();
        });
      };

      const load_paginated_token_mint_history = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.token_mint_history(tokenIdHex, limit, skip))
        .then((transactions) => {
          // transactions = transactions.u.concat(transactions.c); // TODO fix this
          transactions = transactions.c;

          const tbody = $('#token-mint-history-table tbody');
          tbody.html('');

          transactions.forEach((tx) => {
            tbody.append(
              app.template.token_mint_tx({
                tx: tx
              })
            );
          });

          done();
        });
      };

      const load_paginated_token_txs = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex, null, limit, skip))
        .then((transactions) => {
          // transactions = transactions.u.concat(transactions.c); // TODO fix this
          transactions = transactions.c;

          const tbody = $('#token-transactions-table tbody');
          tbody.html('');

          transactions.forEach((tx) => {
            tbody.append(
              app.template.token_tx({
                tx: tx
              })
            );
          });

          done();
        });
      };

      if (token.tokenStats.qty_valid_token_addresses === 0) {
        $('#token-addresses-history-table tbody').html('<tr><td>No addresses found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#token-addresses-table-container'),
          0,
          Math.ceil(token.tokenStats.qty_valid_token_addresses / 10),
          (page, done) => {
            load_paginated_token_addresses(10, 10*page, done);
          }
        );
      }

      if (total_token_mint_transactions.c === 0) {
        $('#token-mint-history-table tbody').html('<tr><td>No mints found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#token-mint-history-table-container'),
          0,
          Math.ceil(total_token_mint_transactions.c / 10),
          (page, done) => {
            load_paginated_token_mint_history(10, 10*page, done);
          }
        );
      }

      if (token.tokenStats.qty_valid_txns_since_genesis === 0) {
        $('#token-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#token-transactions-table-container'),
          0,
          Math.ceil(token.tokenStats.qty_valid_txns_since_genesis / 10),
          (page, done) => {
            load_paginated_token_txs(10, 10*page, done);
          }
        );
      }

      resolve();
    })
  )


app.init_address_page = (address) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.count_tokens_by_slp_address(address)),
      app.slpdb.query(app.slpdb.count_total_transactions_by_slp_address(address)),
    ]).then(([total_tokens, total_transactions]) => {
      total_tokens = app.util.extract_total(total_tokens);
      total_transactions = app.util.extract_total(total_transactions);

      $('main[role=main]').html(app.template.address_page({
        address: address
      }));

      const load_paginated_tokens = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.tokens_by_slp_address(address, limit, skip))
        .then((tokens) => {
          tokens = tokens.a;

          app.get_tokens_from_tokenids(tokens.map(v => v.tokenDetails.tokenIdHex))
          .then((tx_tokens) => {
            const tbody = $('#address-tokens-table tbody');
            tbody.html('');

            tokens.forEach((token) => {
              tbody.append(
                app.template.address_token({
                  token: token,
                  tx_tokens: tx_tokens
                })
              );
            });

            done();
          });
        });
      };

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.transactions_by_slp_address(address, limit, skip))
        .then((transactions) => {
          // transactions = transactions.u.concat(transactions.c); // TODO fix this
          transactions = transactions.c;

          app.get_tokens_from_transactions(transactions)
          .then((tx_tokens) => {
            const tbody = $('#address-transactions-table tbody');
            tbody.html('');

            transactions.forEach((tx) => {
              tbody.append(
                app.template.address_transactions_tx({
                  tx: tx,
                  address: address,
                  tx_tokens: tx_tokens
                })
              );
            });

            done();
          });
        });
      };


      if (total_tokens.a === 0) {
        $('#address-tokens-table tbody').html('<tr><td>No tokens balances found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#address-tokens-table-container'),
          0,
          Math.ceil(total_tokens.a / 10),
          (page, done) => {
            load_paginated_tokens(10, 10*page, done);
          }
        );
      }


      if (total_transactions.c === 0) {
        $('#address-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#address-transactions-table-container'),
          0,
          Math.ceil(total_transactions.c / 10),
          (page, done) => {
            load_paginated_transactions(10, 10*page, done);
          }
        );
      }

      resolve();
    })
  )


app.attach_search_handler = (selector) => {
  $(selector).closest('form').submit(false);
  
  $(selector).autocomplete({
    groupBy: 'category',
    preventBadQueries: false, // retry query in case slpdb hasnt yet indexed something
    triggerSelectOnValidInput: false, // disables reload on clicking into box again
    width: 'flex',
    lookup: function (query, done) {
      let search_value = $(selector).val().trim();

      // check if address entered
      if (slpjs.Utils.isSlpAddress(search_value)) {
        $(selector).val('');
        return app.router('/#address/'+search_value);
      }

      if (slpjs.Utils.isCashAddress(search_value)) {
        $(selector).val('');
        return app.router('/#address/'+slpjs.Utils.toSlpAddress(search_value));
      }

      if (slpjs.Utils.isLegacyAddress(search_value)) {
        $(selector).val('');
        return app.router('/#address/'+slpjs.Utils.toSlpAddress(search_value));
      }
  
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
        })
      ]).then(([tokens, transactions]) => {
        let sugs = [];

        for (let m of tokens.t) {
          if (m.tokenDetails.tokenIdHex === search_value) {
            $(selector).val('');
            return app.router('/#token/'+m.tokenDetails.tokenIdHex);
          }

          const ctxid = app.util.compress_txid(m.tokenDetails.tokenIdHex);
          let tval = null;
          if (m.tokenDetails.symbol) {
            tval = m.tokenDetails.symbol + ' | ' + ctxid;
          } else if (m.tokenDetails.name) {
            tval = m.tokenDetails.name + ' | ' + ctxid;
          } else {
            tval = ctxid;
          }

          sugs.push({
            value: tval,
            data: {
              url: '/#token/'+m.tokenDetails.tokenIdHex,
              category: 'Tokens'
            }
          });
        }
        transactions = transactions.u.concat(transactions.c);
        for (let m of transactions) {
          if (m.tx.h === search_value) {
            $(selector).val('');
            return app.router('/#tx/'+m.tx.h);
          }

          sugs.push({
            value: m.tx.h,
            data: {
              url: '/#tx/'+m.tx.h,
              category: 'Tx'
            }
          });
        }

        done({ suggestions: sugs });
      });
    },
    onSelect: function (sug) {
      $(selector).val('');
      app.router(sug.data.url);
    }
  });
};


app.router = (whash, push_history = true) => {
  if (! whash) {
    whash = window.location.hash.substring(1);
  }

  const [_, path, key] = whash.split('/');


  let method = null;

  switch (path) {
    case '':
    case '#':
      document.title = 'TokenDB';
      method = () => {
          $('html').addClass('index-page');
          return app.init_index_page();
      };
      break;
    case '#alltokens':
      document.title = 'All Tokens - TokenDB';
      method = () => app.init_all_tokens_page();
      break;
    case '#tx':
      document.title = 'Transaction ' + key + ' - TokenDB';
      method = () => app.init_tx_page(key);
      break;
    case '#block':
      document.title = 'Block ' + key + ' - TokenDB';
      if (key === 'mempool') {
        method = () => app.init_block_mempool_page();
      } else {
        method = () => app.init_block_page(parseInt(key));
      }
      break;
    case '#token':
      document.title = 'Token ' + key + ' - TokenDB';
      method = () => app.init_token_page(key);
      break;
    case '#address':
      document.title = 'Address ' + key + ' - TokenDB';
      method = () => app.init_address_page(key);
      break;
    case '#tokengraph':
      document.title = 'TokenGraph ' + key + ' - TokenDB';
      method = () => {
          $('html').addClass('full-width');
          return app.init_tokengraph_page(key);
      };
      break;
    case '#addressgraph':
      document.title = 'AddressGraph ' + key + ' - TokenDB';
      method = () => {
          $('html').addClass('full-width');
          return app.init_addressgraph_page(key);
      };
      break;
    case '#txgraph':
      document.title = 'TxGraph ' + key + ' - TokenDB';
      method = () => {
          $('html').addClass('full-width');
          return app.init_txgraph_page(key);
      };
      break;
    default:
      document.title = '404 | slp-explorer';
      console.error('app.router path not found', whash);
      method = () => app.init_404_page();
      break;
  }

  $('html').removeClass();
  $('html').addClass('loading');
  $('html').scrollTop(0);
  method().then(() => {
    $('html').removeClass('loading');
    $('footer').removeClass('display-none');

    if (push_history) {
      history.pushState({}, document.title, whash);
    }
  });
}

$(document).ready(() => {
  $(window).on('popstate', (e) => {
    app.router(window.location.pathname+window.location.hash, false);
  });

  app.attach_search_handler('#header-search');

  const views = [
    'index_page',
    'latest_transactions_tx',
    'all_tokens_page',
    'all_tokens_token',
    'tx_page',
    'block_page',
    'block_tx',
    'token_page',
    'token_mint_tx',
    'token_address',
    'token_tx',
    'address_page',
    'address_transactions_tx',
    'address_token',
    'tokengraph_page',
    'addressgraph_page',
    'txgraph_page',
    'error_404_page',
    'error_nonslp_tx_page',
    'error_invalid_tx_page',
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

const error_handler = (modal_html) => {
  $('#error-modal-text').html(modal_html);
  $('#error-modal').removeClass('display-none');
  return false;
};

window.onerror = function (message, file, line, col, error) {
  return error_handler(`
    message: ${message}<br>
    file: ${file}<br>
    line: ${line}<br>
    col: ${col}<br>
  `);
};

window.addEventListener("error", function (e) {
  console.error(e);
  return error_handler(e.error.message);
});

window.addEventListener('unhandledrejection', function (e) {
  console.error(e);
  return error_handler(e.reason.message);
});

const reload_page = () => {
  window.location.hash = window.location.hash;
  window.location.reload();
};
