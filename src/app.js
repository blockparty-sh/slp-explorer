'use strict';
window.app = {};

import verified_tokens from '../public/verified_tokens.json';
app.verified_tokens = new Set(JSON.parse(verified_tokens));

import group_icon_repos from '../public/group_icon_repos.json';
app.group_icon_repos = JSON.parse(group_icon_repos);

import index_page from '../views/index_page.ejs';
import index_burn_tx from '../views/index_burn_tx.ejs';
import index_token from '../views/index_token.ejs';
import latest_transactions_tx from '../views/latest_transactions_tx.ejs';
import all_tokens_page from '../views/all_tokens_page.ejs';
import all_tokens_token from '../views/all_tokens_token.ejs';
import dividend_page from '../views/dividend_page.ejs';
import tx_page from '../views/tx_page.ejs';
import nonslp_tx_page from '../views/nonslp_tx_page.ejs';
import block_page from '../views/block_page.ejs';
import block_tx from '../views/block_tx.ejs';
import token_page from '../views/token_page.ejs';
import token_page_nft from '../views/token_page_nft.ejs';
import token_mint_tx from '../views/token_mint_tx.ejs';
import token_burn_tx from '../views/token_burn_tx.ejs';
import token_address from '../views/token_address.ejs';
import token_child_nft from '../views/token_child_nft.ejs';
import token_tx from '../views/token_tx.ejs';
import address_page from '../views/address_page.ejs';
import address_cashaccount from '../views/address_cashaccount.ejs';
import address_transactions_tx from '../views/address_transactions_tx.ejs';
import address_token from '../views/address_token.ejs';
import address_burn_tx from '../views/address_burn_tx.ejs';
import error_404_page from '../views/error_404_page.ejs';
import error_processing_tx_page from '../views/error_processing_tx_page.ejs';
import error_notx_page from '../views/error_notx_page.ejs';
import error_badaddress_page from '../views/error_badaddress_page.ejs';
import search_token_result from '../views/search_token_result.ejs';
import search_cashaccount_result from '../views/search_cashaccount_result.ejs';

app.template = Object.fromEntries(Object.entries({
  index_page,
  index_burn_tx,
  index_token,
  latest_transactions_tx,
  all_tokens_page,
  all_tokens_token,
  dividend_page,
  tx_page,
  nonslp_tx_page,
  block_page,
  block_tx,
  token_page,
  token_page_nft,
  token_mint_tx,
  token_burn_tx,
  token_address,
  token_child_nft,
  token_tx,
  address_page,
  address_cashaccount,
  address_transactions_tx,
  address_token,
  address_burn_tx,
  error_404_page,
  error_processing_tx_page,
  error_notx_page,
  error_badaddress_page,
  search_token_result,
  search_cashaccount_result
}).map(([k, v]) => ([k, ejs.compile(v)])));

import translation_en from '../lang/en.json';
import translation_zh from '../lang/zh.json';
import translation_hi from '../lang/hi.json';
import translation_es from '../lang/es.json';
import translation_ru from '../lang/ru.json';
import translation_ko from '../lang/ko.json';
import translation_ms from '../lang/ms.json';
import translation_ja from '../lang/ja.json';
import translation_bn from '../lang/bn.json';
import translation_yo from '../lang/yo.json';
import translation_fil from '../lang/fil.json';
import translation_pt from '../lang/pt.json';
import translation_tr from '../lang/tr.json';
const i18next_config = {
  fallbackLng: 'en',
  debug: false,
  resources: {
    'en':    { translation: JSON.parse(translation_en) },
    'zh':    { translation: JSON.parse(translation_zh) },
    'hi':    { translation: JSON.parse(translation_hi) },
    'es':    { translation: JSON.parse(translation_es) },
    'ru':    { translation: JSON.parse(translation_ru) },
    'ko':    { translation: JSON.parse(translation_ko) },
    'ms':    { translation: JSON.parse(translation_ms) },
    'ja':    { translation: JSON.parse(translation_ja) },
    'bn':    { translation: JSON.parse(translation_bn) },
    'yo':    { translation: JSON.parse(translation_yo) },
    'fil':   { translation: JSON.parse(translation_fil) },
    'pt':    { translation: JSON.parse(translation_pt) },
    'tr':    { translation: JSON.parse(translation_tr) },
  },
};

i18next
  .use(new i18nextBrowserLanguageDetector())
  .init(i18next_config)
  .then(() => $(document).ready(() => {

  app.util.internationalize($('body'));
  $('html').attr('lang', i18next.language);

  $(window).on('popstate', (e) => {
    app.router(window.location.pathname+window.location.hash, false);
  });

  $('.button-hamburger').click(() => {
    const shown = $('.hamburger-show');
    const hidden = $('.hamburger-hide');
    shown.removeClass('hamburger-show').addClass('hamburger-hide');
    hidden.removeClass('hamburger-hide').addClass('hamburger-show');
    $('#header-search-mobile').focus();
  });

  app.slpstream.init();
  app.router(window.location.pathname+window.location.hash, false);
  $('header').removeClass('loading');
}));


