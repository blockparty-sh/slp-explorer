const app = {};

app.verified_tokens = [];

app.util = {
  generate_exchange_links: ($el, tokenIdHex) => {
    const altilly_tokens = {
      '527a337f34e04b1974cb8a1edc7ca30b2e444bea111afc122259552243c1dbe3': 'LLM',
      '077c832a3ef15068ca2c72dd262883fb24a8a0f612e8a92f579f7dee3eaca372': 'YCLO',
      '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf': 'SPICE',
    };

    const coinex_tokens = {
      'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479': 'https://www.coinex.com/exchange?currency=usdt&dest=usdh',
      '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf': 'https://www.coinex.com/exchange?currency=bch&dest=spice',
    };

    const sideshift_tokens = {
      'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479': 'https://sideshift.ai/bch/usdh',
      '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf': 'https://sideshift.ai/bch/spice',
      '7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f': 'https://sideshift.ai/bch/saislp',
    };

    const sideshift_tokens_settle = {
      'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479': 'usdh',
      '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf': 'spice',
      '7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f': 'saislp',
    };

    const cryptophyl_tokens = {
      '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf': 'https://cryptophyl.com/trade/SPICE-BCH',
      'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479': 'https://cryptophyl.com/trade/BCH-USDH',
      '0f3f223902c44dc2bee6d3f77d565904d8501affba5ee0c56f7b32e8080ce14b': 'https://cryptophyl.com/trade/DROP-BCH',
    };

    let links = [];
    /* waiting for launch
    ret.push({
      'link': `https://slpdex.cash/tokens/${tokenIdHex}`,
      'class': 'exchange-slpdex-icon'
    });
    */
    if (cryptophyl_tokens.hasOwnProperty(tokenIdHex)) {
      links.push({
        'type': 'cryptophyl',
        'link': `${cryptophyl_tokens[tokenIdHex]}?r=blockparty`,
        'class': 'exchange-cryptophyl-icon'
      });
    }

    if (sideshift_tokens.hasOwnProperty(tokenIdHex)) {
      links.push({
        'type': 'sideshift',
        'link': sideshift_tokens[tokenIdHex],
        'class': 'exchange-sideshift-icon',
        'meta': {
          'settleMethodId': sideshift_tokens_settle[tokenIdHex]
        }
      });
    }

    if (coinex_tokens.hasOwnProperty(tokenIdHex)) {
      links.push({
        'type': 'coinex',
        'link': coinex_tokens[tokenIdHex],
        'class': 'exchange-coinex-icon'
      });
    }

    if (altilly_tokens.hasOwnProperty(tokenIdHex)) {
      links.push({
        'type': 'altilly',
        'link': `https://www.altilly.com/asset/${altilly_tokens[tokenIdHex]}`,
        'class': 'exchange-altilly-icon'
      });
    }

    if (links.length > 0) {
      $el.append('<hr>');
    }
    for (const m of links) {
      $obj = $(`<a href="${m.link}" target="blank"><div class="exchange-icon ${m.class}"></div></a>`);
      if (m.type === 'sideshift') {
        $obj.click((event) => {
          event.preventDefault();
		  window.scrollTo(0, 0);
          window.__SIDESHIFT__ = {
            testerId: "9a8b1c79b64edf17",
            parentAffiliateId: "jsKIdsWiF",
            defaultDepositMethodId: "bch" || undefined,
			defaultSettleMethodId: m.meta.settleMethodId,
            settleAddress: "" || undefined,
          };
          sideshift.show();
        });
      }
      $el.append($obj);
    }
  },
  format_bignum: (bn) => {
    let dpos  = -1;
    let nzpos = -1;

    for (let i=0; i<bn.length; ++i) {
      if (bn[i] === '.') {
        dpos = i;
        break;
      }
    }

    if (dpos === -1) {
      return bn;
    }

    for (let i=bn.length-1; i>dpos; --i) {
      if (bn[i] !== '0') {
        nzpos = i;
        break;
      }
    }

    if (nzpos === -1) {
      return bn.substr(0, dpos);
    }

    return bn.substr(0, nzpos+1);
  },
  format_bignum_str: (str, decimals) => app.util.format_bignum(new BigNumber(str).toFormat(decimals), decimals),
  format_bignum_bch_str: (str) => {
    const bn = new BigNumber(str).dividedBy(100000000);
    return app.util.format_bignum_str(bn.toFormat(8), 8);
  },
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

    const protocol_regex = /^[a-zA-Z]+:\/\/(.*)$/;

    if (email_regex.test(doc)) {
      return `mailto:${doc}`;
    }

    if (url_regex.test(doc)) {
      if (doc.startsWith('http') || doc.startsWith('https')) {
        return doc;
      }

      return `http://${doc}`;
    }

    if (protocol_regex.test(doc)) {
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

  get_pagination_page: ($el) => {
      return $el.find('.pagination li.active').data('page');
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
  },
  time_periods_between: (d1, d2, period=1000*60*60*24) => {
    return Math.max(0, Math.abs(Math.floor((d1.getTime() - d2.getTime()) / period))-1);
  },
  create_time_period_plot: (
    usage,
    dom_id,
    y_title='Transactions',
    time_period=60*60*24*30*1000,
    split_time_period=60*60*24*1000
  ) => {
    for (let o of usage.c) {
      o.block_epoch = new Date(o.block_epoch * 1000);
    }
    usage.c.sort((a, b) => a.block_epoch - b.block_epoch);

    let usage_split_t = [];
    if (usage.c.length > 0) {
      let ts = +(usage.c[0].block_epoch);
      let splitset = [];

      for (let m of usage.c) {
        if (+(m.block_epoch) > ts + split_time_period) {
          ts = +(m.block_epoch);
          usage_split_t.push(splitset);
          splitset = [];
        }
        splitset.push(m);
      }

      usage_split_t.push(splitset);
    }

    const usage_split = usage_split_t
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

    let start_date = new Date((+(new Date)) - time_period);

    let split_data = [];
    for (let i=0; i<Math.ceil(time_period / split_time_period); ++i) {
      split_data.push({
        block_epoch: new Date(start_date.getTime() + (split_time_period*i)),
        txs: 0
      });
    }

    for (let m of usage_split_t) {
      const d_off = app.util.time_periods_between(
        start_date,
        m[0].block_epoch,
        split_time_period
      );
      split_data[d_off].txs = m.reduce((a, v) => a+v.txs, 0);
    }

    $('#'+dom_id).html('');
    try {
      Plotly.newPlot(dom_id, [
        {
          x: split_data.map(v => v.block_epoch),
          y: split_data.map(v => v.txs),
          fill: 'tonexty',
          type: 'scatter',
          name: 'Daily',
          /* line: { shape: 'spline' }, // maybe we're not ready for curves yet */
        }
      ], {
        yaxis: {
          title: y_title
        }
      })
    } catch (e) {
      console.error('Plotly.newPlot failed', e);
    }
  },

  set_token_icon: ($el, size) => {
    const tokenIdHex = $el.data('tokenid');

    const append_jdenticon = () => {
      $jdenticon = $(`<svg width="${size}" height="${size}" data-jdenticon-hash="${tokenIdHex}"></svg>`);
      $jdenticon.jdenticon();
      $el.append($jdenticon);
    };

    if (window.sessionStorage.getItem('tokenimgerr_'+tokenIdHex) === null) {
      $img = $('<img>');
      $img.attr('src', `https://tokens.bch.sx/${size}/${tokenIdHex}.png`);

      $img.on('error', function() {
        window.sessionStorage.setItem('tokenimgerr_'+tokenIdHex, true);
        $(this).hide();
        append_jdenticon();
      });

      $el.append($img);
    } else {
      append_jdenticon();
    }
  },

  attach_search_handler: (selector) => {
    $(selector).closest('form').submit(false);
    
    $(selector).autocomplete({
      groupBy: 'category',
      preventBadQueries: false, // retry query in case slpdb hasnt yet indexed something
      triggerSelectOnValidInput: false, // disables reload on clicking into box again
      autoSelectFirst: true, // first item will be selected when showing suggestions
      width: 'flex',
      lookup: function (query, done) {
        let search_value = $(selector).val().trim();
  
        // check if address entered
        if (slpjs.Utils.isSlpAddress(search_value)) {
          $(selector).val('');
          return app.router('/#address/'+slpjs.Utils.toSlpAddress(search_value));
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
              "sort": {"tokenStats.qty_valid_txns_since_genesis": -1},
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
  
            let tval = null;
            const verified = app.util.is_verified(m.tokenDetails.tokenIdHex);
            tval = (verified ? '✔ ' : '… ')
              + app.util.compress_txid(m.tokenDetails.tokenIdHex)
              + (m.tokenDetails.symbol ? (' | ' + m.tokenDetails.symbol) : '')
              + (m.tokenDetails.name   ? (' | ' + m.tokenDetails.name)   : '');
  
            sugs.push({
              value: tval,
              data: {
                url: '/#token/'+m.tokenDetails.tokenIdHex,
                category: 'Tokens',
                verified: verified,
                qty_valid_txns_since_genesis: m.tokenStats.qty_valid_txns_since_genesis,
              }
            });
          }

          sugs.sort((a, b) => {
            const av = (a.data.verified*100000000)+a.data.qty_valid_txns_since_genesis;
            const bv = (b.data.verified*100000000)+b.data.qty_valid_txns_since_genesis;
            return bv-av;
          });

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
  },

  is_verified: (txid) => {
    return app.verified_tokens.has(txid);
  },

  flash_latest_item: ($table) => {
    const $el = $table.find('tr:first');
    if ($el) {
      $el.addClass('flash');
      setTimeout(() => { $el.removeClass('flash'); }, 1000);
    }
  },
};

const btoa_ext = buf => Buffer.Buffer.from(buf).toString('base64');

app.slpdb = {
  query: (query) => new Promise((resolve, reject) => {
    if (! query) {
      return resolve(false);
    }
    const b64 = btoa_ext(JSON.stringify(query));
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

  count_unconfirmed_token_transaction_history: (tokenIdHex, address=null) => {
    let match;

    if (address == null) {
      match = {
        "$and": [
          { "slp.valid": true },
          { "slp.detail.tokenIdHex": tokenIdHex },
        ]
      };
    } else {
      match = {
        "$and": [
          { "slp.valid": true },
          { "slp.detail.tokenIdHex": tokenIdHex },
        ],
        "$or": [
          { "in.e.a":  address },
          { "out.e.a": address }
        ]
      };
    }

    return {
      "v": 3,
      "q": {
        "db": ["u"],
        "aggregate": [
          {
            "$match": match
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

  token_transaction_history: (db, tokenIdHex, address=null, limit=100, skip=0) => {
    let q = {
      "v": 3,
      "q": {
        "db": [db],
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

  unconfirmed_token_transaction_history: (tokenIdHex, address=null, limit=100, skip=0) => {
    return app.slpdb.token_transaction_history('u', tokenIdHex, address, limit, skip);
  },
  confirmed_token_transaction_history: (tokenIdHex, address=null, limit=100, skip=0) => {
    return app.slpdb.token_transaction_history('c', tokenIdHex, address, limit, skip);
  },

  tx: (txid) => ({
    "v": 3,
    "q": {
      "db": ["c", "u"],
      "aggregate": [
        {
          "$match": {
            "tx.h": txid
          }
        },
        {
          "$limit": 1
        },
        {
          "$lookup": {
            "from": "graphs",
            "localField": "tx.h",
            "foreignField": "graphTxn.txid",
            "as": "graph"
          }
        },
        {
          "$lookup": {
            "from": "tokens",
            "localField": "slp.detail.tokenIdHex",
            "foreignField": "tokenDetails.tokenIdHex",
            "as": "token"
          }
        }
      ],
      "limit": 1
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
          "$skip": skip
        },
        {
          "$limit": limit
        },
        {
          "$lookup": {
            "from": "tokens",
            "localField": "slp.detail.tokenIdHex",
            "foreignField": "tokenDetails.tokenIdHex",
            "as": "token"
          }
        }
      ],
      "limit": limit
    }
  }),

  txs_in_mempool: (limit=150, skip=0) => ({
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
          "$skip": skip
        },
        {
          "$limit": limit
        },
        {
          "$lookup": {
            "from": "tokens",
            "localField": "slp.detail.tokenIdHex",
            "foreignField": "tokenDetails.tokenIdHex",
            "as": "token"
          }
        }
      ],
      "limit": limit
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
  token_burn_history: (tokenIdHex, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["g"],
      "aggregate": [
        {
          "$match": {
            "tokenDetails.tokenIdHex": tokenIdHex,
            "graphTxn.outputs": {
              "$elemMatch": {
                "status": {
                  "$in": [
                    "SPENT_NON_SLP",
                    "BATON_SPENT_INVALID_SLP",
                    "SPENT_INVALID_SLP",
                    "BATON_SPENT_NON_SLP",
                    "MISSING_BCH_VOUT",
                    "BATON_MISSING_BCH_VOUT",
                    "BATON_SPENT_NOT_IN_MINT",
                    "EXCESS_INPUT_BURNED"
                  ]
                },
                "slpAmount": {
                  "$gt": 0
                }
              }
            }
          }
        },
        {
          "$lookup": {
            "from": "confirmed",
            "localField": "graphTxn.txid",
            "foreignField": "tx.h",
            "as": "tx"
          }
        },
        {
          "$sort": {
            "tx.blk.i": -1
          }
        },
        {
          "$skip": skip
        },
        {
          "$limit": limit
        }
      ]
    }
  }),
  count_token_burn_transactions: (tokenIdHex) => ({
    "v": 3,
    "q": {
      "db": ["g"],
      "aggregate": [
        {
          "$match": {
            "tokenDetails.tokenIdHex": tokenIdHex,
            "graphTxn.outputs": {
              "$elemMatch": {
                "status": {
                  "$in": [
                    "SPENT_NON_SLP",
                    "BATON_SPENT_INVALID_SLP",
                    "SPENT_INVALID_SLP",
                    "BATON_SPENT_NON_SLP",
                    "MISSING_BCH_VOUT",
                    "BATON_MISSING_BCH_VOUT",
                    "BATON_SPENT_NOT_IN_MINT",
                    "EXCESS_INPUT_BURNED"
                  ]
                },
                "slpAmount": {
                  "$gt": 0
                }
              }
            }
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

  token_child_nfts: (tokenIdHex, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "aggregate": [
        {
          "$match": {
            "nftParentId": tokenIdHex,
          }
        },
        {
          "$sort": {
            "tokenStats.block_created": -1
          }
        },
        {
          "$skip": skip
        },
        {
          "$limit": limit
        }
      ]
    }
  }),
  count_token_child_nfts: (tokenIdHex) => ({
    "v": 3,
    "q": {
      "db": ["t"],
      "aggregate": [
        {
          "$match": {
            "nftParentId": tokenIdHex,
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
      "aggregate": [
        {
          "$match": {
            "slp.valid": true,
            "slp.detail.transactionType": "SEND",
          }
        },
        {
          "$sort": {
            "_id": -1
          }
        },
        {
          "$skip": skip
        },
        {
          "$limit": limit
        },
        {
          "$lookup": {
            "from": "tokens",
            "localField": "slp.detail.tokenIdHex",
            "foreignField": "tokenDetails.tokenIdHex",
            "as": "token"
          }
        }
      ],
      "limit": limit
    }
  }),
  transactions_by_slp_address: (db, address, limit=100, skip=0) => ({
    "v": 3,
    "q": {
      "db": [db],
      "aggregate": [
        {
          "$match": {
            "$and": [
              { "slp.valid": true },
              {
                "$or": [
                  { "in.e.a":  address },
                  { "out.e.a": address }
                ]
              }
            ]
          }
        },
        {
          "$sort": { "blk.i": -1 }
        },
        {
          "$skip": skip
        },
        {
          "$limit": limit
        },
        {
          "$lookup": {
            "from": "tokens",
            "localField": "slp.detail.tokenIdHex",
            "foreignField": "tokenDetails.tokenIdHex",
            "as": "token"
          }
        },
        {
          "$lookup": {
            "from": "graphs",
            "localField": "tx.h",
            "foreignField": "graphTxn.txid",
            "as": "graph"
          }
        }
      ],
      "limit": limit
    }
  }),
  unconfirmed_transactions_by_slp_address: (address, limit=100, skip=0) => {
    return app.slpdb.transactions_by_slp_address('u', address, limit, skip);
  },
  confirmed_transactions_by_slp_address: (address, limit=100, skip=0) => {
    return app.slpdb.transactions_by_slp_address('c', address, limit, skip);
  },
  count_total_transactions_by_slp_address: (address) => ({
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
                  { "in.e.a":  address },
                  { "out.e.a": address }
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
  }),
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
      "aggregate": [
        {
          "$match": {
            "address": address,
          }
        },
        {
          "$sort": {
            "token_balance": -1
          }
        },
        {
          "$skip": skip
        },
        {
          "$limit": limit
        },
        {
          "$lookup": {
            "from": "tokens",
            "localField": "tokenDetails.tokenIdHex",
            "foreignField": "tokenDetails.tokenIdHex",
            "as": "token"
          }
        }
      ],
      "limit": limit
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

  count_txs_per_block: (match_obj={}) => {
    let obj = {
      "v": 3,
      "q": {
        "db": ["c"],
        "aggregate": [
          {
            "$match": match_obj
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
    };

    return obj;
  },

  get_amounts_from_txid_vout_pairs: (pairs=[]) => ({
    "v": 3,
    "q": {
      "db": ["g"],
      "aggregate": [
        {
          "$match": {
            "graphTxn.txid": {
              "$in": [...new Set(pairs.map(v => v.txid))]
            }
          }
        },
        {
          "$unwind": "$graphTxn.outputs"
        },
        {
          "$match": {
            "$or": pairs.map(v => ({
              "$and": [
                {
                  "graphTxn.txid": v.txid
                },
                {
                  "graphTxn.outputs.vout": v.vout
                }
              ]
            }))
          }
        }
      ],
      "limit": 20,
    },
    "r": {
      "f": "[ .[] | { txid: .graphTxn.txid, vout: .graphTxn.outputs.vout, slpAmount: .graphTxn.outputs.slpAmount} ]"
    }
  }),
  get_txs_from_txid_vout_pairs: (pairs=[]) => ({
    "v": 3,
    "q": {
      "db": ["u", "c"],
      "aggregate": [
        {
          "$match": {
            "in.e.h": {
              "$in": [...new Set(pairs.map(v => v.txid))]
            }
          }
        },
        {
          "$unwind": "$in"
        },
        {
          "$match": {
            "$or": pairs.map(v => ({
              "$and": [
                {
                  "in.e.h": v.txid
                },
                {
                  "in.e.i": v.vout
                }
              ]
            }))
          }
        }
      ],
      "limit": 20,
    },
    "r": {
      "f": "[ .[] | { txid: .tx.h, in: { i: .in.e.i } } ]"
    }
  }),
};

app.slpsocket = {
  reset: () => {
    app.slpsocket.on_block = (height, data) => {
      console.log('slpsocket.on_block', height, data);
    };

    app.slpsocket.on_mempool = (sna) => {
      console.log('slpsocket.on_mempool', sna);
    };
  },

  init_listener: (query, fn) => {
    if (! query) {
      return resolve(false);
    }
    const b64 = btoa_ext(JSON.stringify(query));
    const url = "https://slpsocket.fountainhead.cash/s/" + b64;

    const sse = new EventSource(url);
    sse.onmessage = (e) => fn(JSON.parse(e.data));
    return sse;
  },

  init: () => {
    console.log('initializing slpsocket');
    app.slpsocket.reset();

    app.slpsocket.init_listener({
      "v": 3,
      "q": {
        "db": ["u", "c"],
        "find": {}
      }
    }, (data) => {
      console.log('slpsocket data: ', data);
      if ((data.type !== 'mempool' && data.type !== 'block')
      ||   data.data.length < 1) {
        return;
      }

      if (data.type === 'block') {
        app.slpsocket.on_block(data.index, data.data);
      }

      if (data.type === 'mempool') {
        app.slpsocket.on_mempool(data.data[0]);
      }
    });
  },
};


app.bitdb = {
  query: (query) => new Promise((resolve, reject) => {
    if (! query) {
      return resolve(false);
    }
    const b64 = btoa_ext(JSON.stringify(query));
    const url = "https://bitdb.fountainhead.cash/q/" + b64;

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

  count_txs_by_block: (height) => ({
    "v": 3,
    "q": {
      "db": ["c"],
      "aggregate": [
        {
          "$match": {
            "blk.i": height
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
      "db": ["c"],
      "aggregate": [
        {
          "$match": {}
        },
        {
          "$sort": {
            "blk.i": -1
          }
        },
        {
          "$skip": skip
        },
        {
          "$limit": limit
        }
      ],
      "limit": limit
    }
  }),

  lookup_tx_by_input: (txid, vout) => ({
    "v": 3,
    "q": {
      "find": {
        "in": {
          "$elemMatch": {
            "e.h": txid,
            "e.i": vout
          }
        }
      },
      "limit": 1
    }
  }),

  tx: (txid) => ({
    "v": 3,
    "q": {
      "db": ["c", "u"],
      "aggregate": [
        {
          "$match": {
            "tx.h": txid
          }
        },
        {
          "$limit": 1
        },
      ],
      "limit": 1
    }
  }),
  get_amounts_from_txid_vout_pairs: (pairs=[]) => ({
    "v": 3,
    "q": {
      "db": ["c"],
      "aggregate": [
        {
          "$match": {
            "tx.h": {
              "$in": [...new Set(pairs.map(v => v.txid))]
            }
          }
        },
        {
          "$unwind": "$out"
        },
        {
          "$match": {
            "$or": pairs.map(v => ({
              "$and": [
                {
                  "tx.h": v.txid
                },
                {
                  "out.e.i": v.vout
                }
              ]
            }))
          }
        }
      ],
      "limit": 20,
    },
    "r": {
      "f": "[ .[] | { txid: .tx.h, vout: .out.e.i, amount: .out.e.v} ]"
    }
  }),
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

app.extract_sent_amount_from_tx = (tx, addr) => {
  let outer = new Set(tx.in.map(v => v.e.a));

  if (tx.graph && tx.graph[0] && addr) {
    outer = new Set(tx.graph[0].graphTxn.inputs.map(v => v.address));
  }

  let self_send = true;
  for (let v of tx.slp.detail.outputs) {
    if (! outer.has(v.address)) {
      self_send = false;
      break;
    }
  }

  // if self_send we count entirety of outputs as send amount
  if (self_send) {
    let amount = tx.slp.detail.outputs
        .map(v => new BigNumber(v.amount))
        .reduce((a, v) => a.plus(v), new BigNumber(0));

    if (addr && tx.graph[0]) {
        const in_amount = tx.graph[0].graphTxn.inputs
            .filter((e) => e.address == addr)
            .map(v => new BigNumber(v.slpAmount))
            .reduce((a, v) => a.plus(v), new BigNumber(0));

        amount = amount.minus(amount.minus(in_amount));
    }

    return app.util.format_bignum(amount.toFormat(tx.slp.detail.decimals));
  }

  // otherwise count amount not sent to self
  const outer_arr = [...outer];

  const amount = tx.slp.detail.outputs
    .filter((e) => outer_arr.indexOf(e.address) < 0)
    .map(v => new BigNumber(v.amount))
    .reduce((a, v) => a.plus(v), new BigNumber(0));

  return app.util.format_bignum(amount.toFormat(tx.slp.detail.decimals));
};

app.extract_recv_amount_from_tx = (tx, addr) => {
  return app.util.format_bignum(
    tx.slp.detail.outputs
      .filter((e) => e.address === addr)
      .map(v => new BigNumber(v.amount))
      .reduce((a, v) => a.plus(v), new BigNumber(0))
      .toFormat(tx.slp.detail.decimals)
  );
};

app.init_404_page = () => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_404_page());
  resolve();
});

app.init_nonslp_tx_page = (txid) =>
  new Promise((resolve, reject) => {
    app.bitdb.query(app.bitdb.tx(txid))
    .then((tx) => {
      tx = tx.u.concat(tx.c);
      if (tx.length === 0) {
        return resolve(app.init_error_notx_page(txid));
      }

      tx = tx[0];

      const chunk_size = 20;

      const input_txid_vout_pairs = tx.in.map(v => ({
        txid: v.e.h,
        vout: v.e.i
      }));

      let input_txid_vout_reqs = [];
      for (let i=0; i<Math.ceil(input_txid_vout_pairs.length / chunk_size); ++i) {
        const chunk = input_txid_vout_pairs.slice(chunk_size*i, (chunk_size*i)+chunk_size);

        input_txid_vout_reqs.push(app.bitdb.query(
          app.bitdb.get_amounts_from_txid_vout_pairs(chunk)
        ));
      }

      Promise.all(input_txid_vout_reqs)
      .then((results) => {
        const input_pairs  = results.reduce((a, v) => a.concat(v.c), []);
        console.log(input_pairs);

        const input_amounts = input_pairs.reduce((a, v) => {
          a[v.txid+':'+v.vout] = v.amount;
          return a;
        }, {});

        const total_input_amount = Object.keys(input_amounts)
          .map(k => new BigNumber(input_amounts[k]))
          .reduce((a, v) => a.plus(v), new BigNumber(0));

        const lookup_missing_spendtxid = (m, txid, vout) =>
          app.bitdb.query(app.bitdb.lookup_tx_by_input(txid, vout))
          .then((tx) => {
            m['spendTxid'] = tx.u.length > 0
              ? tx.u[0].tx.h
              : tx.c.length > 0
                ? tx.c[0].tx.h
                : null;
          });

        const missing_lookups = tx.out.map((m) => {
          return lookup_missing_spendtxid(m, tx.tx.h, m.e.i)
        });

        Promise.all(missing_lookups)
        .then((lookups) => {
          $('main[role=main]').html(app.template.nonslp_tx_page({
            tx:            tx,
            input_amounts: input_amounts
          }));

          resolve();
        });
      });
    })
  });

app.init_error_invalid_tx_page = (tx) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_invalid_tx_page({
    tx: tx
  }));
  resolve();
});

app.init_error_notx_page = (txid) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_notx_page({
    txid: txid
  }));
  resolve();
});

app.init_error_badaddress_page = (address) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_badaddress_page({
    address: address
  }));
  resolve();
});

app.init_index_page = () =>
  new Promise((resolve, reject) => {
    $('main[role=main]')
    .html(app.template.index_page());

    app.util.attach_search_handler('#main-search');

    app.slpdb.query(app.slpdb.recent_transactions(10))
    .then((data) => {
      const transactions =  data.u.concat(data.c);
      $('#recent-transactions-table tbody').html('');

      for (let i=0; i<transactions.length && i<10; ++i) {
        $('#recent-transactions-table tbody').append(
          app.template.latest_transactions_tx({
            tx: transactions[i]
          })
        );
      }

      $('#recent-transactions-table tbody .token-icon-small').each(function() {
        app.util.set_token_icon($(this), 32);
      });

      $('#recent-transactions-table-container').removeClass('loading');
    });


    // load graphs in background
    Promise.all([
      app.slpdb.query(app.slpdb.count_txs_per_block({
        "$and": [
          { "slp.valid": true },
          { "blk.t": {
            "$gte": (+(new Date) / 1000) - (60*60*24*30),
            "$lte": (+(new Date) / 1000)
          } }
        ]
      })),
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
      app.util.create_time_period_plot(monthly_usage, 'plot-monthly-usage')


      let token_usage_monthly = token_usage.c;
      const total_slp_tx_month = monthly_usage.c.reduce((a, v) => a+v.txs, 0);

      token_usage_monthly.push({
        token_name: 'Other',
        txs: total_slp_tx_month - token_usage_monthly.reduce((a, v) => a + v.txs, 0)
      })

      $('#plot-token-usage').html('');
      try {
        Plotly.newPlot('plot-token-usage', [{
          labels: token_usage_monthly.map(v => v.token_name),
          values: token_usage_monthly.map(v => v.txs),
          type: 'pie',
        }], {
          title: 'Popular Tokens This Month',
        })
      } catch (e) {
        console.error('Plotly.newPlot failed', e);
      }
    });

    
    app.slpdb.query(app.slpdb.count_txs_per_block({
      "$and": [
        { "slp.valid": true },
        { "slp.detail.transactionType": "GENESIS" },
        { "blk.t": {
          "$gte": (+(new Date) / 1000) - (60*60*24*30),
          "$lte": (+(new Date) / 1000)
        } }
      ]
    }))
    .then((tokens_created) => {
      app.util.create_time_period_plot(tokens_created, 'plot-token-creation', 'Genesis Transactions')
    });

    app.slpdb.query(app.slpdb.count_txs_per_block({
      "$and": [
        { "slp.valid": false },
        { "blk.t": {
          "$gte": (+(new Date) / 1000) - (60*60*24*30),
          "$lte": (+(new Date) / 1000)
        } }
      ]
    }))
    .then((token_burns) => {
      app.util.create_time_period_plot(token_burns, 'plot-token-burns', 'REKT Transactions')
    });

    app.slpsocket.on_mempool = (sna) => {
      if (! sna.slp.valid) {
        return;
      }

      app.slpdb.query(app.slpdb.token(sna.slp.detail.tokenIdHex))
      .then((token_data) => {
        if (token_data.t.length === 0) {
          console.error('slpsocket token not found');
          return;
        }
        const token = token_data.t[0];

        sna.token = [token];

        const tbody = $('#recent-transactions-table tbody');
        tbody.prepend(
          app.template.latest_transactions_tx({ tx: sna })
        );

        app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);
        app.util.flash_latest_item(tbody);

        tbody.find('tr:last').remove();
      });
    }

    app.slpsocket.on_block = (index, data) => {
      // TODO delete all pending items from list, add add in block
      // then do query for mempool items and add those on top
      // ensure ordering is the same
      console.log('on_block', index, data);
    };
    resolve();
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

          $('#all-tokens-table tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
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
        return resolve(app.init_nonslp_tx_page(txid));
      }

      tx = tx[0];

      if (! tx.slp || ! tx.slp.valid || tx.graph.length === 0) {
        return resolve(app.init_error_invalid_tx_page(tx));
      }

      const chunk_size = 20;

      const input_txid_vout_pairs = tx.in.map(v => ({
        txid: v.e.h,
        vout: v.e.i
      }));


      let input_txid_vout_reqs = [];
      for (let i=0; i<Math.ceil(input_txid_vout_pairs.length / chunk_size); ++i) {
        const chunk = input_txid_vout_pairs.slice(chunk_size*i, (chunk_size*i)+chunk_size);

        input_txid_vout_reqs.push(app.slpdb.query(
          app.slpdb.get_amounts_from_txid_vout_pairs(chunk)
        ));
      }

      Promise.all(input_txid_vout_reqs)
      .then((results) => {
        const input_pairs  = results.reduce((a, v) => a.concat(v.g), []);

        const input_amounts = input_pairs.reduce((a, v) => {
          a[v.txid+':'+v.vout] = v.slpAmount;
          return a;
        }, {});

        const total_input_amount = Object.keys(input_amounts)
          .map(k => new BigNumber(input_amounts[k]))
          .reduce((a, v) => a.plus(v), new BigNumber(0));

        app.slpdb.query(app.slpdb.token(tx.slp.detail.tokenIdHex))
        .then((token) => {
          const txid = tx.graph[0].graphTxn.txid;

          const lookup_missing_spendtxid = (m, txid, vout) =>
            app.bitdb.query(app.bitdb.lookup_tx_by_input(txid, vout))
            .then((tx) => {
              m['missingTxid'] = tx.u.length > 0
                ? tx.u[0].tx.h
                : tx.c.length > 0
                  ? tx.c[0].tx.h
                  : null;
            });

          let missing_lookups = [];
          for (let m of tx.graph[0].graphTxn.outputs) {
            if (! m.spendTxid) {
              missing_lookups.push(
                lookup_missing_spendtxid(m, tx.graph[0].graphTxn.txid, m.vout)
              );
            }
          }

          Promise.all(missing_lookups)
          .then(() => {
            $('main[role=main]').html(app.template.tx_page({
              tx:    tx,
              token: token.t[0],
              input_amounts: input_amounts
            }));

            app.util.set_token_icon($('main[role=main] .transaction_box .token-icon-large'), 128);
            resolve();
          });
        });
      });
    })
  )

app.init_block_page = (height) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.count_txs_by_block(height)),
      app.bitdb.query(app.bitdb.count_txs_by_block(height+1))
    ])
    .then(([total_txs_by_block, total_bch_txs_by_next_block]) => {
      total_txs_by_block = app.util.extract_total(total_txs_by_block);
      total_bch_txs_by_next_block = app.util.extract_total(total_bch_txs_by_next_block);

      $('main[role=main]').html(app.template.block_page({
        height: height,
        total_txs: total_txs_by_block.c,
        next_block_exists: total_bch_txs_by_next_block.c > 0
      }));

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.txs_by_block(height, limit, skip))
        .then((transactions) => {
          transactions = transactions.c;

          const tbody = $('#block-transactions-table tbody');
          tbody.html('');

          transactions.forEach((tx) => {
            tbody.append(
              app.template.block_tx({
                tx: tx
              })
            );
          });

          $('#block-transactions-table tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
          });

          done();
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
    Promise.all([
      app.slpdb.query(app.slpdb.count_txs_in_mempool()),
      app.bitdb.query(app.bitdb.recent_transactions(1))
    ])
    .then(([total_txs_in_mempool, most_recent_tx]) => {
      total_txs_in_mempool = app.util.extract_total(total_txs_in_mempool);
      const most_recent_block_height = most_recent_tx.c[0].blk.i;

      $('main[role=main]').html(app.template.block_page({
        height: "mempool",
        total_txs: total_txs_in_mempool.u,
        most_recent_block_height: most_recent_block_height
      }));

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.txs_in_mempool(limit, skip))
        .then((transactions) => {
          transactions = transactions.u;

          const tbody = $('#block-transactions-table tbody');
          tbody.html('');

          transactions.forEach((tx) => {
            tbody.append(
              app.template.block_tx({
                tx: tx
              })
            );
          });

          $('#block-transactions-table-container tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
          });

          done();
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

      app.slpsocket.on_mempool = (sna) => {
        if (! sna.slp.valid) {
          return;
        }

        const transactions_page = app.util.get_pagination_page($('#block-transactions-table-container'));
        if (transactions_page !== 0) {
          return;
        }
        app.slpdb.query(app.slpdb.token(sna.slp.detail.tokenIdHex))
        .then((token_data) => {
          if (! token_data || ! token_data.t || token_data.t.length === 0) {
            console.error('slpsocket token not found');
            return;
          }
          const token = token_data.t[0];

          sna.token = [token];

          const tbody = $('#block-transactions-table tbody');
          tbody.prepend(
            app.template.block_tx({ tx: sna })
          );
          tbody.find('tr:last').remove();

          app.util.flash_latest_item(tbody);
          app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);
        });
      }

      resolve();
    })
  )

app.init_token_page = (tokenIdHex) =>
  new Promise((resolve, reject) =>
    Promise.all([
      app.slpdb.query(app.slpdb.token(tokenIdHex)),
      app.slpdb.query(app.slpdb.count_token_mint_transactions(tokenIdHex)),
      app.slpdb.query(app.slpdb.count_token_burn_transactions(tokenIdHex)),
    ])
    .then(([token, total_token_mint_transactions, total_token_burn_transactions]) => {
      total_token_mint_transactions = app.util.extract_total(total_token_mint_transactions);
      total_token_burn_transactions = app.util.extract_total(total_token_burn_transactions);

      if (token.t.length == 0) {
        return resolve(app.init_404_page());
      } 

      token = token.t[0];

      $('main[role=main]').html(app.template.token_page({
        token: token
      }));

      app.util.set_token_icon($('main[role=main] .transaction_box .token-icon-large'), 128);


      if (token.tokenDetails.versionType === 129) {
        app.slpdb.query(app.slpdb.count_token_child_nfts(tokenIdHex))
        .then((total_token_child_nfts) => {
          total_token_child_nfts = app.util.extract_total(total_token_child_nfts);

          const load_paginated_token_child_nfts = (limit, skip, done) => {
            app.slpdb.query(app.slpdb.token_child_nfts(tokenIdHex, limit, skip))
            .then((tokens) => {
             const tbody = $('#token-child-nfts-table tbody');
             tbody.html('');

              tokens.t.forEach((token) => {
                tbody.append(
                  app.template.token_child_nft({
                    token: token
                  })
                );
              });

              $('#token-child-nfts-table tbody .token-icon-small').each(function() {
                app.util.set_token_icon($(this), 32);
              });

              done();
            });
          };

          if (total_token_child_nfts.t === 0) {
            $('#token-child-nfts-table tbody').html('<tr><td>No children found.</td></tr>');
          } else {
            app.util.create_pagination(
              $('#token-child-nfts-table-container'),
              0,
              Math.ceil(total_token_child_nfts.t / 10),
              (page, done) => {
                load_paginated_token_child_nfts(10, 10*page, done);
              }
            );
          }
        });
      }

      const load_paginated_token_addresses = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.token_addresses(tokenIdHex, limit, skip))
        .then((addresses) => {
         const tbody = $('#token-addresses-table tbody');
         tbody.html('');

          addresses.a.forEach((address) => {
            tbody.append(
              app.template.token_address({
                address:  address,
                decimals: token.tokenDetails.decimals,
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

      const load_paginated_token_burn_history = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.token_burn_history(tokenIdHex, limit, skip))
        .then((transactions) => {
          transactions = transactions.g;

          const tbody = $('#token-burn-history-table tbody');
          tbody.html('');

          transactions.forEach((tx) => {
            const total_burnt = tx.graphTxn.outputs.reduce((a, v) => {
              switch (v.status) {
                case 'UNSPENT':
                case 'SPENT_SAME_TOKEN':
                case 'BATON_SPENT':
                case 'BATON_SPENT_IN_MINT':
                  return a;
                default:
                  return a.plus(new BigNumber(v.slpAmount));
              }
            }, new BigNumber(0));

            tx.tx = tx.tx[0] || null;

            tbody.append(
              app.template.token_burn_tx({
                tx: tx,
                total_burnt: total_burnt
              })
            );
          });

          done();
        });
      };

      const load_paginated_token_txs = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.count_unconfirmed_token_transaction_history(tokenIdHex))
        .then((total_unconfirmed_token_transactions) => {
          total_unconfirmed_token_transactions = app.util.extract_total(total_unconfirmed_token_transactions).u;

          let tasks = [];
          if (skip < total_unconfirmed_token_transactions) {
            tasks.push(app.slpdb.query(app.slpdb.unconfirmed_token_transaction_history(tokenIdHex, null, limit, skip)));

            if (skip+limit > total_unconfirmed_token_transactions) {
              if (limit - (total_unconfirmed_token_transactions % limit) > 0) {
                tasks.push(app.slpdb.query(
                  app.slpdb.confirmed_token_transaction_history(
                    tokenIdHex,
                    null,
                    limit - (total_unconfirmed_token_transactions % limit),
                    0
                  )
                ));
              }
            }
          } else {
            tasks.push(app.slpdb.query(
              app.slpdb.confirmed_token_transaction_history(
                tokenIdHex,
                null,
                limit,
                skip - (total_unconfirmed_token_transactions % limit)
              )
            ));
          }

          Promise.all(tasks)
          .then((transactionlists) => {
            let transactions = [];
            for (const transactionlist of transactionlists) {
              if (transactionlist.u) {
                transactions = transactions.concat(transactionlist.u);
              }

              if (transactionlist.c) {
                transactions = transactions.concat(transactionlist.c);
              }
            }

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
        });
      };

      if (token.tokenStats.qty_valid_token_addresses === 0) {
        $('#token-addresses-table tbody').html('<tr><td>No addresses found.</td></tr>');
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

      if (total_token_burn_transactions.g === 0) {
        $('#token-burn-history-table tbody').html('<tr><td>No burns found.</td></tr>');
      } else {
        app.util.create_pagination(
          $('#token-burn-history-table-container'),
          0,
          Math.ceil(total_token_burn_transactions.g / 10),
          (page, done) => {
            load_paginated_token_burn_history(10, 10*page, done);
          }
        );
      }

      if (token.tokenStats.qty_valid_txns_since_genesis === 0) {
        $('#token-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
      } else {
        app.slpdb.query(app.slpdb.count_unconfirmed_token_transaction_history(tokenIdHex))
        .then((total_unconfirmed_token_transactions) => {
          total_unconfirmed_token_transactions = app.util.extract_total(total_unconfirmed_token_transactions).u;


          const total_confirmed = token.tokenStats.qty_valid_txns_since_genesis
                                - total_unconfirmed_token_transactions;

          app.util.create_pagination(
            $('#token-transactions-table-container'),
            0,
            Math.ceil((total_confirmed % 10 == 0 ? total_confirmed : (total_confirmed + 1)) / 10),
            (page, done) => {
              load_paginated_token_txs(10, 10*page, done);
            }
          );
        });
      }

      app.slpdb.query(app.slpdb.count_txs_per_block({
        "$and": [
          { "slp.valid": true },
          { "blk.t": {
            "$gte": (+(new Date) / 1000) - (60*60*24*30),
            "$lte": (+(new Date) / 1000)
          } },
          { "slp.detail.tokenIdHex": tokenIdHex }
        ]
      })).then((token_monthly_usage) => {
        app.util.create_time_period_plot(token_monthly_usage, 'plot-token-monthly-usage');
      });

      app.slpdb.query(app.slpdb.token_addresses(tokenIdHex, 10))
      .then((token_addresses) => {
        let data = [];

        for (let a of token_addresses.a) {
          data.push({
            address: a.address.split(':')[1],
            token_balance: a.token_balance,
            color: "rgba(100, 167, 205, 1)"
          });
        }

        const burnt_balance = Number(token.tokenStats.qty_token_burned);

        const other_balance = token.tokenStats.qty_token_circulating_supply
          - data.reduce((a, v) => a + Number(v.token_balance), 0)
          - burnt_balance;

        if (other_balance > 0) {
          data.push({
            address: 'Other',
            token_balance: other_balance,
            color: "rgba(232, 102, 102, 1)"
          });
        }

        data.sort((a, b) => b.token_balance - a.token_balance);

        try {
          Plotly.newPlot('plot-token-address-rich', [{
            x: data.map(v => v.address),
            y: data.map(v => v.token_balance),
            marker: {
              color: data.map(v => v.color)
            },
            type: 'bar',
          }], {
          })
        } catch (e) {
          console.error('Plotly.newPlot failed', e);
        }
      });

      app.slpsocket.on_mempool = (sna) => {
        if (! sna.slp.valid) {
          return;
        }

        if (sna.slp.detail.tokenIdHex !== tokenIdHex) {
            return;
        }

        const transactions_page = app.util.get_pagination_page($('#token-transactions-table-container'));
        if (transactions_page !== 0) {
          return;
        }

        if (sna.slp.detail.transactionType === 'SEND') {
          console.log('SEND TX');
          const tbody = $('#token-transactions-table tbody');

          tbody.prepend(app.template.token_tx({ tx: sna }));
          tbody.find('tr:last').remove();

          app.util.flash_latest_item(tbody);

          app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);

        }
      };

      app.util.generate_exchange_links($('#token-exchange-exchanges'), token.tokenDetails.tokenIdHex);
      resolve();
    })
  )


app.init_address_page = (address) =>
  new Promise((resolve, reject) => {
    try {
      address = slpjs.Utils.toSlpAddress(address);
    } catch (e) {
      return resolve(app.init_error_badaddress_page(address));
    }

    return Promise.all([
      app.slpdb.query(app.slpdb.count_tokens_by_slp_address(address)),
      app.slpdb.query(app.slpdb.count_total_transactions_by_slp_address(address)),
    ]).then(([total_tokens, total_transactions]) => {
      total_tokens = app.util.extract_total(total_tokens);
      total_transactions = app.util.extract_total(total_transactions);

      $('main[role=main]').html(app.template.address_page({
        address: address
      }));

      let qrcode = null;
      try {
        qrcode = new QRCode(document.getElementById("qrcode-address-"+address), {
          text: address,
          width:  512,
          height: 512,
          colorDark: "#222",
          colorLight: "#fff",
          correctLevel: QRCode.CorrectLevel.M,
        });
      } catch (e) { console.error(e); }

      const load_paginated_tokens = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.tokens_by_slp_address(address, limit, skip))
        .then((tokens) => {
          tokens = tokens.a;

          const tbody = $('#address-tokens-table tbody');
          tbody.html('');

          tokens.forEach((token) => {
            tbody.append(
              app.template.address_token({
                token: token
              })
            );
          });

          $('#address-tokens-table tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
          });

          done();
        });
      };

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.count_total_transactions_by_slp_address(address))
        .then((total_transactions_by_slp_address) => {
          total_unconfirmed_transactions_by_slp_address = app.util.extract_total(total_transactions_by_slp_address).u;

          let tasks = [];
          if (skip < total_unconfirmed_transactions_by_slp_address) {
            tasks.push(app.slpdb.query(app.slpdb.unconfirmed_transactions_by_slp_address(address, limit, skip)));

            if (skip+limit > total_unconfirmed_transactions_by_slp_address) {
              if (limit - (total_unconfirmed_transactions_by_slp_address % limit) > 0) {
                tasks.push(app.slpdb.query(
                  app.slpdb.confirmed_transactions_by_slp_address(
                    address,
                    limit - (total_unconfirmed_transactions_by_slp_address % limit),
                    0
                  )
                ));
              }
            }
          } else {
            tasks.push(app.slpdb.query(
              app.slpdb.confirmed_transactions_by_slp_address(
                address,
                limit,
                skip - (total_unconfirmed_transactions_by_slp_address % limit)
              )
            ));
          }

          Promise.all(tasks)
          .then((transactionlists) => {
            let transactions = [];
            for (const transactionlist of transactionlists) {
              if (transactionlist.u) {
                transactions = transactions.concat(transactionlist.u);
              }

              if (transactionlist.c) {
                transactions = transactions.concat(transactionlist.c);
              }
            }

            const tbody = $('#address-transactions-table tbody');
            tbody.html('');

            transactions.forEach((tx) => {
              tbody.append(
                app.template.address_transactions_tx({
                  tx: tx,
                  address: address
                })
              );
            });

            $('#address-transactions-table tbody .token-icon-small').each(function() {
              app.util.set_token_icon($(this), 32);
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

      Promise.all([
        app.slpdb.query(app.slpdb.count_txs_per_block({
          "$and": [
            { "slp.valid": true },
            { "blk.t": {
              "$gte": (+(new Date) / 1000) - (60*60*24*30),
              "$lte": (+(new Date) / 1000)
            } }
          ],
          "$or": [
            { "in.e.a":  address },
            { "out.e.a": address }
          ]
        }))
      ]).then(([address_monthly_usage]) => {
        app.util.create_time_period_plot(address_monthly_usage, 'plot-address-monthly-usage');
      });

      app.slpsocket.on_mempool = (sna) => {
        if (! sna.slp.valid) {
          return;
        }

        let found = false;

        for (const m of sna.in) {
            if (m.e.a === address) {
                found = true;
            }
        }

        for (const m of sna.out) {
            if (m.e.a === address) {
                found = true;
            }
        }

        if (! found) {
            return;
        }

        const transactions_page = app.util.get_pagination_page($('#address-transactions-table-container'));
        if (transactions_page !== 0) {
          return;
        }

        if (sna.slp.detail.transactionType === 'SEND') {
          app.slpdb.query(app.slpdb.tx(sna.tx.h))
          .then((tx) => {
            if (tx.u.length === 0 && tx.c.length === 0) {
              return;
            }

            const tbody = $('#address-transactions-table tbody');
            tbody.prepend(app.template.address_transactions_tx({
              tx: tx.u.length > 0 ? tx.u[0] : tx.c[0],
              address: address
            }));
            tbody.find('tr:last').remove();

            app.util.flash_latest_item(tbody);

            app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);
          });
        }
      };


      resolve();
    })
  })


app.router = (whash, push_history = true) => {
  if (! whash) {
    whash = window.location.hash.substring(1);
  }

  const [_, path, key] = whash.split('/');


  let method = null;

  switch (path) {
    case '':
    case '#':
      document.title = 'SLP Explorer';
      method = () => {
          $('html').addClass('index-page');
          return app.init_index_page();
      };
      break;
    case '#alltokens':
      document.title = 'All Tokens - SLP Explorer';
      method = () => app.init_all_tokens_page();
      break;
    case '#tx':
      document.title = 'Transaction ' + key + ' - SLP Explorer';
      method = () => app.init_tx_page(key);
      break;
    case '#block':
      document.title = 'Block ' + key + ' - SLP Explorer';
      if (key === 'mempool') {
        method = () => app.init_block_mempool_page();
      } else {
        method = () => app.init_block_page(parseInt(key));
      }
      break;
    case '#token':
      document.title = 'Token ' + key + ' - SLP Explorer';
      method = () => app.init_token_page(key);
      break;
    case '#address':
      document.title = 'Address ' + key + ' - SLP Explorer';
      method = () => app.init_address_page(key);
      break;
    default:
      document.title = '404 | SLP Explorer';
      console.error('app.router path not found', whash);
      method = () => app.init_404_page();
      break;
  }

  $('html').removeClass();
  $('html').addClass('loading');
  $('html').scrollTop(0);
  $('#main-search').autocomplete('dispose');

  app.slpsocket.reset();
  method().then(() => {
    tippy('[data-tippy-content]');
    jdenticon();

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

  app.util.attach_search_handler('#header-search');

  app.slpsocket.init();

  const views = [
    'index_page',
    'latest_transactions_tx',
    'all_tokens_page',
    'all_tokens_token',
    'tx_page',
    'nonslp_tx_page',
    'block_page',
    'block_tx',
    'token_page',
    'token_mint_tx',
    'token_burn_tx',
    'token_address',
    'token_child_nft',
    'token_tx',
    'address_page',
    'address_transactions_tx',
    'address_token',
    'error_404_page',
    'error_invalid_tx_page',
    'error_notx_page',
    'error_badaddress_page',
  ];

  app.template = {}

  console.time('loading verified tokens');
  fetch('/verified_tokens.json')
  .then(tokens => tokens.json())
  .then(tokens => {
    app.verified_tokens = new Set(tokens);
    console.timeEnd('loading verified tokens');
  })
  .then(() => {
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
      $('header').removeClass('loading');
    });
  });
});

const error_handler = (modal_text) => {
  $('#error-modal-text').text(modal_text);
  $('#error-modal').removeClass('display-none');
  return false;
};

window.onerror = function (message, file, line, col, error) {
  console.error(error, window.location.hash);
  return error_handler(`
    hash: ${window.location.hash}
    message: ${message}
    file: ${file}
    line: ${line}
    col: ${col}
  `);
};

window.addEventListener("error", function (e) {
  console.error(e, window.location.hash);
  return error_handler(window.location.hash + ' ' + e.error.message);
});

window.addEventListener('unhandledrejection', function (e) {
  console.error(e, window.location.hash);
  return error_handler(`
    hash: ${window.location.hash}
    message: ${e.reason.message}
    stack: ${e.reason.stack}
  `);
});

const reload_page = () => {
  window.location.hash = window.location.hash;
  window.location.reload();
};

const start_simclick = (interval=6000) => {
  window.simclick_pages = [];

  window.setInterval(() => {
    simclick_pages.push(window.location.hash);

    const evt = new MouseEvent('click');
    const things = $('a[href^="/#"]');
    const thing = $(things[Math.floor(Math.random()*things.length)])[0];

    if (things.length === 0) {
      history.back(-2);
    } else {
      thing.dispatchEvent(evt);
    }
  }, interval);
};
