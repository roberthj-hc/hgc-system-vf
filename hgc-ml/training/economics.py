"""Operational cost benchmarking and observational price scenarios."""

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error

from training.common import track, report, kpi, records


def cost_features(frame):
    return pd.DataFrame(
        {
            "branch": frame.id_sucursal.astype(str),
            "log_orders": np.log1p(frame.n_pedidos.astype(float)),
            "month": pd.to_datetime(frame.mes_fecha).dt.month,
        }
    )


def train_economics(monthly, products, sales, load_id):
    monthly = monthly.copy()
    monthly.mes_fecha = pd.to_datetime(monthly.mes_fecha)
    for c in (
        "ingresos_netos",
        "costo_op_total",
        "costo_fijo",
        "costo_variable",
        "costo_productos_estimado",
        "n_pedidos",
    ):
        monthly[c] = pd.to_numeric(monthly[c])
    # Omit the final incomplete month relative to sales cutoff.
    cutoff = pd.Timestamp(sales["model"]["cutoff"])
    last_complete = (cutoff + pd.Timedelta(days=1)).to_period("M").start_time
    monthly = (
        monthly[monthly.mes_fecha < last_complete]
        .sort_values(["mes_fecha", "id_sucursal"])
        .reset_index(drop=True)
    )
    missing_costs = int(monthly.costo_op_total.isna().sum())
    monthly = monthly.dropna(subset=["costo_op_total"]).reset_index(drop=True)
    dates = sorted(monthly.mes_fecha.unique())
    if len(dates) < 12:
        raise ValueError("Cost model needs at least twelve complete months")
    boundary = pd.Timestamp(dates[-3])
    train_mask = monthly.mes_fecha < boundary
    X = cost_features(monthly)
    y = np.log1p(monthly.costo_op_total)
    model = make_pipeline(
        ColumnTransformer(
            [
                (
                    "category",
                    OneHotEncoder(handle_unknown="ignore"),
                    ["branch", "month"],
                ),
                ("scale", StandardScaler(), ["log_orders"]),
            ]
        ),
        Ridge(alpha=10),
    )
    model.fit(X[train_mask], y[train_mask])
    prediction = np.maximum(0, np.expm1(model.predict(X[~train_mask])))
    mae = mean_absolute_error(monthly.loc[~train_mask, "costo_op_total"], prediction)
    # Residual scale is measured out of time, not on the fitted latest rows.
    tolerance = float(
        np.quantile(
            np.abs(monthly.loc[~train_mask, "costo_op_total"] - prediction), 0.90
        )
    )
    model.fit(X, y)
    run_id = track(
        "efficiency",
        model,
        X.head(5),
        model.predict(X.head(5)),
        {"mae_cost_bob": mae},
        {
            "target": "log1p_operating_cost",
            "validation_months": 3,
            "cutoff": str(monthly.mes_fecha.max().date()),
        },
        load_id,
    )
    monthly["costo_esperado"] = np.maximum(0, np.expm1(model.predict(X)))
    monthly["desviacion_costo"] = monthly.costo_op_total - monthly.costo_esperado
    monthly["costo_total_estimado"] = (
        monthly.costo_op_total + monthly.costo_productos_estimado
    )
    monthly["utilidad"] = monthly.ingresos_netos - monthly.costo_total_estimado
    monthly["margen"] = np.where(
        monthly.ingresos_netos > 0, monthly.utilidad / monthly.ingresos_netos, 0
    )
    monthly["estado"] = np.where(
        monthly.desviacion_costo > tolerance, "Revisar costo", "Dentro de referencia"
    )
    latest = monthly[monthly.mes_fecha == monthly.mes_fecha.max()].copy()
    info = {
        "run_id": run_id,
        "algorithm": "Ridge · costo logarítmico",
        "cutoff": str(monthly.mes_fecha.max().date()),
        "metrics": {"mae_cost_bob": mae},
        "validation": "Últimos tres meses completos",
        "limitations": f"{missing_costs} meses-sucursal sin costos excluidos; nunca imputados como cero. Referencia estadística de costo operativo; no demuestra desperdicio ni ahorro realizable. Rentabilidad incluye alquiler, electricidad y costo estándar de productos (estimación, no costo contable histórico). No incluye nómina u otros gastos ausentes en bronze.",
    }
    efficiency = report(
        "Monitor de eficiencia",
        "Costo observado frente a referencia ajustada por volumen y sucursal.",
        records(latest),
        [
            kpi("Costo operativo", latest.costo_op_total.sum(), "money"),
            kpi("Sucursales a revisar", (latest.estado == "Revisar costo").sum()),
            kpi("Error de referencia", mae, "money"),
        ],
        info,
    )
    profit = report(
        "Detección de rentabilidad",
        "Ingresos menos gastos registrados y costo estándar estimado de productos; meses con cobertura.",
        records(monthly.tail(12 * latest.shape[0])),
        [
            kpi("Utilidad · último mes", latest.utilidad.sum(), "money"),
            kpi(
                "Margen ponderado",
                latest.utilidad.sum() / max(latest.ingresos_netos.sum(), 1),
                "percent",
            ),
            kpi("Sucursales con pérdida", (latest.utilidad < 0).sum()),
        ],
        info,
        cutoff=str(monthly.mes_fecha.max().date()),
        limitations=info["limitations"],
    )
    analogs = []
    for branch, group in monthly.groupby("id_sucursal"):
        group = group.tail(12)
        entry = group.iloc[-1]
        forecast = pd.DataFrame(
            [r for r in sales["forecast"] if r["id_sucursal"] == branch]
        )
        analogs.append(
            {
                "id_sucursal": int(branch),
                "sucursal": entry.sucursal,
                "ciudad": entry.ciudad,
                "ingreso_mensual": float(forecast.head(28).ingresos.sum() * 30 / 28),
                "costo_fijo": float(group.costo_fijo.mean()),
                "ratio_variable": float(
                    (group.costo_variable.sum() + group.costo_productos_estimado.sum())
                    / max(group.ingresos_netos.sum(), 1)
                ),
                "margen_historico": float(
                    group.utilidad.sum() / max(group.ingresos_netos.sum(), 1)
                ),
                "corte_costos": str(entry.mes_fecha.date()),
            }
        )
    expansion = report(
        "Apertura de sucursales",
        "Simulación por sucursal comparable; ajusta demanda, costos e inversión.",
        analogs,
        [
            kpi("Sucursales comparables", len(analogs)),
            kpi("Horizonte del modelo", 84, "days"),
        ],
        sales["model"],
        limitations=f"Escenario por analogía, no predicción geográfica. Costos disponibles hasta {monthly.mes_fecha.max().date()}; actualizar presupuestos antes de decidir. Alquiler y electricidad se tratan como base fija; productos como costo variable estándar. No incluye nómina, canibalización, competencia ni costos no registrados.",
    )
    price = train_prices(products, load_id)
    return {
        "profit": profit,
        "efficiency": efficiency,
        "expansion": expansion,
        "margin": price,
    }


