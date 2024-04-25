class CantonesController {
  constructor(req) {
    this.req = req;
  }

  listaCantones() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const { province } = this.req.query;
    return new Promise((resolve, reject) => {
      const sql = 'SELECT `codigo_canton`,`nombre_canton`,`codigo_provincia` FROM `canton_cr` WHERE `codigo_provincia` = ? ';
      const sqlPage = 'SELECT count(*) FROM `canton_cr` WHERE `codigo_provincia` = ? ';
      connectionDB.query(sql, [province], async (err, results) => {
        if (err) {
          console.error('Error interno del servidor:', err);
          reject(err);
        }
        resolve(results);
      });
    });
  }
}

module.exports = CantonesController;