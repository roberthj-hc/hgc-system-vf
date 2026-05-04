const { loadData } = require("./dataLoader");

// obtener todo el dataset
function getTimeSeries() {
  return loadData();
}

// ejemplo: filtro por sucursal
function getBySucursal(sucursal) {
  const data = loadData();

  return data.filter((row) => row.sucursal === sucursal);
}

module.exports = {
  getTimeSeries,
  getBySucursal,
};