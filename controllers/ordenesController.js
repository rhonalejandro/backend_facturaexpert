const DatabaseHelper = require('../helpers/databaseHelper');

class OrdenesController {
  constructor(req) {
    this.req = req;
  }

  async getOrderById(orderId) {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const sql = `SELECT 
                  si.id AS id_proforma,
                  si.consecutivo AS consecutivo,
                  si.id AS consecutivo_offline,
                  p.nombre_proveedor AS cliente,
                  si.userid AS idcliente,
                  si.entry_by AS created_by_id,
                  u.username AS created_by,
                  si.date AS fecha,
                  SUM(i.qty) AS cantidad,
                  IF(si.status = 'Anulada', -1, 1) AS estado,
                  IF( si.paymentmethod> 0, 1,2) AS tip_venta,
                  si.TotalVentaNeta AS monto_total,
                  si.discount AS descuento_total,
                  si.subtotal AS subtotal,
                  si.tax AS impuesto,
                  si.TotalComprobante AS total_comprobante,
                  IF(si.TotalComprobante- si.credit < 0, 0, si.TotalComprobante- si.credit) AS adeudado,
                  si.paymentmethod AS  dias_plazo,
                  si.nota_credito AS monto_nota_credito
                FROM sys_invoices si
                left JOIN tb_users u ON u.id = si.entry_by
                left JOIN proveedores p ON p.id_proveedor = si.vendedor
                left JOIN sys_invoiceitems i ON i.invoiceid = si.id
                WHERE si.id = ?
                GROUP BY si.id`;
    const data = await DatabaseHelper.executeQuery(connectionDB, sql, [orderId]);

    if (data.length > 0) {
      return data[0];
    }
    return null;
  }

  async getOrdenes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const { page = 1, size = 10 } = this.req.query;
    const offset = (page - 1) * size;
    const like = `%${this.req.query.like}%`;

    const query = `SELECT
            s.consecutivo_offline,
            s.id AS id_proforma, 
            s.date as fecha,
            "1" as estado,
            p.nombre_proveedor AS cliente,
            s.userid AS  idcliente, 
            s.vendedor AS id_agente, 
            s.TotalVentaNeta AS monto_total, 
            s.TotalDescuentos AS descuento_total, 
            s.subtotal AS subtotal,
            s.TotalImpuesto AS impuesto,
            s.TotalComprobante AS total_comprobante, 
            s.paymentmethod AS dias_plazo, 
            s.nota_credito AS monto_nota_credito, 
            IF( IFNULL(s.paymentmethod, 0) > 0, 2,1) AS tip_venta,
            IF(s.TotalComprobante- s.credit < 0, 0, s.TotalComprobante- s.credit) AS adeudado,
            SUM(i.qty)AS cantidad
          FROM sys_invoices s
          left JOIN proveedores p ON p.id_proveedor = s.userid
          left JOIN sys_invoiceitems i ON i.invoiceid = s.id
          WHERE CONCAT(s.id, IFNULL(p.nombre_proveedor, ''), IFNULL(s.consecutivo, '')) LIKE ?
          GROUP BY s.id
          ORDER BY s.id DESC
          LIMIT ? OFFSET ? `;

