const query_get_all_tokens = (limit=100, skip=0) => ({
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

const query_token_transaction_history = (tokenIdHex, address, limit=100, skip=0) => {
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
      "f": "[.[] | { txid: .tx.h, tokenDetails: .slp } ]"
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

const query_tx = (txid) => ({
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



const query_slpdb = (query) => new Promise((resolve, reject) => {
    const b64 = btoa(JSON.stringify(query));
    const url = "https://slpdb.fountainhead.cash/q/" + b64;

    console.log(url)
    resolve(
        fetch(url)
        .then((r) => r.json())
    );
});


/*
query_slpdb(query_token_transaction_history('495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a', 'qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqlsy4gusz'))
.then((data) => {
    console.log(data);
});
*/

/*
query_slpdb(query_get_all_tokens())
.then((data) => {
    console.log(data);
    data.t.forEach((o) => {
        console.log(o);
    });
});
*/
/*
query_slpdb(query_get_token('5e4afabfacba770389bc6c0d2bfc6d7791347412d51449a5bc4ec3fea90f1e81'), (data) => {
    console.log(data.t[0]['txnGraph']);
    let nodes = [];
    let edges = [];
    for (let [k, v] of Object.entries(data.t[0]['txnGraph'])) {
        let target = v['outputs'][0]['spendTxid'];
        console.log(k, target);
        nodes.push({
            data: {
                id: k,
                label: k
            }
        });
        if (target !== null) {
            edges.push({
                data: {
                    source: k,
                    target: target
                }
            });
        }
    }

    console.log(edges);

    document.addEventListener('DOMContentLoaded', function() {

        var cy = window.cy = cytoscape({
            container: document.getElementById('cy'),

            autounselectify: true,
            boxSelectionEnabled: false,

            layout: {
                name: 'cola'
            },
            style: [
                {
                    selector: 'node',
                    css: {
                        'background-color': '#f92411'
                    }
                },

                {
                    selector: 'edge',
                    css: {
                        'line-color': '#f92411'
                    }
                }
            ],

            elements: {
              nodes: nodes,
              edges: edges
            }
        });

    });
});
*/


