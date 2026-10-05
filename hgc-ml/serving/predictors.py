"""Dynamic inference; never retrains and never queries Snowflake."""

import numpy as np
import pandas as pd
from training.sales import features as sales_features
from training.economics import cost_features
from training.customers import FEATURES
from training.common import records
from serving.registry import report, model, customer


def branch(report_data, branch_id):
    options = report_data.get("branches", report_data["rows"])
    found = next((r for r in options if r["id_sucursal"] == branch_id), None)
    if found is None:
        raise ValueError("Selecciona una sucursal de la publicación")
    return found


def forecast(data, branch_id, days):
    branch(data, branch_id)
    info = data["model"]
    cutoff = pd.Timestamp(info["cutoff"])
    frame = pd.DataFrame(
        {
            "fecha": pd.date_range(cutoff + pd.Timedelta(days=1), periods=days),
            "id_sucursal": branch_id,
        }
    )
    origin = pd.Timestamp(info.get("feature_origin", "2015-05-15"))
    prediction = np.maximum(
        0, model(info["run_id"]).predict(sales_features(frame, origin))
    )
    frame["ingresos"] = prediction[:, 0].round(2)
    frame["pedidos"] = prediction[:, 1].round().astype(int)
    return frame


def infer(module, request):
    data = report(module)
    info = data["model"]
    if module in ("clv", "churn"):
        row = customer(data["release_id"], request.id_cliente)
        values = {
            "recency": row["dias_sin_compra"],
            "frequency": row["pedidos_180d"],
            "monetary": row["gasto_180d"],
            "tenure": row.get("tenure", 180),
            "registration_age": row.get("registration_age", 0),
            "ticket": row["gasto_180d"] / max(row["pedidos_180d"], 1),
        }
        for key in ("recency", "frequency", "monetary"):
            if getattr(request, key) is not None:
                values[key] = getattr(request, key)
        values["tenure"] = max(values["tenure"], values["recency"])
        values["ticket"] = values["monetary"] / values["frequency"]
        X = pd.DataFrame([values], columns=FEATURES)
        fitted = model(info["run_id"])
        value = (
            float(fitted.predict(X)[0])
            if module == "clv"
            else float(fitted.predict_proba(X)[0, list(fitted.classes_).index(1)])
        )
        result = {
            "value": max(0, value),
            "unit": "money" if module == "clv" else "percent",
            "features": values,
            "label": "Ingreso esperado a 90 días"
            if module == "clv"
            else "Probabilidad de inactividad a 90 días",
        }
    elif module == "sales":
        frame = forecast(data, request.id_sucursal, request.weeks * 7)
        result = {
            "rows": records(frame),
            "value": float(frame.ingresos.sum()),
            "unit": "money",
            "label": "Ingresos del horizonte",
            "orders": int(frame.pedidos.sum()),
        }
    elif module == "efficiency":
        row = branch(data, request.id_sucursal)
        orders = request.orders or int(row["n_pedidos"])
        X = cost_features(
            pd.DataFrame(
                [
                    {
                        "id_sucursal": request.id_sucursal,
                        "mes_fecha": row["mes_fecha"],
                        "n_pedidos": orders,
                    }
                ]
            )
        )
        value = float(max(0, np.expm1(model(info["run_id"]).predict(X)[0])))
        result = {
            "value": value,
            "unit": "money",
            "label": "Costo operativo de referencia",
            "orders": orders,
            "observed_cost": row["costo_op_total"],
        }
    elif module == "margin":
        row = next(
            (
                r
                for r in data["rows"]
                if r["id_sucursal"] == request.id_sucursal
                and r["id_producto"] == request.id_producto
            ),
            None,
        )
        if row is None:
            raise ValueError("Selecciona un producto de la sucursal")
        price = row["precio_actual"] * (1 + request.price_change)
        X = pd.DataFrame(
            [
                {
                    "group": f"{request.id_sucursal}_{request.id_producto}",
                    "log_price": np.log(price),
                    "month": pd.Timestamp(info["cutoff"]).month,
                }
            ]
        )
        units = float(np.exp(model(info["run_id"]).predict(X)[0]))
        result = {
            "value": (price - row["costo_unitario"]) * units,
            "unit": "money",
            "label": "Contribución semanal según modelo",
            "price": price,
            "units": units,
            "support": row["estado"],
        }
    elif module in ("profit", "expansion"):
        sales = report("sales", data["release_id"])
        efficiency = report("efficiency", data["release_id"])
        analog = branch(report("expansion", data["release_id"]), request.id_sucursal)
        frame = forecast(sales, request.id_sucursal, 30)
        revenue = float(frame.ingresos.sum()) * request.demand_factor
        orders = float(frame.pedidos.sum()) * request.demand_factor
        X = cost_features(
            pd.DataFrame(
                [
                    {
                        "id_sucursal": request.id_sucursal,
                        "mes_fecha": pd.Timestamp(sales["model"]["cutoff"])
                        + pd.Timedelta(days=1),
                        "n_pedidos": orders,
                    }
                ]
            )
        )
        operating = float(
            max(0, np.expm1(model(efficiency["model"]["run_id"]).predict(X)[0]))
        )
        product_cost = revenue * analog["ratio_variable"]
        result = {
            "value": revenue - operating - product_cost,
            "unit": "money",
            "label": "Resultado estimado · próximos 30 días",
            "revenue": revenue,
            "operating_cost": operating,
            "product_cost": product_cost,
            "orders": orders,
            "additional_run_id": efficiency["model"]["run_id"],
            "demand_factor": request.demand_factor,
        }
        info = sales["model"]
    else:
        raise ValueError("Módulo no disponible")
    return {
        **result,
        "run_id": info["run_id"],
        "release_id": data["release_id"],
        "cutoff": info["cutoff"],
        "algorithm": info["algorithm"],
        "limitations": " ".join(
            filter(None, [data.get("limitations"), info.get("limitations")])
        ),
    }