app.util = {
  generate_exchange_links: ($el, tokenIdHex) => {
    const coinex_tokens = {
      'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479': 'https://www.coinex.com/exchange?currency=usdt&dest=usdh',
      '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf': 'https://www.coinex.com/exchange?currency=bch&dest=spice',
    };

    const coinflex_tokens = {
      'dd21be4532d93661e8ffe16db6535af0fb8ee1344d1fef81a193e2b4cfa9fbc9': 'https://www.coinflex.com/flexassets',
      '5fba436097410a1d69d90a1188c341609647ebd2eeac0615e3d275e4b88e790b': 'https://www.coinflex.com/flexassets',
      '78630e16ac2155f6953edeb033654c04665acb8a34eb2d11af9725f8e0f873d0': 'https://www.coinflex.com/flexassets',
    };

    const sideshift_tokens = {
      'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479': 'https://sideshift.ai/bch/usdh',
      '7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f': 'https://sideshift.ai/bch/saislp',
      '9fc89d6b7d5be2eac0b3787c5b8236bca5de641b5bafafc8f450727b63615c11': 'https://sideshift.ai/bch/usdtBch',
      'dd21be4532d93661e8ffe16db6535af0fb8ee1344d1fef81a193e2b4cfa9fbc9': 'https://sideshift.ai/bch/flexusd',
    };

    const sideshift_tokens_settle = {
      'c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479': 'usdh',
      '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf': 'spice',
      '7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f': 'saislp',
      '9fc89d6b7d5be2eac0b3787c5b8236bca5de641b5bafafc8f450727b63615c11': 'usdtBch',
      'dd21be4532d93661e8ffe16db6535af0fb8ee1344d1fef81a193e2b4cfa9fbc9': 'flexusd',
    };

    const custom_tokens = {
      '7f8889682d57369ed0e32336f8b7e0ffec625a35cca183f4e81fde4e71a538a1': {
        'type': 'honk_faucet',
        'link': `https://faucet.honkhonk.io/r/dx1OP`,
        'class': 'exchange-honkfaucet-icon',
      },
    };

    const links = [];

    if (coinflex_tokens.hasOwnProperty(tokenIdHex)) {
      links.push({
        'type': 'coinflex',
        'link': `${coinflex_tokens[tokenIdHex]}`,
        'class': 'exchange-coinflex-icon',
      });
    }

    if (custom_tokens.hasOwnProperty(tokenIdHex)) {
      links.push(custom_tokens[tokenIdHex]);
    }

    if (sideshift_tokens.hasOwnProperty(tokenIdHex)) {
      links.push({
        'type': 'sideshift',
        'link': sideshift_tokens[tokenIdHex],
        'class': 'exchange-sideshift-icon',
        'meta': {
          'settleMethodId': sideshift_tokens_settle[tokenIdHex],
        },
      });
    }

    if (coinex_tokens.hasOwnProperty(tokenIdHex)) {
      links.push({
        'type': 'coinex',
        'link': `${coinex_tokens[tokenIdHex]}&refer_code=c39pv`,
        'class': 'exchange-coinex-icon',
      });
    }

    if (links.length > 0) {
      $el.append('<hr>');
    }
    for (const m of links) {
      const $obj = $(`<a href="${m.link}" target="blank"><div class="exchange-icon ${m.class}"></div></a>`);
      if (m.type === 'sideshift') {
        $obj.click((event) => {
          // if sideshift hasnt loaded yet
          if (typeof(sideshift) === 'undefined') {
            return;
          }

          event.preventDefault();
          _paq.push(['trackGoal', 4]);
          window.scrollTo(0, 0);
          window.__SIDESHIFT__ = {
            testerId: '9a8b1c79b64edf17',
            parentAffiliateId: 'jsKIdsWiF',
            defaultDepositMethodId: 'bch' || undefined,
            defaultSettleMethodId: m.meta.settleMethodId,
            settleAddress: '' || undefined,
          };
          sideshift.show();
        });
      }
      $el.append($obj);
    }
  },
  format_bignum: (bn) => {
    let dpos = -1;
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
  document_link: (doc) => {
    const email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const url_regex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    const bitcoinfile_regex = /^bitcoinfile:[0-9a-fA-F]{64}$/;

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

    if (bitcoinfile_regex.test(doc)) {
      return `https://bitcoinfiles.com/${doc}`;
    }

    if (protocol_regex.test(doc)) {
      return doc;
    }

    return '';
  },

  create_pagination: ($el, page=0, max_page=10, fn) => {
    const $paginator = $el.find('.pagination');
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
    const poffend = Math.min(poffstart+5, max_page);

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

  extract_total: (o, key='count') => {
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
    y_title=i18next.t('transactions'),
    time_period=60*60*24*30*1000,
    split_time_period=60*60*24*1000,
    line_type='hvh',
  ) => {
    for (const o of usage.c) {
      o.block_epoch = new Date(o.block_epoch * 1000);
    }
    usage.c.sort((a, b) => a.block_epoch - b.block_epoch);

    const usage_split_t = [];
    if (usage.c.length > 0) {
      let ts = +(usage.c[0].block_epoch);
      let splitset = [];

      for (const m of usage.c) {
        if (+(m.block_epoch) > ts + split_time_period) {
          ts = +(m.block_epoch);
          usage_split_t.push(splitset);
          splitset = [];
        }
        splitset.push(m);
      }

      usage_split_t.push(splitset);
    }

    const start_date = new Date((+(new Date)) - time_period);

    const split_data = [];
    for (let i=0; i<Math.ceil(time_period / split_time_period); ++i) {
      split_data.push({
        block_epoch: new Date(start_date.getTime() + (split_time_period*i)),
        txs: 0,
      });
    }

    for (const m of usage_split_t) {
      const d_off = app.util.time_periods_between(
        start_date,
        m[0].block_epoch,
        split_time_period,
      );
      split_data[d_off].txs = m.reduce((a, v) => a+v.txs, 0);
    }

    $('#'+dom_id).html('');
    try {
      Plotly.newPlot(dom_id, [
        {
          x: split_data.map((v) => v.block_epoch),
          y: split_data.map((v) => v.txs),
          fill: 'tonexty',
          type: 'scatter',
          name: 'Daily',
          line: {shape: line_type}, // maybe we're not ready for curves yet
        },
      ], {
        yaxis: {
          title: y_title,
        },
      });
    } catch (e) {
      console.error('Plotly.newPlot failed', e);
    }
  },

  set_token_icon: ($el, size) => {
    const tokenIdHex = $el.data('tokenid');
    const tokenGroup = $el.data('tokengroup');

    let icon_repo = 'https://icons.fountainhead.cash';
    if (tokenGroup && app.group_icon_repos.hasOwnProperty(tokenGroup)) {
        icon_repo = app.group_icon_repos[tokenGroup];
    }

    const append_jdenticon = () => {
      const size_px = size != 'original' ? size : 128;
      const $jdenticon = $(`<svg width="${size_px}" height="${size_px}" data-jdenticon-hash="${tokenIdHex}"></svg>`);
      $jdenticon.jdenticon();
      $el.append($jdenticon);
    };


    if (window.sessionStorage.getItem('tokenimgerr_'+tokenIdHex) === null) {
      const $img = $('<img>');
      $img.attr('src', `${icon_repo}/${size}/${tokenIdHex}.png`);

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

  attach_search_handler: ($selector, $container) => {
    $selector.closest('form').submit(false);

    $selector.autocomplete({
      groupBy: 'category',
      preventBadQueries: false, // retry query in case slpdb hasnt yet indexed something
      triggerSelectOnValidInput: false, // disables reload on clicking into box again
      autoSelectFirst: true, // first item will be selected when showing suggestions
      showNoSuggestionNotice: true,
      noSuggestionNotice: 'No results found...',
      appendTo: $container,
      width: 'flex',
      lookup: function(query, done) {
        const search_value = $selector.val().trim();

        _paq.push(['trackSiteSearch', search_value, false, 0]);

        // check if address entered
        try {
          const addr = bchaddr.toSlpAddress(search_value);
          $selector.val('');
          return app.router('/#address/'+addr);
        } catch (e) {}

        Promise.all([
          app.slpdb.query({
            'v': 3,
            'q': {
              'db': ['t'],
              'find': {
                '$or': [
                  {
                    'tokenDetails.tokenIdHex': search_value,
                  },
                  {
                    'tokenDetails.name': {
                      '$regex': '^'+search_value+'.*',
                      '$options': 'i',
                    },
                  },
                  {
                    'tokenDetails.symbol': {
                      '$regex': '^'+search_value+'.*',
                      '$options': 'i',
                    },
                  },
                ],
              },
              'sort': {'tokenStats.approx_txns_since_genesis': -1},
              'limit': 10,
            },
          }),
          app.slpdb.query({
            'v': 3,
            'q': {
              'db': ['u', 'c'],
              'find': {'tx.h': search_value},
              'limit': 1,
            },
          }),
          app.bitdb.query({
            'v': 3,
            'q': {
              'db': ['c'],
              'find': {
                'out.h1': '01010101',
                'blk.i': {
                  '$gte': 563620,
                },
                'out.s2': {
                  '$regex': '^'+search_value+'.*',
                  '$options': 'i',
                },
              },
              'sort': {
                'blk.i': -1,
              },
              'limit': 10,
            },
            'r': {
              'f': '[ .[] | ( .out[] | select(.b0.op==106) ) as $outWithData | { blockheight: .blk.i?, blockhash: .blk.h?, txid: .tx.h?, name: $outWithData.s2, data: $outWithData.h3 } ]',
            },
          }),
        ]).then(([tokens, transactions, cashaccounts]) => {
          const sugs = [];

          for (const m of tokens.t) {
            if (m.tokenDetails.tokenIdHex === search_value) {
              $selector.val('');
              return app.router('/#token/'+m.tokenDetails.tokenIdHex);
            }

            const verified = app.util.is_verified(m.nftParentId || m.tokenDetails.tokenIdHex);
            const tval = app.template.search_token_result({
              verified: verified,
              token: m,
            });

            sugs.push({
              value: m.tokenDetails.tokenIdHex,
              data: {
                url: '/#token/'+m.tokenDetails.tokenIdHex,
                category: i18next.t('tokens'),
                html: tval,
                verified: verified,
                txns_since_genesis: m.tokenStats.approx_txns_since_genesis,
              },
            });
          }

          sugs.sort((a, b) => {
            const av = (a.data.verified*100000000)+a.data.txns_since_genesis;
            const bv = (b.data.verified*100000000)+b.data.txns_since_genesis;
            return bv-av;
          });

          transactions = transactions.u.concat(transactions.c);
          for (const m of transactions) {
            if (m.tx.h === search_value) {
              $selector.val('');
              return app.router('/#tx/'+m.tx.h);
            }

            sugs.push({
              value: m.tx.h,
              data: {
                url: '/#tx/'+m.tx.h,
                category: i18next.t('tx'),
              },
            });
          }

          cashaccounts = cashaccounts.c;
          for (const m of cashaccounts) {
            try {
              const cash_addr = app.util.raw_address_to_cash_address(m.data);
              const slp_addr = bchaddr.toSlpAddress(cash_addr);

              sugs.push({
                value: slp_addr,
                data: {
                  url: '/#address/'+slp_addr,
                  html: app.template.search_cashaccount_result(app.util.get_cash_account_data(m)),
                  category: i18next.t('cash_accounts'),
                },
              });
            } catch (e) { }
          }

          if (search_value.match(/^\d+$/)) {
            if (parseInt(search_value, 10) >= 543375) {
              sugs.push({
                value: search_value,
                data: {
                  url: '/#block/'+search_value,
                  category: i18next.t('blocks'),
                },
              });
            }
          }

          done({suggestions: sugs});
        });
      },
      onSelect: function(sug) {
        $selector.val('');
        app.router(sug.data.url);
      },
      onSearchComplete: function(query, sug) {
        $('.autocomplete-suggestion .token-icon-small').each(function() {
           app.util.set_token_icon($(this), 32);
        });
      },
      formatResult: function(sug) {
        if (sug.data.html) {
          return sug.data.html;
        } else {
          return sug.value;
        }
      },
    });
  },

  is_verified: (txid) => {
    return app.verified_tokens.has(txid);
  },

  flash_latest_item: ($table) => {
    const $el = $table.find('tr:first');
    if ($el) {
      $el.addClass('flash');
      setTimeout(() => {
 $el.removeClass('flash');
}, 1000);
    }
  },

  cash_address_to_raw_address: (address) => {
    let source_value = address;
    switch (address.split(':')[0]) {
      case 'bitcoincash': break;
      case 'bchtest': break;
      default: source_value = 'bitcoincash:'+address;
    }

    const raw = bchaddr.decodeAddress(source_value);
    const payload_hex = raw.hash
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
      .toLowerCase();
    const payload_type = raw.type;
    const types = {'p2pkh': '01', 'p2sh': '02', 'p2pc': '03', 'p2sk': '04'};

    return types[payload_type]+payload_hex;
  },

  raw_address_to_cash_address: (address) => {
    try {
      const arrayFromHex = (hexString) => new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

      const types = {'01': 'p2pkh', '02': 'p2sh', '03': 'p2pc', '04': 'p2sk'};
      const type = types[address.substring(0, 2)];
      const payment_data = address.substring(2);

      return bchaddr.encodeAsCashaddr({
        hash: arrayFromHex(payment_data),
        format: 'bchaddr',
        network: 'mainnet',
        type: type
      });
    } catch (e) {
      return null;
    }
  },

  get_cash_account_data: (cashaccount) => {
    if (! cashaccount) {
      return {};
    }

    let name = cashaccount.name;
    const regex = new RegExp('/^[a-zA-Z0-9_]{1,99}$/');
    if (! regex.test(cashaccount.name) || cashaccount.blockheight <= 563620) {
      name = name.replace(/[^a-zA-Z0-9_]/gi, '');
    }

    const arrayFromHex = (hexString) => new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const avatars = ['1f47b', '1f412', '1f415', '1f408', '1f40e', '1f404', '1f416', '1f410', '1f42a', '1f418', '1f401', '1f407', '1f43f', '1f987', '1f413', '1f427', '1f986', '1f989', '1f422', '1f40d', '1f41f', '1f419', '1f40c', '1f98b', '1f41d', '1f41e', '1f577', '1f33b', '1f332', '1f334', '1f335', '1f341', '1f340', '1f347', '1f349', '1f34b', '1f34c', '1f34e', '1f352', '1f353', '1f95d', '1f965', '1f955', '1f33d', '1f336', '1f344', '1f9c0', '1f95a', '1f980', '1f36a', '1f382', '1f36d', '1f3e0', '1f697', '1f6b2', '26f5', '2708', '1f681', '1f680', '231a', '2600', '2b50', '1f308', '2602', '1f388', '1f380', '26bd', '2660', '2665', '2666', '2663', '1f453', '1f451', '1f3a9', '1f514', '1f3b5', '1f3a4', '1f3a7', '1f3b8', '1f3ba', '1f941', '1f50d', '1f56f', '1f4a1', '1f4d6', '2709', '1f4e6', '270f', '1f4bc', '1f4cb', '2702', '1f511', '1f512', '1f528', '1f527', '2696', '262f', '1f6a9', '1f463', '1f35e'];
    const concat = cashaccount.blockhash + cashaccount.txid;
    const hash = sha256(arrayFromHex(concat));
    const account_hash = hash.substring(0, 8);
    const account_emoji = hash.substring(hash.length - 8);
    // step 4
    const account_hash_step4 = parseInt(account_hash, 16);
    const emoji_index = parseInt(account_emoji, 16) % avatars.length;
    // step 5
    const account_hash_step5 = account_hash_step4.toString().split('').reverse().join('').padEnd(10, '0');

    const avatar_url = '/img/cashaccount-avatars/emoji_u'+avatars[emoji_index]+'.svg';
    return {
      avatar_url: avatar_url,
      name: name,
      blockheight: cashaccount.blockheight - 563620,
      bits: account_hash_step5,
    };
  },

  cashaccount_avatar: (cashaccount) => {
  },

  decimal_formatting: (td_selector) => {
    let biggest_decimals = 0;

    td_selector.each(function() {
      $(this).html($(this).text().trim());

      const val = $(this).text();
      const dotidx = val.indexOf('.');
      if (dotidx >= 0) {
        biggest_decimals = Math.max(biggest_decimals, val.length - dotidx);
      }
    });

    td_selector.each(function() {
      const val = $(this).html();
      const dotidx = val.indexOf('.');
      const skip = dotidx < 0 ? biggest_decimals : biggest_decimals-(val.length - dotidx);
      if (dotidx >= 0) {
        const dparts = val.split('.');
        $(this).html(`${dparts[0]}.<span class="decimal-part">${dparts[1]}</span>`);
      }
      $(this).html($(this).html()+('&nbsp;').repeat(skip));
    });
  },

  fetch_retry: (url, options, n=5) => fetch(url, options).catch(function(error) {
    if (n === 0) {
      throw error;
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve(app.util.fetch_retry(url, options, n - 1)), 1000);
    });
  }),

  attach_clipboard: (container_selector) => {
    const clipboard = new ClipboardJS(`${container_selector} .copybtn`);
    tippy(`${container_selector} .copybtn`, {
      content: i18next.t('copy_to_clipboard')
    });
  },

  internationalize: ($el) => {
    $el.find('[data-i18n]').each(function() {
      const trans = i18next.t($(this).data('i18n'));

      if (typeof($(this).attr('placeholder')) === 'string') {
        // TODO why doesnt this work?
        $(this).attr('placeholder', trans);
      } else {
        $(this).html(trans);
      }
    });
  },
  transaction_type_trans: (translation_type) => {
    switch (translation_type) {
      case 'SEND':    return i18next.t('send');
      case 'MINT':    return i18next.t('mint');
      case 'GENESIS': return i18next.t('genesis');
    }

    return translation_type;
  },
  set_meta_description: (description) => {
    $('meta[name="description"]').attr('content', description);
    $('meta[name="twitter:description"]').attr('content', description);
    $('meta[property="og:description"]').attr('content', description);
  },
  set_title: (title) => {
    document.title = title;
    $('meta[name="twitter:title"]').attr('content', title);
    $('meta[property="og:title"]').attr('content', title);
  },
};

const btoa_ext = (buf) => Buffer.Buffer.from(buf).toString('base64');

app.slpdb = {
  query: (query) => new Promise((resolve, reject) => {
    if (! query) {
      return resolve(false);
    }
    const b64 = btoa_ext(JSON.stringify(query));
    const url = 'https://slpdb.bitcoin.com/q/' + b64;

    console.log(url);

    app.util.fetch_retry(url)
    .then((r) => r = r.json())
    .then((r) => {
      if (r.hasOwnProperty('error')) {
        reject(new Error(r['error']));
      }
      resolve(r);
    });
  }),

  all_tokens: (limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['t'],
      'find': {},
      'sort': {
        'tokenStats.approx_txns_since_genesis': -1,
      },
      'limit': limit,
      'skip': skip,
    },
  }),

  count_all_tokens: () => ({
    'v': 3,
    'q': {
      'db': ['t'],
      'aggregate': [
        {
          '$match': {},
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  count_unconfirmed_token_transaction_history: (tokenIdHex, address=null) => {
    let match;

    if (address == null) {
      match = {
        '$and': [
          {'slp.valid': true},
          {'slp.detail.tokenIdHex': tokenIdHex},
        ],
      };
    } else {
      match = {
        '$and': [
          {'slp.valid': true},
          {'slp.detail.tokenIdHex': tokenIdHex},
        ],
        '$or': [
          {'in.e.a': address},
          {'out.e.a': address},
        ],
      };
    }

    return {
      'v': 3,
      'q': {
        'db': ['u'],
        'aggregate': [
          {
            '$match': match,
          },
          {
            '$group': {
              '_id': null,
              'count': {'$sum': 1},
            },
          },
        ],
      },
      'r': {
        'f': '[ .[] | {count: .count } ]',
      },
    };
  },

  token_transaction_history: (db, tokenIdHex, address=null, limit=100, skip=0) => {
    const q = {
      'v': 3,
      'q': {
        'db': [db],
        'find': {
          '$and': [
            {'slp.valid': true},
            {'slp.detail.tokenIdHex': tokenIdHex},
          ],
        },
        'sort': {'blk.i': -1},
        'limit': limit,
        'skip': skip,
      },
    };

    if (address !== null) {
      q['q']['find']['$query']['$or'] = [
        {'in.e.a': address},
        {'out.e.a': address},
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
    'v': 3,
    'q': {
      'db': ['c', 'u'],
      'aggregate': [
        {
          '$match': {
            'tx.h': txid,
          },
        },
        {
          '$limit': 1,
        },
        {
          '$lookup': {
            'from': 'graphs',
            'localField': 'tx.h',
            'foreignField': 'graphTxn.txid',
            'as': 'graph',
          },
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'slp.detail.tokenIdHex',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
      ],
      'limit': 1,
    },
  }),

  count_txs_by_block: (height) => ({
    'v': 3,
    'q': {
      'db': ['c'],
      'aggregate': [
        {
          '$match': {
            '$and': [
              {'slp.valid': true},
              {'blk.i': height},
            ],
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  count_txs_in_mempool: () => ({
    'v': 3,
    'q': {
      'db': ['u'],
      'aggregate': [
        {
          '$match': {
            'slp.valid': true,
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  txs_by_block: (height, limit=150, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['c'],
      'aggregate': [
        {
          '$match': {
            '$and': [
              {'slp.valid': true},
              {'blk.i': height},
            ],
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'slp.detail.tokenIdHex',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
      ],
      'limit': limit,
    },
  }),

  txs_in_mempool: (limit=150, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['u'],
      'aggregate': [
        {
          '$match': {
            'slp.valid': true,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'slp.detail.tokenIdHex',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
      ],
      'limit': limit,
    },
  }),

  token: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['t'],
      'find': {
        'tokenDetails.tokenIdHex': tokenIdHex,
      },
      'limit': 1,
    },
  }),
  tokens: (tokenIdHexs) => ({
    'v': 3,
    'q': {
      'db': ['t'],
      'find': {
        'tokenDetails.tokenIdHex': {
          '$in': tokenIdHexs,
        },
      },
      'limit': tokenIdHexs.length,
    },
  }),
  token_addresses: (tokenIdHex, limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': 'UNSPENT',
          },
        },
        {
          '$group': {
            '_id': '$graphTxn.outputs.address',
            'slpAmount': {
              '$sum': '$graphTxn.outputs.slpAmount',
            },
          },
        },
        {
          '$match': {
            'slpAmount': {
              '$gt': 0,
            },
          },
        },
      ],
      'sort': {
        'slpAmount': -1,
      },
      'project': {
        'address': '$_id',
        'token_balance': '$slpAmount',
      },
      'limit': limit,
      'skip': skip,
    },
  }),
  token_mint_history: (tokenIdHex, limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['u', 'c'],
      'find': {
        'slp.valid': true,
        'slp.detail.tokenIdHex': tokenIdHex,
        '$or': [
          {
            'slp.detail.transactionType': 'GENESIS',
          },
          {
            'slp.detail.transactionType': 'MINT',
          },
        ],
      },
      'sort': {
        'blk.i': -1,
      },
      'limit': limit,
      'skip': skip,
    },
  }),
  count_token_mint_transactions: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['c'],
      'aggregate': [
        {
          '$match': {
            'slp.valid': true,
            'slp.detail.tokenIdHex': tokenIdHex,
            '$or': [
              {
                'slp.detail.transactionType': 'GENESIS',
              },
              {
                'slp.detail.transactionType': 'MINT',
              },
            ],
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  token_get_total_burned: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs.status': {
              '$in': [
                'SPENT_NON_SLP',
                'BATON_SPENT_INVALID_SLP',
                'SPENT_INVALID_SLP',
                'BATON_SPENT_NON_SLP',
                'MISSING_BCH_VOUT',
                'BATON_MISSING_BCH_VOUT',
                'BATON_SPENT_NOT_IN_MINT',
                'EXCESS_INPUT_BURNED',
              ],
            },
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': {
              '$in': [
                'SPENT_NON_SLP',
                'BATON_SPENT_INVALID_SLP',
                'SPENT_INVALID_SLP',
                'BATON_SPENT_NON_SLP',
                'MISSING_BCH_VOUT',
                'BATON_MISSING_BCH_VOUT',
                'BATON_SPENT_NOT_IN_MINT',
                'EXCESS_INPUT_BURNED',
              ],
            },
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {
              '$sum': '$graphTxn.outputs.slpAmount',
            },
          },
        },
      ],
      'limit': 1,
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  token_get_total_satoshis_locked: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs.status': {
              '$in': [
                'UNSPENT',
                'BATON_UNSPENT',
              ],
            },
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': {
              '$in': [
                'UNSPENT',
                'BATON_UNSPENT',
              ],
            },
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {
              '$sum': '$graphTxn.outputs.bchSatoshis',
            },
          },
        },
      ],
      'limit': 1,
    },
    'r': {
      'f': '[ .[] | {count: .count} ]',
    },
  }),

  token_get_total_minted: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            '$or': [
              {'graphTxn.details.transactionType': 'GENESIS'},
              {'graphTxn.details.transactionType': 'MINT'},
            ],
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$group': {
            '_id': null,
            'count': {
              '$sum': '$graphTxn.outputs.slpAmount',
            },
          },
        },
      ],
      'limit': 10,
    },
  }),

  token_get_total_transactions: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {
              '$sum': 1,
            },
          },
        },
      ],
      'limit': 1,
    },
    'r': {
      'f': '[ .[] | {count: .count} ]',
    },
  }),

  token_get_total_utxos: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs.status': {
              '$in': [
                'UNSPENT',
                'BATON_UNSPENT',
              ],
            },
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': {
              '$in': [
                'UNSPENT',
                'BATON_UNSPENT',
              ],
            },
            'graphTxn.outputs.slpAmount': {
              '$gt': 0,
            },
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {
              '$sum': 1,
            },
          },
        },
      ],
      'limit': 1,
    },
    'r': {
      'f': '[ .[] | {count: .count} ]',
    },
  }),

  token_get_total_addresses: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs.status': {
              '$in': [
                'UNSPENT',
                'BATON_UNSPENT',
              ],
            },
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': {
              '$in': [
                'UNSPENT',
                'BATON_UNSPENT',
              ],
            },
            'graphTxn.outputs.slpAmount': {
              '$gt': 0,
            },
          },
        },
        {
          '$group': {
            '_id': '$graphTxn.outputs.address',
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {
              '$sum': 1,
            },
          },
        },
      ],
      'limit': 1,
    },
    'r': {
      'f': '[ .[] | {count: .count} ]',
    },
  }),

  token_burn_history: (tokenIdHex, limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs': {
              '$elemMatch': {
                'status': {
                  '$in': [
                    'SPENT_NON_SLP',
                    'BATON_SPENT_INVALID_SLP',
                    'SPENT_INVALID_SLP',
                    'BATON_SPENT_NON_SLP',
                    'MISSING_BCH_VOUT',
                    'BATON_MISSING_BCH_VOUT',
                    'BATON_SPENT_NOT_IN_MINT',
                    'EXCESS_INPUT_BURNED',
                  ],
                },
                'slpAmount': {
                  '$gt': 0,
                },
              },
            },
          },
        },
        {
          '$lookup': {
            'from': 'confirmed',
            'localField': 'graphTxn.txid',
            'foreignField': 'tx.h',
            'as': 'tx',
          },
        },
        {
          '$sort': {
            'tx.blk.i': -1,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
      ],
    },
  }),
  count_token_burn_transactions: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs': {
              '$elemMatch': {
                'status': {
                  '$in': [
                    'SPENT_NON_SLP',
                    'BATON_SPENT_INVALID_SLP',
                    'SPENT_INVALID_SLP',
                    'BATON_SPENT_NON_SLP',
                    'MISSING_BCH_VOUT',
                    'BATON_MISSING_BCH_VOUT',
                    'BATON_SPENT_NOT_IN_MINT',
                    'EXCESS_INPUT_BURNED',
                  ],
                },
                'slpAmount': {
                  '$gt': 0,
                },
              },
            },
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  count_address_burn_transactions: (address) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            '$or': [
              {
                'graphTxn.outputs': {
                  '$elemMatch': {
                    'address': address,
                    'status': {
                      '$in': [
                        'SPENT_NON_SLP',
                        'BATON_SPENT_INVALID_SLP',
                        'SPENT_INVALID_SLP',
                        'BATON_SPENT_NON_SLP',
                        'MISSING_BCH_VOUT',
                        'BATON_MISSING_BCH_VOUT',
                        'BATON_SPENT_NOT_IN_MINT',
                        'EXCESS_INPUT_BURNED',
                      ],
                    },
                    'slpAmount': {
                      '$gt': 0,
                    },
                  },
                },
              },
              {
                'graphTxn.inputs.address': address,
                'graphTxn.outputs': {
                  '$elemMatch': {
                    'status': {
                      '$in': [
                        'SPENT_NON_SLP',
                        'BATON_SPENT_INVALID_SLP',
                        'SPENT_INVALID_SLP',
                        'BATON_SPENT_NON_SLP',
                        'MISSING_BCH_VOUT',
                        'BATON_MISSING_BCH_VOUT',
                        'BATON_SPENT_NOT_IN_MINT',
                        'EXCESS_INPUT_BURNED',
                      ],
                    },
                    'slpAmount': {
                      '$gt': 0,
                    },
                  },
                },
              },
            ],
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),
  address_burn_history: (address, limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            '$or': [
              {
                'graphTxn.outputs': {
                  '$elemMatch': {
                    'address': address,
                    'status': {
                      '$in': [
                        'SPENT_NON_SLP',
                        'BATON_SPENT_INVALID_SLP',
                        'SPENT_INVALID_SLP',
                        'BATON_SPENT_NON_SLP',
                        'MISSING_BCH_VOUT',
                        'BATON_MISSING_BCH_VOUT',
                        'BATON_SPENT_NOT_IN_MINT',
                        'EXCESS_INPUT_BURNED',
                      ],
                    },
                    'slpAmount': {
                      '$gt': 0,
                    },
                  },
                },
              },
              {
                'graphTxn.inputs.address': address,
                'graphTxn.outputs': {
                  '$elemMatch': {
                    'status': {
                      '$in': [
                        'SPENT_NON_SLP',
                        'BATON_SPENT_INVALID_SLP',
                        'SPENT_INVALID_SLP',
                        'BATON_SPENT_NON_SLP',
                        'MISSING_BCH_VOUT',
                        'BATON_MISSING_BCH_VOUT',
                        'BATON_SPENT_NOT_IN_MINT',
                        'EXCESS_INPUT_BURNED',
                      ],
                    },
                    'slpAmount': {
                      '$gt': 0,
                    },
                  },
                },
              },
            ],
          },
        },
        {
          '$lookup': {
            'from': 'confirmed',
            'localField': 'graphTxn.txid',
            'foreignField': 'tx.h',
            'as': 'tx',
          },
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'tx.slp.detail.tokenIdHex',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
        {
          '$sort': {
            'tx.blk.i': -1,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
      ],
    },
  }),

  count_total_burn_transactions: () => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'graphTxn.outputs': {
              '$elemMatch': {
                'status': {
                  '$in': [
                    'SPENT_NON_SLP',
                    'BATON_SPENT_INVALID_SLP',
                    'SPENT_INVALID_SLP',
                    'BATON_SPENT_NON_SLP',
                    'MISSING_BCH_VOUT',
                    'BATON_MISSING_BCH_VOUT',
                    'BATON_SPENT_NOT_IN_MINT',
                    'EXCESS_INPUT_BURNED',
                  ],
                },
                'slpAmount': {
                  '$gt': 0,
                },
              },
            },
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),
  total_burn_history: (limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'graphTxn.outputs': {
              '$elemMatch': {
                'status': {
                  '$in': [
                    'SPENT_NON_SLP',
                    'BATON_SPENT_INVALID_SLP',
                    'SPENT_INVALID_SLP',
                    'BATON_SPENT_NON_SLP',
                    'MISSING_BCH_VOUT',
                    'BATON_MISSING_BCH_VOUT',
                    'BATON_SPENT_NOT_IN_MINT',
                    'EXCESS_INPUT_BURNED',
                  ],
                },
                'slpAmount': {
                  '$gt': 0,
                },
              },
            },
          },
        },
        {
          '$lookup': {
            'from': 'confirmed',
            'localField': 'graphTxn.txid',
            'foreignField': 'tx.h',
            'as': 'tx',
          },
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'tx.slp.detail.tokenIdHex',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
        {
          '$sort': {
            'tx.blk.i': -1,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
      ],
    },
  }),

  token_child_nfts: (tokenIdHex, limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['t'],
      'aggregate': [
        {
          '$match': {
            'nftParentId': tokenIdHex,
          },
        },
        {
          '$sort': {
            'tokenStats.block_created': -1,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
      ],
    },
  }),
  count_token_child_nfts: (tokenIdHex) => ({
    'v': 3,
    'q': {
      'db': ['t'],
      'aggregate': [
        {
          '$match': {
            'nftParentId': tokenIdHex,
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  recent_transactions: (limit=150, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['c', 'u'],
      'aggregate': [
        {
          '$match': {
            'slp.valid': true
          },
        },
        {
          '$sort': {
            '_id': -1,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'slp.detail.tokenIdHex',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
      ],
      'limit': limit,
    },
  }),
  transactions_by_slp_address: (db, address, limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': [db],
      'aggregate': [
        {
          '$match': {
            '$and': [
              {'slp.valid': true},
              {
                '$or': [
                  {'in.e.a': address},
                  {'out.e.a': address},
                ],
              },
            ],
          },
        },
        {
          '$sort': {'blk.i': -1},
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'slp.detail.tokenIdHex',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
        {
          '$lookup': {
            'from': 'graphs',
            'localField': 'tx.h',
            'foreignField': 'graphTxn.txid',
            'as': 'graph',
          },
        },
      ],
      'limit': limit,
    },
  }),
  unconfirmed_transactions_by_slp_address: (address, limit=100, skip=0) => {
    return app.slpdb.transactions_by_slp_address('u', address, limit, skip);
  },
  confirmed_transactions_by_slp_address: (address, limit=100, skip=0) => {
    return app.slpdb.transactions_by_slp_address('c', address, limit, skip);
  },
  count_total_transactions_by_slp_address: (address) => ({
    'v': 3,
    'q': {
      'db': [
        'c',
        'u',
      ],
      'aggregate': [
        {
          '$match': {
            '$and': [
              {
                '$or': [
                  {'in.e.a': address},
                  {'out.e.a': address},
                ],
              },
              {'slp.valid': true},
            ],
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),
  count_address_sent_transactions: (address) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'graphTxn.inputs.address': address,
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),
  count_address_recv_transactions: (address) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'graphTxn.inputs.address': {
              '$ne': address,
            },
            'graphTxn.outputs.address': address,
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  count_tokens_by_slp_address: (address) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'graphTxn.outputs.address': address,
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': 'UNSPENT',
            'graphTxn.outputs.address': address,
          },
        },
        {
          '$group': {
            '_id': '$tokenDetails.tokenIdHex',
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  tokens_by_slp_address: (address, limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'graphTxn.outputs.address': address,
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': 'UNSPENT',
            'graphTxn.outputs.address': address,
          },
        },
        {
          '$group': {
            '_id': '$tokenDetails.tokenIdHex',
            'slpAmount': {
              '$sum': '$graphTxn.outputs.slpAmount',
            },
          },
        },
        {
          '$sort': {
            'slpAmount': -1,
          },
         },
        {
          '$match': {
            'slpAmount': {
              '$gt': 0,
            },
          },
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': '_id',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
      ],
      'sort': {
        'slpAmount': -1,
       },
      'skip': skip,
      'limit': limit,
    },
  }),

  count_tokens: () => ({
    'v': 3,
    'q': {
      'db': ['t'],
      'aggregate': [
        {
          '$match': {},
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  recent_tokens: (limit=100, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['c'],
      'aggregate': [
        {
          '$match': {
            'slp.detail.transactionType': 'GENESIS',
            'slp.valid': true,
          },
        },
        {
          '$lookup': {
            'from': 'tokens',
            'localField': 'tx.h',
            'foreignField': 'tokenDetails.tokenIdHex',
            'as': 'token',
          },
        },
        {
          '$sort': {
            'blk.i': -1,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
      ],
      'limit': limit,
    },
  }),

  tokengraph: (tokenIdHex, limit=10000, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'find': {
        'tokenDetails.tokenIdHex': tokenIdHex,
      },
      'limit': 10000,
    },
  }),

  count_txs_per_block: (match_obj={}) => {
    const obj = {
      'v': 3,
      'q': {
        'db': ['c'],
        'aggregate': [
          {
            '$match': match_obj,
          },
          {
            '$group': {
               '_id': '$blk.t',
              'count': {'$sum': 1},
            },
          },
        ],
        'limit': 100000,
      },
      'r': {
        'f': '[ .[] | {block_epoch: ._id, txs: .count} ]',
      },
    };

    return obj;
  },

  get_amounts_from_txid_vout_pairs: (pairs=[], tokenIdHex, versionType) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'graphTxn.details.tokenIdHex': tokenIdHex,
            'graphTxn.details.versionType': versionType,
            'graphTxn.txid': {
              '$in': [...new Set(pairs.map((v) => v.txid))],
            },
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            '$or': pairs.map((v) => ({
              '$and': [
                {
                  'graphTxn.txid': v.txid,
                },
                {
                  'graphTxn.outputs.vout': v.vout,
                },
              ],
            })),
          },
        },
      ],
      'limit': 20,
    },
    'r': {
      'f': '[ .[] | { txid: .graphTxn.txid, vout: .graphTxn.outputs.vout, slpAmount: .graphTxn.outputs.slpAmount} ]',
    },
  }),
  get_txs_from_txid_vout_pairs: (pairs=[]) => ({
    'v': 3,
    'q': {
      'db': ['u', 'c'],
      'aggregate': [
        {
          '$match': {
            'in.e.h': {
              '$in': [...new Set(pairs.map((v) => v.txid))],
            },
          },
        },
        {
          '$unwind': '$in',
        },
        {
          '$match': {
            '$or': pairs.map((v) => ({
              '$and': [
                {
                  'in.e.h': v.txid,
                },
                {
                  'in.e.i': v.vout,
                },
              ],
            })),
          },
        },
      ],
      'limit': 20,
    },
    'r': {
      'f': '[ .[] | { txid: .tx.h, in: { i: .in.e.i } } ]',
    },
  }),
  dividend_calculate_bch_mempool: (tokenIdHex, slp_supply, bch_amount, ignoreAddresses) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs.status': 'UNSPENT',
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': 'UNSPENT',
            'graphTxn.outputs.address': {
              '$nin': ignoreAddresses,
            },
          },
        },
        {
          '$group': {
            '_id': '$graphTxn.outputs.address',
            'slpAmount': {
              '$sum': '$graphTxn.outputs.slpAmount',
            },
          },
        },
        {
          '$sort': {
            'slpAmount': -1,
          },
        },
        {
          '$project': {
            '_id': 1,
            'bchAmount': {
              '$divide': ['$slpAmount', slp_supply],
            },
          },
        },
        {
          '$project': {
            '_id': 1,
            'bchAmount': {
              '$multiply': ['$bchAmount', bch_amount],
            },
          },
        },
        {
          '$limit': 10000,
        },
         {
          '$match': {
            'bchAmount': {
              '$gte': 0.00000546,
            },
          },
        },
      ],
      'limit': 10000,
    },
    'r': {
      'f': '[ .[] | { address: ._id, bchAmount: .bchAmount } ]',
    },
  }),

  dividend_count_ignore_amounts: (tokenIdHex, addresses) => ({
    'v': 3,
    'q': {
      'db': ['g'],
      'aggregate': [
        {
          '$match': {
            'tokenDetails.tokenIdHex': tokenIdHex,
            'graphTxn.outputs.status': 'UNSPENT',
            'graphTxn.outputs.address': {
              '$in': addresses,
            },
          },
        },
        {
          '$unwind': '$graphTxn.outputs',
        },
        {
          '$match': {
            'graphTxn.outputs.status': 'UNSPENT',
            'graphTxn.outputs.address': {
              '$in': addresses,
            },
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {
              '$sum': '$graphTxn.outputs.slpAmount',
            },
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),
};

app.slpstream = {
  reset: () => {
    app.slpstream.on_block = (height, data) => {
      console.log('slpstream.on_block', height, data);
    };

    app.slpstream.on_mempool = (sna) => {
      console.log('slpstream.on_mempool', sna);
    };
  },

  init_listener: (query, fn) => {
    if (! query) {
      return false;
    }

    const b64 = btoa_ext(JSON.stringify(query));
    const url = 'https://slpstream.fountainhead.cash/s/' + b64;

    const sse = new EventSource(url);
    sse.onmessage = (e) => fn(JSON.parse(e.data));
    return sse;
  },

  init: () => {
    console.log('initializing slpstream');
    app.slpstream.reset();

    app.slpstream.init_listener({
      'v': 3,
      'q': {
        'db': ['u', 'c'],
        'find': {},
      },
    }, (data) => {
      console.log('slpstream data: ', data);
      if ((data.type !== 'mempool' && data.type !== 'block') ||
      data.data.length < 1) {
        return;
      }

      if (data.type === 'block') {
        app.slpstream.on_block(data.data);
      }

      if (data.type === 'mempool') {
        app.slpstream.on_mempool(data.data[0]);
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
    const url = 'https://bitdb2.fountainhead.cash/q/' + b64;

    console.log(url);

    app.util.fetch_retry(url)
    .then((r) => r = r.json())
    .then((r) => {
      if (r.hasOwnProperty('error')) {
        reject(new Error(r['error']));
      }
      resolve(r);
    });
  }),

  count_txs_by_block: (height) => ({
    'v': 3,
    'q': {
      'db': ['c'],
      'aggregate': [
        {
          '$match': {
            'blk.i': height,
          },
        },
        {
          '$group': {
            '_id': null,
            'count': {'$sum': 1},
          },
        },
      ],
    },
    'r': {
      'f': '[ .[] | {count: .count } ]',
    },
  }),

  recent_transactions: (limit=150, skip=0) => ({
    'v': 3,
    'q': {
      'db': ['c'],
      'aggregate': [
        {
          '$match': {},
        },
        {
          '$sort': {
            'blk.i': -1,
          },
        },
        {
          '$skip': skip,
        },
        {
          '$limit': limit,
        },
      ],
      'limit': limit,
    },
  }),

  lookup_tx_by_input: (txid, vout) => ({
    'v': 3,
    'q': {
      'find': {
        'in': {
          '$elemMatch': {
            'e.h': txid,
            'e.i': vout,
          },
        },
      },
      'limit': 1,
    },
  }),

  tx: (txid) => ({
    'v': 3,
    'q': {
      'db': ['c', 'u'],
      'find': {
        'tx.h': txid,
      },
      'limit': 1,
    },
  }),
  get_amounts_from_txid_vout_pairs: (pairs=[]) => ({
    'v': 3,
    'q': {
      'db': ['c', 'u'],
      'aggregate': [
        {
          '$match': {
            'tx.h': {
              '$in': [...new Set(pairs.map((v) => v.txid))],
            },
          },
        },
        {
          '$unwind': '$out',
        },
        {
          '$match': {
            '$or': pairs.map((v) => ({
              '$and': [
                {
                  'tx.h': v.txid,
                },
                {
                  'out.e.i': v.vout,
                },
              ],
            })),
          },
        },
      ],
      'limit': 20,
    },
    'r': {
      'f': '[ .[] | { txid: .tx.h, vout: .out.e.i, amount: .out.e.v} ]',
    },
  }),

  // thanks kos
  get_cashaccount: (raw_address) => ({
    'v': 3,
    'q': {
      'find': {
        'out.h1': '01010101',
        'out.h3': raw_address,
        'blk.i': {
          '$gte': 563720,
        },
      },
      'sort': {
        'blk.i': 1,
      },
      'limit': 1,
    },
    'r': {
        'f': '[ .[] | ( .out[] | select(.b0.op==106) ) as $outWithData | { blockheight: .blk.i?, blockhash: .blk.h?, txid: .tx.h?, name: $outWithData.s2, data: $outWithData.h3 } ]',
    },
  }),
};


app.get_tokens_from_tokenids = (token_ids, chunk_size=50) => {
  const reqs = [];
  for (let i=0; i<Math.ceil(token_ids.length / chunk_size); ++i) {
    reqs.push(app.slpdb.query(
      app.slpdb.tokens(token_ids.slice(chunk_size*i, (chunk_size*i)+chunk_size)),
    ));
  }

  return Promise.all(reqs)
  .then((results) => {
    const tx_tokens = [];
    results
    .map((v) => v.t)
    .reduce((a, v) => a.concat(v), [])
    .forEach((v) => tx_tokens[v.tokenDetails.tokenIdHex] = v);

    return tx_tokens;
  });
};

app.get_tokens_from_transactions = (transactions, chunk_size=50) => {
  let token_ids = [];
  for (const m of transactions) {
    if (m.slp && m.slp.detail) token_ids.push(m.slp.detail.tokenIdHex);
  }
  token_ids = [...new Set(token_ids)]; // make unique

  return app.get_tokens_from_tokenids(token_ids, chunk_size);
};

app.extract_sent_amount_from_tx = (tx, addr) => {
  let outer = new Set(tx.in.map((v) => v.e.a));

  if (tx.graph && tx.graph[0] && addr) {
    outer = new Set(tx.graph[0].graphTxn.inputs.map((v) => v.address));
  }

  let self_send = true;
  for (const v of tx.slp.detail.outputs) {
    if (! outer.has(v.address)) {
      self_send = false;
      break;
    }
  }

  // if self_send we count entirety of outputs as send amount
  if (self_send) {
    let amount = tx.slp.detail.outputs
      .map((v) => new BigNumber(v.amount))
      .reduce((a, v) => a.plus(v), new BigNumber(0));

    if (addr && tx.graph[0]) {
      const in_amount = tx.graph[0].graphTxn.inputs
        .filter((e) => e.address == addr)
        .map((v) => new BigNumber(v.slpAmount))
        .reduce((a, v) => a.plus(v), new BigNumber(0));

      amount = amount.minus(amount.minus(in_amount));
    }

    return app.util.format_bignum(amount.toFormat(tx.slp.detail.decimals));
  }

  // otherwise count amount not sent to self
  const outer_arr = [...outer];

  const amount = tx.slp.detail.outputs
    .filter((e) => outer_arr.indexOf(e.address) < 0)
    .map((v) => new BigNumber(v.amount))
    .reduce((a, v) => a.plus(v), new BigNumber(0));

  return app.util.format_bignum(amount.toFormat(tx.slp.detail.decimals));
};

app.extract_recv_amount_from_tx = (tx, addr) => {
  return app.util.format_bignum(
    tx.slp.detail.outputs
      .filter((e) => e.address === addr)
      .map((v) => new BigNumber(v.amount))
      .reduce((a, v) => a.plus(v), new BigNumber(0))
      .toFormat(tx.slp.detail.decimals),
  );
};

app.init_404_page = () => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_404_page());
  app.util.set_meta_description(`404 page not found`);
  resolve();
});

app.init_nonslp_tx_page = (txid, highlight=[], slp=null) =>
  new Promise((resolve, reject) => {
    app.bitdb.query(app.bitdb.tx(txid))
    .then((tx) => {
      tx = tx.u.concat(tx.c);
      if (tx.length === 0) {
        return resolve(app.init_error_notx_page(txid));
      }

      tx = tx[0];

      const chunk_size = 20;

      const input_txid_vout_pairs = tx.in.map((v) => ({
        txid: v.e.h,
        vout: v.e.i,
      }));

      const input_txid_vout_reqs = [];
      for (let i=0; i<Math.ceil(input_txid_vout_pairs.length / chunk_size); ++i) {
        const chunk = input_txid_vout_pairs.slice(chunk_size*i, (chunk_size*i)+chunk_size);

        input_txid_vout_reqs.push(app.bitdb.query(
          app.bitdb.get_amounts_from_txid_vout_pairs(chunk),
        ));
      }

      Promise.all(input_txid_vout_reqs)
      .then((results) => {
        const input_pairs = results.reduce((a, v) => a.concat(v.u).concat(v.c), []);
        const input_amounts = input_pairs.reduce((a, v) => {
          a[v.txid+':'+v.vout] = v.amount;
          return a;
        }, {});

        const lookup_missing_spendtxid = (m, txid, vout) =>
          app.bitdb.query(app.bitdb.lookup_tx_by_input(txid, vout))
          .then((tx) => {
            const ttx = tx.u.length > 0 ? tx.u[0] : tx.c.length > 0 ? tx.c[0] : null;
            m['spendTxid'] = null;
            m['spendVout'] = null;
            if (ttx !== null) {
              m['spendTxid'] = ttx.tx.h;
              m['spendVout'] = ttx.in.filter((v) => v.e.h === txid && v.e.i === vout)[0].i;
            }
          });

        const missing_lookups = tx.out.map((m) => {
          return lookup_missing_spendtxid(m, tx.tx.h, m.e.i);
        });

        Promise.all(missing_lookups)
        .then((lookups) => {
          $('main[role=main]').html(app.template.nonslp_tx_page({
            tx: tx,
            input_amounts: input_amounts,
            slp: slp,
          }));
          app.util.set_meta_description(`View information about the Bitcoin Cash transaction ${txid}`);
          app.util.attach_clipboard('main[role=main]');
          app.util.decimal_formatting($('#inputs-list tbody tr td:nth-child(3)'));
          app.util.decimal_formatting($('#outputs-list tbody tr td:nth-child(3)'));

          for (const h of highlight) {
            if (h.length < 2) continue;
            const type = h[0] == 'i' ? 'input' : 'output';
            const idx = parseInt(h.slice(1), 10);
            const $selector = $('#'+type+'s-list .table tr:nth-child('+(1+idx)+')');
            $selector.addClass('highlight');
            /*
            $('html,body').animate({
               scrollTop: $selector.offset().top - 100
            });*/
          }

          resolve();
        });
      });
    });
  });

app.init_error_processing_tx_page = (tx) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_processing_tx_page({
    tx: tx,
  }));
  app.util.set_meta_description(`Processing transaction... please check back later`);
  resolve();
});

