const fs = require("fs");
const path = require("path");

// ruta hacia tu dbt export
const FILE_PATH = path.join(
  __dirname,
  "../../../hgc-dbt/data_exports/feat_ts_desc__g_regional.json"
);

let cachedData = null;

function loadData() {
  if (!cachedData) {
    console.log("📦 Cargando dataset en memoria...");
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    cachedData = JSON.parse(raw);
  }

  return cachedData;
}

module.exports = {
  loadData,
};