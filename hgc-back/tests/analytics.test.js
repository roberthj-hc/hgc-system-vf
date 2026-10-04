const test=require('node:test');
const assert=require('node:assert/strict');
const {queryOptions,numberInRange}=require('../src/analytics/analytics.validation');
const {viewReport}=require('../src/analytics/analytics.service');
const {authorizeModule}=require('../src/analytics/analytics.permissions');
const {pool}=require('../src/config/postgres');

test.after(()=>pool.end());
test('rejects malformed and unbounded pagination',()=>{
  for(const input of [{page:'0'},{page:'1.5'},{page_size:'999'},{page:'NaN'},{branch:'DROP TABLE'}])
    assert.throws(()=>queryOptions(input),{status:400});
  assert.deepEqual(queryOptions({}),{page:1,pageSize:25,branch:null,search:''});
});
test('scenario bounds reject nonfinite values',()=>{
  assert.throws(()=>numberInRange(Infinity,'factor',.1,2,1),{status:400});
  assert.throws(()=>numberInRange(-1,'investment',0,100),{status:400});
});
test('server enforces module permissions',()=>{
  let status;const res={status(code){status=code;return this;},json(){}};
  authorizeModule({params:{module:'clv'},user:{cargo:'STAFF'}},res,()=>assert.fail('unauthorized'));
  assert.equal(status,403);
  let allowed=false;
  authorizeModule({params:{module:'efficiency'},user:{cargo:'CFO'}},res,()=>{allowed=true;});
  assert.equal(allowed,true);
});
test('aggregates before pagination and isolates branch forecasts',()=>{
  const data={rows:[{id_sucursal:1,semana:'2026-01-05',ingresos:10,pedidos:1},{id_sucursal:2,semana:'2026-01-05',ingresos:20,pedidos:2}],
    forecast:[{id_sucursal:1,fecha:'2026-01-12',ingresos:15},{id_sucursal:2,fecha:'2026-01-12',ingresos:30}]};
  const all=viewReport(data,'sales',{page:1,pageSize:1,branch:null,search:''});
  assert.equal(all.series[0].ingresos,30);assert.equal(all.rows.length,1);assert.equal(all.pagination.total,2);
  const one=viewReport(data,'sales',{page:1,pageSize:25,branch:1,search:''});
  assert.equal(one.forecast[0].ingresos,15);
});