app.init_error_notx_page = (txid) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_notx_page({
    txid: txid,
  }));
  app.util.set_meta_description(`This transaction was not found in SLPDB or BitDB. It may have been very old or mispelled.`);
  resolve();
});

app.init_error_badaddress_page = (address) => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.error_badaddress_page({
    address: address,
  }));
  app.util.set_meta_description(`Sorry, we cannot decode the address given. Double check it isn't misspelled.`);
  resolve();
});

app.init_index_page = () =>
  new Promise((resolve, reject) => {
    $('main[role=main]')
    .html(app.template.index_page());

    app.util.attach_search_handler($('#main-search'), $('#main-search-suggestions-container'));
    $('#language_selector').val(i18next.language.split('-')[0]);
    if($('#language_selector').val() === null) {
      $('#language_selector').val('en');
    }
    $('#language_selector').change(function() {
      window.location = update_query_string_value('lng', $(this).val());
    });
    $('#language_selector').niceSelect();

    app.slpdb.query(app.slpdb.recent_transactions(10))
    .then((data) => {
      const transactions = data.u.concat(data.c);
      $('#recent-transactions-table tbody').html('');

      for (let i=0; i<transactions.length && i<10; ++i) {
        $('#recent-transactions-table tbody').append(
          app.template.latest_transactions_tx({
            tx: transactions[i],
          }),
        );
      }

      app.util.internationalize($('#recent-transactions-table'));
      app.util.attach_clipboard('#recent-transactions-table');
      $('#recent-transactions-table tbody .token-icon-small').each(function() {
        app.util.set_token_icon($(this), 32);
      });

      app.util.decimal_formatting($('#recent-transactions-table tbody tr td:nth-child(3)'));

      $('#recent-transactions-table-container').removeClass('loading');
    });


    const create_transaction_graph = (time_period, split_time_period, line_type) => {
      Promise.all([
        app.slpdb.query(app.slpdb.count_txs_per_block({
          '$and': [
            {'slp.valid': true},
            {'blk.t': {
              '$gte': (+(new Date) / 1000) - time_period,
              '$lte': (+(new Date) / 1000),
            }},
          ],
        })),
        app.slpdb.query({
          'v': 3,
          'q': {
            'aggregate': [
              {
                '$match': {
                  'blk.t': {
                    '$gte': (+(new Date) / 1000) - time_period,
                    '$lte': (+(new Date) / 1000),
                  },
                },
              },
              {
                '$group': {
                  '_id': '$slp.detail.name',
                  'count': {
                    '$sum': 1,
                  },
                },
              },
              {
                '$sort': {
                  'count': -1,
                },
              },
                {
                '$limit': 20,
              },
            ],
          },
          'r': {
            'f': '[ .[] | {token_name: ._id, txs: .count} ]',
          },
        }),
      ])
      .then(([monthly_usage, token_usage]) => {
        app.util.create_time_period_plot(
          monthly_usage,
          'plot-usage',
          i18next.t('transactions'),
          time_period*1000,
          split_time_period*1000,
          line_type,
        );
        const token_usage_monthly = token_usage.c;
        const total_slp_tx_month = monthly_usage.c.reduce((a, v) => a+v.txs, 0);
        $('#transaction-count').text(Number(total_slp_tx_month).toLocaleString());

        token_usage_monthly.push({
          token_name: i18next.t('other'),
          txs: total_slp_tx_month - token_usage_monthly.reduce((a, v) => a + v.txs, 0),
        });

        $('#plot-token-usage').html('');
        try {
          Plotly.newPlot('plot-token-usage', [{
            x: token_usage_monthly.map((v) => v.token_name),
            y: token_usage_monthly.map((v) => v.txs),
            type: 'bar',
            marker: {
              color: token_usage_monthly.map((v, i) =>
                (i < token_usage_monthly.length-1) ? 'rgba(100, 167, 205, 1)' :
                                                   'rgba(232, 102, 102, 1)',
              ),
            },
          }], {
            title: i18next.t('popular_tokens'),
          });
        } catch (e) {
          console.error('Plotly.newPlot failed', e);
        }
      });
    };
    create_transaction_graph(60*60*24*30, 60*60*24);
    $('#plot-usage-month').addClass('active');
    [
      {
        id: '#plot-usage-year',
        time_period: 60*60*24*365,
        split_time_period: 60*60*24*7,
      },
      {
        id: '#plot-usage-month',
        time_period: 60*60*24*30,
        split_time_period: 60*60*24,
      },
      {
        id: '#plot-usage-week',
        time_period: 60*60*24*7,
        split_time_period: 60*60*6,
      },
      {
        id: '#plot-usage-day',
        time_period: 60*60*24,
        split_time_period: 60*60*2,
      },
    ].forEach((data) => {
      $(data.id).click(function() {
        create_transaction_graph(
          data.time_period,
          data.split_time_period,
          'hvh',
         );
        $('.plot-time-selector span').removeClass('active');
        $(this).addClass('active');
        $('#plot-usage').html('Loading...');
        $('#plot-token-usage').html('');
      });
    });

    const load_paginated_tokens = (limit, skip, done) => {
      app.slpdb.query(app.slpdb.recent_tokens(limit, skip))
      .then((genesises) => {
        genesises = genesises.c;

        const tbody = $('#index-tokens-table tbody');
        tbody.html('');

        genesises.forEach((tx) => {
          tbody.append(
            app.template.index_token({
              tx: tx,
            }),
          );
        });

        app.util.internationalize($('#index-tokens-table'));
        app.util.attach_clipboard('#index-tokens-table');
        $('#index-tokens-table tbody .token-icon-small').each(function() {
          app.util.set_token_icon($(this), 32);
        });

        done();
      });
    };

    const load_paginated_burn_history = (limit, skip, done) => {
      app.slpdb.query(app.slpdb.total_burn_history(limit, skip))
      .then((transactions) => {
        transactions = transactions.g;

        const tbody = $('#index-burn-history-table tbody');
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
            app.template.index_burn_tx({
              tx: tx,
              total_burnt: total_burnt,
            }),
          );
        });
        app.util.internationalize($('#index-burn-history-table'));
        app.util.attach_clipboard('#index-burn-history-table');
        $('#index-burn-history-table tbody .token-icon-small').each(function() {
          app.util.set_token_icon($(this), 32);
        });

        app.util.decimal_formatting($('#index-burn-history-table tbody tr td:nth-child(3)'));

        done();
      });
    };


    app.slpdb.query(app.slpdb.count_tokens())
    .then((total_tokens) => {
      total_tokens = app.util.extract_total(total_tokens);
      $('#index-tokens-count').text(Number(total_tokens.t).toLocaleString());

      if (total_tokens.t === 0) {
        $('#index-tokens-table tbody').html('<tr><td>No tokens found.</td></tr>'); // TODO internationalize
      } else {
        app.util.create_pagination(
          $('#index-tokens-table-container'),
          0,
          Math.ceil(total_tokens.t / 10),
          (page, done) => {
            load_paginated_tokens(10, 10*page, done);
          },
        );
      }
    });

    app.slpdb.query(app.slpdb.count_address_burn_transactions())
    .then((total_burn_transactions) => {
      total_burn_transactions = app.util.extract_total(total_burn_transactions);
      $('#index-burn-count').text(Number(total_burn_transactions.g).toLocaleString());

      if (total_burn_transactions.g === 0) {
        $('#index-burn-history-table tbody').html('<tr><td>No burns found.</td></tr>'); // TODO internationalize
      } else {
        app.util.create_pagination(
          $('#index-burn-history-table-container'),
          0,
          Math.ceil(total_burn_transactions.g / 10),
          (page, done) => {
            load_paginated_burn_history(10, 10*page, done);
          },
        );
      }
    });

    app.slpstream.on_mempool = (sna) => {
      const tokenIdHex = (sna.slp.detail.transactionType === 'GENESIS') ? sna.tx.h : sna.slp.detail.tokenIdHex;
      app.slpdb.query(app.slpdb.token(tokenIdHex))
      .then((token_data) => {
        if (token_data.t.length === 0) {
          console.error('slpstream token not found');
          return;
        }
        const token = token_data.t[0];

        sna.token = [token];
        sna.slp.detail.outputs = sna.slp.detail.outputs.map((v) => {
          const bn = new BigNumber(v.amount).dividedBy(10 ** sna.token[0].tokenDetails.decimals);
          v.amount = bn.toString();
          return v;
        });

        const tbody = $('#recent-transactions-table tbody');
        tbody.prepend(
          app.template.latest_transactions_tx({tx: sna}),
        );

        app.util.internationalize(tbody);
        app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);
        app.util.flash_latest_item(tbody);

        app.util.decimal_formatting($('#recent-transactions-table tbody tr td:nth-child(3)'));

        tbody.find('tr:last').remove();
      });
    };

    app.slpstream.on_block = (index, data) => {
      // TODO delete all pending items from list, add add in block
      // then do query for mempool items and add those on top
      // ensure ordering is the same
      console.log('on_block', index, data);
    };
    resolve();
  });

