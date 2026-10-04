"""Point-in-time RFM, 90-day spending and inactivity labels with purged splits."""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.dummy import DummyRegressor, DummyClassifier
from sklearn.metrics import mean_absolute_error, brier_score_loss, roc_auc_score

from training.common import track, report, kpi, records

FEATURES = ['recency', 'frequency', 'monetary', 'tenure', 'ticket']
HORIZON = 90


def snapshot(orders, cutoff, labels=True):
    past = orders[(orders.fecha <= cutoff) & (orders.fecha > cutoff-pd.Timedelta(days=180))]
    frame = past.groupby('id_cliente').agg(last=('fecha','max'), first=('fecha','min'),
                                          frequency=('id_pedido','nunique'), monetary=('ingresos','sum'))
    frame['recency'] = (cutoff-frame['last']).dt.days
    frame['tenure'] = (cutoff-frame['first']).dt.days
    frame['ticket'] = frame.monetary/frame.frequency
    branch = past.sort_values(['fecha','id_pedido']).drop_duplicates('id_cliente', keep='last').set_index('id_cliente').id_sucursal
    frame['id_sucursal'] = branch
    frame['cutoff'] = cutoff
    if labels:
        future = orders[(orders.fecha > cutoff) & (orders.fecha <= cutoff+pd.Timedelta(days=HORIZON))]
        spend = future.groupby('id_cliente').ingresos.sum()
        counts = future.groupby('id_cliente').size()
        frame['spend_90d'] = spend.reindex(frame.index).fillna(0)
        frame['inactive_90d'] = (counts.reindex(frame.index).fillna(0) == 0).astype(int)
    return frame.reset_index().drop(columns=['first','last'])


def train_customers(orders, load_id):
    orders = orders.copy()
    orders.fecha = pd.to_datetime(orders.fecha)
    orders.ingresos = orders.ingresos.astype(float)
    cutoff = orders.fecha.max()
    cutoffs = [cutoff-pd.Timedelta(days=d) for d in (630,540,450,360,270,180,90)]
    cutoffs = [c for c in cutoffs if c >= orders.fecha.min()+pd.Timedelta(days=180)]
    if len(cutoffs) < 3:
        raise ValueError('Customer models require 450 days of identifiable history')
    frames = [snapshot(orders, c) for c in cutoffs]
    dataset = pd.concat(frames, ignore_index=True)
    train = dataset[dataset.cutoff < cutoffs[-2]]
    validation = dataset[dataset.cutoff == cutoffs[-2]]
    test = dataset[dataset.cutoff == cutoffs[-1]]
    if min(len(train),len(validation),len(test)) < 20:
        raise ValueError('Customer temporal cohorts too small')
    # Bound training compute with a deterministic sample within each temporal split.
    train = train.sample(n=min(len(train),120000), random_state=42)
    current = snapshot(orders, cutoff, labels=False)
    result = current.copy()
    infos = {}
    for name, target, classifier in [('clv','spend_90d',False), ('churn','inactive_90d',True)]:
        if classifier:
            if train[target].nunique() < 2:
                raise ValueError('Churn training needs both inactive and returning customers')
            candidate = RandomForestClassifier(n_estimators=100, max_depth=8, min_samples_leaf=20, random_state=42, n_jobs=2)
            baseline = DummyClassifier(strategy='prior')
            score = brier_score_loss
            predict = lambda m, x: m.predict_proba(x)[:,list(m.classes_).index(1)]
        else:
            candidate = RandomForestRegressor(n_estimators=100, max_depth=8, min_samples_leaf=20, random_state=42, n_jobs=2)
            baseline = DummyRegressor(strategy='median')
            score = mean_absolute_error
            predict = lambda m, x: np.maximum(0,m.predict(x))
        for model in (candidate, baseline):
            model.fit(train[FEATURES],train[target])
        candidate_score = score(validation[target], predict(candidate, validation[FEATURES]))
        baseline_score = score(validation[target], predict(baseline, validation[FEATURES]))
        selected = candidate if candidate_score < baseline_score else baseline
        algorithm = type(selected).__name__
        train_valid = dataset[dataset.cutoff < cutoffs[-1]]
        train_valid = train_valid.sample(n=min(len(train_valid),120000), random_state=42)
        selected.fit(train_valid[FEATURES],train_valid[target])
        test_pred = predict(selected,test[FEATURES])
        metric_name = 'brier' if classifier else 'mae_bob'
        metrics = {metric_name: score(test[target],test_pred), 'validation_candidate': candidate_score,
                   'validation_baseline': baseline_score, 'test_customers': len(test)}
        if classifier and test[target].nunique() == 2:
            metrics['roc_auc'] = roc_auc_score(test[target], test_pred)
        refit = dataset.sample(n=min(len(dataset),180000), random_state=42)
        selected.fit(refit[FEATURES],refit[target])
        run_id = track(name, selected, current[FEATURES].head(5), selected.predict(current[FEATURES].head(5)), metrics,
            {'algorithm':algorithm, 'history_days':180, 'horizon_days':90, 'test_cutoff':str(cutoffs[-1].date()),
             'label_maturity':str(cutoff.date()), 'split':'chronological_nonoverlapping_labels'}, load_id)
        result[name] = predict(selected,current[FEATURES])
        infos[name] = {'run_id':run_id, 'algorithm':algorithm, 'metrics':metrics, 'cutoff':str(cutoff.date()),
                       'validation':'Cohortes temporales; etiquetas maduras; evaluación final fuera de selección',
                       'limitations': 'Ingreso esperado a 90 días, no utilidad ni valor de vida completo.' if name == 'clv'
                       else 'Probabilidad de no comprar durante 90 días. No implica baja definitiva; umbral operativo de 0,5.'}
    result['segmento'] = np.where(result.churn >= .5,'Priorizar retención','Seguimiento')
    result = result.rename(columns={'monetary':'gasto_180d','frequency':'pedidos_180d','recency':'dias_sin_compra'})
    rows = records(result.drop(columns=['cutoff','tenure','ticket']).sort_values('clv',ascending=False))
    return {
        'clv': report('Valor del Cliente','Ingreso esperado por cliente en los próximos 90 días.',rows,
                      [kpi('Ingreso esperado · 90 días',result.clv.sum(),'money'),kpi('Clientes evaluados',len(result)),
                       kpi('Error absoluto · prueba',infos['clv']['metrics']['mae_bob'],'money')],infos['clv']),
        'churn': report('Fuga de Clientes','Prioriza clientes con riesgo de inactividad durante los próximos 90 días.',
                       sorted(rows,key=lambda r:r['churn'],reverse=True),
                       [kpi('Clientes con riesgo ≥ 50%',(result.churn>=.5).sum()),kpi('Riesgo medio',result.churn.mean(),'percent'),
                        kpi('Brier · menor es mejor',infos['churn']['metrics']['brier'])],infos['churn'])}
