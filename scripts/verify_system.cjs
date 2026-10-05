const assert = require("node:assert/strict");
const jwt = require("../hgc-back/node_modules/jsonwebtoken");
const app = require("../hgc-back/src/app");
const { jwtSecret } = require("../hgc-back/src/config/env");
const { pool } = require("../hgc-back/src/config/postgres");

async function main() {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/analytics`;
  const token = jwt.sign({ id: 0, cargo: "CEO" }, jwtSecret, {
    expiresIn: "5m",
  });
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  try {
    assert.equal((await fetch(`${base}/clv`)).status, 401);
    const forbidden = jwt.sign({ id: 0, cargo: "STAFF" }, jwtSecret, {
      expiresIn: "5m",
    });
    assert.equal(
      (
        await fetch(`${base}/clv`, {
          headers: { Authorization: `Bearer ${forbidden}` },
        })
      ).status,
      403,
    );
    const reports = {};
    for (const name of [
      "sales",
      "clv",
      "churn",
      "profit",
      "efficiency",
      "expansion",
      "margin",
    ]) {
      const response = await fetch(`${base}/${name}`, { headers });
      assert.equal(response.status, 200, name);
      const data = await response.json();
      assert.ok(data.rows.length > 0, name);
      assert.ok(data.pagination.total > 0, name);
      assert.ok(data.release_id, name);
      reports[name] = data;
      console.log(
        `${name}: ${data.pagination.total} rows, ${data.rows.length} returned`,
      );
    }
    assert.equal(
      new Set(Object.values(reports).map((r) => r.release_id)).size,
      1,
    );
    assert.ok(
      reports.clv.kpis[0].value > 0,
      "CLV expected spend must be positive on this dataset",
    );
    const first = reports.sales.branches[0].id_sucursal;
    const filtered = await (
      await fetch(`${base}/sales?branch=${first}`, { headers })
    ).json();
    assert.ok(filtered.rows.every((r) => r.id_sucursal === first));
    assert.equal(
      (await fetch(`${base}/sales?page=0`, { headers })).status,
      400,
    );
    assert.equal(
      (
        await fetch(`${base}/expansion/scenario`, {
          method: "POST",
          headers,
          body: "{}",
        })
      ).status,
      400,
    );
    const scenario = await (
      await fetch(`${base}/expansion/scenario`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id_sucursal: first,
          demand_factor: 1.1,
          fixed_factor: 1,
          investment: 100000,
        }),
      })
    ).json();
    assert.ok(Number.isFinite(scenario.profit));
    const item = reports.margin.rows[0];
    const margin = await (
      await fetch(`${base}/margin/scenario`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id_sucursal: item.id_sucursal,
          id_producto: item.id_producto,
          price_change: 0.05,
          elasticity: -1,
        }),
      })
    ).json();
    assert.ok(Number.isFinite(margin.contribution));
    for (const name of Object.keys(reports)) {
      const row = reports[name].rows[0];
      const body = ["clv", "churn"].includes(name)
        ? { id_cliente: row.id_cliente }
        : { id_sucursal: row.id_sucursal, id_producto: row.id_producto };
      const response = await fetch(`${base}/${name}/infer`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const result = await response.json();
      assert.equal(response.status, 200, `${name}: ${JSON.stringify(result)}`);
      assert.ok(Number.isFinite(result.value), name);
      assert.equal(result.release_id, reports[name].release_id);
      assert.ok(result.run_id, name);
      console.log(`${name}: real inference OK`);
    }
    const inferSales = async (weeks) =>
      await (
        await fetch(`${base}/sales/infer`, {
          method: "POST",
          headers,
          body: JSON.stringify({ id_sucursal: first, weeks }),
        })
      ).json();
    const short = await inferSales(1),
      long = await inferSales(4);
    assert.equal(short.rows.length, 7);
    assert.equal(long.rows.length, 28);
    assert.ok(
      long.value > short.value,
      "Horizon must change the actual forecast",
    );
    assert.equal(
      (
        await fetch(`${base}/sales/infer`, {
          method: "POST",
          headers,
          body: JSON.stringify({ id_sucursal: first, weeks: 99 }),
        })
      ).status,
      422,
    );
    console.log(
      "PASS: 7 modules, release consistency, RBAC, filters, scenarios and input validation",
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