app.init_all_tokens_page = () =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.count_all_tokens())
    .then((all_tokens_count) => {
      all_tokens_count = app.util.extract_total(all_tokens_count);

      $('main[role=main]').html(app.template.all_tokens_page());
      $('#all-tokens-total-tokens').text(Number(all_tokens_count.t).toLocaleString());
      app.util.set_meta_description(`View all ${$('#all-tokens-total-tokens').html()} tokens created with Simple Ledger Protocol on Bitcoin Cash`);

      const load_paginated_tokens = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.all_tokens(limit, skip))
        .then((tokens) => {
          tokens = tokens.t;

          const tbody = $('#all-tokens-table tbody');
          tbody.html('');

          tokens.forEach((token) => {
            tbody.append(
              app.template.all_tokens_token({
                token: token,
              }),
            );
          });

          app.util.internationalize($('#all-tokens-table'));
          app.util.attach_clipboard('#all-tokens-table');
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
          },
        );
      }

      resolve();
    }),
  );

app.init_dividend_page = () => new Promise((resolve, reject) => {
  $('main[role=main]').html(app.template.dividend_page());
  app.util.set_meta_description(`Calculate Bitcoin Cash Dividend Payments to SLP Tokens`);

  $('#div_calculate').click(() => {
    const tokenIdHex = $('#div_tokenid').val();
    if (tokenIdHex.length != 64) {
      alert(i18next.t('tokenid_required'));
      return;
    }

    let ignoreAddresses = [];
    try {
        ignoreAddresses = $('#div_ignore_addresses').val()
          .split('\n')
          .filter((v) => v.length !== 0)
          .map((v) => bchaddr.toSlpAddress(v));
    } catch (e) {
      alert('invalid ignore address found');
      return;
    }

    Promise.all([
      app.slpdb.query(app.slpdb.token_get_total_minted(tokenIdHex)),
      app.slpdb.query(app.slpdb.token_get_total_burned(tokenIdHex)),
      app.slpdb.query(app.slpdb.dividend_count_ignore_amounts(tokenIdHex, ignoreAddresses)),
    ])
    .then(([
      total_minted,
      total_burned,
      total_ignored,
    ]) => {
      total_minted = app.util.extract_total(total_minted).g;
      total_burned = app.util.extract_total(total_burned).g;
      total_ignored = app.util.extract_total(total_ignored).g;

      const supply = new BigNumber(total_minted)
        .minus(new BigNumber(total_burned))
        .minus(new BigNumber(total_ignored));

      app.slpdb.query(app.slpdb.dividend_calculate_bch_mempool(
        tokenIdHex,
        Number(supply.toFixed()),
        Number($('#div_bch').val()),
        ignoreAddresses,
      ))
      .then((data) => {
        $('#div_results').html(
          data.g.map((v) => `${bchaddr.toSlpAddress(v.address)},${Number(v.bchAmount).toFixed(8)}`)
          .reduce((a, v) => a+v+'\n', ''),
        );
      });
    });
  });

  resolve();
});

