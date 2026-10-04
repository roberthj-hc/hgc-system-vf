import pandas as pd
import numpy as np
import pytest

from data.contracts import validate
from training.customers import snapshot, FEATURES
from training.sales import features, WeeklySeasonal


def test_customer_snapshot_has_no_future_feature_leakage():
    cutoff=pd.Timestamp('2025-06-30')
    data=pd.DataFrame({'id_cliente':[1,1,2], 'id_pedido':[1,2,3], 'id_sucursal':[1,2,1],
        'fecha':pd.to_datetime(['2025-06-01','2025-07-01','2025-06-15']), 'ingresos':[100.,900.,20.]})
    original=snapshot(data,cutoff).set_index('id_cliente')
    mutated=data.copy();mutated.loc[1,'ingresos']=1000000
    changed=snapshot(mutated,cutoff).set_index('id_cliente')
    pd.testing.assert_frame_equal(original[FEATURES],changed[FEATURES])
    assert original.loc[1,'id_sucursal']==1
    assert original.loc[1,'spend_90d']==900
    assert original.loc[2,'inactive_90d']==1
    assert original.loc[1,'inactive_90d']==0


def test_horizon_boundary_and_cohort_exclusion():
    cutoff=pd.Timestamp('2025-01-01')
    data=pd.DataFrame({'id_cliente':[1,1,1,2], 'id_pedido':[1,2,3,4], 'id_sucursal':[1]*4,
        'fecha':[cutoff,cutoff+pd.Timedelta(days=90),cutoff+pd.Timedelta(days=91),cutoff+pd.Timedelta(days=1)],
        'ingresos':[10.,20.,30.,40.]})
    result=snapshot(data,cutoff)
    assert len(result)==1
    assert result.iloc[0].spend_90d==20


def test_forecast_features_do_not_use_targets():
    base=pd.DataFrame({'fecha':pd.to_datetime(['2025-01-01','2025-01-02']), 'id_sucursal':[1,2], 'ingresos':[10,20]})
    mutated=base.assign(ingresos=[999,0])
    pd.testing.assert_frame_equal(features(base,base.fecha.min()),features(mutated,base.fecha.min()))
    assert 'ingresos' not in features(base,base.fecha.min())


def test_seasonal_model_respects_branch():
    X=pd.DataFrame({'branch':['1','1','2','2'],'dow':[0,1,0,1]})
    model=WeeklySeasonal().fit(X,np.array([[10,1],[20,2],[100,10],[200,20]]))
    prediction=model.predict(pd.DataFrame({'branch':['1','2'],'dow':[0,0]}))
    assert prediction[:,0].tolist()==[10,100]


def test_serving_contract_rejects_duplicate_and_empty_sources():
    frame=pd.DataFrame({'id':[1,1],'ingresos':[1.,2.]})
    with pytest.raises(ValueError,match='grain'): validate(frame,['id'])
    with pytest.raises(ValueError,match='Empty'): validate(frame.head(0),['id'])
    with pytest.raises(ValueError,match='measure'): validate(pd.DataFrame({'id':[1],'ingresos':[-1]}),['id'])


def test_missing_cost_is_unknown_not_zero():
    frame=pd.DataFrame({'id':[1,2],'costo_op_total':[100.,np.nan]})
    validate(frame,['id'])
    assert pd.isna(frame.loc[1,'costo_op_total'])
