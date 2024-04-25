const DatabaseHelper = require("../helpers/databaseHelper");

class ClientesController {
  constructor(req) {
    this.req = req;
  }

  async listaClientes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const { page = 1, size = 10, agent, like } = this.req.query;
    const offset = (page - 1) * size;
    const whereClause = 'WHERE id_proveedor > 0';
    const likeClause = like ? 'AND p.nombre_proveedor LIKE ?' : '';


    const queryTotalRegistros = `
      SELECT COUNT(*) AS total
      FROM proveedores p
      ${whereClause} ${likeClause}; `;

    const queryParams = [`%${like}%`];
    const dataTotalRegistros = await DatabaseHelper.executeQuery(connectionDB, queryTotalRegistros, queryParams); 
    const totalRegistros = dataTotalRegistros[0].total;

    // Calcular la cantidad de páginas y la cantidad de registros en la página actual
    const totalPages = Math.ceil(totalRegistros / size);

    // Obtener los registros paginados
    const limitClause = size ? `LIMIT ${size} OFFSET ${offset}` : '';
    const listaProveedoresQuery = `
            SELECT 
                  p.nombre_proveedor AS nombre,
                  p.id_proveedor AS idcliente,
                  IF(p.pre_id_number = "C.I.", 1, 
                        IF(p.pre_id_number = "C.J.", 2, 
                        IF(p.pre_id_number = "DIMEX", 3, 
                              IF(p.pre_id_number = "NITE", 4, -1)
                        )
                        )
                  ) AS tipo_cedula,
                  p.id_number_proveedor AS cedula,
                  p.telefonos_proveedor AS telefono,
                  p.email_proveedor AS email,
                  p.direccion_proveedor AS direccion,
                  p.codigo_provincia * 1 AS provincia,
                  p.codigo_canton * 1 AS canton,
                  p.codigo_distrito * 1 AS distrito,
                  "" AS barrio,
                  p.contacto_proveedor AS contacto,
                  p.tipo_cliente AS lproveedor,
                  p.consecutivo_offline,
                  0 AS lentrada
            FROM proveedores p
            ${whereClause} ${likeClause}
            ORDER BY id_proveedor DESC
            ${limitClause};
            `;

    const registrosPaginados = await DatabaseHelper.executeQuery(connectionDB,  listaProveedoresQuery, queryParams);

    return {
      page,
      size,
      totalPages,
      totalRegistros,
      registrosPaginados
    };
  }

  async postagregarcliente() {
    try {
      const { connectionDB } = this.req;
      if (!connectionDB) {
        console.error('La conexión a la base de datos no se ha establecido correctamente.');
        return;
      }
      const promiseConnection = await mysql.createConnection(connectionDB.config);
      const sqlx = `SELECT userid FROM sys_invoices WHERE id = ?`;
      const [userResults] = await promiseConnection.execute(sqlx, [this.req.body['nombre']]);
      switch (this.req.body['paymentMethodId']) {
        case 1:
          if (userResults[0] && userResults[0].userid) {
            const sql = `INSERT INTO proveedores (
                                          nombre_proveedor,
                                          instituto,
                                          IF(p.pre_id_number = "C.I.", 1, 
                                            IF(p.pre_id_number = "C.J.", 2, 
                                              IF(p.pre_id_number = "DIMEX", 3, 
                                                IF(p.pre_id_number = "NITE", 4, -1)
                                              )
                                            )
                                          ),
                                          id_number_proveedor,
                                          telefonos_proveedor,
                                          email_proveedor,
                                          direccion_proveedor,
                                          codigo_provincia,
                                          codigo_canton ,
                                          codigo_distrito,
                                          "" AS barrio,
                                          contacto_proveedor,
                                          tipo_cliente)
                                          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?); `;
            const [clientsResults] = await promiseConnection.execute(sql, [
              this.req.body['nombre'],
              1,
              this.req.body['tipo_cedula'],
              this.req.body['cedula'],
              this.req.body['telefono'],
              this.req.body['email'],
              this.req.body['direccion'],
              this.req.body['provincia'],
              this.req.body['canton'],
              this.req.body['distrito'],
              "",
              this.req.body['contacto'],
              this.req.body['lproveedor']
            ]);
            if (clientsResults) {
              return { detail: "El proveedor ya existe" };
            } else {
              return { detail: "El proveedor no existe" };
            }
          } else {

          }
        case 2:
          return { detail: "Proveedor no reconocido" };
        default:

      }
    } catch (error) {
      console.error('Error interno del servidor:', error);
      return { ok: false, message: "Error interno del servidor" };
    }

  }

  async getClientIdByConsecutivoOffline(connectionDB, consecutivo) {
    const query = `SELECT * FROM proveedores WHERE consecutivo_offline = ?`;
    const data = (await DatabaseHelper.executeQuery(connectionDB, query, [consecutivo]))[0];
    return data.id_proveedor;
  }
}

module.exports = ClientesController;