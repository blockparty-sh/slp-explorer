const path            = require('path');
const express         = require('express');
const express_layouts = require('express-ejs-layouts');

const app  = express();
const port = 3009;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(express_layouts);

app.get('/', (req, res) => {
  res.render('all_tokens', {
    title:   'all tokens'
  });
})

app.get('/token', (req, res) => {
  res.render('token', {
    title:   'view token'
  });
})

app.get('/tx', (req, res) => {
  res.render('tx', {
    title:   'view tx'
  });
})

app.get('/address', (req, res) => {
  res.render('address', {
    title:   'view address'
  });
})

app.listen(port, () => console.log(`app listening on port ${port}!`))
