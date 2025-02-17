const express = require('express');
const router = express.Router();
const db = require('../db');

const logger = function (req, res, next) {
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
            next();
        }
        else
        {
            console.log('User allowed to read, results:', results);
            req.rachunek = {nazwa: results[0].nazwa, idRachunek: results[0].idRachunek};
            next();
        }
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
    const zapytanie = `SELECT * FROM Wydatki WHERE idRachunek = ? ORDER BY kiedy DESC`;
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
        req.czlonkowie = {};
        for (let row of results) {
            req.czlonkowie[row['idCzlonek']] = {
                idCzlonek: row.idCzlonek,
                czyWirtualny: row.czyWirtualny,
                idUzytkownik: row.idUzytkownik,
                pseudonim: row.pseudonim,
                bilans: {}
            };
        }
        console.log('uzyskano listę członków');
        next();
    });
}

const getBilansWpisy = function (req, res, next) {
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
            if(!(wpis['waluta'] in req.czlonkowie[wpis.kto_idCzlonek].bilans)) req.czlonkowie[wpis.kto_idCzlonek].bilans[wpis['waluta']] = 0;
            if(!(wpis['waluta'] in req.czlonkowie[wpis.winny_idCzlonek].bilans)) req.czlonkowie[wpis.winny_idCzlonek].bilans[wpis['waluta']] = 0;
            req.czlonkowie[wpis.kto_idCzlonek].bilans[wpis['waluta']] += kwota;
            req.czlonkowie[wpis.winny_idCzlonek].bilans[wpis['waluta']] -= kwota;
        }
        next();
    });
}

const getBilansRozliczenia = function (req, res, next) {
    db.connect();
    const zapytanie = `SELECT * FROM Rozliczenie JOIN Waluta ON Rozliczenie.idWaluta = Waluta.idWaluta WHERE idRachunek = ?`;
    db.query(zapytanie, [req.params.idRachunek], function(err, results) {
        if (err) {
            console.error('Error in getCzlonkowie:', err);
            return res.status(500).send('Database error');
        }
        if (req.czlonkowie.length<=0) {
            console.log('Error in getCzlonkowie:', 'Brak listy czlonkow');
        }
        console.log(results);
        for (let rozliczenie of results) {
            let kwota = 0;

            if(!(rozliczenie['waluta'] in req.czlonkowie[rozliczenie.kto_id].bilans)) req.czlonkowie[rozliczenie.kto_id].bilans[rozliczenie['waluta']] = 0;
            if(!(rozliczenie['waluta'] in req.czlonkowie[rozliczenie.komu_id].bilans)) req.czlonkowie[rozliczenie.komu_id].bilans[rozliczenie['waluta']] = 0;
            req.czlonkowie[rozliczenie.kto_id].bilans[rozliczenie['waluta']] += rozliczenie.kwota;
            req.czlonkowie[rozliczenie.komu_id].bilans[rozliczenie['waluta']] -= rozliczenie.kwota;
        }
        next();
    });
}

const getRozliczenia = function (req, res, next) {
    db.connect();
    const zapytanie = `SELECT * FROM RozliczeniaDetails WHERE idRachunek = ?`;
    db.query(zapytanie, [req.params.idRachunek], function(err, results) {
        if (err) {
            console.error('Error in getRozliczenia:', err);
            return res.status(500).send('Database error');
        }
        req.rozliczenia = results;
        next();
    })
}

const getWaluty = function (req, res, next) {
    db.connect();
    const zapytanie = `SELECT * FROM Waluta`;
    db.query(zapytanie, function(err, results) {
        if (err) {
            console.error('Error in getWaluty');
            return res.status(500).send('Database error');
        }
        //console.log(results);
        req.waluty = results;
        next();
    })
}

const getRodzajePodzialu = function (req, res, next) {
    db.connect();
    const zapytanie = `SELECT * FROM RodzajPodzialu`;
    db.query(zapytanie, function(err, results) {
        if (err) {
            console.error('Error in getRodzajePodzialu');
            return res.status(500).send('Database error');
        }
        //console.log(results);
        req.rodzajePodzialu = results;
        next();
    })
}

