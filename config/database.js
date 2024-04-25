const mysql = require('mysql2');
require('dotenv').config();

// const connection = mysql.createConnection({
//   host: "10.10.0.110",
//   user: process.env.USER_DB,
//   password: "8314579Kh$dams",
//   database: "admin_default",//process.env.NAME_DB,
// });

// connection.connect((err) => {
//   if (err) {
//     console.error('Error de conexión a MySQL:', err);
//   } else {
//     console.log('Conexión a MySQL default establecida');
//   }
// });

// module.exports = connection;

const pool = mysql.createPool({
  host: "10.10.0.110",
  user: process.env.USER_DB,
  password: "8314579Kh$dams",
  database: "admin_default",//process.env.NAME_DB,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error de conexión a MySQL:', err);
    return 
  } else {
    console.log('Conexión a MySQL default establecida');
  }
  return connection;
});

module.exports = pool
