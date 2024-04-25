class ConfiguracionController {
  constructor(req) {
    this.req = req;
  }

  getConfiguracion() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    return new Promise((resolve, reject) => {
      const sql = 'SELECT `name` AS variable, `value` FROM `config`';
      connectionDB.query(sql, [], async (err, results) => {
        if (err) {
          console.error('Error interno del servidor:', err);
          reject(err);
        }
        resolve(results);
      });
    });
  }
}

module.exports = ConfiguracionController;