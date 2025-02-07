const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const mysql = require('mysql2');
const router = express.Router();
const db = require('../db');


router.get('/login', function(req, res, next){
    res.render('login');
})

router.post('/logout', function(req, res, next){
    req.logout(function(err) {
        if (err) {return next(err);}
        res.redirect('/');
    });
});

router.get('/signup', function (req, res, next){
    res.render('signup');
});

router.post('/signup', function(req, res, next){
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if(err) {return next(err);}
        db.query('INSERT INTO Uzytkownik (login, hashed_password, salt) VALUES (?,?,?)', [
            req.body.username,
            hashedPassword,
            salt
        ], function (err) {
            if (err) {return next(err);}
            var user = {
                id: this.lastID,
                username: req.body.username,
            };
            req.login(user, function(err) {
                if (err) {return next(err);}
                res.redirect('/');
            });
        });
    });
});

passport.use('local', new LocalStrategy(function verify(username, password, cb) {
    db.query('SELECT * FROM Uzytkownik WHERE login = ?', [username], function(err, user) {

        if (err) {return cb(err);}
        if (!user) {
            console.log('Niepoprawna nazwa użytkownika');
            return cb(null, false, {message: 'Incorrect username or password'});
        }
        const row = user[0];
        row.username = row.login;
        row.id = row.idUzytkownik;
        console.log(username, password, user);

        if(!row || !row.salt) {
            console.log('Brakujący salt');
            return cb(null, false, {message: 'Incorrect username or password'});
        }

        crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
            if (err) {return cb(err);}
            if (hashedPassword.toString('hex') !== row.hashed_password.toString('hex')) {
                console.log('Passwords do not match');
                return cb(null, false, {message: 'Incorrect password or password'});
            }
            return cb(null, row);
        });
    });
}));

router.post('/login/password',
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureMessage: true
    }),
    function(req, res) {
        console.log('logged in, redirecting, user:', req.user);
        //res.render('index', {authentication: req.isAuthenticated(), user: req.user });
        res.redirect('/');
    });


module.exports = router;