var mysql = require('mysql2');
var crypto = require('crypto');

DB_HOST = 'localhost';
DB_USER = 'nowy_user';
DB_PASSWORD = 'haslo';
DB_DATABASE = 'ktokomuiledb';

const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    charset: 'utf8mb4'
})

const queryCreate = `
CREATE TABLE IF NOT EXISTS Uzytkownik (
    idUzytkownik INT AUTO_INCREMENT PRIMARY KEY,
    login varchar(255) UNIQUE NOT NULL,
    hashed_password BLOB NOT NULL,
    salt BLOB,
    email varchar(255) UNIQUE NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

db.query(queryCreate, (err, data) => {
    if (err) throw err;
});

const queryFirstUser = `
INSERT INTO Uzytkownik (login, hashed_password, salt, email) VALUES (?,?,?,?)
ON DUPLICATE KEY UPDATE login = login;`;

const salt = crypto.randomBytes(16);
db.query(queryFirstUser, ['alice', crypto.pbkdf2Sync('letmein', salt, 310000, 32, 'sha256'), salt, 'alice@gmail.com'], (err, rows, fields) => {
    if (err) throw err;
});

module.exports = db;