const template = ejs.compile(`
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
            <% let O = tokenDetails.detail.sendOutputs[i]; %>
            <tr>
              <td><a href="/address#<%= o.e.a %>"><%= o.e.a %></a></td>
              <td><%= (O.c[0] / Math.pow(10, decimals)) %></td>
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


const txid = window.location.hash.substring(1);
console.log(txid);



query_slpdb(query_tx(txid))
.then((data) => {
  console.log(data);
  data.u.forEach((o) => {
    tx_table_el.insertAdjacentHTML('beforeend', template(o));
  });
  data.c.forEach((o) => {
    o.decimals = 8;
    tx_table_el.insertAdjacentHTML('beforeend', template(o));
  });
});

