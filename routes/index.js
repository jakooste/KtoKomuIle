const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'nowy_user',
  password: 'haslo',
  database: 'ktokomuiledb'
})

const getListaRachunkow = function(req, res, next) {
  db.connect();
  const zapytanie = 'SELECT nazwa FROM Rachunek';
  db.query(zapytanie, function(err, results) {
    if (err) {
      console.error('Error in getListaRachunkow:', err);
      return res.status(500).send('Database error');
    }
    req.rachunki = results;
    next()
  })
}

const global_info = {title: 'KtoKomuIle'};
const getGlobalInfo = function(req, res, next) {
  req.global_info = global_info;
  next();
}

/* GET home page. */
router.get('/', getGlobalInfo, function(req, res) {
  res.render('index', { global_info: req.global_info });
});

router.get('/rachunki', getGlobalInfo, getListaRachunkow, function(req, res) {
  res.render('rachunki', { global_info: req.global_info, rachunki: req.rachunki });
})

module.exports = router;
