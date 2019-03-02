const app = {};

app.query_get_all_tokens = (limit=100, skip=0) => ({
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
});

app.query_token_transaction_history = (tokenIdHex, address, limit=100, skip=0) => {
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
};

app.query_tx = (txid) => ({
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
});

app.query_token = (tokenIdHex) => ({
  "v": 3,
  "q": {
    "db": ["t"],
    "find": {
      "tokenDetails.tokenIdHex": tokenIdHex
    },
    "limit": 1
  }
});



app.query_slpdb = (query) => new Promise((resolve, reject) => {
    const b64 = btoa(JSON.stringify(query));
    const url = "https://slpdb.fountainhead.cash/q/" + b64;

    console.log(url)
    resolve(
        fetch(url)
        .then((r) => r.json())
    );
});

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


  const token_details_template = ejs.compile(`
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
  `);
  const token_details_table_el = document.getElementById('token-details-table');



  app.query_slpdb(app.query_tx(txid))
  .then((data) => {
    console.log(data);
    data.u.forEach((o) => {
      tx_table_el.insertAdjacentHTML('beforeend', tx_template(o));

      app.query_slpdb(app.query_token(o.tokenIdHex))
      .then((data) => {
        data.t.forEach((o) => {
          token_details_table_el.insertAdjacentHTML('beforeend', token_details_template(o.tokenDetails));
        });
      });
    });
    data.c.forEach((o) => {
      tx_table_el.insertAdjacentHTML('beforeend', tx_template(o));

      app.query_slpdb(app.query_token(o.tokenIdHex))
      .then((data) => {
        data.t.forEach((o) => {
          token_details_table_el.insertAdjacentHTML('beforeend', token_details_template(o.tokenDetails));
        });
      });
    });
  });
};

app.init_token_page = (tokenIdHex) => {
  const token_stats_template = ejs.compile(`
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
  `);
  const token_stats_table_el = document.getElementById('token-stats-table');
  
  const token_details_template = ejs.compile(`
    <tr>
      <td><%= tokenIdHex %></td>
      <td><%= name %></td>
      <td><%= symbol %></td>
      <td><%= timestamp %></td>
      <td><%= genesisOrMintQuantity %></td>
      <td><%= decimals %></td>
      <td><a href="<%= documentUri %>"><%= documentUri %></a></td>
      <td><%= documentSha256Hex %></td>
    </tr>
  `);
  const token_details_table_el = document.getElementById('token-details-table');
  
  
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
  
  
  app.query_slpdb(app.query_token(tokenIdHex))
  .then((data) => {
    data.t.forEach((o) => {
      token_details_table_el.insertAdjacentHTML('beforeend', token_details_template(o.tokenDetails));
      token_stats_table_el.insertAdjacentHTML('beforeend', token_stats_template(o.tokenStats));
  
      o.addresses.forEach((v) => {
        token_address_table_el.insertAdjacentHTML('beforeend', token_address_template({
          address: v[0],
          balance_satoshis: v[1]['bch_balance_satoshis'],
          balance_tokens:   v[1]['token_balance']
  	  })
      )});
    });
  });
  
  app.query_slpdb(app.query_token_transaction_history(tokenIdHex))
  .then((data) => {
    data.u.forEach((o) => {
      token_transactions_table_el.insertAdjacentHTML('beforeend', txid_template(o));
    });
    data.c.forEach((o) => {
      token_transactions_table_el.insertAdjacentHTML('beforeend', txid_template(o));
    });
  });
};

app.init_all_tokens_page = () => {
  const template = ejs.compile(`
    <tr>
      <td><a href="/token#<%= tokenId %>"><%= tokenId %></a></td>
      <td><%= name %></td>
      <td><%= symbol %></td>
      <td><%= circulatingSupply %></td>
      <td><%= burnedQty %></td>
      <td><%= mintedQty %></td>
    </tr>
  `);
  
  const tokens_table_el = document.getElementById('tokens-table');
  
  app.query_slpdb(app.query_get_all_tokens())
  .then((data) => {
      data.t.forEach((o) => {
        tokens_table_el.insertAdjacentHTML('beforeend', template(o));
      });
  });
};
  
