const express = require("express");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeModule } = require("./analytics.permissions");
const { queryOptions } = require("./analytics.validation");
const service = require("./analytics.service");
const router = express.Router();
router.use(verifyToken);
router.get("/overview", async (req, res, next) => {
  try {
    res.json(await service.overview(req.user.cargo));
  } catch (error) {
    next(error);
  }
});
router.get("/:module", authorizeModule, async (req, res, next) => {
  try {
    const options = queryOptions(req.query);
    res.set("Cache-Control", "private, no-store");
    const module = req.params.module;
    const data = await service.getReport(module);
    res.json(
      ["clv", "churn"].includes(module)
        ? await service.customerView(data, module, options)
        : service.viewReport(data, module, options),
    );
  } catch (error) {
    next(error);
  }
});
router.post("/:module/infer", authorizeModule, async (req, res, next) => {
  try {
    const upstream = await fetch(
      `${process.env.ML_API_URL || "http://127.0.0.1:8000"}/v1/infer/${req.params.module}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(30000),
      },
    );
    const payload = await upstream.json();
    if (!upstream.ok)
      return res
        .status(upstream.status)
        .json({
          error:
            typeof payload.detail === "string"
              ? payload.detail
              : "Parámetros de inferencia inválidos",
        });
    res.set("Cache-Control", "private, no-store").json(payload);
  } catch (error) {
    error.status = 503;
    error.message =
      "El servicio de modelos no está disponible. Reintenta cuando termine su arranque.";
    next(error);
  }
});
router.post("/:module/scenario", authorizeModule, async (req, res, next) => {
  if (!["expansion", "margin"].includes(req.params.module))
    return res.status(404).json({ error: "Escenario no disponible" });
  try {
    res.json(
      await (req.params.module === "margin"
        ? service.marginScenario(req.body)
        : service.expansionScenario(req.body)),
    );
  } catch (error) {
    next(error);
  }
});
router.use((error, req, res, next) => {
  const unavailable = ["42P01", "3F000", "ECONNREFUSED"].includes(error.code);
  const status = error.status || (unavailable ? 503 : 500);
  if (status >= 500)
    console.error("Analytics request failed:", error.code || error.name);
  res
    .status(status)
    .json({
      error:
        status === 500
          ? "No se pudo consultar la publicación analítica."
          : unavailable
            ? "Datos analíticos no disponibles. Ejecuta el pipeline de actualización."
            : error.message,
    });
});
module.exports = router;