const insertWydatek = function (req, res, next) {
    //console.log('POSTing new wydatek:', req.body);
    db.connect();
    const zapytanie = `INSERT INTO Wpis(idRachunek, kto_id, idWaluta, kwota, idRodzajPodzialu, data, wpis) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(zapytanie, [req.params.idRachunek, req.body.kto_idCzlonek, req.body.idWaluta, req.body.kwota, req.body.idRodzajPodzialu, req.body.data, req.body.wpis], function(err, results) {
        if(err){
            console.error('Error in insertWydatek');
            return res.status(500).send('Database error');
        }
        //console.log(results.insertId);
        const idWpis = results['insertId'];
        const zapytanie2 = `INSERT INTO PoleWpisu(idWpis, idCzlonek, wartosc) VALUES ?`;

        let values = [];
        let czlonkowie = Object.entries(req.czlonkowie)
        //console.log('czlonkowie:', czlonkowie);
        for (let czlonek of czlonkowie) {
            if(('czlonek'+czlonek[0]) in req.body) {
                values.push([
                    idWpis,
                    czlonek[1].idCzlonek,
                    (req.body.idRodzajPodzialu === '1') ? 0 : req.body['czlonek'+czlonek[0]]]);
            }
        }
        //console.log(values);
        db.query(zapytanie2, [values], function(err) {
            if(err){
                console.error('Error in insertWydatek(2)');
                return res.status(500).send('Database error');
            }
            //console.log(results);
            next();
        })
    })

}

const insertCzlonek = function (req, res, next) {
    db.connect();
    if('login' in req.body) {
        let name = req.body['login'];
        const zapytanie = `CALL dodaj_czlonka_uzytkownika(?, ?)`;
        db.query(zapytanie, [req.rachunek.idRachunek, name], function(err) {
            if(err){
                console.error('Error in insertCzlonek-uzytkownik');
                return res.status(500).send('Database error');
            }
            console.log('dodano czlonka uzytkownika');
            next();
        })
    }
    else {
        let name = req.body['pseudonim'];
        const zapytanie = `CALL dodaj_czlonka_wirtualnego(?, ?)`;
        db.query(zapytanie, [req.rachunek.idRachunek, name], function(err) {
            if(err){
                console.error('Error in insertCzlonek-wirtualny');
                return res.status(500).send('Database error');
            }
            console.log('dodano czlonka wirtualnego');
            next();
        })
    }
}

const insertRozliczenie = function (req, res, next) {
    console.log('Inserting new Rozliczenie:', req.body);
    db.connect();
    const zapytanie = `INSERT INTO Rozliczenie(idRachunek, kto_id, komu_id, idWaluta, kwota, data) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(zapytanie, [req.params.idRachunek, req.body['kto_idCzlonek'], req.body['komu_idCzlonek'], req.body['idWaluta'], req.body['kwota'], req.body['data']], function(err, results) {
        if(err){
            console.error('Error in insertRozliczenie');
            return res.status(500).send('Database error');
        }
        console.log(results);
        next();
    })
}

router.use(logger);

router.param('idRachunek', authRead);
router.param('idRachunek', authWrite);

router.route('/:idRachunek/wydatki')
    .get(getWydatki, function(req, res) {
        if (req.authRead) {
            res.render('rachunekWydatki', {
                authWrite: req.authWrite,
                rachunek: req.rachunek,
                wydatki: req.wydatki
            });
        }
        else {
            res.render('notfoundRachunek');
        }

    });

router.route('/:idRachunek/nowy_wydatek')
    .get(getCzlonkowie, getWaluty, getRodzajePodzialu, function(req, res) {
        res.render('addWydatek', {
            authWrite: req.authWrite,
            rachunek: req.rachunek,
            czlonkowie: req.czlonkowie,
            waluty: req.waluty,
            rodzajePodzialu: req.rodzajePodzialu,
        });
    })
    .post(getCzlonkowie, insertWydatek, getWydatki, function(req, res) {
        res.redirect('/rachunek/'+req.params.idRachunek+'/wydatki');
    });

router.route('/:idRachunek/czlonkowie')
    .get(getCzlonkowie, getBilansWpisy, getBilansRozliczenia, function(req, res) {
       res.render('rachunekCzlonkowie', {
           authWrite: req.authWrite,
           rachunek: req.rachunek,
           czlonkowie: req.czlonkowie
       });
    });

router.route('/:idRachunek/nowy_czlonek')
    .get(getCzlonkowie, function (req, res) {
        res.render('addCzlonek', {authRead: req.authRead, authWrite: req.authWrite, rachunek: req.rachunek});
    })
    .post(insertCzlonek, getCzlonkowie, getBilansWpisy, getBilansRozliczenia, function(req, res) {
        res.redirect('/rachunek/'+req.params.idRachunek+'/czlonkowie');
    })

router.route('/:idRachunek/rozliczenia')
    .get(getRozliczenia, function(req, res) {
        res.render('rachunekRozliczenia', {
            rachunek: req.rachunek,
            authRead: req.authRead,
            authWrite: req.authWrite,
            czlonkowie: req.czlonkowie,
            rozliczenia: req.rozliczenia
        })
    })

router.route('/:idRachunek/nowe_rozliczenie')
    .get(getCzlonkowie, getWaluty, function (req, res) {
        res.render('addRozliczenie', {
            rachunek: req.rachunek,
            authRead: req.authRead,
            authWrite: req.authWrite,
            czlonkowie: req.czlonkowie,
            waluty: req.waluty,
        })
    })
    .post(insertRozliczenie, getRozliczenia, function(req, res) {
        res.redirect('/rachunek/'+req.params.idRachunek+'/rozliczenia');
    })

module.exports = router;