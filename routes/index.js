
const fs = require('fs');

const path = require('path');

const loadRoutes = (app) => {
      const versions = fs.readdirSync(__dirname).filter(version => fs.statSync(path.join(__dirname, version)).isDirectory());

      versions.forEach((version) => {
            const routePath = path.join(__dirname, version);
            const files = fs.readdirSync(routePath);

            if (files.length === 0) {
                  console.log(`No hay endpoints en la versión ${version}`);
                  return;
            }

            files.forEach((file) => {
                  const [routeName, ext] = file.split('.');
                  if (ext === 'js') {
                        const route = require(path.join(routePath, file));
                        app.use(`/api/${version}/${routeName}`, route);
                        console.log(`Endpoint /api/${version}/${routeName} cargado`);
                  }
            });
      });
};

module.exports = loadRoutes;