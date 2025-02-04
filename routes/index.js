var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/rachunki', function(req, res, next) {
  res.render('rachunki', { rachunki: ['Coworkerzy', 'Oslo 2024']});
})

module.exports = router;
