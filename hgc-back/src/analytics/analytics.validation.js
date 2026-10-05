function numberInRange(value, name, min, max, fallback) {
  if (value === undefined) {
    if (fallback === undefined)
      throw Object.assign(new Error(`${name} es requerido`), { status: 400 });
    return fallback;
  }
  if (value === "" || typeof value === "boolean")
    throw Object.assign(new Error(`${name} inválido`), { status: 400 });
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw Object.assign(new Error(`${name} debe estar entre ${min} y ${max}`), {
      status: 400,
    });
  }
  return number;
}
function queryOptions(query) {
  const page = numberInRange(query.page, "Página", 1, 100000, 1);
  const pageSize = numberInRange(
    query.page_size,
    "Tamaño de página",
    1,
    200,
    25,
  );
  if (!Number.isInteger(page) || !Number.isInteger(pageSize))
    throw Object.assign(new Error("Paginación inválida"), { status: 400 });
  const branch =
    query.branch === undefined || query.branch === "all"
      ? null
      : numberInRange(query.branch, "Sucursal", 1, 100000, null);
  if (branch !== null && !Number.isInteger(branch))
    throw Object.assign(new Error("Sucursal inválida"), { status: 400 });
  return {
    page,
    pageSize,
    branch,
    search: String(query.search || "")
      .trim()
      .slice(0, 80),
  };
}
module.exports = { numberInRange, queryOptions };
