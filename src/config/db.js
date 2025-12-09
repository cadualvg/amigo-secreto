const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createPool({
host: process.env.DB_HOST,
port: process.env.DB_PORT,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_DATABASE
});

connection.getConnection((err, conn) => {
if (err) {
    console.error('Erro ao conectar no MySQL:', err);
} else {
    console.log('Conectado ao MySQL com sucesso.');
    conn.release();
}
});

module.exports = connection;
