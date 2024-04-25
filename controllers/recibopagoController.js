const DatabaseHelper = require('../helpers/databaseHelper');
const OrderController = require("./ordenesController");

const { getTipoInstrumento } = require('../helpers/globalHelpers');
class RecibopagoController {
  constructor(req) {
    this.req = req;
  }

  async getRecibopago(IdInstruccion) {
    const { connectionDB } = this.req;
    const limite = this.req.body['limit'] ?? 10;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = `SELECT 
                  i.id_instruccion AS id,
                  i.n_factura AS id_proforma,
                  i.id_instruccion AS consecutivo_offline,
                  1 AS metodo_pago_id,
                  i.total_monto AS monto,
                  i.entry_by AS created_by_id,
                  i.t_instrumento AS metodo,
                  i.fecha_factura AS fecha_registro,
                  u.username AS created_by,
                  p.nombre_proveedor AS cliente
              FROM instrucciones i

              JOIN proveedores p ON p.id_proveedor = i.id_proveedor
              JOIN tb_users u ON u.id = i.entry_by
              WHERE id_instruccion = ?
              limit ? ;`;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, [IdInstruccion, limite]);
    return data;
  }

  async postagregarpago() {
    try {
      const { connectionDB } = this.req;
      if (!connectionDB) {
        console.error('La conexión a la base de datos no se ha establecido correctamente.');
        return;
      }
      let body = this.req.body;
      const queryPaymentMethod = "SELECT * FROM tb_metodos_pago WHERE id_metodo =  ?";
      const paymentMethod = (await DatabaseHelper.executeQuery(connectionDB, queryPaymentMethod, [body.paymentMethodId]))[0];

      const invoiceId = await (new OrderController()).getOrderIdByConsecutivoOffline(body.consecutivo_offline_factura)
      body.orderId = invoiceId;

      let insertedId;
      if (paymentMethod.tabla_registro == "tb_cajaschica_mov") {
        insertedId = await this.insertCajaChica(connectionDB, body)
      }
      else {
        insertedId = await this.insertInstruccion(connectionDB, body);
      }


      if (insertedId) {
        const queryUpdateInvoice = `UPDATE sys_invoices SET credit = credit + ? WHERE id=?;`
        const updated = await DatabaseHelper.executeQuery(connectionDB, queryUpdateInvoice, [this.req.body.total, this.req.body.orderId]);
        return { message: "pago guardado exitosamente", data: insertedId };
      } else {
        return { ok: [false], message: "no se pudo guardar el pago", type: "value_error.missing" };
      }
    } catch (error) {
      console.error('Error interno del servidor:', error);
      return { ok: false, message: "Error interno del servidor" };
    }

  }

  async insertInstruccion(connectionDB, body) {
    const queryInstruccion = `INSERT INTO instrucciones (
        id_banco,
        id_proveedor,
        fecha_elaboracion_instruccion,
        fecha_procesado,
        detalles_concepto,
        monto_instruccion,
        total_monto,
        t_instrumento,
        id_t_operacion,
        status,
        n_control_factura,
        n_factura,
        consecutivo_offline_factura,
        consecutivo_offline,
        id_metodo_pago,
        saldo,
        entry_by
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?); `;

    const inserted = await DatabaseHelper.executeQuery(connectionDB, queryInstruccion, [
      1,
      body.user_reg_pago,
      body.fecha,
      body.fecha,
      `Entrada Bancaria por pago de factura #${body.orderId}`,
      body.monto,
      body.monto,
      getTipoInstrumento(body.paymentMethodId),
      3,
      1,
      1,
      body.orderId,
      body.consecutivo_offline_factura,
      body.consecutivo_offline,
      body.metodo_pago_id,
      body.monto,
      body.user_reg_pago
    ]);

    return inserted.insertId;
  }

  async insertCajaChica(connectionDB, body) {
    const queryCajaChica = `INSERT INTO tb_cajaschica_mov (
        id_cajachica,
        entry_by,
        fecha_mov,
        descripcion_mov,
        monto_mov,
        tipo_mov,
        status_mov,
        venta_valid,
        id_factura,
        consecutivo_offline_factura,
        consecutivo_offline,
        id_metodo_pago
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?); `;

    const inserted = DatabaseHelper.executeQuery(connectionDB, queryCajaChica, [
      1,
      body.user_reg_pago,
      body.fecha,
      `Entrada en efectivo por pago de factura #${body.orderId}`,
      body.monto,
      1,
      1,
      1,
      body.orderId,
      body.consecutivo_offline_factura,
      body.consecutivo_offline,
      body.metodo_pago_id,
    ]);
    return inserted.insertId;
  }

}

module.exports = RecibopagoController;

