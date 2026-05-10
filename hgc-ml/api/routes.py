from fastapi import APIRouter
from schemas.input import PredictRequest
from services.predictor import predict_sales, predict_churn

router = APIRouter()

# 🔹 Modelo ventas
@router.post("/predict/sales")
def sales(data: PredictRequest):
    result = predict_sales(data.dict())
    return {"prediction": result}


# 🔹 Modelo churn
@router.post("/predict/churn")
def churn(data: PredictRequest):
    result = predict_churn(data.dict())
    return {"prediction": result}