app.init_tx_page = (txid, highlight=[]) =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.tx(txid))
    .then((tx) => {
      tx = tx.u.concat(tx.c);
      if (tx.length == 0) {
        return resolve(app.init_nonslp_tx_page(txid, highlight));
      }

      tx = tx[0];

      if (! tx.slp || ! tx.slp.valid) {
        return resolve(app.init_nonslp_tx_page(tx.tx.h, highlight, tx.slp));
      }

      if (tx.graph.length === 0) {
        return resolve(app.init_error_processing_tx_page(tx));
      }

      const chunk_size = 20;

      const input_txid_vout_pairs = tx.in.map((v) => ({
        txid: v.e.h,
        vout: v.e.i,
      }));


      const input_txid_vout_reqs = [];
      for (let i=0; i<Math.ceil(input_txid_vout_pairs.length / chunk_size); ++i) {
        const chunk = input_txid_vout_pairs.slice(chunk_size*i, (chunk_size*i)+chunk_size);

        input_txid_vout_reqs.push(app.slpdb.query(
          app.slpdb.get_amounts_from_txid_vout_pairs(
            chunk,
            tx.slp.detail.tokenIdHex,
            tx.slp.detail.versionType
          ),
        ));
      }

      Promise.all(input_txid_vout_reqs)
      .then((results) => {
        const input_pairs = results.reduce((a, v) => a.concat(v.g), []);

        const input_amounts = input_pairs.reduce((a, v) => {
          a[v.txid+':'+v.vout] = v.slpAmount;
          return a;
        }, {});

        app.slpdb.query(app.slpdb.token(tx.slp.detail.tokenIdHex))
        .then((token) => {
          const lookup_missing_spendtxid = (m, txid, vout) =>
            app.bitdb.query(app.bitdb.lookup_tx_by_input(txid, vout))
            .then((tx) => {
              const ttx = tx.u.length > 0 ? tx.u[0] : tx.c.length > 0 ? tx.c[0] : null;
              m['spendTxid'] = null;
              m['spendVout'] = null;
              if (ttx !== null) {
                m['spendTxid'] = ttx.tx.h;
                const ifilt = ttx.in.filter((v) => v.e.h === txid && v.e.i === vout);
                if (ifilt.length > 0) {
                  m['spendVout'] = ifilt[0].i + 1;
                }
              }
            });

          const missing_lookups = tx.graph[0].graphTxn.outputs.map((m) => {
            return lookup_missing_spendtxid(m, tx.graph[0].graphTxn.txid, m.vout);
          });

          Promise.all(missing_lookups)
          .then(() => {
            $('main[role=main]').html(app.template.tx_page({
              tx: tx,
              token: token.t[0],
              input_amounts: input_amounts,
            }));
            app.util.set_meta_description(`View information about ${txid} which was a ${tx.slp.detail.transactionType} of ${token.t[0].tokenDetails.name}`);
            app.util.attach_clipboard('main[role=main]');
            app.util.set_token_icon($('main[role=main] .transaction_box .token-icon-large'), 128);

            app.util.decimal_formatting($('#inputs-list tbody tr td:nth-child(2)'));
            app.util.decimal_formatting($('#outputs-list tbody tr td:nth-child(2)'));

            for (const h of highlight) {
              if (h.length < 2) continue;
              const type = h[0] == 'i' ? 'input' : 'output';
              const idx = parseInt(h.slice(1), 10) - 1;
              const $selector = $('#'+type+'s-list .table tr:nth-child('+(idx+1)+')');
              if ($selector.length > 0) {
                $selector.addClass('highlight');
                /*
                $('html,body').animate({
                   scrollTop: $selector.offset().top
                });
                */
              }
            }

            const cytoscape_colors = {
              tx:              '#4DE935',
              input:           '#CCCCCC',
              address:         '#AAAAAA',
              burn:            '#FAAAAA',
              txin:            '#555555',
              txin_slp:        '#DE35E9',
              txout:           '#333333',
              txout_slp:       '#35C1E9',
              txout_slp_burn:  '#f94a4a',
              txout_slp_baton: '#00ff00',
              select_color:    '#E9358F',
            };

            const create_cytoscape_context = (selector='.graph_container') => {
              const cy = cytoscape({
                container: $(selector),
                style: [
                {
                  selector: 'node',
                  style: {
                    'width': 10,
                    'height': 10,
                    'background-color': 'transparent',
                    'border-color': 'data(color)',
                    'border-width': 2,
                    'padding': 'data(padding)',
                    'shape': 'data(type)',
                    'text-wrap': 'wrap',
                    'text-rotation': '-20deg',
                    'font-size': 2,
                    'text-halign': 'right',
                    'color': 'rgba(0,0,0,0.5)',
                    'label': 'data(val)',
                  },
                },
                {
                  selector: ':selected',
                  style: {
                    'padding': 5,
                    'background-color': 'transparent',
                    'border-color': cytoscape_colors.select_color,
                    'border-width': 4,
                  },
                },
                {
                  selector: 'edge',
                  style: {
                    'width': 1,
                    'label': 'data(val)',
                    'text-wrap': 'wrap',
                    'text-halign': 'right',
                    'font-size': 2,
                    'line-color': 'data(color)',
                    'target-arrow-color': 'data(color)',
                    'text-background-opacity': 1,
                    'text-background-color': 'data(color)',
                    'text-border-color': 'data(color)',
                    'text-border-width': 5,
                    'text-border-style': 'solid',
                    'color': 'white',
                    'text-border-color': 'data(color)',
                    'text-rotation': '-20deg',
                    'text-border-width': 5,
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                  },
                }],
                layout: {
                  name: 'klay',
                  animate: true,
                },
              });

              cy.once('render', (e) => {
                cy.on('tap', (e) => {
                  const tdata = e.target.json();

                  if (tdata.data && tdata.data.url) {
                    app.router(tdata.data.url);
                  }
                });
              });

              return cy;
            };

            const cytoscape_extract_graph = (tx) => {
              const items        = [];
              const addresses    = new Set();
              const inputs       = new Set();
              const output_vouts = new Set();
              const burn_txids   = new Set();

              items.push({ data: {
                id:      tx.tx.h,
                color:   cytoscape_colors.tx,
                type:    'diamond',
                kind:    'tx',
                val:     tx.tx.h,
                padding: 0,
              }});

              for (const m of tx.graph[0].graphTxn.inputs) {
                const vin = m.txid + ':' + m.vout;
                inputs.add(vin);

                items.push({ data: {
                  id:      m.txid + '/' + m.vout + '/in',
                  source:  vin,
                  target:  tx.tx.h,
                  color:   cytoscape_colors.txin_slp,
                  kind:    'txin',
                  val:      `${m.slpAmount} ${tx.token[0].tokenDetails.symbol}`,
                  padding: 0,
                }});
              }

              for (const m of tx.in) {
                const vin = m.e.h + ':' + m.e.i;
                if (inputs.has(vin)) {
                  continue;
                }
                inputs.add(vin);

                items.push({ data: {
                  id:      m.e.a + '/' + tx.tx.h + '/in',
                  source:  vin,
                  target:  tx.tx.h,
                  color:   cytoscape_colors.txin,
                  kind:    'txin',
                  val:     'BCH',
                  padding: 0,
                }});
              }

              for (const m of tx.graph[0].graphTxn.outputs) {
                output_vouts.add(m.vout);

                if (m.status === 'EXCESS_INPUT_BURNED') {
                  burn_txids.add(m.spendTxid);
                  items.push({ data: {
                    id:      m.spendTxid + '/' + tx.tx.h + '/burn',
                    source:  tx.tx.h,
                    target:  m.spendTxid,
                    color:   cytoscape_colors.txout_slp_burn,
                    kind:    'burn',
                    val:     `BURN ${m.slpAmount} ${tx.token[0].tokenDetails.symbol}`,
                    padding: 0,
                  }});
                } else if (
                  m.status === 'BATON_SPENT_IN_MINT' ||
                  m.status === 'BATON_UNSPENT'
                ) {
                  addresses.add(m.address);
                  items.push({ data: {
                    id:      m.spendTxid + '/' + tx.tx.h + '/baton',
                    source:  tx.tx.h,
                    target:  m.address,
                    color:   cytoscape_colors.txout_slp_baton,
                    kind:    'baton',
                    val:     `BATON ${tx.token[0].tokenDetails.symbol}`,
                    padding: 0,
                  }});
                } else {
                  addresses.add(m.address);
                  items.push({ data: {
                    id:      m.address + '/' + tx.tx.h + '/slpout',
                    source:  tx.tx.h,
                    target:  m.address,
                    color:   cytoscape_colors.txout_slp,
                    kind:    'txout',
                    val:     `${m.slpAmount} ${tx.token[0].tokenDetails.symbol}`,
                    padding: 0,
                  }});
                }
              }
              for (const m of tx.out) {
                if (typeof m.e.a === 'undefined') {
                  continue;
                }
                if (output_vouts.has(m.e.i)) {
                  continue;
                }
                addresses.add(m.e.a);

                items.push({ data: {
                  id:      m.e.a + '/' + tx.tx.h + '/out',
                  source:  tx.tx.h,
                  target:  m.e.a,
                  color:   cytoscape_colors.txout,
                  kind:    'txout',
                  val:     app.util.format_bignum_bch_str(m.e.v) + ' BCH',
                  padding: 0,
                }});
              }

              inputs.forEach((v) => {
                const [tx, vout] = v.split(':');
                items.push({ data: {
                  id:       v,
                  url:     `/#tx/${tx}/o${vout}`,
                  color:   cytoscape_colors.input,
                  type:    'square',
                  kind:    'input',
                  val:     v,
                  padding: 0,
                }});
              });
              addresses.forEach((v) => {
                items.push({ data: {
                  id:       v,
                  url:     `/#address/${v}`,
                  color:   cytoscape_colors.address,
                  type:    'square',
                  kind:    'address',
                  val:     v,
                  padding: 0,
                }});
              });
              burn_txids.forEach((v) => {
                items.push({ data: {
                  id:      v,
                  url:     `/#tx/${v}`,
                  color:   cytoscape_colors.burn,
                  type:    'square',
                  kind:    'tx',
                  val:     v,
                  padding: 0,
                }});
              });

              return items;
            };

            $('#txgraph-container').css('height',
              $('#token-details-table-container')
              .closest('.rounded_row').outerHeight()
            );

            const cy = create_cytoscape_context('#txgraph-container');
            cy.json({ elements: cytoscape_extract_graph(tx) })
              .layout({ name: 'klay', animate: true })
              .run();

            resolve();
          });
        });
      });
    }),
  );

