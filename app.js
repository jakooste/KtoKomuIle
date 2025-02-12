const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const mysqlStore = require('express-mysql-session')(session);
const mysql = require('mysql2');
const passport = require('passport');
const db = require('./db');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const rachunekRouter = require('./routes/rachunek');

const app = express();
const sessionStore = new mysqlStore({}, db);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    //cookie: { secure: true }
}));
app.use(passport.authenticate('session'));

passport.serializeUser(function(user, cb) {
    console.log('serializeUser:', user);
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function(user, cb) {
    console.log('deserializeUser:', user);
    process.nextTick(function() {
        return cb(null, user);
    });
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/rachunek', rachunekRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
