const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const db = require('../db');

const logger = function (req, res, next) {
    console.log('Params:', req.params);
    next();
}

const authRead = function (req, res, next) {
    db.connect();
    console.log('Authorising read rights to Rachunek', req.params.idRachunek);
    const zapytanie = `SELECT * FROM RachunekAuthRead WHERE idRachunek = ? AND idUzytkownik = ?`;
    db.query(zapytanie, [req.params.idRachunek, req.user.id], function(err, results) {
        if (err) {
            console.log('Error in authRead:', err);
            return res.status(500).send('Database error');
        }
        req.authRead = results.length > 0;
        if(!req.authRead) {
            console.log('User not allowed to read this Rachunek');
            res.render('notfoundRachunek');
            res.end();
        }
        console.log('User allowed to read, results:', results);
        req.rachunek = {nazwa: results[0].nazwa, idRachunek: results[0].idRachunek};
        next();
    })
}

const authWrite = function (req, res, next) {
    db.connect();
    console.log('Authorising write rights to Rachunek', req.params.idRachunek);
    const zapytanie = `SELECT * FROM RachunekAuthWrite WHERE idRachunek = ? AND idUzytkownik = ?`;
    db.query(zapytanie, [req.params.idRachunek, req.user.id], function(err, results) {
        if (err) {
            console.log('Error in authWrite:', err);
            return res.status(500).send('Database error');
        }
        req.authWrite = results.length > 0;
        next();
    })
}

const getWydatki = function (req, res, next) {
    db.connect();
    const zapytanie = `SELECT * FROM Wydatki WHERE idRachunek = ?`;
    db.query(zapytanie, [req.params.idRachunek], function(err, results) {
        if (err) {
            console.error('Error in getListaWydatkow:', err);
            return res.status(500).send('Database error');
        }
        req.wydatki = results;
        next();
    })
}

const getCzlonkowie = function (req, res, next) {
    db.connect();
    const zapytanie = `SELECT * FROM Czlonkowie WHERE idRachunek = ?`;
    db.query(zapytanie, [req.params.idRachunek], function(err, results) {
        if (err) {
            console.error('Error in getCzlonkowie:', err);
            return res.status(500).send('Database error');
        }
        console.log('getCzlonkowie query results:', results);
        req.czlonkowie = {};
        for (let row of results) {
            req.czlonkowie[row.idCzlonek] = {
                idCzlonek: row.idCzlonek,
                czyWirtualny: row.czyWirtualny,
                idUzytkownik: row.idUzytkownik,
                pseudonim: row.pseudonim,
                bilans: 0
            };
        }
        console.log('getCzlonkowie processing results:', req.czlonkowie);
        next();
    });
}

const getBilans = function (req, res, next) {
    db.connect();
    const zapytanie = `SELECT * FROM WydatkiDetails WHERE idRachunek = ?`;
    db.query(zapytanie, [req.params.idRachunek], function(err, results) {
        if (err) {
            console.error('Error in getCzlonkowie:', err);
            return res.status(500).send('Database error');
        }
        if (req.czlonkowie.length<=0) {
            console.log('Error in getCzlonkowie:', 'Brak listy czlonkow');
        }
        for (let wpis of results) {
            let kwota = 0;
            switch (wpis.rodzajPodzialu) {
                case 'po równo':
                    kwota = (wpis.kwota / wpis.krotnoscPodzialu);
                    break;
                case 'procenty':
                    kwota = wpis.kwota * wpis.wartosc / 100;
                    break;
                case 'udziały':
                    kwota = wpis.kwota * wpis.wartosc / wpis.sumaUdzialow;
                    break;
                default:
                    kwota = wpis.wartosc;
                    break;
            }
            console.log(kwota);
            req.czlonkowie[wpis.kto_idCzlonek].bilans += kwota;
            req.czlonkowie[wpis.winny_idCzlonek].bilans -= kwota;
        }
        console.log('getBilans processing results:', req.czlonkowie);
        next();
    });
}

router.use(logger);

router.param('idRachunek', authRead);
router.param('idRachunek', authWrite);

router.route('/:idRachunek/wydatki')
    .get(getWydatki, function(req, res) {
        res.render('rachunekWydatki', {
            authWrite: req.authWrite,
            rachunek: req.rachunek,
            wydatki: req.wydatki
        });
    });

router.route('/:idRachunek/czlonkowie')
    .get(getCzlonkowie, getBilans, function(req, res) {
       res.render('rachunekCzlonkowie', {
           authWrite: req.authWrite,
           rachunek: req.rachunek,
           czlonkowie: req.czlonkowie
       });
    });


module.exports = router;