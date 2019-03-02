const template = ejs.compile(`
  <tr>
    <td><%= tokenId %></td>
    <td><%= name %></td>
    <td><%= symbol %></td>
    <td><%= circulatingSupply %></td>
    <td><%= burnedQty %></td>
    <td><%= mintedQty %></td>
  </tr>
`);

const tokens_table_el = document.getElementById('tokens-table');

query_slpdb(query_get_all_tokens())
.then((data) => {
    data.t.forEach((o) => {
      tokens_table_el.insertAdjacentHTML('beforeend', template(o));
    });
});

