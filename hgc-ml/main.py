import os
import pickle
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Importar el pipeline dinámico
from core.pipeline import train_and_save_model

app = FastAPI(title="HGC Multi-Model API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
loaded_models: Dict[str, dict] = {}

class PredictRequest(BaseModel):
    model_name: str
    num_semanas: int
    flag_campana: int
    id_sucursal: int

def load_models_into_memory():
    global loaded_models
    loaded_models = {}
    if MODELS_DIR.exists():
        for file in MODELS_DIR.glob("*.pkl"):
            with open(file, "rb") as f:
                loaded_models[file.stem] = pickle.load(f)
    print(f"Modelos en memoria: {list(loaded_models.keys())}")

@app.on_event("startup")
def startup():
    # Ejemplo: Si no hay modelos, entrenar uno por defecto al iniciar
    if not MODELS_DIR.exists() or not list(MODELS_DIR.glob("*.pkl")):
        train_and_save_model("modelo_predictivo_ventas.pkl", "feat_ts_pred__g_regional")
    load_models_into_memory()

@app.get("/api/models")
async def list_models():
    return {"available_models": list(loaded_models.keys())}

@app.post("/api/predict")
async def predict(request: PredictRequest):
    if request.model_name not in loaded_models:
        raise HTTPException(status_code=404, detail="Modelo no cargado")

    pkg = loaded_models[request.model_name]
    model = pkg["model"]
    last_row = pkg["last_known_data"]
    results = []
    
    curr = datetime.now()
    for i in range(1, (request.num_semanas * 7) + 1):
        future_date = curr + timedelta(days=i)
        
        # Vector de entrada basado en el historial (last_row)
        input_data = pd.DataFrame([[
            future_date.year, future_date.month, future_date.isocalendar()[1],
            int(future_date.strftime("%j")), (future_date.month - 1) // 3 + 1,
            request.flag_campana, last_row["costo_operativo_mensual"], last_row["ticket_promedio_dia"],
            last_row["pedidos_lag_1d"], last_row["pedidos_lag_7d"], last_row["pedidos_lag_14d"], last_row["pedidos_lag_28d"],
            last_row["ingresos_lag_1d"], last_row["ingresos_lag_7d"], last_row["ingresos_media_movil_7d"],
            last_row["media_movil_7d"], last_row["media_movil_14d"], last_row["media_movil_28d"], last_row["stddev_7d"]
        ]], columns=pkg["features"])

        pred = model.predict(input_data)[0]
        results.append({
            "fecha": future_date.strftime("%Y-%m-%d"),
            "ingresos": {"pred": round(float(pred[0]), 2)},
            "pedidos": {"pred": int(pred[1])}
        })

    return {"model": request.model_name, "predictions": results}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)