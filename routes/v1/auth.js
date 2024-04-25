const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const dbConnection = require('../../config/database');
const {getConnection} = require('../../helpers/databaseHelper');
const comparePassword = require('../../helpers/bcryptLoginHelper');
require('dotenv').config();


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Inicia sesión con las credenciales proporcionadas.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Codigo de acceso al sistema de Factura expert.
 *               username:
 *                 type: string
 *                 description: Nombre de usuario o correo electrónico del usuario.
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *     responses:
 *       200:
 *         description: Token de acceso JWT generado.
 *       401:
 *         description: Credenciales incorrectas o usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/login', async (req, res) => {
      try {
            const { username, password, code } = req.body;
            const sql = 'SELECT * FROM `tb_systems` WHERE `codigo_acceso` =  ?';
            dbConnection.query(sql, [code], async (err, results) => {
                  if (err) {
                        console.error('Error interno del servidor:', err);
                        res.status(500).send({ ok: false, message: 'Error interno del servidor' });
                  } else if (results.length > 0) {
                        if (results[0].status_system !== "Pagado" && results[0].status_system !== "Evaluacion") {
                              res.status(500).send({ ok: false, message: `Error el estado actual de su sistema es: ${results[0].status_system}` });
                        }

                        connectionDB = getConnection(results[0].host_db, results[0].user_db, results[0].password_db, results[0].name_db, results[0].prefix_name_db);
                        connectionDB.query('SELECT * FROM `tb_users` WHERE `username` =  ? or `email` = ?', [username, username], async (err, results) => {
                              const match = await comparePassword(password, results[0].password);

                              if (match) {
                                    const { ver_compras, ver_ventas, ver_online } = results[0].permissions ?? { ver_compras: 0, ver_ventas: 0, ver_online: 0 };
                                    const user = {
                                          id_agente: results[0].id,
                                          nombre: `${results[0].first_name} ${results[0].last_name?? ""}`,
                                          email: results[0].email,
                                          admin: [1,2].includes(results[0].group_id) ? 1 : 0,
                                          ver_compras: ver_compras,
                                          ver_ventas: ver_ventas,
                                          ver_online: ver_online,
                                    };

                                    const config = 'SELECT * from config';
                                    connectionDB.query(config, [], (cnfErr,  configResults) => {
                                          if (cnfErr) {
                                                console.error('Error al obtener la configuracion del sistema:', cnfErr);
                                                res.status(500).send('Error interno del servidor');
                                          } else {
                                                const tokenPayload = { username, code };
                                                const token = jwt.sign(tokenPayload, process.env.SECRET_KEY_JWT, { expiresIn: '48h' });
                                                res.json({
                                                      user,
                                                      auth: {
                                                            "access_token": token,
                                                            "token_type": "Bearer"
                                                      }
                                                });
                                          }
                                    });
                              } else {
                                    res.status(401).send({ ok: false, message: 'Contraseña incorrecta' });
                              }
                        });

                  } else {
                        res.status(401).send({ ok: false, message: 'Error el sistema al que intenta ingresar no existe' });
                  }
            });
      } catch (error) {
            console.error('Error en el login:', error);
            res.status(500).send('Error interno del servidor');
      }
});


module.exports = router;