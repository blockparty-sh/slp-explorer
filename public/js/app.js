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
          },
          "$orderby": {
            "blk.i": -1
          }
        },
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
        "$orderby": {
          "blk.i": -1
        }
      }
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
};




app.template = {
  token_details: ejs.compile(`
    <div class="table-responsive">
      <table class="table" id="token-details-table">
        <thead>
          <tr>
            <td>
                <h3 class="pb-1 mb-1">Details</h3>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Token Id</th>
            <td><a href="/#token/<%= tokenIdHex %>"><%= tokenIdHex %></a></td>
		  </tr>
          <tr>
            <th scope="row">Name</th>
            <td><%= name %></td>
          </tr>
          <tr>
            <th scope="row">Symbol</th>
            <td><%= symbol %></td>
          </tr>
          <tr>
            <th scope="row">Timestamp</th>
            <td><%= timestamp %></td>
          </tr>
          <tr>
            <th scope="row">Quantity</th>
            <td><%= genesisOrMintQuantity %></td>
          </tr>
          <tr>
            <th scope="row">Decimals</th>
            <td><%= decimals %></td>
          </tr>
          <tr>
            <th scope="row">Document URI</th>
            <td><a href="<%= documentUri %>" target="_blank"><%= documentUri %></a></td>
          </tr>
          <tr>
            <th scope="row">Document Checksum</th>
            <td><%= documentSha256Hex %></td>
          </tr>
        </tbody>
      </table>
    </div>
  `),

  token_stats: ejs.compile(`
    <div class="table-responsive">
      <table class="table" id="token-stats-table">
        <thead>
          <tr>
            <td>
                <h3 class="pb-1 mb-1">Stats</h3>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Block Created</th>
            <td><%= block_created %></td>
          </tr>
          <tr>
            <th scope="row">Block Last Active Send</th>
            <td><%= block_last_active_send %></td>
          </tr>
          <tr>
            <th scope="row">Block Last Active Mint</th>
            <td><%= block_last_active_mint %></td>
          </tr>
          <tr>
            <th scope="row">Qty. Valid Txns Since Genesis</th>
            <td><%= qty_valid_txns_since_genesis %></td>
          </tr>
          <tr>
            <th scope="row">Qty. Valid Token Utxos</th>
            <td><%= qty_valid_token_utxos %></td>
          </tr>
          <tr>
            <th scope="row">Qty. Valid Token Addresses</th>
            <td><%= qty_valid_token_addresses %></td>
          </tr>
          <tr>
            <th scope="row">Qty. Token Minted</th>
            <td><%= qty_token_minted %></td>
          </tr>
          <tr>
            <th scope="row">Qty. Token Burned</th>
            <td><%= qty_token_burned %></td>
          </tr>
          <tr>
            <th scope="row">Qty. Token Circulating Supply</th>
            <td><%= qty_token_circulating_supply %></td>
          </tr>
          <tr>
            <th scope="row">Qty. Satoshis Locked Up</th>
            <td><%= qty_satoshis_locked_up %></td>
          </tr>
        </tbody>
      </table>
    </div>
  `),
};




app.init_all_tokens_page = () => new Promise((resolve, reject) => {
  $('main[role=main]').html(`
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded box-shadow">
      <img class="mr-3" src="https://getbootstrap.com/assets/brand/bootstrap-outline.svg" alt="" width="48" height="48">
      <div class="lh-100">
        <h2 class="mb-0 text-white lh-100">All Tokens</h2>
      </div>
    </div>
	<div id="tokens-table-container" class="my-3 p-3 bg-white rounded box-shadow">
    </div>
  `);

  const template = ejs.compile(`
    <div class="table-responsive">
      <table class="table" id="tokens-table">
        <thead>
          <tr>
            <th>Token Id</th>
            <th>Symbol</th>
            <th>Name</th>
            <th>Minted</th>
            <th>Burned</th>
            <th>Supply</th>
            <th>Transactions</th>
            <th>Utxos</th>
            <th>Addresses</th>
          </tr>
        </thead>
        <tbody>
        <% for (let m of t) { %>
          <tr>
            <td><a href="/#token/<%= m.tokenDetails.tokenIdHex %>"><%= m.tokenDetails.tokenIdHex %></a></td>
            <td><%= m.tokenDetails.symbol %></td>
            <td><%= m.tokenDetails.name %></td>
            <td><%= m.tokenStats.qty_token_minted %></td>
            <td><%= m.tokenStats.qty_token_burned %></td>
            <td><%= m.tokenStats.qty_token_circulating_supply %></td>
            <td><%= m.tokenStats.qty_valid_txns_since_genesis %></td>
            <td><%= m.tokenStats.qty_valid_token_utxos %></td>
            <td><%= m.tokenStats.qty_valid_token_addresses %></td>
          </tr>
        <% } %>
        </tbody>
      </table>
    </div>
  `);

  return app.slpdb.query(app.slpdb.all_tokens(1000))
  .then((data) => {
    $('#tokens-table-container')
    .append(template(data))
    .find('#tokens-table').DataTable();
	$('body').removeClass('loading');
  });
});