    const data = DatabaseHelper.executeQuery(connectionDB, query, [like, parseInt(size), offset]);
    return data;
  }

  async getItemsByOrderId(id) {
    const { connectionDB } = this.req;
    const limite = this.req.body['limit'] ?? 10;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    return new Promise((resolve, reject) => {
      const sql = `
                  SELECT
                    id as id_item,
                    si.item_id AS id_producto,
                    si.description AS nombre,
                    si.itemcode AS codigo,
                    si.PrecioUnitario AS precio,
                    si.qty AS cantidad,
                    si.MontoDescuento AS descuento,
                    si.MontoTotal AS monto_total,
                    si.ImpuestoNeto AS impuesto
                  FROM sys_invoiceitems si
                  WHERE si.invoiceid = ?
                  limit ?;`;
      connectionDB.query(sql, [id, limite], async (err, results) => {
        if (err) {
          console.error('Error interno del servidor:', err);
          reject(err);
        }
        resolve(results);
      });
    });
  }

  async getPaymentsByOrderId(id) {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const queryInstrucciones = `SELECT
      i.id_instruccion AS id,
      i.n_factura AS id_proforma,
      1 AS metodo_pago_id,
      i.fecha_elaboracion_instruccion AS fecha_registro,
      i.t_instrumento AS metodo,
      i.monto_instruccion AS monto,
      i.entry_by AS created_by_id,
      u.username AS created_by,
      p.nombre_proveedor AS cliente,
      i.consecutivo_offline
      FROM
        instrucciones i
        LEFT JOIN tb_users u ON u.id = i.entry_by
        LEFT JOIN proveedores p ON p.id_proveedor = i.id_proveedor
      WHERE i.n_factura = ?`;

    const queryCajasChica = `SELECT
      ccm.id_cajachica_mov AS id,
      ccm.id_factura AS id_proforma,
      2 AS metodo_pago_id,
      ccm.fecha_mov AS fecha_registro,
      'efectivo' AS metodo,
      ccm.monto_mov AS monto,
      ccm.entry_by AS created_by_id,
      u.username AS created_by,
      p.nombre_proveedor AS cliente,
      ccm.consecutivo_offline
    FROM
      tb_cajaschica_mov ccm
      LEFT JOIN tb_users u ON u.id = ccm.entry_by
    LEFT JOIN proveedores p ON p.id_proveedor = ccm.id_proveedor
    WHERE ccm.id_factura = ?`;

    const query = `${queryInstrucciones}
                  UNION
                  ${queryCajasChica};`;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, [id, id])
    return data;
  }

  async postagregarorden() {
    const { connectionDB } = this.req;

    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const body = this.req.body;
    const orderQuery = `insert into sys_invoices (
        userid,
        vendedor,
        date,
        total,
        subtotal,
        TotalVenta,
        TotalVentaNeta,
        tax,
        TotalImpuesto,
        discount_value,
        TotalDescuentos,
        TotalComprobante,
        paymentmethod,
        credit
      ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const orderQueryParams = [
      body.id_cliente,
      body.id_agente,
      body.fecha,
      body.monto_total,
      body.subtotal,
      body.subtotal,
      body.subtotal,
      body.impuesto,
      body.impuesto,
      body.descuento_total,
      body.descuento_total,
      body.total_comprobante,
      body.dias_plazo ?? 0,
      body.pagado
    ];

    const data = await DatabaseHelper.executeQuery(connectionDB, orderQuery, orderQueryParams);
    const insertItemsQuery = `
      INSERT INTO sys_invoiceitems (
          invoiceid,
          item_id,
          PrecioUnitario,
          qty,
          item_tax_code,
          ImpuestoNeto,
          MontoTotal,
          MontoDescuento,
          item_discount_rate
        )
    `;
    const queryValues = [];
    for(const item of this.req.body.items){
      const queryValue = `
        (
          ${data.insertId},
          ${item.id_producto},
          ${item.precio},
          ${item.cantidad},
          ${item.impuesto_codigo},
          ${item.impuesto},
          ${item.monto_total},
          ${item.descuento},
          ${item.tasa_descuento}
        )
      `;
      queryValues.push(queryValue);
    }

    const fullQuery = `${insertItemsQuery} VALUES ${queryValues.join(",")}`;
    await DatabaseHelper.executeQuery(connectionDB, fullQuery, []);
    return data.insertId;
  }

  async postagregarordenitems() {
    const { connectionDB } = this.req;

    if (!connectionDB) {
      return { statusCode: 500, message: "La conexión a la base de datos no se ha establecido correctamente." }
    }
    const itemId = this.req.body['id_producto'];
    if (itemId == null) {
      return { statusCode: 400, message: 'El valor de "id_producto" no puede ser nulo.' }

    }

    const query = ` (?,?,?,?,?,?,?,?)`;

    const params = [
      itemId,
      this.req.body.precio,
      this.req.body.cantidad,
      this.req.body.impuesto_codigo,
      this.req.body.impuesto,
      this.req.body.monto_total,
      this.req.body.descuento,
      this.req.body.tasa_descuento
    ];

    await DatabaseHelper.executeQuery(connectionDB, query, params);
    return true;
  }

  async postcargarordenes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    return new Promise((resolve, reject) => {
      const sql = `insert into sys_invoices (
                              cn,
                              consecutivo,
                              userid,
                              vendedor,
                              date,
                              total,
                              subtotal,
                              TotalVenta,
                              TotalVentaNeta,
                              tax,
                              TotalImpuesto,
                              discount_value,
                              TotalDescuentos,
                              TotalComprobante,
                              paymentmethod,
                              status,
                              credit,
                              anulada_por,
                              entry_by
                              
                              ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      const orderData = this.req.body.data.order;
      DatabaseHelper.executeQuery(sql, [
        orderData['id_proforma'],
        orderData['consecutivo'],
        orderData['idcliente'],
        orderData['id_agente'],
        orderData['fecha'],
        orderData['monto_total'],
        orderData['subtotal'],
        orderData['subtotal'],
        orderData['subtotal'],
        orderData['impuesto'],
        orderData['impuesto'],
        orderData['descuento_total'],
        orderData['descuento_total'],
        orderData['total_comprobante'],
        orderData['dias_plazo'],
        orderData['estado'],
        orderData['pagado'],
        orderData['anulado_por'],
        orderData['created_by_id']
      ], (err, results) => {
        if (err) {
          console.error('Error interno del servidor:', err);
          reject(err);
        } else {
          if (results) {
            resolve({ message: "Orden guardada exitosamente" });
          } else {
            resolve({ message: "La orden no se pudo guardar" });
          }
        }
      });
    });
  }

  async postcargarordenesitems() {
    const { connectionDB } = this.req;

    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    try {
      const items = this.req.body.data.order.items;

      const promises = items.map(async (item) => {
        const sql = `INSERT INTO sys_invoiceitems (
                              item_id,
                              description,
                              id,
                              itemcode,
                              PrecioUnitario,
                              qty,
                              Imp_Monto,
                              ImpuestoNeto,
                              MontoTotal,
                              MontoDescuento
                              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await new Promise((resolve, reject) => {
          connectionDB.query(sql, [
            item.id_producto,
            item.nombre,
            item.id_item,
            item.id_proforma,
            item.precio,
            item.cantidad,
            item.impuesto_codigo,
            item.impuesto,
            item.monto_total,
            item.descuento,
          ], (err, results) => {
            if (err) {
              console.error('Error interno del servidor:', err);
              reject(err);
            } else {
              if (results) {
                resolve({ message: "Orden guardada exitosamente" });
              } else {
                resolve({ message: "La orden no se pudo guardar" });
              }
            }
          });
        });
      });


      await Promise.all(promises);

      return { message: "Todas las órdenes se guardaron exitosamente" };
    } catch (error) {
      console.error('Error durante el proceso:', error);
      return { message: "Error durante el proceso de guardado" };
    }
  }

  async putAnularOrden(id) {
    try {
      const { connectionDB } = this.req;
      if (!connectionDB) {
        console.error('La conexión a la base de datos no se ha establecido correctamente.');
        return;
      }
      const creditNotesController = new CreditNotesController();

      const queryGetFactura = `SELECT * FROM sys_invoices WHERE id = ?`;
      const queryGetItems = `SELECT * FROM sys_invoiceitems WHERE invoiceid = ?`;
      const factura = await executeQuery(connectionDB, queryGetFactura, [id]);
      const items = await executeQuery(connectionDB, queryGetItems[id]);

      if (!factura) {
        return { "message": "Factura no encontrada" };
      }

      await creditNotesController.postCrearNCPorIdFactura(id);

      const queryAnulacion = `
        UPDATE sys_invoices
        SET status = 'Anulada'
        WHERE id = ?;`;
      const anulada = await executeQuery(connectionDB, queryAnulacion, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getOrderIdByConsecutivoOffline(connectionDB, consecutivo) {
    const query = `SELECT * FROM sys_invoices WHERE consecutivo_offline = ?`;

    const data = (await DatabaseHelper.executeQuery(connectionDB, query, [consecutivo]))[0];
    return data.id;
  }

  async getOrderByConsecutivoOffline(connectionDB, consecutivo) {
    const query = `SELECT * FROM sys_invoices WHERE consecutivo_offline = ?`;

    const data = (await DatabaseHelper.executeQuery(connectionDB, query, [consecutivo]))[0];
    return data;
  }
}
module.exports = OrdenesController;
