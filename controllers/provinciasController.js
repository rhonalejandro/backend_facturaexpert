class ProvinciasController {
      constructor(req) {
            this.req = req;
      }

      listaProvincias() {
            const { connectionDB } = this.req;
            if (!connectionDB) {
                  console.error('La conexión a la base de datos no se ha establecido correctamente.');
                  return;
            }
            return new Promise((resolve, reject) => {        
                  const sql = 'SELECT codigo_provincia, nombre_provincia FROM `provincia_cr`';
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

module.exports = ProvinciasController;