app.init_tx_page = (txid) => new Promise((resolve, reject) => {
  const tx_template = ejs.compile(`
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded box-shadow">
      <img class="mr-3" src="https://getbootstrap.com/assets/brand/bootstrap-outline.svg" alt="" width="48" height="48">
      <div class="lh-100">
        <h2 class="mb-0 text-white lh-100">View Transaction</h2>
      </div>
    </div>

    <div class="row">
      <div class="col-md">
        <div class="bg-white rounded box-shadow mb-4">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th><h3 class="pl-3 pt-3 pb-1 mb-1">Transaction Details</h3></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th role="col">Type</th>
                  <td><%= tokenDetails.detail.transactionType %></td>
                </tr>
                <tr>
                  <th role="col">Txid</th>
                  <td><a href="#tx/<%= tx.h %>"><%= tx.h %></td>
                </tr>
                <tr>
                  <th role="col">Block</th>
                  <td><%= blk.i %></td>
                </tr>
                <tr>
                  <th role="col">Token Id</th>
                  <td><a href="#token/<%= tokenDetails.detail.tokenIdHex %>"><%= tokenDetails.detail.tokenIdHex %></td>
                </tr>
                <tr>
                  <th role="col">Token Name</th>
                  <td><%= tokenDetails.full.name %></td>
                </tr>
                <tr>
                  <th role="col">Token Symbol</th>
                  <td><%= tokenDetails.full.symbol %></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>


    <% if (tokenDetails.detail.transactionType == 'SEND') { %>
      <div class="row">
        <div class="col-md">
          <div class="bg-white rounded box-shadow mb-4">
            <h3 class="pl-3 pt-3 pb-1 mb-1">Inputs</h3>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>txid</th>
                    <th>address</th>
                  </tr>
                </thead>
                <tbody>
                  <% for (let m of inputs) { %>
                    <tr>
                      <td><a href="/#tx/<%= m.e.h %>"><i class="material-icons">exit_to_app</i></a></td>
                      <td><a href="/#address/<%= m.e.a %>"><%= m.e.a %></a></td>
                    </tr>
                  <% } %>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-md">
          <div class="bg-white rounded box-shadow mb-4">
            <h3 class="pl-3 pt-3 pb-1 mb-1">Outputs</h3>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>amount</th>
                    <th>address</th>
                  </tr>
                </thead>
                <tbody>
                  <% for (let m of outputs) { %>
                    <tr>
                      <td><%= m.amount %></td>
                      <td><a href="/#address/<%= m.address %>"><%= m.address %></a></td>
                    </tr>
                  <% } %>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    <% } %>

	<!--<div id="tokens-details-table-container" class="my-3 p-3 bg-white rounded box-shadow"></div>-->
  `);

  return app.slpdb.query(app.slpdb.tx(txid))
  .then((data) => {
    const tmp = (tx) => new Promise((resolve, reject) => {
      return app.slpdb.query(app.slpdb.token(tx.tokenDetails.detail.tokenIdHex))
      .then((data) => {
        if (data.t.length > 0) {
          tx['tokenDetails']['full'] = data.t[0].tokenDetails;
          console.log(tx);

          let outputs = [];
          if (tx.tokenDetails.detail.transactionType === 'SEND') {
            for (let i=0; i<tx.tokenDetails.detail.sendOutputs.length; ++i) {
              outputs.push({
                'address': tx.outputs[i+1].e.a,
                'amount': tx.tokenDetails.detail.sendOutputs[i]
              })
            }
            tx['outputs'] = outputs;
          }

          $('main[role=main]').html(tx_template(tx));

          // $('#token-details-table-container')
          // .append(app.template.token_details(tx.tokenDetails.full));
        } else {
          window.alert('token not found');
        }

		$('body').removeClass('loading');
      });
    });

         if (data.u.length > 0) return tmp(data.u[0]);
    else if (data.c.length > 0) return tmp(data.c[0]);
  });
});

