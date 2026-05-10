import os
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import quote_plus
from sqlalchemy import create_engine

# Modelado
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor

# Configurar rutas relativas al archivo
BASE_DIR = Path(__file__).resolve().parents[1]
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

def get_db_connection():
    db_user = os.getenv("POSTGRES_USER")
    db_password = quote_plus(os.getenv("POSTGRES_PASSWORD") or "")
    db_host = os.getenv("POSTGRES_HOST")
    db_port = os.getenv("POSTGRES_PORT")
    db_name = os.getenv("POSTGRES_DB")

    url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    return create_engine(url)

def train_and_save_model(model_filename: str, query_table: str):
    """
    Entrena el mejor modelo y lo guarda en la carpeta models/
    :param model_filename: Nombre del archivo (ej: 'modelo_ventas_regional.pkl')
    :param query_table: Nombre de la tabla en Postgres
    """
    print(f"--- Iniciando entrenamiento para {model_filename} ---")
    
    engine = get_db_connection()
    df = pd.read_sql(f"SELECT * FROM {query_table}", engine)
    df.columns = df.columns.str.lower()

    # Preparación de datos
    df["fecha"] = pd.to_datetime(df["fecha"])
    df = df.sort_values(["id_sucursal", "fecha"])

    features = [
        "anio", "mes", "semana_anio", "dia_secuencial", "trimestre",
        "flag_campana_activa", "costo_operativo_mensual", "ticket_promedio_dia",
        "pedidos_lag_1d", "pedidos_lag_7d", "pedidos_lag_14d", "pedidos_lag_28d",
        "ingresos_lag_1d", "ingresos_lag_7d", "ingresos_media_movil_7d",
        "media_movil_7d", "media_movil_14d", "media_movil_28d", "stddev_7d"
    ]
    targets = ["target_ingresos", "target_pedidos"]

    df_clean = df.dropna(subset=targets + features)
    X = df_clean[features]
    y = df_clean[targets]

    split = int(len(df_clean) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    # Competencia
    candidate_models = {
        "Ridge": MultiOutputRegressor(Ridge()),
        "RandomForest": MultiOutputRegressor(RandomForestRegressor(n_estimators=100, random_state=42)),
        "XGBoost": MultiOutputRegressor(XGBRegressor(n_estimators=100, learning_rate=0.05)),
        "LightGBM": MultiOutputRegressor(LGBMRegressor(n_estimators=100, verbose=-1)),
        "GradientBoost": MultiOutputRegressor(GradientBoostingRegressor(random_state=42))
    }

    best_mae = float("inf")
    best_model = None
    best_name = ""

    for name, model in candidate_models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        print(f"Modelo: {name} | MAE: {mae:.4f}")
        if mae < best_mae:
            best_mae = mae
            best_model = model
            best_name = name

    # Confianza y empaquetado
    residuals = y_test - best_model.predict(X_test)
    std_resid = residuals.std().to_dict()

    model_package = {
        "model": best_model,
        "features": features,
        "std_resid": std_resid,
        "model_name": best_name,
        "last_known_data": df_clean.iloc[-1:].to_dict(orient="records")[0]
    }

    # Guardar en carpeta ml/models/
    models_dir = BASE_DIR / "models"
    models_dir.mkdir(exist_ok=True)
    save_path = models_dir / model_filename
    
    with open(save_path, "wb") as f:
        pickle.dump(model_package, f)

    print(f"--- Ganador: {best_name} guardado en {save_path} ---")
    return model_package