app.init_block_page = (height) =>
  new Promise((resolve, reject) =>
    app.bitdb.query(app.bitdb.count_txs_by_block(height+1))
    .then((total_bch_txs_by_next_block) => {
      total_bch_txs_by_next_block = app.util.extract_total(total_bch_txs_by_next_block);

      $('main[role=main]').html(app.template.block_page({
        height: height,
        next_block_exists: total_bch_txs_by_next_block.c > 0,
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
                tx: tx,
              }),
            );
          });

          app.util.internationalize($('#block-transactions-table'));
          app.util.attach_clipboard('#block-transactions-table');
          $('#block-transactions-table tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
          });

          app.util.decimal_formatting($('#block-transactions-table tbody tr td:nth-child(3)'));

          done();
        });
      };


      app.slpdb.query(app.slpdb.count_txs_by_block(height))
      .then((total_txs_by_block) => {
        total_txs_by_block = app.util.extract_total(total_txs_by_block).c;
        $('#total_txs, #total_transactions').html(Number(total_txs_by_block).toLocaleString());
        app.util.set_meta_description(`Block ${height} has ${$('#total_txs').html()} SLP transactions.`);

        if (total_txs_by_block === 0) {
          $('#block-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
        } else {
          app.util.create_pagination(
            $('#block-transactions-table-container'),
            0,
            Math.ceil(total_txs_by_block / 15),
            (page, done) => {
              load_paginated_transactions(15, 15*page, done);
            },
          );
        }
      });

      resolve();
    }),
  );

app.init_block_mempool_page = (height) =>
  new Promise((resolve, reject) =>
    app.bitdb.query(app.bitdb.recent_transactions(1))
    .then((most_recent_tx) => {
      const most_recent_block_height = most_recent_tx.c[0].blk.i;

      $('main[role=main]').html(app.template.block_page({
        height: 'mempool',
        most_recent_block_height: most_recent_block_height,
      }));
      app.util.set_meta_description(`The Bitcoin Cash Mempool contains all transactions waiting to be confirmed in a block.`);

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.txs_in_mempool(limit, skip))
        .then((transactions) => {
          transactions = transactions.u;

          const tbody = $('#block-transactions-table tbody');
          tbody.html('');

          transactions.forEach((tx) => {
            tbody.append(
              app.template.block_tx({
                tx: tx,
              }),
            );
          });

          app.util.internationalize($('#block-transactions-table'));
          app.util.attach_clipboard('#block-transactions-table');
          $('#block-transactions-table tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
          });

          app.util.decimal_formatting($('#block-transactions-table tbody tr td:nth-child(3)'));

          done();
        });
      };

      app.slpdb.query(app.slpdb.count_txs_in_mempool())
      .then((total_txs_in_mempool) => {
        total_txs_in_mempool = app.util.extract_total(total_txs_in_mempool).u;
        $('#total_txs, #total_transactions').html(Number(total_txs_in_mempool).toLocaleString());

        if (total_txs_in_mempool === 0) {
          $('#block-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
        } else {
          app.util.create_pagination(
            $('#block-transactions-table-container'),
            0,
            Math.ceil(total_txs_in_mempool / 15),
            (page, done) => {
              load_paginated_transactions(15, 15*page, done);
            },
          );
        }
      });

      app.slpstream.on_mempool = (sna) => {
        const transactions_page = app.util.get_pagination_page($('#block-transactions-table-container'));
        if (transactions_page !== 0) {
          return;
        }
        app.slpdb.query(app.slpdb.token(sna.slp.detail.tokenIdHex))
        .then((token_data) => {
          if (! token_data || ! token_data.t || token_data.t.length === 0) {
            console.error('slpstream token not found');
            return;
          }
          const token = token_data.t[0];
          sna.token = [token];
          sna.slp.detail.outputs = sna.slp.detail.outputs.map((v) => {
            const bn = new BigNumber(v.amount).dividedBy(10 ** sna.token[0].tokenDetails.decimals);
            v.amount = bn.toString();
            return v;
          });


          const tbody = $('#block-transactions-table tbody');
          tbody.prepend(
            app.template.block_tx({tx: sna}),
          );
          tbody.find('tr:last').remove();

          app.util.decimal_formatting($('#block-transactions-table tbody tr td:nth-child(3)'));

          app.util.flash_latest_item(tbody);
          app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);
        });
      };

      resolve();
    }),
  );

