class ListaclientesporagenteController {
      constructor(req) {
            this.req = req;
      }

      getListaClientesByAgente(id_user) {
            const { connectionDB } = this.req;
            if (!connectionDB) {
                  console.error('La conexión a la base de datos no se ha establecido correctamente.');
                  return;
            }
            return new Promise((resolve, reject) => {
                  const sql = `
                  SELECT
                        p.nombre_proveedor AS nombre,
                        p.id_proveedor AS id_cliente,
                        p.nombre_proveedor AS comercial,
                        p.pre_id_number AS tipo_cedula,
                        p.id_number_proveedor AS cedula,
                        p.telefonos_proveedor AS telefono,
                        p.email_proveedor AS email,
                        p.direccion_proveedor AS direccion,
                        p.codigo_provincia AS provincia,
                        p.codigo_canton AS canton,
                        p.codigo_distrito AS distrito,
                        p.codigo_barrio AS barrio,
                        "" AS lproveedor,
                        0 AS lentrada
                  FROM proveedores p
                  WHERE id_user= ?;`;
                  connectionDB.query(sql, [id_user], async (err, results) => {
                        if (err) {
                              console.error('Error interno del servidor:', err);
                              reject(err);
                        }
                        resolve(results);
                  });
            });
      }
      getAgentes() {
            const { connectionDB } = this.req;
            const limite = this.req.body['limit']??10;
            if (!connectionDB) {
                  console.error('La conexión a la base de datos no se ha establecido correctamente.');
                  return;
            }
            return new Promise((resolve, reject) => {
                  const sql = `
                  SELECT
                        p.nombre_proveedor AS nombre,
                        p.id_proveedor AS id_cliente,
                        p.nombre_proveedor AS comercial,
                        p.pre_id_number AS tipo_cedula,
                        p.id_number_proveedor AS cedula,
                        p.telefonos_proveedor AS telefono,
                        p.email_proveedor AS email,
                        p.direccion_proveedor AS direccion,
                        p.codigo_provincia AS provincia,
                        p.codigo_canton AS canton,
                        p.codigo_distrito AS distrito,
                        p.codigo_barrio AS barrio,
                        "" AS lproveedor,
                        0 AS lentrada
                  FROM proveedores p
                  limit ? ;`;
                  connectionDB.query(sql, [limite], async (err, results) => {
                        if (err) {
                              console.error('Error interno del servidor:', err);
                              reject(err);
                        }
                        resolve(results);
                  });
            });
      }
}
module.exports = ListaclientesporagenteController;