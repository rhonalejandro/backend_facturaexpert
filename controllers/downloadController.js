const DatabaseHelper = require('../helpers/databaseHelper');

class DownloadController {
  constructor(req) {
    this.req = req;
  }

  async downloadOrdenes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = `
      SELECT 
        sys_invoices.id AS id_proforma,
        sys_invoices.consecutivo,
        IFNULL(sys_invoices.userid, 1) AS idcliente,
        sys_invoices.vendedor AS id_agente,
        sys_invoices.date AS fecha,
        SUM(IFNULL(sys_invoiceitems.qty, 0)) AS cantidad,
        IF(sys_invoices.status = 'Anulada', -1, 1) AS estado,
        sys_invoices.TotalVentaNeta AS monto_total,
        sys_invoices.subtotal,
        sys_invoices.TotalImpuesto AS impuesto,
        sys_invoices.TotalDescuentos AS descuento_total,
        sys_invoices.TotalComprobante AS total_comprobante,
        IF(IFNULL(sys_invoices.paymentmethod, 0) > 0, 2, 1) AS tip_venta,
        sys_invoices.paymentmethod AS dias_plazo,
        sys_invoices.credit AS pagado,
        sys_invoices.latitud,
        sys_invoices.longitud,
        sys_invoices.modelo,
        sys_invoices.dispositivo,
        sys_invoices.fabricante,
        sys_invoices.anulada_por as anulado_por,
        sys_invoices.fecha_anulada as fecha_anulacion,
        SUM(IFNULL(sys_nc_items.MontoTotalLinea, 0)) AS monto_nota_credito,
        sys_invoices.consecutivo_offline,
        status_invoices
      FROM sys_invoices
      LEFT JOIN sys_invoiceitems ON sys_invoiceitems.invoiceid = sys_invoices.id
      LEFT JOIN sys_nc ON sys_nc.id_invoice = sys_invoices.id
      LEFT JOIN sys_nc_items ON sys_nc_items.id_nc = sys_nc.id_nc
      GROUP BY sys_invoices.id
      ORDER BY sys_invoices.id DESC
      LIMIT 1000;
    `;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadAgentes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = `
      SELECT 
        id AS id_agente,
        CONCAT(IFNULL(first_name, ''), IFNULL(last_name, '')) AS nombre,
        password,
        active AS activo,
        0 AS agente_admin,
        IFNULL(JSON_VALUE(permissions,'$.ver_ventas'),0) AS ver_ventas,
        IFNULL(JSON_VALUE(permissions,'$.ver_compras'),0) AS ver_compras,
        IFNULL(JSON_VALUE(permissions,'$.admin'),0) AS admin,
        IFNULL(JSON_VALUE(permissions,'$.anular_facturas'),0) AS anular_facturas,
        IFNULL(JSON_VALUE(permissions,'$.ver_online'),0) AS ver_online
      FROM tb_users;
    `;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadItemsOrdenes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = `
      SELECT 
        id AS id_item,
        invoiceid AS id_proforma,
        item_id AS id_producto,
        PrecioUnitario AS precio,
        description AS descripcion,
        qty AS cantidad,
        item_tax_code AS impuesto_codigo,
        Imp_Monto AS impuesto,
        MontoDescuento AS descuento,
        '' AS tasa_descuento,
        Imp_Tarifa AS iva,
        0 AS sincronizar,
        consecutivo_offline_factura,
        MontoTotalLinea as monto_total
      FROM
      sys_invoiceitems
      WHERE invoiceid IN
        (SELECT facturas.* FROM 
          (SELECT id FROM sys_invoices ORDER BY id DESC LIMIT 1000) AS facturas
      )
    `;
    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadClientes() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const query = `
      SELECT 
        id_proveedor as idcliente,
        nombre_proveedor as nombre,
        nombre_proveedor as comercial,
        id_number_proveedor as cedula,
        IFNULL(pre_id_number, '') as tipo_cedula,
        telefonos_proveedor as telefono,
        email_proveedor as email,
        direccion_proveedor as direccion,
        codigo_provincia as provincia,
        codigo_canton as canton,
        tipo_cliente as lproveedor,
        0 as sincronizar,
        consecutivo_offline,
        creado_por
      FROM 
      proveedores
    `;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadProducts() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = `
      SELECT 
        tb_products.id AS id_producto,
        tb_products.code AS codigo,
        tb_products.name AS nombre,
        tb_products.codigo_cabys AS codigo_cabys,
        tb_products.id_tax AS codigo_iva,
        tb_products.tax_rate AS iva,
        ROUND(MAX(tb_product_prices.price), 2) AS precio_maximo,
        ROUND(MIN(tb_product_prices.price), 2) AS precio_minimo
      FROM tb_products
      LEFT JOIN tb_product_prices on tb_product_prices.product_id = tb_products.id
      GROUP BY tb_products.id;
    `;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadProvinces() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const query = `SELECT * FROM provincia_cr;`;
    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadCanton() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const query = `SELECT * FROM canton_cr;`;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadRecibosPago() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const queryInstrucciones = `
      SELECT 
        null AS id,
        i.n_factura AS id_proforma,
        id_metodo_pago as metodo_pago_id,
        i.fecha_elaboracion_instruccion AS fecha_registro,
        i.monto_instruccion AS monto,
        i.entry_by AS user_reg_pago,
        i.consecutivo_offline
      FROM
        instrucciones i
        LEFT JOIN tb_users u ON u.id = i.entry_by
        LEFT JOIN proveedores p ON p.id_proveedor = i.id_proveedor
        LEFT JOIN tb_metodos_pago tb_metodos_pago ON tb_metodos_pago.id_metodo = i.id_metodo_pago
        WHERE i.n_factura IN
          (SELECT facturas.* FROM 
            (SELECT id FROM sys_invoices ORDER BY id DESC LIMIT 1000) AS facturas
      )`;

