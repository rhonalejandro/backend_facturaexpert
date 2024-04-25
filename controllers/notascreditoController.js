const { executeQuery } = require('../helpers/databaseHelper');

const OrderController = require("./ordenesController");

class NotascreditoController {
  constructor(req) {
    this.req = req;
  }

  async getNotascredito() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = `SELECT
      n.id_nc AS id,
      n.id_invoice AS id_proforma,
      n.TotalComprobante AS total_comprobante,
      GROUP_CONCAT(p
            JSON_OBJECT(
                  'id_item', c.item_id,
                  'id_nc_encabezado', c.id_nc,
                  'cantidad', c.qty,
                  'producto', p.name
            )
      ) AS items
      FROM sys_nc n
      JOIN sys_nc_items c ON c.id_nc = n.id_nc
      JOIN tb_products p on p.id = c.item_id
      GROUP BY n.id_nc;`;

    const data = await executeQuery(connectionDB, query, []);
    return data;
  }

  async getNotasdecreditobyidfactura(id) {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = `SELECT
                    n.id_nc AS id,
                    n.id_invoice AS id_proforma,
                    n.date as fecha,
                    n.TotalComprobante AS total_comprobante,
                    JSON_ARRAYAGG(
                          JSON_OBJECT(
                                'id_item', c.item_id,
                                'id_nc_encabezado', c.id_nc,
                                'cantidad', c.qty,
                                'producto', p.name
                          )
                    ) AS items
                    FROM sys_nc n
                    JOIN sys_nc_items c ON c.id_nc = n.id_nc
                    JOIN tb_products p on p.id = c.item_id
                    WHERE n.id_invoice = ?
                    GROUP BY n.id_nc;`;

    const data = await executeQuery(connectionDB, query, [id]);
    return data;
  }

  getNotascreditoitems() {
    const { connectionDB } = this.req;
    const limite = this.req.body['limit'] ?? 10;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
                              nci.id AS id,
                              nci.qty AS cantidad,
                              nci.item_id AS id_item,
                              nci.id_nc AS id_nc_encabezado
                        FROM sys_nc_items nci
                        limit ?  `;
      connectionDB.query(sql, [limite], async (err, results) => {
        if (err) {
          console.error('Error interno del servidor:', err);
          reject(err);
        }
        resolve(results);
      });
    });
  }

  async postCrearNCPorIdFactura() {
    try {
      const { connectionDB } = this.req;
      if (!connectionDB) {
        console.error('La conexión a la base de datos no se ha establecido correctamente.');
        return;
      }

      const body = this.req.body;
      const orderId = await (new OrderController).getOrderIdByConsecutivoOffline(connectionDB, body.consecutivo_offline_factura);

      const queryEncabezadoNC = `INSERT INTO sys_nc (
        id_invoice,
        id_moneda,
        userid,
        paymentmethod,
        date,
        motivo_anulada,
        subtotal,
        discount_type,
        discount_value,
        discount,
        sub_d_descuento_factura,
        tax,
        taxrate,
        total,
        id_lista_precio,
        entry_by,
        CodigoActividad,
        ExoTipoDocumento,
        ExoNumeroDocumento,
        ExoNombreInstitucion,
        ExoFechaEmision,
        ExoPorcentajeExoneracion,
        TotalServGravados,
        TotalServExonerado,
        TotalServExentos,
        TotalMercanciasGravadas,
        TotalMercExonerada,
        TotalMercanciasExentas,
        TotalGravado,
        TotalExento,
        TotalExonerado,
        TotalVenta,
        TotalDescuentos,
        TotalVentaNeta,
        TotalImpuesto,
        TotalComprobante,
        TotalIvaDevuelto,
        consecutivo_offline,
        consecutivo_offline_factura
        )
        (SELECT 
              ?,
              id_moneda,
              userid,
              paymentmethod,
              date,
              'Anulacion de factura',
              subtotal,
              discount_type,
              discount_value,
              discount,
              sub_d_descuento_factura,
              tax,
              taxrate,
              total,
              id_lista_precio,
              entry_by,
              CodigoActividad,
              ExoTipoDocumento,
              ExoNumeroDocumento,
              ExoNombreInstitucion,
              ExoFechaEmision,
              ExoPorcentajeExoneracion,
              TotalServGravados,
              TotalServExonerado,
              TotalServExentos,
              TotalMercanciasGravadas,
              TotalMercExonerada,
              TotalMercanciasExentas,
              TotalGravado,
              TotalExento,
              TotalExonerado,
              TotalVenta,
              TotalDescuentos,
              TotalVentaNeta,
              TotalImpuesto,
              TotalComprobante,
              TotalIvaDevuelto,
              ?
              consecutivo_offline
        FROM sys_invoices 
        WHERE id = ?)
      `;

      const queryItemsNC = `INSERT INTO sys_nc_items (
                id_nc,
                itemcode,
                description,
                qty,
                amount,
                taxed,
                taxamount,
                total,
                entry_by,
                status_items,
                PrecioUnitario,
                MontoTotal,
                MontoDescuento,
                subtotal,
                Imp_Tarifa,
                Imp_Monto,
                ImpuestoNeto,
                PorcentajeExoneracion,
                MontoExoneracion,
                MontoTotalLinea,
                item_unit,
                addtype,
                item_type,
                item_comment,
                item_discount_rate,
                item_tax_code,
                item_tax_code_rate,
                serial,
                item_id,
                item_base_quantity,
                codigo_cabys
              )
              SELECT
                ?,
                itemcode,
                description,
                qty,
                amount,
                taxed,
                taxamount,
                total,
                entry_by,
                status_items,
                PrecioUnitario,
                MontoTotal,
                MontoDescuento,
                subtotal,
                Imp_Tarifa,
                Imp_Monto,
                ImpuestoNeto,
                PorcentajeExoneracion,
                MontoExoneracion,
                MontoTotalLinea,
                item_unit,
                addtype,
                item_type,
                item_comment,
                item_discount_rate,
                item_tax_code,
                item_tax_code_rate,
                serial,
                item_id,
                item_base_quantity,
                codigo_cabys
              FROM
                sys_invoiceitems
              WHERE invoiceid = ?
              `;

      const encabezadoInsertado = await executeQuery(connectionDB, queryEncabezadoNC, [orderId, body.consecutivo_offline, orderId]);
      const itemsInsertados = await executeQuery(connectionDB, queryItemsNC, [encabezadoInsertado.insertId, orderId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

}

module.exports = NotascreditoController;