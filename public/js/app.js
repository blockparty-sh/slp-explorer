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
    },
    "r": {
      "f": `[.[] | {
        tokenId: .tokenDetails.tokenIdHex,
        name: .tokenDetails.name,
        symbol: .tokenDetails.symbol,
        circulatingSupply: .tokenStats.qty_token_circulating_supply,
        burnedQty: .tokenStats.qty_token_burned,
        mintedQty: .tokenStats.qty_token_minted
      } ]`
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
      "f": "[.[] | { outputs: .out, inputs: .in, tokenDetails: .slp, blk: .blk } ]"
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
      <table class="table table-striped table-sm" id="token-details-table">
        <thead class="thead-dark">
          <tr>
            <th>token id</th>
            <th>name</th>
            <th>symbol</th>
            <th>timestamp</th>
            <th>quantity</th>
            <th>decimals</th>
            <th>document uri</th>
            <th>document sha256hex</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="/token#<%= tokenIdHex %>"><%= tokenIdHex %></a></td>
            <td><%= name %></td>
            <td><%= symbol %></td>
            <td><%= timestamp %></td>
            <td><%= genesisOrMintQuantity %></td>
            <td><%= decimals %></td>
            <td><a href="<%= documentUri %>"><%= documentUri %></a></td>
            <td><%= documentSha256Hex %></td>
          </tr>
        </tbody>
      </table>
    </div>
  `),

  token_stats: ejs.compile(`
    <div class="table-responsive">
      <table class="table table-striped table-sm" id="token-stats-table">
        <thead class="thead-dark">
          <tr>
            <th>block created</th>
            <th>block last active send</th>
            <th>block last active mint</th>
            <th>qty valid txns since genesis</th>
            <th>qty valid token utxos</th>
            <th>qty valid token addresses</th>
            <th>qty token minted</th>
            <th>qty token burned</th>
            <th>qty token circulating supply</th>
            <th>qty satoshis locked up</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><%= block_created %></td>
            <td><%= block_last_active_send %></td>
            <td><%= block_last_active_mint %></td>
            <td><%= qty_valid_txns_since_genesis %></td>
            <td><%= qty_valid_token_utxos %></td>
            <td><%= qty_valid_token_addresses %></td>
            <td><%= qty_token_minted %></td>
            <td><%= qty_token_burned %></td>
            <td><%= qty_token_circulating_supply %></td>
            <td><%= qty_satoshis_locked_up %></td>
          </tr>
        </tbody>
      </table>
    </div>
  `),
};




app.init_all_tokens_page = () => {
  const template = ejs.compile(`
    <div class="table-responsive">
      <table class="table table-striped table-sm" id="tokens-table">
        <thead class="thead-dark">
          <tr>
            <th>tokenId</th>
            <th>name</th>
            <th>symbol</th>
            <th>circulatingSupply</th>
            <th>burnedQty</th>
            <th>mintedQty</th>
          </tr>
        </thead>
        <tbody>
        <% for (let m of t) { %>
          <tr>
            <td><a href="/token#<%= m.tokenId %>"><%= m.tokenId %></a></td>
            <td><%= m.name %></td>
            <td><%= m.symbol %></td>
            <td><%= m.circulatingSupply %></td>
            <td><%= m.burnedQty %></td>
            <td><%= m.mintedQty %></td>
          </tr>
        <% } %>
        </tbody>
      </table>
    </div>
  `);
  
  const tokens_table_container_el = document.getElementById('tokens-table-container');
  
  app.slpdb.query(app.slpdb.all_tokens())
  .then((data) => {
    tokens_table_container_el.insertAdjacentHTML('beforeend', template(data));
  });
};



app.init_tx_page = (txid) => {
  const tx_template = ejs.compile(`
    <tr>
      <td><a href="/token#<%= tokenDetails.detail.tokenIdHex %>"><%= tokenDetails.detail.tokenIdHex %></a></td>
      <td>
        <table>
          <thead>
            <tr>
              <th>txid</th>
              <th>address</th>
            </tr>
          </thead>
          <tbody>
            <% for (let m of inputs) { %>
              <tr>
                <td><a href="/tx#<%= m.e.h %>"><%= m.e.h %></a></td>
                <td><a href="/address#<%= m.e.a %>"><%= m.e.a %></a></td>
              </tr>
            <% } %>
          </tbody>
        </table>
      </td>
      <td>
        <table>
          <thead>
            <tr>
              <th>address</th>
              <th>amount</th>
            </tr>
          </thead>
          <tbody>
            <% for (let i=0; i<tokenDetails.detail.sendOutputs.length; ++i) { %>
              <% let o = outputs[i]; %>
              <% let tokens = tokenDetails.detail.sendOutputs[i]; %>
              <tr>
                <td><a href="/address#<%= o.e.a %>"><%= o.e.a %></a></td>
                <td><%= tokens %></td>
              </tr>
            <% } %>
          </tbody>
        </table>
      </td>
      <td><%= blk.i %></td>
      <td><%= blk.t%></td>
    </tr>
  `);
  const tx_table_el = document.getElementById('tx-table');

  const token_details_table_container_el = document.getElementById('token-details-table-container');

  app.slpdb.query(app.slpdb.tx(txid))
  .then((data) => {
    const tmp = (tx) => {
      tx_table_el.insertAdjacentHTML('beforeend', tx_template(tx));

      app.slpdb.query(app.slpdb.token(tx.tokenIdHex))
      .then((data) => {
        if (data.t.length > 0) {
          token_details_table_container_el
          .insertAdjacentHTML('beforeend', app.template.token_details(data.t[0].tokenDetails));
        } else {
          window.alert('token not found');
        }
      });
    };

         if (data.u.length > 0) tmp(data.u[0]);
    else if (data.c.length > 0) tmp(data.c[0]);
  });
};

app.init_token_page = (tokenIdHex) => {
  const token_stats_table_container_el = document.getElementById('token-stats-table-container');
  
  const token_details_table_container_el = document.getElementById('token-details-table-container');
  
  
  const token_address_template = ejs.compile(`
    <tr>
      <td><a href="/address#<%= address %>"><%= address %></a></td>
      <td><%= balance_satoshis %></a></td>
      <td><%= balance_tokens %></a></td>
    </tr>
  `);
  const token_address_table_el = document.getElementById('token-addresses-table');
  
  
  const txid_template = ejs.compile(`
    <tr>
      <td><a href="/tx#<%= tx.h %>"><%= tx.h %></a></td>
      <td><%= blk.i %></td>
      <td><%= blk.t %></td>
    </tr>
  `);
  const token_transactions_table_el = document.getElementById('token-transactions-table');
  
  
  app.slpdb.query(app.slpdb.token(tokenIdHex))
  .then((data) => {
    if (data.t.length > 0) {
      token_details_table_container_el
      .insertAdjacentHTML('beforeend', app.template.token_details(data.t[0].tokenDetails));

      token_stats_table_container_el
      .insertAdjacentHTML('beforeend', app.template.token_stats(data.t[0].tokenStats));
  
      data.t[0].addresses.forEach((v) => {
        token_address_table_el
        .insertAdjacentHTML('beforeend', token_address_template({
          address: v[0],
          balance_satoshis: v[1]['bch_balance_satoshis'],
          balance_tokens:   v[1]['token_balance']
  	  })
      )});
    }
  });
  
  app.slpdb.query(app.slpdb.token_transaction_history(tokenIdHex))
  .then((data) => {
    data.u.forEach((o) => {
      token_transactions_table_el.insertAdjacentHTML('beforeend', txid_template(o));
    });
    data.c.forEach((o) => {
      token_transactions_table_el.insertAdjacentHTML('beforeend', txid_template(o));
    });
  });
};

  