def train_prices(products, load_id):
    products = products.copy()
    products.semana = pd.to_datetime(products.semana)
    for c in ["precio_prom", "unidades", "costo_estandar"]:
        products[c] = pd.to_numeric(products[c])
    products = products[
        (products.precio_prom > 0)
        & (products.unidades > 0)
        & products.costo_estandar.notna()
    ]
    products["group"] = (
        products.id_sucursal.astype(str) + "_" + products.id_producto.astype(str)
    )
    products["log_price"] = np.log(products.precio_prom)
    products["month"] = products.semana.dt.month
    X = products[["group", "log_price", "month"]]
    y = np.log(products.unidades)
    boundary = products.semana.max() - pd.Timedelta(weeks=12)
    mask = products.semana < boundary
    model = make_pipeline(
        ColumnTransformer(
            [
                (
                    "category",
                    OneHotEncoder(handle_unknown="ignore"),
                    ["group", "month"],
                ),
                ("price", "passthrough", ["log_price"]),
            ]
        ),
        Ridge(alpha=10),
    )
    model.fit(X[mask], y[mask])
    mae = mean_absolute_error(
        products.loc[~mask, "unidades"], np.exp(model.predict(X[~mask]))
    )
    model.fit(X, y)
    elasticity = float(model[-1].coef_[-1])
    run_id = track(
        "margin",
        model,
        X.head(5),
        model.predict(X.head(5)),
        {"mae_units": mae, "elasticity": elasticity},
        {
            "target": "log_quantity",
            "controls": "product_branch,month",
            "validation_weeks": 12,
        },
        load_id,
    )
    rows = []
    for _, group in products.groupby("group"):
        group = group.sort_values("semana")
        last = group.iloc[-1]
        recent = group.tail(12)
        base_price = float(recent.ingresos.astype(float).sum() / recent.unidades.sum())
        quantity = float(recent.unidades.mean())
        cost = float(last.costo_estandar)
        supported = (
            len(group) >= 26
            and group.precio_prom.std() / group.precio_prom.mean() >= 0.02
            and -5 < elasticity < -0.05
        )
        # Recommendations stay inside observed support AND a +/-10% business guardrail.
        low = max(float(group.precio_prom.quantile(0.05)), base_price * 0.9, cost)
        high = min(float(group.precio_prom.quantile(0.95)), base_price * 1.1)
        supported = supported and high > low
        grid = np.linspace(low, high, 41) if supported else np.array([base_price])
        units = quantity * (grid / base_price) ** elasticity
        margins = (grid - cost) * units
        best = int(np.argmax(margins))
        rows.append(
            {
                "id_sucursal": int(last.id_sucursal),
                "sucursal": last.sucursal,
                "id_producto": int(last.id_producto),
                "producto": last.producto,
                "precio_actual": base_price,
                "costo_unitario": cost,
                "unidades_semana": quantity,
                "precio_sugerido": float(grid[best]),
                "margen_actual": (base_price - cost) * quantity,
                "margen_simulado": float(margins[best]),
                "elasticidad": elasticity,
                "estado": "Escenario evaluable"
                if supported
                else "Sin soporte para cambiar precio",
            }
        )
    return report(
        "Optimizador de margen",
        "Escenarios de contribución semanal dentro del rango de precios observado.",
        rows,
        [
            kpi("Productos por sucursal", len(rows)),
            kpi(
                "Escenarios evaluables",
                sum(r["estado"] == "Escenario evaluable" for r in rows),
            ),
            kpi("Elasticidad observada", elasticity),
        ],
        {
            "run_id": run_id,
            "algorithm": "Ridge log-log con efectos de producto y sucursal",
            "metrics": {"mae_units": mae},
            "cutoff": str(products.semana.max().date()),
            "validation": "Últimas doce semanas",
            "limitations": "Asociación observacional, no efecto causal del precio. Costo estándar actual; validar con prueba comercial antes de aplicar.",
        },
    )
