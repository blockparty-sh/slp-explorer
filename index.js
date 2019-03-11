const path            = require('path');
const express         = require('express');

const app  = express();
const port = 3009;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('layout', {
    title:   'slp-explorer'
  });
})

app.listen(port, () => console.log(`app listening on port ${port}!`))