    const queryCajasChica = ` 
      SELECT 
        null AS id,
        ccm.id_factura AS id_proforma,
        id_metodo_pago as metodo_pago_id,
        ccm.fecha_mov AS fecha_registro,
        ccm.monto_mov AS monto,
        ccm.entry_by AS user_reg_pago,
        ccm.consecutivo_offline
      FROM
        tb_cajaschica_mov ccm
        LEFT JOIN tb_users u ON u.id = ccm.entry_by
      LEFT JOIN proveedores p ON p.id_proveedor = ccm.id_proveedor
      LEFT JOIN tb_metodos_pago tb_metodos_pago ON tb_metodos_pago.id_metodo = ccm.id_metodo_pago
          WHERE ccm.id_factura IN
            (SELECT facturas.* FROM 
              (SELECT id FROM sys_invoices ORDER BY id DESC LIMIT 1000) AS facturas
          );`;

    const query = `${queryInstrucciones}
                UNION
                ${queryCajasChica};`;

    const data = await DatabaseHelper.executeQuery(connectionDB, query, [])
    return data;
  }

  async downloadEncabezadoNc() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const query = `
      SELECT
        id_nc AS id,
        id_invoice AS id_proforma,
        date AS fecha,
        TotalComprobante AS total_comprobante,
        entry_by AS creado_por,
        consecutivo_offline
      FROM sys_nc
      ORDER BY id DESC
      LIMIT 1000;
    `;
    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadDetalleNc() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const query = `
      SELECT 
        id,
        id_nc AS id_nc_encabezado,
        item_id AS id_producto,
        qty AS cantidad,
        0 AS sincronizar,
        consecutivo_offline_nc
      FROM
      sys_nc_items
      WHERE id_nc IN
        (SELECT nc.* FROM 
          (SELECT id_nc FROM sys_nc ORDER BY id DESC LIMIT 1000) AS nc
      )
    `;
    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadReimpresionesFacturas() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const query = `
      SELECT
        reimpresion_facturas.id,
        reimpresion_facturas.id_factura AS id_proforma,
        reimpresion_facturas.consecutivo_offline_factura as consecutivo_offline,
        reimpresion_facturas.id_agente,
        reimpresion_facturas.fecha,
        reimpresion_facturas.latitud,
        reimpresion_facturas.longitud,
        0 as sincronizar
      FROM
      reimpresion_facturas
      WHERE id_factura IN
        (SELECT facturas.* FROM 
          (SELECT id FROM sys_invoices ORDER BY id DESC LIMIT 1000) AS facturas
      )
    `;
    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

  async downloadMetodosPago() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const query = `SELECT id_metodo as metodo_pago_id, metodo_pago as metodo FROM tb_metodos_pago;`;
    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }

}


module.exports = DownloadController