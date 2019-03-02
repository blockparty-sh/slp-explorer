const txid = window.location.hash.substring(1);
console.log(txid);


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



query_slpdb(query_tx(txid))
.then((data) => {
  console.log(data);
  data.u.forEach((o) => {
    tx_table_el.insertAdjacentHTML('beforeend', tx_template(o));

    query_slpdb(query_token(o.tokenIdHex))
    .then((data) => {
      data.t.forEach((o) => {
        token_details_table_el.insertAdjacentHTML('beforeend', token_details_template(o.tokenDetails));
      });
    });
  });
  data.c.forEach((o) => {
    tx_table_el.insertAdjacentHTML('beforeend', tx_template(o));

    query_slpdb(query_token(o.tokenIdHex))
    .then((data) => {
      data.t.forEach((o) => {
        token_details_table_el.insertAdjacentHTML('beforeend', token_details_template(o.tokenDetails));
      });
    });
  });
});

