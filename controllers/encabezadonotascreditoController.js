class EncabezadonotascreditoController {
    constructor(req) {
        this.req = req;
}

    getencabezadonotascredito() {
        const { connectionDB } = this.req;
        const limite = this.req.body['limit']??10;
        if (!connectionDB) {
            console.error('La conexión a la base de datos no se ha establecido correctamente.');
            return;
        }
        return new Promise((resolve, reject) => {
            const sql = `SELECT 
                            nc.id_invoice AS id_proforma,
                            0 AS procesado,
                            nc.TotalComprobante AS total_comprobante,
                            0 AS idestado,
                            nc.id_nc AS consecutivo_offline,
                            nc.date AS fecha,
                            0 AS idload,
                            nc.entry_by AS creado_por
                            
                        FROM sys_nc nc
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

module.exports = EncabezadonotascreditoController;