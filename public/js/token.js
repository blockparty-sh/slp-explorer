const template = ejs.compile(`
  <tr>
    <td><%= txid %></td>
  </tr>
`);

const token_table_el = document.getElementById('token-transactions-table');

const tokenIdHex = window.location.hash.substring(1);
console.log(tokenIdHex);



query_slpdb(query_token_transaction_history(tokenIdHex))
.then((data) => {
  data.u.forEach((o) => {
    token_table_el.insertAdjacentHTML('beforeend', template(o));
  });
  data.c.forEach((o) => {
    token_table_el.insertAdjacentHTML('beforeend', template(o));
  });
});

