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
    $el.html('');

    fn(page);

    const poffstart = page >= 5 ? page-5 : 0;
    const poffend   = Math.min(poffstart+10, max_page);

    const row_tobeginning = $(`<li><a>«</a></li>`);
    row_tobeginning.click(() => app.util.create_pagination($el, 0, max_page, fn));
    $el.append(row_tobeginning);

    for (let poff=poffstart; poff<poffend; ++poff) {
      const row = $(`<li data-page="${poff}"><a>${poff+1}</a></li>`);

      row.click(function() {
        const page = parseInt($(this).data('page'));
        app.util.create_pagination($el, page, max_page, fn);
      });

      $el.append(row);
    }

    const row_toend = $(`<li><a>»</a></li>`);
    row_toend.click(() => app.util.create_pagination($el, max_page-1, max_page, fn));
    $el.append(row_toend);

    $el
      .find(`li[data-page="${page}"]`)
      .addClass('active');
  },
};

app.slpdb = {
  query: (query) => new Promise((resolve, reject) => {
    if (! query) {
      return resolve(false);
    }
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
  // check if in and out are all same address
  {
    const chk = new Set();
    for (let v of tx.in) {
      chk.add(v.e.a);
    }
    for (let v of tx.out) {
      chk.add(v.e.a);
    }

    if (chk.size === 1) {
      return 0;
    }
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

app.init_error_nonslp_tx_page = (txid) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_nonslp_tx_page({
    txid: txid
  }));
  resolve();
});

app.init_index_page = () =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.recent_transactions(25))
    .then((data) => {
      const transactions =  data.u.concat(data.c);

      app.get_tokens_from_transactions(transactions).then((tx_tokens) => {
        $('main[role=main]')
        .html(app.template.index_page({
          transactions: transactions,
          tx_tokens: tx_tokens
        }));

        const recent_transactions_data_table_init = () =>
          $('#recent-transactions-table')
          .DataTable({
            searching: false,
            lengthChange: false,
            ordering: false,
            order: []
          });

        let recent_transactions_table = recent_transactions_data_table_init();

        app.attach_search_handler('#main-search');

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

            recent_transactions_table.destroy();

            $('#recent-transactions-table tbody').prepend(
              app.template.latest_transactions_tx({
                tx: sna,
                tx_tokens: {
                  [token.tokenDetails.tokenIdHex]: token
                }
              })
            );

            recent_transactions_table = recent_transactions_data_table_init();
          });
        });

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
        .find('#tokens-table').DataTable({order: [3, 'desc']}) // sort by transaction count
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
      app.slpdb.query(app.slpdb.token_mint_history(tokenIdHex, 1000)),
      app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex, null, 1000))
    ])
    .then(([token, addresses, mint_history, transactions]) => {
      console.log(token);
      console.log(addresses);
      console.log(mint_history);
      console.log(transactions);

      if (token.t.length == 0) {
        return resolve(app.init_404_page());
      } 

      $('main[role=main]').html(app.template.token_page({
        token:        token.t[0],
        addresses:    addresses.a,
        mint_history: mint_history.u.concat(mint_history.c),
        transactions: transactions.u.concat(transactions.c)
      }));

      $('#token-transactions-table').DataTable({searching:false,order: []});
      $('#token-addresses-table').DataTable({searching:false,order: [[1, 'desc']]}); // sort by token balance
      $('#token-mint-history-table').DataTable({searching:false,order: [[3, 'asc']]}); // sort by block height

      resolve();
    })
  )


app.init_address_page = (address) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.tokens_by_slp_address(address, 10)),
      app.slpdb.query(app.slpdb.count_total_transactions_by_slp_address(address)),
    ]).then(([tokens, total_transactions]) => {
      console.log(tokens);
      console.log(total_transactions);

      if (! total_transactions) {
        return resolve(app.init_404_page());
      }

      total_transactions = {
        c: total_transactions.c.length ? total_transactions.c[0].count : 0,
        u: total_transactions.u.length ? total_transactions.u[0].count : 0,
      };

      app.get_tokens_from_tokenids(tokens.a.map(v => v.tokenDetails.tokenIdHex))
      .then((tx_tokens) => {
        $('main[role=main]').html(app.template.address_page({
          address:   address,
          tokens:    tokens.a,
          tx_tokens: tx_tokens
        }));

        const load_paginated_transactions = (limit, skip) => {
          app.slpdb.query(app.slpdb.transactions_by_slp_address(address, limit, skip))
          .then((transactions) => {
            transactions = transactions.u.concat(transactions.c);

            app.get_tokens_from_transactions(transactions)
            .then((tx_tokens) => {
             const tbody = $('#address-transactions-table tbody');
             tbody.html('');

              transactions.forEach((tx) => {
                tbody.prepend(
                  app.template.address_transactions_tx({
                    tx: tx,
                    address: address,
                    tx_tokens: tx_tokens
                  })
                );
              });
            });
          });
        };

        app.util.create_pagination(
          $('#address-transactions-table-container .pagination'),
          0,
          Math.ceil(total_transactions.c) / 10,
          (page) => {
            load_paginated_transactions(10, 10*page);
          }
        );

        resolve();
      });
    })
  )


app.attach_search_handler = (selector) => {
  $(selector).closest('form').submit(false);
  
  console.log($(selector))
  $(selector).autocomplete({
    groupBy: 'category',
    preventBadQueries: false, // retry query in case slpdb hasnt yet indexed something
    triggerSelectOnValidInput: false, // disables reload on clicking into box again
    width: 'flex',
    lookup: function (query, done) {
      let search_value = $(selector).val().trim();

      // check if address entered
      try {
        if (slpjs.Utils.isSlpAddress(search_value)) {
          $(selector).val('');
          return app.router('/#address/'+search_value);
        }

        if (slpjs.Utils.isCashAddress(search_value)) {
          $(selector).val('');
          return app.router('/#address/'+slpjs.Utils.toSlpAddress(search_value));
        }
      } catch (e) { /* TODO this is to work around https://github.com/simpleledger/slpjs/issues/10 */ }
  
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
      app.router(sug.data.url);
    }
  });
};


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
    console.log('done')
    $('html').removeClass('loading');
    $('footer').removeClass('display-none');

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

  app.attach_search_handler('#header-search');

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
    'error_nonslp_tx_page',
    'error_invalid_tx_page',
    'latest_transactions_tx',
    'address_transactions_tx',
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
