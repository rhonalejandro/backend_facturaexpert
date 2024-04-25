const DatabaseHelper = require('../helpers/databaseHelper');


class MetodoPagoController {
  constructor(req) {
    this.req = req;
  }

  async listaMetodos() {
    const { connectionDB } = this.req;
    if (!connectionDB) {
      console.error('La conexión a la base de datos no se ha establecido correctamente.');
      return;
    }

    const query = 'SELECT id_metodo as metodo_pago_id, metodo_pago as metodo FROM tb_metodos_pago';
    const data = await DatabaseHelper.executeQuery(connectionDB, query, []);
    return data;
  }
}

module.exports = MetodoPagoController;