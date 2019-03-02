const tokenIdHex = window.location.hash.substring(1);
console.log(tokenIdHex);



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
    <td><a href="/tx#<%= txid %>"><%= txid %></a></td>
  </tr>
`);
const token_transactions_table_el = document.getElementById('token-transactions-table');


query_slpdb(query_token(tokenIdHex))
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

query_slpdb(query_token_transaction_history(tokenIdHex))
.then((data) => {
  data.u.forEach((o) => {
    token_transactions_table_el.insertAdjacentHTML('beforeend', txid_template(o));
  });
  data.c.forEach((o) => {
    token_transactions_table_el.insertAdjacentHTML('beforeend', txid_template(o));
  });
});

