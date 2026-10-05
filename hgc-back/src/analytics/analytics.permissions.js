const OPERATIONS = [
  "CEO",
  "COO",
  "GERENTE_REGIONAL",
  "JEFE_LOGISTICA",
  "ADMIN_TIENDA",
];
const CUSTOMERS = [
  "CEO",
  "COO",
  "CMO",
  "GERENTE_REGIONAL",
  "GERENTE_MARKETING",
];
const MODULE_ROLES = {
  sales: OPERATIONS,
  profit: OPERATIONS,
  expansion: OPERATIONS,
  clv: CUSTOMERS,
  churn: CUSTOMERS,
  margin: ["CEO", "CFO"],
  efficiency: ["CEO", "CFO"],
};
function authorizeModule(req, res, next) {
  const roles = MODULE_ROLES[req.params.module];
  if (!roles) return res.status(404).json({ error: "Módulo desconocido" });
  if (!roles.includes(req.user.cargo))
    return res.status(403).json({ error: "Sin acceso a este módulo" });
  next();
}
module.exports = { MODULE_ROLES, authorizeModule };