app.init_token_page = (tokenIdHex) => new Promise((resolve, reject) => {
  $('main[role=main]').html(`
    <div class="d-flex align-items-center p-3 my-3 text-white-50 bg-purple rounded box-shadow">
      <img class="mr-3" src="https://getbootstrap.com/assets/brand/bootstrap-outline.svg" alt="" width="48" height="48">
      <div class="lh-100">
        <h2 class="mb-0 text-white lh-100">View Token</h2>
      </div>
    </div>
    <div class="row">
      <div class="col-md">
        <div id="token-details-table-container" class="bg-white rounded box-shadow"></div>
      </div>
      <div class="col-md">
        <div id="token-stats-table-container" class="bg-white rounded box-shadow"></div>
      </div>
    </div>
    <div id="token-addresses-table-container" class="my-3 p-3 bg-white rounded box-shadow">
	  <h3 class="border-bottom border-gray pb-1 mb-3">Addresses</h3>
	</div>
    <div id="token-transactions-table-container" class="my-3 p-3 bg-white rounded box-shadow">
	  <h3 class="border-bottom border-gray pb-1 mb-3">Transactions</h3>
	</div>
  `);

  const token_addresses_template = ejs.compile(`
    <div class="table-responsive">
      <table class="table" id="token-addresses-table">
        <thead>
          <tr>
            <th>Address</th>
            <th>Satoshi Balance</th>
            <th>Token Balance</th>
          </tr>
        </thead>
        <tbody>
          <% for (let o of addresses) { %>
            <tr>
              <td><a href="/#address/<%= o.address %>"><%= o.address %></a></td>
              <td><%= o.satoshis_balance %></a></td>
              <td><%= o.token_balance %></a></td>
            </tr>
          <% } %>
        </tbody>
      </table>
    </div>
  `);
  
  
  const token_transactions_template = ejs.compile(`
    <div class="table-responsive">
      <table class="table" id="token-transactions-table">
        <thead>
          <tr>
            <th>Txid</th>
			<th>Type</th>
            <th>Block Height</th>
            <th>Block Time</th>
          </tr>
        </thead>
        <tbody>
          <% for (let o of u) { %>
            <tr>
              <td><a href="/#tx/<%= o.tx.h %>"><%= o.tx.h %></a></td>
			  <td><%= o.tokenDetails.detail.transactionType %></td>
              <td><%= o.blk.i %></td>
              <td><%= o.blk.t %></td>
            </tr>
          <% } %>
          <% for (let o of c) { %>
            <tr>
              <td><a href="/#tx/<%= o.tx.h %>"><%= o.tx.h %></a></td>
			  <td><%= o.tokenDetails.detail.transactionType %></td>
              <td><%= o.blk.i %></td>
              <td><%= o.blk.t %></td>
            </tr>
          <% } %>
        </tbody>
      </table>
    </div>
  `);
  
  
  app.slpdb.query(app.slpdb.token(tokenIdHex))
  .then((data) => {
    if (data.t.length > 0) {
      $('#token-details-table-container')
      .append(app.template.token_details(data.t[0].tokenDetails));

      $('#token-stats-table-container')
      .append(app.template.token_stats(data.t[0].tokenStats));
  
      $('#token-addresses-table-container')
      .append(token_addresses_template(data.t[0]))
      .find('#token-addresses-table').DataTable();
    }
  })
  .then(() => app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex)))
  .then((data) => {
    $('#token-transactions-table-container')
    .append(token_transactions_template(data))
    .find('#token-transactions-table').DataTable();

	$('body').removeClass('loading');
  });
});

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

  app.router(window.location.pathname+window.location.hash, false);
});
