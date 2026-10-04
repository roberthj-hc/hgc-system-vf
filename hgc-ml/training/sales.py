"""Calendar-only demand forecast with chronological holdout and a fitted baseline.

No target-day revenue, ticket or unshifted moving averages enter the feature set.
Forecast origin is the data cutoff, not the computer clock.
"""
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from sklearn.base import BaseEstimator, RegressorMixin

from training.common import track, report, kpi, records


class WeeklySeasonal(RegressorMixin, BaseEstimator):
    def fit(self, X, y):
        data = X[['branch', 'dow']].copy()
        data[['revenue', 'orders']] = np.asarray(y)
        self.means_ = data.groupby(['branch', 'dow'])[['revenue', 'orders']].mean()
        self.fallback_ = np.asarray(y).mean(axis=0)
        return self

    def predict(self, X):
        return np.array([self.means_.loc[(r.branch, r.dow)].to_numpy()
                         if (r.branch, r.dow) in self.means_.index else self.fallback_
                         for r in X.itertuples()])


def features(frame, origin):
    date = pd.to_datetime(frame.fecha)
    return pd.DataFrame({'branch': frame.id_sucursal.astype(str), 'dow': date.dt.dayofweek,
        'month': date.dt.month, 'trend': (date - origin).dt.days / 365.25,
        'sin_year': np.sin(2*np.pi*date.dt.dayofyear/365.25),
        'cos_year': np.cos(2*np.pi*date.dt.dayofyear/365.25)})


def train_sales(daily, load_id):
    daily = daily.copy()
    daily.fecha = pd.to_datetime(daily.fecha)
    daily = daily.sort_values(['fecha', 'id_sucursal']).reset_index(drop=True)
    cutoff = daily.fecha.max()
    origin = daily.fecha.min()
    if (cutoff-origin).days < 180:
        raise ValueError('Sales requires at least 180 days for temporal validation')
    X = features(daily, origin)
    y = daily[['ingresos', 'pedidos']].astype(float)
    validation_start = cutoff - pd.Timedelta(days=83)
    train_mask = daily.fecha < validation_start
    valid_mask = ~train_mask
    pipeline = make_pipeline(ColumnTransformer([
        ('categories', OneHotEncoder(handle_unknown='ignore'), ['branch', 'dow', 'month']),
        ('numeric', StandardScaler(), ['trend', 'sin_year', 'cos_year'])]), Ridge(alpha=20))
    baseline = WeeklySeasonal()
    # Recent seasonality is a real trained baseline; evaluated on the same future holdout.
    recent = train_mask & (daily.fecha >= validation_start-pd.Timedelta(days=180))
    baseline.fit(X[recent], y[recent])
    pipeline.fit(X[train_mask], y[train_mask])
    baseline_pred = np.maximum(0, baseline.predict(X[valid_mask]))
    candidate_pred = np.maximum(0, pipeline.predict(X[valid_mask]))
    baseline_mae = mean_absolute_error(y[valid_mask].iloc[:, 0], baseline_pred[:, 0])
    candidate_mae = mean_absolute_error(y[valid_mask].iloc[:, 0], candidate_pred[:, 0])
    model, name, pred = (pipeline, 'ridge_calendar', candidate_pred) if candidate_mae < baseline_mae else (baseline, 'weekly_seasonal', baseline_pred)
    residual = np.abs(y[valid_mask].to_numpy()-pred)
    widths = np.quantile(residual, .90, axis=0)
    metrics = {'mae_revenue': mean_absolute_error(y[valid_mask].iloc[:, 0], pred[:, 0]),
               'mae_orders': mean_absolute_error(y[valid_mask].iloc[:, 1], pred[:, 1]),
               'baseline_mae_revenue': baseline_mae,
               'candidate_mae_revenue': candidate_mae}
    fit_mask = daily.fecha >= cutoff-pd.Timedelta(days=180) if name == 'weekly_seasonal' else np.ones(len(daily), dtype=bool)
    model.fit(X[fit_mask], y[fit_mask])
    run_id = track('sales', model, X.head(5), model.predict(X.head(5)), metrics,
        {'algorithm': name, 'cutoff': str(cutoff.date()), 'validation_days': 84, 'horizon_days': 84}, load_id)
    branches = daily[['id_sucursal','sucursal','ciudad','tipo_formato']].drop_duplicates('id_sucursal')
    future = pd.MultiIndex.from_product([branches.id_sucursal, pd.date_range(cutoff+pd.Timedelta(days=1), periods=84)],
                                        names=['id_sucursal', 'fecha']).to_frame(index=False)
    forecast = np.maximum(0, model.predict(features(future, origin)))
    future['ingresos'] = forecast[:,0].round(2)
    future['pedidos'] = forecast[:,1].round().astype(int)
    future['inferior'] = np.maximum(0, forecast[:,0]-widths[0]).round(2)
    future['superior'] = (forecast[:,0]+widths[0]).round(2)
    future = future.merge(branches, on='id_sucursal')
    history = daily[daily.fecha >= cutoff-pd.Timedelta(days=364)].copy()
    history['semana'] = (history.fecha-pd.to_timedelta(history.fecha.dt.dayofweek, unit='D')).dt.strftime('%Y-%m-%d')
    weekly = history.groupby(['semana','id_sucursal','sucursal'], as_index=False)[['ingresos','pedidos']].sum()
    model_info = {'run_id': run_id, 'algorithm': name, 'metrics': metrics, 'cutoff': str(cutoff.date()),
                  'validation': 'Últimos 84 días; selección frente a promedio estacional',
                  'limitations': 'Proyección desde el último dato. Banda diaria empírica del 90%, sin garantía de cobertura futura. No estima efectos causales de campañas.'}
    sales = report('Ventas semanales', 'Ventas observadas y proyección diaria por sucursal.', records(weekly),
                   [kpi('Ventas · últimas 4 semanas', daily.loc[daily.fecha > cutoff-pd.Timedelta(days=28),'ingresos'].sum(), 'money'),
                    kpi('Sucursales', len(branches)), kpi('MAE diario validado', metrics['mae_revenue'], 'money')],
                   model_info, forecast=records(future), branches=records(branches))
    return sales
