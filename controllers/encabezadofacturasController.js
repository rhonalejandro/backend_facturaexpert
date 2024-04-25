class EncabezadofacturasController {
    constructor(req) {
        this.req = req;
}

    getencabezadofacturas() {
        const { connectionDB } = this.req;
        const limite = this.req.body['limit']??10;
        if (!connectionDB) {
            console.error('La conexión a la base de datos no se ha establecido correctamente.');
            return;
        }
        return new Promise((resolve, reject) => {
            const sql = `SELECT 
                            si.consecutivo,
                            si.TotalDescuentos AS descuento_total,
                            si.paymentmethod AS pagado,
                            si.userid AS idcliente,
                            si.TotalComprobante AS total_comprobante,
                            0 AS lentrada,
                            si.vendedor AS id_agente,
                            IF( INULL(si.paymentmethod, 0) > 0, 2,1) AS tip_venta,
                            0 AS lentrada_loaded,
                            "" AS fabricante,
                            si.date AS fecha,
                            si.paymentmethod AS dias_plazo,
                            0 AS lventa,
                            si.id AS consecutivo_offline,
                            SUM(i.qty) AS cantidad,
                            0 AS lsended,
                            "" AS latitud,
                            si.fecha_anulada AS fecha_anulacion,
                            si.TotalVentaNeta AS monto_total,
                            0 AS loaded,
                            "" AS longitud,
                            si.anulada_por,
                            si.cn AS id_proforma,
                            si.subtotal AS subtotal,
                            si.nota_credito AS monto_nota_credito,
                            si.TotalImpuesto AS impuesto,
                            si.status AS estado
                            
                        FROM sys_invoices si 
                        LEFT JOIN sys_invoiceitems i ON i.invoiceid = si.id
                        GROUP BY si.id
                        ORDER BY si.id DESC
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
}

module.exports = EncabezadofacturasController;