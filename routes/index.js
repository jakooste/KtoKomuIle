const express = require('express');
const router = express.Router();
const db = require('../db');

const getListaRachunkow = function(req, res, next) {
  db.connect();
  const zapytanie = 'SELECT * FROM RachunekAuthRead WHERE idUzytkownik = ?';
  db.query(zapytanie, [req.user.id], function(err, results) {
    if (err) {
      console.error('Error in getListaRachunkow:', err);
      return res.status(500).send('Database error');
    }
    req.rachunki = results;
    next()
  })
}

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
  res.render('home', {
    user: req.user,
    isAuthenticated: req.isAuthenticated(),
    rachunki: req.rachunki});
})

router.get('/home/new', function(req, res) {
  res.render('addRachunek', {
    user: req.user,
    isAuthenticated: req.isAuthenticated()
  });
})

router.post('/home/new', getListaRachunkow, function(req, res) {
  console.log('Creating new Rachunek "' + req.body.nazwa +'"');
  db.connect();
  const zapytanie = `CALL nowy_rachunek(?,?)`;
  db.query(zapytanie, [req.body.nazwa, req.user.id], function(err) {
    if (err) {
      console.error('Error in nowy_rachunek:', err);
      return res.status(500).send('Database error');
    }
    console.log('Created');
    res.redirect('/home');
  })
})

module.exports = router;
