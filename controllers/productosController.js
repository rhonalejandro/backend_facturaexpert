const { executeQuery } = require('../helpers/databaseHelper');
class ProductosController {
  constructor(req) {
    this.req = req;
  }

  listaProductos() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }
    const page = this.req.query.page;
    const size = this.req.query.size;

    const like = `%${this.req.query.like}%`;
    const query = `SELECT 
                  p.id AS id_producto, 
                  p.code AS codigo, 
                  p.name AS nombre,
                  i.codigo_tarifa * 1 AS codigo_iva,
                  p.tax_rate AS iva, 
                  ROUND(pp.price, 2) AS precio_minimo,
                  ROUND(pp.price, 2) AS precio_maximo,
                  0 AS descuento,
                  p.id AS idcodigo, 
                  0 AS item_descuento
                FROM tb_products p JOIN tb_impuestos i ON i.id_impuesto = p.id_tax
                JOIN tb_product_prices pp ON pp.product_id = p.id
                WHERE p.name LIKE ?
                LIMIT ${size}`;
    const data = executeQuery(connectionDB, query, [like]);
    return data;
  }
}

module.exports = ProductosController;