app.init_token_page = (tokenIdHex) =>
  new Promise((resolve, reject) =>
    app.slpdb.query(app.slpdb.token(tokenIdHex))
    .then((token) => {
      if (token.t.length == 0) {
        return resolve(app.init_404_page());
      }

      token = token.t[0];

      if (token.tokenDetails.versionType === 65) {
        $('main[role=main]').html(app.template.token_page_nft({
          token: token,
        }));
        app.util.set_token_icon($('main[role=main] .transaction_box--nft .token-icon-large'), 'original');
      } else {
        $('main[role=main]').html(app.template.token_page({
          token: token,
        }));
        app.util.set_token_icon($('main[role=main] .transaction_box .token-icon-large'), 128);
      }

      app.util.attach_clipboard('main[role=main]');


      if (token.tokenDetails.versionType === 129) {
        app.slpdb.query(app.slpdb.count_token_child_nfts(tokenIdHex))
        .then((total_token_child_nfts) => {
          total_token_child_nfts = app.util.extract_total(total_token_child_nfts).t;
          $('#total_token_child_nfts').html(Number(total_token_child_nfts).toLocaleString());

          const load_paginated_token_child_nfts = (limit, skip, done) => {
            app.slpdb.query(app.slpdb.token_child_nfts(tokenIdHex, limit, skip))
            .then((tokens) => {
             const tbody = $('#token-child-nfts-table tbody');
             tbody.html('');

              tokens.t.forEach((token) => {
                tbody.append(
                  app.template.token_child_nft({
                    token: token,
                  }),
                );
              });

              app.util.internationalize($('#token-child-nfts-table'));
              app.util.attach_clipboard('#token-child-nfts-table');
              $('#token-child-nfts-table tbody .token-icon-small').each(function() {
                app.util.set_token_icon($(this), 32);
              });

              done();
            });
          };

          if (total_token_child_nfts === 0) {
            $('#token-child-nfts-table tbody').html('<tr><td>No children found.</td></tr>');
          } else {
            app.util.create_pagination(
              $('#token-child-nfts-table-container'),
              0,
              Math.ceil(total_token_child_nfts / 10),
              (page, done) => {
                load_paginated_token_child_nfts(10, 10*page, done);
              },
            );
          }
        });
      }

      const load_paginated_token_addresses = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.token_addresses(tokenIdHex, limit, skip))
        .then((addresses) => {
          const tbody = $('#token-addresses-table tbody');
          tbody.html('');

          addresses.g.forEach((address) => {
            if (token.tokenDetails.versionType === 65) {
              $('#tokenstats_nft_owner').html(`
                <a href="/#address/${address.address}">${address.address}</a>
                <button class="copybtn" data-clipboard-text="${address.address}"></button>
              `);
              app.util.attach_clipboard('#tokenstats_nft_owner');
            }
            tbody.append(
              app.template.token_address({
                address: address,
                decimals: token.tokenDetails.decimals,
              }),
            );
          });

          app.util.internationalize($('#token-addresses-table'));
          app.util.attach_clipboard('#token-addresses-table');
          app.util.decimal_formatting($('#token-addresses-table tbody tr td:nth-child(2)'));

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
                tx: tx,
              }),
            );
          });

          app.util.internationalize($('#token-mint-history-table'));
          app.util.attach_clipboard('#token-mint-history-table');
          app.util.decimal_formatting($('#token-mint-history-table tbody tr td:nth-child(3)'));

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
            if (token.tokenDetails.versionType === 65) {
              $('#tokenstats_nft_burnt').html(`
                <a href="/#tx/${tx.graphTxn.txid}">${tx.graphTxn.txid}</a>
                <button class="copybtn" data-clipboard-text="${tx.graphTxn.txid}"></button>
              `);
              app.util.attach_clipboard('#tokenstats_nft_burnt');
            }
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
                total_burnt: total_burnt,
              }),
            );
          });

          app.util.internationalize($('#token-burn-history-table'));
          app.util.attach_clipboard('#token-burn-history-table');
          app.util.decimal_formatting($('#token-burn-history-table tbody tr td:nth-child(2)'));

          done();
        });
      };

      const load_paginated_token_txs = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.count_unconfirmed_token_transaction_history(tokenIdHex))
        .then((total_unconfirmed_token_transactions) => {
          total_unconfirmed_token_transactions = app.util.extract_total(total_unconfirmed_token_transactions).u;

          const tasks = [];
          if (skip < total_unconfirmed_token_transactions) {
            tasks.push(app.slpdb.query(app.slpdb.unconfirmed_token_transaction_history(tokenIdHex, null, limit, skip)));

            if (skip+limit > total_unconfirmed_token_transactions) {
              if (limit - (total_unconfirmed_token_transactions % limit) > 0) {
                tasks.push(app.slpdb.query(
                  app.slpdb.confirmed_token_transaction_history(
                    tokenIdHex,
                    null,
                    limit - (total_unconfirmed_token_transactions % limit),
                    0,
                  ),
                ));
              }
            }
          } else {
            tasks.push(app.slpdb.query(
              app.slpdb.confirmed_token_transaction_history(
                tokenIdHex,
                null,
                limit,
                skip - (total_unconfirmed_token_transactions % limit),
              ),
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
                  tx: tx,
                }),
              );
            });

            app.util.internationalize($('#token-transactions-table'));
            app.util.attach_clipboard('#token-transactions-table');
            app.util.decimal_formatting($('#token-transactions-table tbody tr td:nth-child(3)'));

            done();
          });
        });
      };

      app.slpdb.query(app.slpdb.count_token_mint_transactions(tokenIdHex))
      .then((total_token_mint_transactions) => {
        total_token_mint_transactions = app.util.extract_total(total_token_mint_transactions).c;
        $('#total_token_mint_transactions').html(Number(total_token_mint_transactions).toLocaleString());

        if (total_token_mint_transactions === 0) {
          $('#token-mint-history-table tbody').html('<tr><td>No mints found.</td></tr>');
        } else {
          app.util.create_pagination(
            $('#token-mint-history-table-container'),
            0,
            Math.ceil(total_token_mint_transactions / 10),
            (page, done) => {
              load_paginated_token_mint_history(10, 10*page, done);
            },
          );
        }
      });


      app.slpdb.query(app.slpdb.count_token_burn_transactions(tokenIdHex))
      .then((total_token_burn_transactions) => {
        total_token_burn_transactions = app.util.extract_total(total_token_burn_transactions).g;
        $('#total_token_burn_transactions').html(Number(total_token_burn_transactions).toLocaleString());

        if (total_token_burn_transactions === 0) {
          $('#token-burn-history-table tbody').html('<tr><td>No burns found.</td></tr>');
          $('#tokenstats_nft_burnt').html('');
        } else {
          app.util.create_pagination(
            $('#token-burn-history-table-container'),
            0,
            Math.ceil(total_token_burn_transactions / 10),
            (page, done) => {
              load_paginated_token_burn_history(10, 10*page, done);
            },
          );
        }
      });

      Promise.all([
        app.slpdb.query(app.slpdb.token_get_total_transactions(tokenIdHex)),
        app.slpdb.query(app.slpdb.token_get_total_utxos(tokenIdHex)),
        app.slpdb.query(app.slpdb.token_get_total_addresses(tokenIdHex)),
        app.slpdb.query(app.slpdb.token_get_total_satoshis_locked(tokenIdHex)),
        app.slpdb.query(app.slpdb.token_get_total_minted(tokenIdHex)),
        app.slpdb.query(app.slpdb.token_get_total_burned(tokenIdHex)),
      ])
      .then(([
        total_transactions,
        total_utxos,
        total_addresses,
        total_satoshis_locked,
        total_minted,
        total_burned,
      ]) => {
        total_transactions = app.util.extract_total(total_transactions).g;
        total_utxos = app.util.extract_total(total_utxos).g;
        total_addresses = app.util.extract_total(total_addresses).g;
        total_satoshis_locked = app.util.extract_total(total_satoshis_locked).g;
        total_minted = app.util.extract_total(total_minted).g;
        total_burned = app.util.extract_total(total_burned).g;

        $('#tokenstats_valid_token_transactions').html(Number(total_transactions).toLocaleString());
        $('#token_transactions_count').html(Number(total_transactions).toLocaleString());
        $('#tokenstats_valid_token_utxos').html(Number(total_utxos).toLocaleString());
        $('#tokenstats_valid_token_addresses').html(Number(total_addresses).toLocaleString());
        $('#token_addresses_count').html(Number(total_addresses).toLocaleString());
        $('#tokenstats_satoshis_locked_up').html(app.util.format_bignum_str(new BigNumber(total_satoshis_locked).toFixed()));
        const totalMinted = new BigNumber(total_minted);
        $('#tokenstats_tokens_minted').html(app.util.format_bignum_str(totalMinted.toFixed(), token.tokenDetails.decimals));
        $('#tokenstats_tokens_burned').html(app.util.format_bignum_str(total_burned, token.tokenDetails.decimals));
        const circulatingSupply = totalMinted.minus(new BigNumber(total_burned));
        $('#tokenstats_circulating_supply').html(app.util.format_bignum_str(circulatingSupply.toFixed()));

        app.util.decimal_formatting($('#token-stats-table tr.decimal-stats td'));
        $('#token-stats-table-container').removeClass('loading');

        app.util.set_meta_description(`${token.tokenDetails.name} (${token.tokenDetails.symbol}) is a ${token.tokenDetails.versionType === 1 ? 'Type1' : token.tokenDetails.versionType === 129 ? 'NFT1-Group' : token.tokenDetails.versionType === 65 ? 'NFT1-Child' : ''} token built on SLP. There have been ${$('#tokenstats_valid_token_transactions').html()} transactions, and ${$('#tokenstats_valid_token_addresses').html()} addresses currently holding. ${$('#tokenstats_circulating_supply').html()} tokens are in circulation.`);


        if (total_addresses === 0) {
          $('#token-addresses-table tbody').html('<tr><td>No addresses found.</td></tr>');
          $('#tokenstats_nft_owner').html('');
        } else {
          app.util.create_pagination(
            $('#token-addresses-table-container'),
            0,
            Math.ceil(total_addresses / 10),
            (page, done) => {
              load_paginated_token_addresses(10, 10*page, done);
            },
          );
        }

        if (total_transactions === 0) {
          $('#token-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
        } else {
          app.slpdb.query(app.slpdb.count_unconfirmed_token_transaction_history(tokenIdHex))
          .then((total_unconfirmed_token_transactions) => {
            total_unconfirmed_token_transactions = app.util.extract_total(total_unconfirmed_token_transactions).u;


            const total_confirmed = total_transactions -
                                  total_unconfirmed_token_transactions;

            app.util.create_pagination(
              $('#token-transactions-table-container'),
              0,
              Math.ceil((total_confirmed % 10 == 0 ? total_confirmed : (total_confirmed + 1)) / 10),
              (page, done) => {
                load_paginated_token_txs(10, 10*page, done);
              },
            );
          });
        }
      });

      const create_transaction_graph = (time_period, split_time_period, line_type) => {
        app.slpdb.query(app.slpdb.count_txs_per_block({
          '$and': [
            {'slp.valid': true},
            {'blk.t': {
              '$gte': (+(new Date) / 1000) - time_period,
              '$lte': (+(new Date) / 1000),
            }},
            {'slp.detail.tokenIdHex': tokenIdHex},
          ],
        })).then((token_usage) => {
          app.util.create_time_period_plot(
            token_usage,
            'plot-token-usage',
            i18next.t('transactions'),
            time_period*1000,
            split_time_period*1000,
            line_type,
          );
          $('#token-usage-count').text(Number(token_usage.c.reduce((a, v) => a+v.txs, 0)).toLocaleString());
        });
      };
      create_transaction_graph(60*60*24*30, 60*60*24);
      $('#plot-token-usage-month').addClass('active');

      [
        {
          id: '#plot-token-usage-year',
          time_period: 60*60*24*365,
          split_time_period: 60*60*24*7,
        },
        {
          id: '#plot-token-usage-month',
          time_period: 60*60*24*30,
          split_time_period: 60*60*24,
        },
        {
          id: '#plot-token-usage-week',
          time_period: 60*60*24*7,
          split_time_period: 60*60*6,
        },
        {
          id: '#plot-token-usage-day',
          time_period: 60*60*24,
          split_time_period: 60*60*2,
        },
      ].forEach((data) => {
        $(data.id).click(function() {
          create_transaction_graph(
            data.time_period,
            data.split_time_period,
            'hvh',
           );
          $('.plot-time-selector span').removeClass('active');
          $(this).addClass('active');
          $('#plot-token-usage').html('Loading...');
        });
      });

      app.slpdb.query(app.slpdb.token_addresses(tokenIdHex, 10))
      .then((token_addresses) => {
        const data = [];

        for (const a of token_addresses.g) {
          data.push({
            address: a.address.split(':')[1],
            token_balance: a.token_balance,
            color: 'rgba(100, 167, 205, 1)',
          });
        }

        const burnt_balance = Number(token.tokenStats.qty_token_burned);

        const other_balance = token.tokenStats.qty_token_circulating_supply -
          data.reduce((a, v) => a + Number(v.token_balance), 0) -
          burnt_balance;

        if (other_balance > 0) {
          data.push({
            address: 'Other',
            token_balance: other_balance,
            color: 'rgba(232, 102, 102, 1)',
          });
        }

        data.sort((a, b) => b.token_balance - a.token_balance);

        try {
          Plotly.newPlot('plot-token-address-rich', [{
            x: data.map((v) => (v.address !== 'Other') ?
              `<a href="/#address/simpleledger:${v.address}">${v.address}</a>` :
              v.address,
            ),
            y: data.map((v) => v.token_balance),
            marker: {
              color: data.map((v) => v.color),
            },
            type: 'bar',
          }], {
          });
        } catch (e) {
          console.error('Plotly.newPlot failed', e);
        }
      });

      app.slpstream.on_mempool = (sna) => {
        if (sna.slp.detail.tokenIdHex !== tokenIdHex) {
            return;
        }

        const transactions_page = app.util.get_pagination_page($('#token-transactions-table-container'));
        if (transactions_page !== 0) {
          return;
        }

        sna.slp.detail.outputs = sna.slp.detail.outputs.map((v) => {
          const bn = new BigNumber(v.amount).dividedBy(10 ** token.tokenDetails.decimals);
          v.amount = bn.toString();
          return v;
        });


        if (sna.slp.detail.transactionType === 'SEND') {
          const tbody = $('#token-transactions-table tbody');

          tbody.prepend(app.template.token_tx({tx: sna}));
          tbody.find('tr:last').remove();

          app.util.flash_latest_item(tbody);

          app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);
        }
      };

      app.util.generate_exchange_links($('#token-exchange-exchanges'), token.tokenDetails.tokenIdHex);
      resolve();
    }),
  );


