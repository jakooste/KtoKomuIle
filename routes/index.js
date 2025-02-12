const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const db = require('../db');

const getListaRachunkow = function(req, res, next) {
  db.connect();
  const zapytanie = 'SELECT * FROM Rachunek WHERE tworca_id = ?';
  db.query(zapytanie, [req.user.id], function(err, results) {
    if (err) {
      console.error('Error in getListaRachunkow:', err);
      return res.status(500).send('Database error');
    }
    req.rachunki = results;
    next()
  })
}


/* GET home page. */
router.get('/', function(req, res) {
  console.log('Home page, user:', req.user);
  console.log('Authenticated:', req.isAuthenticated());

  if(req.isAuthenticated()){
    console.log('User' + req.user.username + 'logged in, redirecting');
    res.redirect('/home');
  }
  else {
    console.log('Guest user, redirecting to login');
    res.redirect('/login');
  }
});

router.get('/home', getListaRachunkow, function(req, res) {
  console.log('Home page, user:', req.user);
  console.log('Rachunki:', req.rachunki);
  res.render('home', {user: req.user, rachunki: req.rachunki});
})

router.get('/home/new', function(req, res) {
  res.render('addRachunek');
})

router.post('/home/new', function(req, res) {
  console.log('Creating new Rachunek "' + req.body.nazwa +'"');
  db.connect();
  const zapytanie = 'INSERT INTO Rachunek(tworca_id, nazwa) VALUES (?,?)';
  db.query(zapytanie, [req.user.id, req.body.nazwa], function(err, results) {
    console.log('Created');
    res.redirect('/home');
  })
})

/*router.get('/rachunek/:idRachunek', function(req, res) {
  res.location('/rachunek/' + req.params.idRachunek + '/wydatki');
})

router.get('/rachunek/:idRachunek/wydatki/', authRachunekAccess, getListaWydatkow, function(req, res) {
  console.log('Rachunek:', req.rachunek);
  console.log('Wydatki:', req.wydatki);
  res.render('rachunekWydatki', {user: req.user, rachunek: req.rachunek, wydatki: req.wydatki});
})

router.get('/rachunek/:idRachunek/notfound', function(req, res) {
  res.render('notfoundRachunek');
})*/

module.exports = router;
