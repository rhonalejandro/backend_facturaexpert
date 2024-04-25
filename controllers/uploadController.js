const DatabaseHelper = require('../helpers/databaseHelper');
const ClientesController = require('./clientesController');
const OrderController = require('./ordenesController');

const RecibopagoController = require("./recibopagoController");

class UploadController {
  constructor(req) {
    this.req = req;
  }

  async uploadOrdenes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const body = this.req.body;

    for (const orderInfo of body.data) {
      const order = orderInfo.order;
        const insertedOrderId = await this.insertOrder(connectionDB, order);
    }
  }

  async uploadClientes() {
    try {
      const { connectionDB } = this.req;
      if (!connectionDB) {
        console.error('La conexión a la base de datos no se ha establecido correctamente.');
        return;
      }

      const body = this.req.body;
      const queryClientExists = `SELECT * FROM proveedores WHERE id_number_proveedor = ? AND tipo_cliente = ?`;
      const exists = await DatabaseHelper.executeQuery(connectionDB, queryClientExists, [body.cedula, body.lproveedor]);

      if (exists.length > 0) {
        return exists[0].id_proveedor;
      }

      const identificationType = {
        "01": "C.I.",
        "02": "C.J.",
        "03": "DIMEX",
        "04": "NITE",
      }

      const sql = `INSERT INTO proveedores (
          nombre_proveedor,
          pre_id_number,
          id_number_proveedor,
          telefonos_proveedor,
          email_proveedor,
          direccion_proveedor,
          codigo_provincia,
          codigo_canton,
          contacto_proveedor,
          tipo_cliente,
          consecutivo_offline,
          creado_por
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?); `;

      const data = await DatabaseHelper.executeQuery(connectionDB, sql, [
        body.nombre,
        identificationType[body.tipo_cedula],
        body.cedula,
        body.telefono,
        body.email,
        body.direccion,
        body.provincia,
        body.canton,
        body.contacto,
        body.lproveedor,
        body.consecutivo_offline,
        body.creado_por,
      ]);
      return data.insertId;
    } catch (error) {
      console.error('Error interno del servidor:', error);
      return -1;
    }
  }

  async uploadRecibosPago() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    try {
      const body = this.req.body;
      for (const recibo of body.data) {
        await this.insertPayment(connectionDB, recibo);
      }
    } catch (error) {
      console.error('Error interno del servidor:', error);
      return { ok: false, message: "Error interno del servidor" };
    }
  }

  async uploadReimpresionesFacturas() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const body = this.req.body;
    const invoiceId = await (new OrderController()).getOrderIdByConsecutivoOffline(connectionDB, body.consecutivo_offline);
    body.id_proforma = invoiceId;

    const insertedId = await this.insertOrderReprinted(connectionDB, body);
    return insertedId;
  }

  async insertOrder(connectionDB, data) {
    let totalServiciosGravados = 0;
    let totalMercanciasGravadas = 0;

    let totalServiciosExentos = 0;
    let totalMercanciasExentas = 0;

    let totalServiciosExonerados = 0;
    let totalMercanciasExoneradas = 0;

    let totalDescuentos = 0;
    for (const item of data.items) {

      let descuentoLinea = item.descuento || 0;
      let tarifaImpuesto = item.iva;
      item.subtotal = item.monto_total / (1 + (tarifaImpuesto / 100));
      item.montoTotalLinea = item.monto_total;
      item.monto_total = item.subtotal;

      item.totalGravadoLinea = item.subtotal;
      totalDescuentos += descuentoLinea;
      totalMercanciasGravadas += item.totalGravadoLinea;
    }

    const totalGravado = totalMercanciasGravadas + totalServiciosGravados;
    const totalExento = totalMercanciasExentas + totalServiciosExentos;
    const totalExonerado = totalMercanciasExoneradas + totalServiciosExonerados;

    const subtotal = data.subtotal;
    const totalVenta = totalGravado + totalExento + totalExonerado;
    const totalVentaNeta = totalVenta - totalDescuentos;

    const clientId = await (new ClientesController()).getClientIdByConsecutivoOffline(connectionDB, data.consecutivo_offline_cliente);


    const orderTableName = data.status_invoices == 3 ? 'sys_fec' : 'sys_invoices';

    const orderQuery = `insert into ${orderTableName} (
        userid,
        vendedor,
        date,
        total,
        subtotal,
        tax,
        TotalImpuesto,
        discount_value,
        TotalDescuentos,
        paymentmethod,
        credit,
        consecutivo_offline,
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
        TotalVentaNeta,
        TotalComprobante,
        oldinvoice,
        consecutivo_offline_cliente,
        id_moneda,
        status_invoices
      ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const orderQueryParams = [
      clientId,
      data.id_agente,
      data.fecha,
      data.monto_total,
      data.subtotal,
      data.impuesto,
      data.impuesto,
      data.descuento_total,
      data.descuento_total,
      data.dias_plazo ?? 0,
      data.pagado,
      data.consecutivo_offline,
      totalServiciosGravados,
      totalServiciosExonerados,
      totalServiciosExentos,
      totalMercanciasGravadas,
      totalMercanciasExoneradas,
      totalMercanciasExentas,
      totalGravado,
      totalExento,
      totalExonerado,
      totalVenta,
      totalVentaNeta,
      data.total_comprobante,
      0,
      data.consecutivo_offline_cliente,
      1,
      data.status_invoices
    ];

    const insertedInvoice = await DatabaseHelper.executeQuery(connectionDB, orderQuery, orderQueryParams);

    const itemsTableName = data.status_invoices == 3 ? 'sys_fec_items' : 'sys_invoiceitems';
    const insertItemsQuery = `
      INSERT INTO ${itemsTableName} (
          invoiceid,
          itemcode,
          description,
          item_id,
          total,
          PrecioUnitario,
          qty,
          item_tax_code,
          Imp_Monto,
          ImpuestoNeto,
          MontoTotal,
          MontoDescuento,
          item_discount_rate,
          consecutivo_offline_factura,
          Imp_Tarifa,
          MontoTotalLinea,
          subtotal
        )
    `;

    const updateProducts = [];
    const queryValues = [];
    for (const item of data.items) {
      const queryValue = `
        (
          ${insertedInvoice.insertId},
          '${item.codigo}',
          '${item.descripcion}',
          ${item.id_producto},
          ${item.monto_total},
          ${item.precio},
          ${item.cantidad},
          ${item.impuesto_codigo},
          ${item.impuesto},
          ${item.impuesto},
          ${item.monto_total},
          ${item.descuento},
          ${item.tasa_descuento},
          '${data.consecutivo_offline}',
          ${item.iva},
          ${item.montoTotalLinea},
          ${item.subtotal}
        )
      `;
      queryValues.push(queryValue);
      
      const operation = data.status_invoices == 3 ? '+' : '-';
      updateProducts.push(`UPDATE tb_products SET qty = ${qty} - ${item.cantidad} WHERE id = ${item.id_producto}`);
    }

    const fullQuery = `${insertItemsQuery} VALUES ${queryValues.join(",")}`;
    
    const insertedItems = await DatabaseHelper.executeQuery(connectionDB, fullQuery, []);
    if(insertedItems){
      await DatabaseHelper.executeQuery(updateProducts.join(' '));
    }
    
    return data.insertId;
  }

  async insertClient(connectionDB, data) {
    const query = ``;
    const result = await DatabaseHelper.executeQuery(connectionDB, query, params);
    return result.insertId;
  }

  async uploadEncabezadoNc() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const body = this.req.body;

    for (const creditNote of body.data) {
      let totalImpuesto = 0;

      let totalServiciosGravados = 0;
      let totalMercanciasGravadas = 0;

      let totalServiciosExentos = 0;
      let totalMercanciasExentas = 0;

      let totalServiciosExonerados = 0;
      let totalMercanciasExoneradas = 0;

      let subtotalNc = 0;
      let totalDescuentos = 0;

      for (let item of creditNote.items) {
        const precioUnitario = item.precio_unitario;
        const descuentoLinea = item.descuento || 0;
        const tarifaImpuesto = item.iva;
        const montoTotal = precioUnitario * Number.parseFloat(item.cantidad);
        const montoTotalSinImpuesto = montoTotal;
        item.montoTotal = montoTotal;
        item.subtotal = montoTotalSinImpuesto - descuentoLinea;
        
        item.totalImpuesto = item.subtotal * (item.iva / 100);
        item.montoTotalLinea = montoTotal + item.totalImpuesto;
        
        item.totalGravadoLinea = item.subtotal;

        subtotalNc += item.subtotal;
        totalDescuentos += descuentoLinea;
        totalMercanciasGravadas += item.totalGravadoLinea;
        totalImpuesto += item.totalImpuesto;
      }

      const totalGravado = totalMercanciasGravadas + totalServiciosGravados;
      const totalExento = totalMercanciasExentas + totalServiciosExentos;
      const totalExonerado = totalMercanciasExoneradas + totalServiciosExonerados;

      const totalVenta = totalGravado + totalExento + totalExonerado;
      const totalVentaNeta = totalVenta - totalDescuentos;

      creditNote.montoTotal = 0;
      creditNote.subtotal = subtotalNc;
      creditNote.totalDescuentos = totalDescuentos;
      creditNote.totalGravado = totalGravado;
      creditNote.totalExento = totalExento;
      creditNote.totalExonerado = totalExonerado;
      creditNote.totalVenta = totalVenta;
      creditNote.totalVentaNeta = totalVentaNeta;
      creditNote.totalImpuesto = totalImpuesto;
      
      creditNote.totalServGravados = totalServiciosGravados;
      creditNote.totalServExonerado = totalServiciosExonerados;
      creditNote.totalServExentos = totalServiciosExentos;
      creditNote.totalMercGravadas = totalMercanciasGravadas;
      creditNote.totalMercExentas = totalMercanciasExentas;
      creditNote.totalMercExonerada = totalMercanciasExoneradas;

      const creditNoteId = await this.insertCreditNote(connectionDB, creditNote);
      const creditNoteItems = creditNote.items.map((e) => {
        e.id_nc_encabezado = creditNoteId;
        return e;
      });

      await this.insertCreditNoteItems(connectionDB, creditNoteItems);
    }
  }

  async insertCreditNote(connectionDB, data) {
    const invoiceId = await (new OrderController()).getOrderIdByConsecutivoOffline(connectionDB, data.consecutivo_offline_factura);
    data.id_proforma = invoiceId;

    const query = `INSERT INTO sys_nc (
        id_invoice,
        TotalComprobante,
        entry_by,
        date,
        consecutivo_offline,
        consecutivo_offline_factura,
        TotalServGravados,
        TotalServExonerado,
        TotalServExentos,
        TotalMercanciasGravadas,
        TotalMercanciasExentas,
        TotalMercExonerada,
        TotalGravado,
        TotalExento,
        TotalExonerado,
        TotalVenta,
        TotalVentaNeta,
        subtotal,
        TotalDescuentos,
        TotalImpuesto,
        motivo_anulada
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
      data.id_proforma,
      data.total_comprobante,
      data.creado_por,
      data.fecha,
      data.consecutivo_offline,
      data.consecutivo_offline_factura,
      data.totalServGravados,
      data.totalServExonerado,
      data.totalServExentos,
      data.totalMercGravadas,
      data.totalMercExentas,
      data.totalMercExonerada,
      data.totalGravado,
      data.totalExento,
      data.totalExonerado,
      data.totalVenta,
      data.totalVentaNeta,
      data.subtotal,
      data.totalDescuentos,
      data.totalImpuesto,
      "02",
    ];

    const inserted = await DatabaseHelper.executeQuery(connectionDB, query, params);
    return inserted.insertId;
  }

  async insertCreditNoteItems(connectionDB, data) {
    const insertItemsQuery = `INSERT INTO sys_nc_items(
      id_nc,
      item_id,
      itemcode,
      description,
      qty,
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
      codigo_cabys
    )`;
    const queryValues = [];
    for (const item of data) {
      const queryValue = `
      (
        ${item.id_nc_encabezado},
        '${item.id_producto}',
        '${item.itemcode}',
        '${item.descripcion}',
        '${item.cantidad}',
        '${item.precio_unitario}',
        '${item.montoTotal}',
        '${item.monto_descuento}',
        '${item.subtotal}',
        '${item.iva}',
        '${item.totalImpuesto}',
        '${item.totalImpuesto}',
        0,
        0,
        '${item.montoTotalLinea}',
        '${item.codigo_cabys}'
        
      )`;
      queryValues.push(queryValue);
    }

    const fullQuery = `${insertItemsQuery} VALUES ${queryValues.join(",")} `;
    await DatabaseHelper.executeQuery(connectionDB, fullQuery, []);
    return data.insertId;
  }

  async insertOrderReprinted(connectionDB, data) {
    const query = `
      INSERT INTO reimpresion_facturas(
      id_factura,
      id_agente,
      fecha,
      latitud,
      longitud,
      sincronizar,
      consecutivo_offline_factura)
    VALUES(?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.id_proforma,
      data.id_agente,
      data.fecha,
      data.latitud,
      data.longitud,
      0,
      data.consecutivo_offline
    ]
    const result = await DatabaseHelper.executeQuery(connectionDB, query, params);
    return result.insertId;
  }

  async insertPayment(connectionDB, data) {
    const queryPaymentMethod = "SELECT * FROM tb_metodos_pago WHERE id_metodo =  ?";

    const paymentMethod = (await DatabaseHelper.executeQuery(connectionDB, queryPaymentMethod, [data.metodo_pago_id]))[0];

    const reciboController = new RecibopagoController();
    const invoice = await (new OrderController()).getOrderByConsecutivoOffline(connectionDB, data.consecutivo_offline_factura);
    data.orderId = invoice.id;
    data.clientId = invoice.userid;

    let insertedId;
    if (paymentMethod.tabla_registro == "tb_cajaschica_mov") {
      insertedId = await reciboController.insertCajaChica(connectionDB, data)
    }
    else {
      insertedId = await reciboController.insertInstruccion(connectionDB, data);
    }

    if (insertedId) {
      const queryUpdateInvoice = `UPDATE sys_invoices SET credit = credit + ? WHERE id =?; `
      const updated = await DatabaseHelper.executeQuery(connectionDB, queryUpdateInvoice, [data.total, data.orderId]);
      return insertedId;
    } else {
      return null;
    }
  }
}

module.exports = UploadController