app.init_address_page = (address) =>
  new Promise((resolve, reject) => {
    try {
      address = bchaddr.toSlpAddress(address);
    } catch (e) {
      return resolve(app.init_error_badaddress_page(address));
    }

    return app.bitdb.query(
      app.bitdb.get_cashaccount(
        app.util.cash_address_to_raw_address(bchaddr.toCashAddress(address)),
      ),
    )
    .then((cashaccount) => {
      cashaccount = cashaccount.u.length > 0 ? cashaccount.u[0] :
                    cashaccount.c.length > 0 ? cashaccount.c[0] :
                    null;
      const cashaccount_data = cashaccount ? app.util.get_cash_account_data(cashaccount) : null;
      const cashaccount_html = cashaccount_data ? app.template.address_cashaccount(cashaccount_data) : '';

      $('main[role=main]').html(app.template.address_page({
        address: address,
        cashaccount_html: cashaccount_html,
      }));
      app.util.attach_clipboard('main[role=main]');

      try {
        new QRCode(document.getElementById('qrcode-address-'+address), {
          text: address,
          width: 512,
          height: 512,
          colorDark: '#222',
          colorLight: '#fff',
          correctLevel: QRCode.CorrectLevel.M,
        });
        $('#qrcode-address-'+address).click(function() {
          // TODO
          console.log('CLICKED');
          $(this).toggleClass('expanded');
        });
      } catch (e) {
        console.error(e);
      }

      const load_paginated_tokens = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.tokens_by_slp_address(address, limit, skip))
        .then((tokens) => {
          tokens = tokens.g;

          const tbody = $('#address-tokens-table tbody');
          tbody.html('');

          tokens.forEach((token) => {
            tbody.append(
              app.template.address_token({
                token: token,
              }),
            );
          });

          app.util.internationalize($('#address-tokens-table'));
          app.util.attach_clipboard('#address-tokens-table');
          $('#address-tokens-table tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
          });

          app.util.decimal_formatting($('#address-tokens-table tbody tr td:nth-child(4)'));

          done();
        });
      };

      const load_paginated_transactions = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.count_total_transactions_by_slp_address(address))
        .then((total_transactions_by_slp_address) => {
          const total_unconfirmed_transactions_by_slp_address = app.util.extract_total(total_transactions_by_slp_address).u;

          const tasks = [];
          if (skip < total_unconfirmed_transactions_by_slp_address) {
            tasks.push(app.slpdb.query(app.slpdb.unconfirmed_transactions_by_slp_address(address, limit, skip)));

            if (skip+limit > total_unconfirmed_transactions_by_slp_address) {
              if (limit - (total_unconfirmed_transactions_by_slp_address % limit) > 0) {
                tasks.push(app.slpdb.query(
                  app.slpdb.confirmed_transactions_by_slp_address(
                    address,
                    limit - (total_unconfirmed_transactions_by_slp_address % limit),
                    0,
                  ),
                ));
              }
            }
          } else {
            tasks.push(app.slpdb.query(
              app.slpdb.confirmed_transactions_by_slp_address(
                address,
                limit,
                skip - (total_unconfirmed_transactions_by_slp_address % limit),
              ),
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
                  address: address,
                }),
              );
            });

            app.util.internationalize($('#address-transactions-table'));
            app.util.attach_clipboard('#address-transactions-table');
            $('#address-transactions-table tbody .token-icon-small').each(function() {
              app.util.set_token_icon($(this), 32);
            });

            app.util.decimal_formatting($('#address-transactions-table tbody tr td:nth-child(3)'));

            done();
          });
        });
      };

      const load_paginated_address_burn_history = (limit, skip, done) => {
        app.slpdb.query(app.slpdb.address_burn_history(address, limit, skip))
        .then((transactions) => {
          transactions = transactions.g;

          const tbody = $('#address-burn-history-table tbody');
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
              app.template.address_burn_tx({
                tx: tx,
                total_burnt: total_burnt,
              }),
            );
          });
          app.util.internationalize($('#address-burn-history-table'));
          app.util.attach_clipboard('#address-burn-history-table');
          $('#address-burn-history-table tbody .token-icon-small').each(function() {
            app.util.set_token_icon($(this), 32);
          });

          done();
        });
      };

      app.slpdb.query(app.slpdb.count_tokens_by_slp_address(address))
      .then((total_tokens) => {
        total_tokens = app.util.extract_total(total_tokens).g;
        $('#total_tokens').html(Number(total_tokens).toLocaleString());

        if (total_tokens === 0) {
          $('#address-tokens-table tbody').html('<tr><td>No tokens balances found.</td></tr>');
        } else {
          app.util.create_pagination(
            $('#address-tokens-table-container'),
            0,
            Math.ceil(total_tokens / 10),
            (page, done) => {
              load_paginated_tokens(10, 10*page, done);
            },
          );
        }
      });

      app.slpdb.query(app.slpdb.count_address_burn_transactions(address))
      .then((total_address_burn_transactions) => {
        total_address_burn_transactions = app.util.extract_total(total_address_burn_transactions).g;
        $('#total_address_burn_transactions').html(Number(total_address_burn_transactions).toFixed());

        if (total_address_burn_transactions === 0) {
          $('#address-burn-history-table tbody').html('<tr><td>No burns found.</td></tr>');
        } else {
          app.util.create_pagination(
            $('#address-burn-history-table-container'),
            0,
            Math.ceil(total_address_burn_transactions / 10),
            (page, done) => {
              load_paginated_address_burn_history(10, 10*page, done);
            },
          );
        }
      });

      Promise.all([
        app.slpdb.query(app.slpdb.count_address_sent_transactions(address)),
        app.slpdb.query(app.slpdb.count_address_recv_transactions(address)),
      ])
      .then(([total_sent_transactions, total_recv_transactions]) => {
        total_sent_transactions = app.util.extract_total(total_sent_transactions).g;
        total_recv_transactions = app.util.extract_total(total_recv_transactions).g;
        $('#total_sent_transactions').html(Number(total_sent_transactions).toLocaleString());
        $('#total_recv_transactions').html(Number(total_recv_transactions).toLocaleString());

        const total_transactions = total_sent_transactions + total_recv_transactions;
        $('#total_transactions').html(Number(total_transactions).toLocaleString());

        app.util.set_meta_description(`The ${cashaccount_data ? cashaccount_data.name : address} address has performed ${$('#total_sent_transactions').html()} transactions and received ${$('#total_recv_transactions').html()} transactions, and is holding a balance of ${$('#total_tokens').html()} different tokens.`);

        if (total_transactions === 0) {
          $('#address-transactions-table tbody').html('<tr><td>No transactions found.</td></tr>');
        } else {
          app.util.create_pagination(
            $('#address-transactions-table-container'),
            0,
            Math.ceil(total_transactions / 10),
            (page, done) => {
              load_paginated_transactions(10, 10*page, done);
            },
          );
        }
      });

      const create_transaction_graph = (time_period, split_time_period, line_type) => {
        Promise.all([
          app.slpdb.query(app.slpdb.count_txs_per_block({
            '$and': [
              {'slp.valid': true},
              {'blk.t': {
                '$gte': (+(new Date) / 1000) - time_period,
                '$lte': (+(new Date) / 1000),
              }},
            ],
            '$or': [
              {'in.e.a': address},
              {'out.e.a': address},
            ],
          })),
        ]).then(([address_usage]) => {
          app.util.create_time_period_plot(
            address_usage,
            'plot-address-usage',
            i18next.t('transactions'),
            time_period*1000,
            split_time_period*1000,
            line_type,
          );
          $('#address-usage-count').text(Number(address_usage.c.reduce((a, v) => a+v.txs, 0)).toLocaleString());
        });
      };
      create_transaction_graph(60*60*24*30, 60*60*24);
      $('#plot-address-usage-month').addClass('active');
      [
        {
          id: '#plot-address-usage-year',
          time_period: 60*60*24*365,
          split_time_period: 60*60*24*7,
        },
        {
          id: '#plot-address-usage-month',
          time_period: 60*60*24*30,
          split_time_period: 60*60*24,
        },
        {
          id: '#plot-address-usage-week',
          time_period: 60*60*24*7,
          split_time_period: 60*60*6,
        },
        {
          id: '#plot-address-usage-day',
          time_period: 60*60*24,
          split_time_period: 60*60*2,
        },
      ].forEach((data) => {
        $(data.id).click(function() {
          create_transaction_graph(
            data.time_period,
            data.split_time_period,
            'hvh',
           );
          $('.plot-time-selector span').removeClass('active');
          $(this).addClass('active');
          $('#plot-address-usage').html('Loading...');
        });
      });

      app.slpstream.on_mempool = (sna) => {
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
          app.slpdb.query(app.slpdb.token(sna.slp.detail.tokenIdHex))
          .then((token_data) => {
            if (token_data.t.length === 0) {
              console.error('slpstream token not found');
              return;
            }
            const token = token_data.t[0];

            sna.token = [token];
            sna.slp.detail.outputs = sna.slp.detail.outputs.map((v) => {
              const bn = new BigNumber(v.amount).dividedBy(10 ** sna.token[0].tokenDetails.decimals);
              v.amount = bn.toString();
              return v;
            });

            const tbody = $('#address-transactions-table tbody');

            tbody.prepend(app.template.address_transactions_tx({
              tx: sna,
              address: address,
            }));
            tbody.find('tr:last').remove();

            app.util.flash_latest_item(tbody);

            app.util.set_token_icon(tbody.find('.token-icon-small:first'), 32);
          });
        }
      };


      resolve();
    });
  });


app.router = (whash, push_history = true) => {
  // non-spa like /tx/xxx
  if (! whash && document.location.pathname !== '/') {
    whash = window.location.pathname.substring(1);
  }

  if (! whash) {
    whash = window.location.hash.substring(1);
  }

  // simplify routing to treat fragment and regular urls as the same
  whash = whash.replace(/#/, '');

  const [_, path, ...key] = whash.split('/');
  console.log(path, key);

  let method = null;

  switch (path) {
    case '':
      app.util.set_title(i18next.t('slp_explorer'));
      method = () => {
          $('html').addClass('index-page');
          return app.init_index_page();
      };
      break;
    case 'alltokens':
      app.util.set_title(`${i18next.t('all_tokens')} - ${i18next.t('slp_explorer')}`);
      method = () => app.init_all_tokens_page();
      break;
    case 'dividend':
      app.util.set_title(`${i18next.t('dividend_helper')} - ${i18next.t('slp_explorer')}`);
      method = () => app.init_dividend_page();
      break;
    case 'tx':
      app.util.set_title(`${i18next.t('transaction')} ${key[0]} - ${i18next.t('slp_explorer')}`);
      method = () => app.init_tx_page(key[0], key.slice(1));
      break;
    case 'bchtx':
      app.util.set_title(`${i18next.t('bitcoin_cash_transaction')} ${key[0]} - ${i18next.t('slp_explorer')}`);
      method = () => app.init_nonslp_tx_page(key[0], key.slice(1));
      break;
    case 'block':
      app.util.set_title(`${i18next.t('block')} ${key[0]} - ${i18next.t('slp_explorer')}`);
      if (key[0] === 'mempool') {
        method = () => app.init_block_mempool_page();
      } else {
        method = () => app.init_block_page(parseInt(key[0]));
      }
      break;
    case 'token':
      app.util.set_title(`${i18next.t('token')} ${key[0]} - ${i18next.t('slp_explorer')}`);
      method = () => app.init_token_page(key[0]);
      break;
    case 'address':
      app.util.set_title(`${i18next.t('address')} ${key[0]} - ${i18next.t('slp_explorer')}`);
      method = () => app.init_address_page(key[0]);
      break;
    default:
      app.util.set_title(`404 | ${i18next.t('slp_explorer')}`);
      console.error('app.router path not found', whash);
      method = () => app.init_404_page();
      break;
  }


  $('html').removeClass();
  $('html').addClass('loading');
  $('html').scrollTop(0);
  $('#main-search').autocomplete('dispose');
  $('#header-search-desktop').autocomplete('dispose');
  $('#header-search-mobile').autocomplete('dispose');


  const canonical_url = 'https://simpleledger.info/' + whash.substring(1);
  $('mta[property="og:url"]').attr('content', canonical_url);
  $('link[rel="canonical"]').attr('href', canonical_url);
  $('link[rel="alternate"]').each(function() {
      $(this).attr('href', `${canonical_url}?lng=${$(this).attr('hreflang')}`);
  });
  

  app.slpstream.reset();

  const loading_timer_start = +(new Date)/1000|0;
  method().then(() => {
    app.util.internationalize($('main[role=main]'));
    tippy('[data-tippy-content]');
    jdenticon();

    app.util.attach_search_handler($('#header-search-desktop'), $('#header-search-suggestions-container'));
    app.util.attach_search_handler($('#header-search-mobile'), $('#header-search-suggestions-container'));

    $('html').removeClass('loading');
    $('footer').removeClass('display-none');

    if (push_history) {
      // _paq.push(['setReferrerUrl', previousPageUrl]); // TODO
      history.pushState({}, document.title, whash);
    }

    _paq.push(['setCustomUrl', whash]);
    _paq.push(['setDocumentTitle', document.title]);
    _paq.push(['deleteCustomVariables', 'page']);
    _paq.push(['setGenerationTimeMs', +(new Date)/1000|0-loading_timer_start]);
    _paq.push(['trackPageView']);
    _paq.push(['enableHeartBeatTimer']);
    _paq.push(['enableLinkTracking']);
  });
};

const error_handler = (modal_text) => {
  $('#error-modal-text').text(modal_text);
  $('#error-modal').removeClass('display-none');
  return false;
};

window.onerror = function(message, file, line, col, error) {
  console.error(error, window.location.hash);
  return error_handler(`
    hash: ${window.location.hash}
    message: ${message}
    file: ${file}
    line: ${line}
    col: ${col}
  `);
};

window.addEventListener('error', function(e) {
  console.error(e, window.location.hash);
  if (! e || ! e.error) {
    e = {
      error: {
        message: 'no message available',
      }
    };
  }
  return error_handler(window.location.hash + ' ' + e.error.message);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error(e, window.location.hash);
  if (! e || ! e.reason) {
    e = {
      reason: {
        message: 'no message available',
        stack: 'no stack available',
      }
    };
  }
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

const update_query_string_value = (key, value, url) => {
  if (! url) {
    url = window.location.href;
  }
  const re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");
  let hash;

  if (re.test(url)) {
    if (typeof value !== 'undefined' && value !== null) {
      return url.replace(re, '$1' + key + "=" + value + '$2$3');
    } else {
      hash = url.split('#');
      url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
      if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
        url += '#' + hash[1];
      }

      return url;
    }
  } else {
    if (typeof value !== 'undefined' && value !== null) {
      const separator = url.indexOf('?') !== -1 ? '&' : '?';
      hash = url.split('#');
      url = hash[0] + separator + key + '=' + value;
      if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
        url += '#' + hash[1];
      }
      return url;
    } else {
      return url;
    }
  }
}

