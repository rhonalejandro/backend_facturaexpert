const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

const getConnection = (hostDB, userDB, passwordDB, nameDB, prefixDB) => {
  const pool = mysql.createPool({
    host: hostDB,
    user: userDB,
    password: passwordDB,
    database: `${prefixDB ?? ""}${nameDB}`,
  });

  pool.getConnection((err) => {
    if (err) {
      console.error('Error en la conexión a MySQL:', err);
    } else {
      console.log('Conexión a MySQL del cliente establecida');
    }
  });

  return pool;
};

const getConnectionToken = (req) => {
  return new Promise((resolve, reject) => {
    const accessToken = req.header('Authorization');
    const splitterToken = accessToken.split(" ")
    let token = splitterToken[0];
    if (splitterToken[0].toLowerCase() == "bearer") {
      token = splitterToken[1];
    }

    let codeToken = "";

    if (token) {
      try {
        const decodedToken = jwt.decode(token, { complete: true });
        if (decodedToken) {
          const { code } = decodedToken.payload;
          codeToken = code;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        reject(error);
      }

      const dbConnection = require('../config/database');
      const sql = 'SELECT * FROM `tb_systems` WHERE `codigo_acceso` =  ?';

      dbConnection.query(sql, [codeToken], async (err, results) => {
        if (err) {
          console.error('Error en la consulta:', err);
          reject(err);
        } else {
          const connection = getConnection(results[0].host_db, results[0].user_db, results[0].password_db, results[0].name_db, results[0].prefix_name_db);
          resolve(connection);
        }
      });
    } else {
      resolve(null);
    }
  });
};

const executeQuery = (connectionDB, sql, params) => {
  return new Promise((resolve, rejec) => {
    connectionDB.query(sql, params, async (err, results) =>{
      return err ? rejec(err) : resolve(results)
    }
    );
  });
}
module.exports = { getConnection, getConnectionToken, executeQuery };