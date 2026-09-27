const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const Database=require('better-sqlite3');const {createService}=require('../server/service.cjs');
test('PIN setup, approved pricing, untracked checkout, overrides, receipt, reporting and refund',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'medflow-quick-'));let svc=createService(root);
 try{
  const raw=(m,a={})=>svc.call(m,a);
  assert.equal(raw('bootstrap').installed,false);
  assert.throws(()=>raw('setup',{quickPin:true,password:'12345'}),/6–10/);
  raw('setup',{quickPin:true,store:'My Lahore Shop',password:'473892'});
  assert.equal(raw('bootstrap').quickMode,true);
  const token=raw('login',{username:'owner',password:'473892'}).token;
  const owner=(m,a={})=>raw(m,{...a,_token:token});
  assert.equal(owner('quickSearch',{q:'panadol'}).rows[0].price,0,'price must not be invented');
  assert.ok(owner('quickSearch',{q:'condoms'}).rows.some(x=>x.name==='Condoms'));
  assert.throws(()=>owner('quickCheckout',{items:[{id:1,quantity:1}],received:10}),/no Owner-approved price/);
  const saved=owner('saveQuickPrice',{lookup_id:'catalog:pk:haleon:panadol-regular-500-tablet',price:15,unit:'tablet'});
  assert.equal(saved.price,1500);assert.equal(saved.prescription,1);
  assert.throws(()=>owner('saveQuickPrice',{lookup_id:'catalog:pk:haleon:panadol-regular-500-tablet',price:22}),/already has an approved price/);
  assert.throws(()=>owner('quickCheckout',{items:[{id:saved.id,quantity:2}],received:50}),/actual pack, expiry/);
  const product=owner('saveQuickPrice',{lookup_id:'catalog:everyday:condoms',name:'Condoms · one sealed pack',price:350,unit:'pack'});
  assert.equal(product.prescription,0);
  const customer=owner('saveCustomer',{name:'Customer A',phone:'0123'});
  const buyers=owner('listCustomers');const cid=buyers[0].id;
  raw('saveUser',{_token:token,name:'Cashier A',username:'cashier',password:'password123',role:'Cashier'});
  const cashierToken=raw('login',{username:'cashier',password:'password123'}).token;
  const cashier=(m,a={})=>raw(m,{...a,_token:cashierToken});
  assert.throws(()=>cashier('saveQuickPrice',{id:saved.id,price:17}),/authorized user/);
  const sale=cashier('quickCheckout',{items:[{id:saved.id,quantity:2,price:16},{id:product.id,quantity:1}],customer_id:cid,received:400,method:'Cash',prescriptionConfirmed:true});
  assert.match(sale.invoice_no,/^Q-/);
  const doc=cashier('getQuickSale',{id:sale.id});
  assert.equal(doc.items.length,2);assert.equal(doc.sale.total,38200);assert.equal(doc.sale.change_due,1800);
  assert.equal(doc.sale.customer,'Customer A');assert.equal(doc.stock,'untracked');
  assert.equal(doc.items[0].price,1600);assert.equal(doc.items[0].saved_price,1500);
  assert.equal(cashier('quickSearch',{q:'Panadol'}).rows[0].price,1500,'sale price edit must not overwrite default');
  assert.equal(owner('listProducts').total,0,'no inventory, suppliers, or products created by quick sales');
  assert.equal(new Database(path.join(root,'medflow.sqlite'),{readonly:true}).prepare('SELECT count(*) n FROM batches').get().n,0);
  const today=new Date();const d=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const summary=owner('overview',{from:d,to:d}).summary;assert.equal(summary.sales,38200);assert.equal(summary.profit,null,'cannot claim profit without cost');
  assert.equal(owner('reports',{type:'sales',from:d,to:d}).some(x=>x.invoice_no===sale.invoice_no),true);
  assert.equal(owner('reports',{type:'daily',from:d,to:d})[0].revenue,38200);
  assert.ok(owner('reports',{type:'topProducts',from:d,to:d}).some(x=>x.name.includes('Condoms')));
  assert.ok(owner('reports',{type:'categories',from:d,to:d}).some(x=>x.category==='Family planning'));
  assert.equal(owner('reports',{type:'paymentMethods',from:d,to:d})[0].sales,38200);
  assert.ok(owner('listAudit').some(x=>x.action==='price_override'));
  assert.throws(()=>cashier('quickReturn',{item_id:doc.items[0].id,quantity:1,reason:'Returned'}),/authorized user/);
  const ret=owner('quickReturn',{item_id:doc.items[0].id,quantity:1,reason:'Unopened item returned'});
  assert.equal(ret.refund,1600);
  assert.throws(()=>owner('quickReturn',{item_id:doc.items[0].id,quantity:2,reason:'Too many'}),/Return exceeds/);
  assert.equal(owner('listQuickSales')[0].refunded,1600);
  assert.equal(owner('overview',{from:d,to:d}).summary.sales,36600);
  assert.equal(owner('reports',{type:'sales',from:d,to:d}).some(x=>x.total===-1600),true);
  const newPrice=owner('saveQuickPrice',{id:saved.id,price:18,unit:'tablet'});assert.equal(newPrice.price,1800);
  assert.equal(cashier('quickSearch',{q:'panadol'}).rows[0].price,1800);
  assert.equal(cashier('getQuickSale',{id:sale.id}).items[0].saved_price,1500,'historical receipt price is immutable');
 }finally{svc.close();fs.rmSync(root,{recursive:true,force:true})}
});
test('no unauthorized sale, no negative price, no fake default, offline data and PKR safeguard',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'medflow-quick-safe-'));const svc=createService(root);
 try{
  svc.call('setup',{quickPin:true,password:'123456'});const tok=svc.call('login',{username:'owner',password:'123456'}).token;
  const call=(m,a={})=>svc.call(m,{...a,_token:tok});
  assert.equal(call('quickSearch',{q:'face wash'}).rows.some(x=>x.name==='Face wash'),true);
  assert.throws(()=>call('saveQuickPrice',{lookup_id:'custom',name:'Product X',unit:'pack',price:0}),/positive selling price/);
  assert.throws(()=>call('saveQuickPrice',{lookup_id:'catalog:unknown',name:'Fake',price:100}),/Catalogue entry not found/);
  const p=call('saveQuickPrice',{lookup_id:'custom',name:'Facial cream 100 ml',category:'Everyday item',unit:'jar',price:390});
  assert.throws(()=>call('quickCheckout',{items:[{id:p.id,quantity:1,price:-2}]}),/valid non-negative/);
  assert.throws(()=>call('quickCheckout',{items:[{id:p.id,quantity:1}],received:389}),/full payment/);
  assert.equal(call('quickCheckout',{items:[{id:p.id,quantity:1}],received:400}).id>0,true);
  call('saveSettings',{store:{name:'My Pharmacy'},currency:'USD'});
  assert.throws(()=>call('saveQuickPrice',{id:p.id,price:400}),/requires? PKR/);
  assert.throws(()=>call('quickCheckout',{items:[{id:p.id,quantity:1}]}),/requires? PKR/);
 }finally{svc.close();fs.rmSync(root,{recursive:true,force:true})}
});
test('six-digit Owner PIN is throttled and upgrades preserve saved prices and sales',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'medflow-pin-'));let svc=createService(root);
 try{
  svc.call('setup',{quickPin:true,password:'789456'});
  for(let i=0;i<4;i++)assert.throws(()=>svc.call('login',{username:'owner',password:'bad'}),/Incorrect username/);
  assert.throws(()=>svc.call('login',{username:'owner',password:'bad'}),/Too many/);
  assert.throws(()=>svc.call('login',{username:'owner',password:'789456'}),/Too many/);
  svc.close();svc=createService(root);
  const tok=svc.call('login',{username:'owner',password:'789456'}).token;
  const item=svc.call('saveQuickPrice',{_token:tok,lookup_id:'custom',name:'Test everyday item',unit:'piece',price:50});
  svc.call('quickCheckout',{_token:tok,items:[{id:item.id,quantity:1}]});
  svc.close();svc=createService(root);
  const token=svc.call('login',{username:'owner',password:'789456'}).token;
  assert.equal(svc.call('quickSearch',{_token:token,q:'Test everyday'}).rows[0].price,5000);
  assert.equal(svc.call('listQuickSales',{_token:token}).length,1);
 }finally{svc.close();fs.rmSync(root,{recursive:true,force:true})}
});

test('untracked mode cannot bypass a product already managed with tracked batches',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'medflow-no-bypass-'));const svc=createService(root);try{svc.call('setup',{quickPin:true,password:'123456'});const tok=svc.call('login',{username:'owner',password:'123456'}).token;const c=(m,a={})=>svc.call(m,{...a,_token:tok});const ref=c('saveQuickPrice',{lookup_id:'custom',name:'Tracked name',unit:'tablet',category:'Medicine',price:10});c('saveProduct',{name:'Tracked name',retail:10});const prod=c('listProducts').rows[0];const db=new Database(path.join(root,'medflow.sqlite'));db.prepare('INSERT INTO batches(product_id,batch_no,expiry,purchased_on,cost,price,initial_qty,remaining) VALUES(?,?,?,?,?,?,?,?)').run(prod.id,'B1','2020-01-01','2019-01-01',100,1000,1,1);db.close();assert.throws(()=>c('quickCheckout',{items:[{id:ref.id,quantity:1}],prescriptionConfirmed:true}),/tracked batches/);assert.equal(c('listQuickSales').length,0)}finally{svc.close();fs.rmSync(root,{recursive:true,force:true})}
});

test('upgrade from 1.1, backup and restore retain the quick price book and bills',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'medflow-quick-restore-'));let svc=createService(root);
 try{
  svc.call('setup',{store:'Old shop',name:'Owner',username:'owner',password:'old-password'});
  svc.close();const db=new Database(path.join(root,'medflow.sqlite'));db.prepare('UPDATE settings SET value=? WHERE key=?').run(JSON.stringify('1.1.0'),'appVersion');db.close();
  svc=createService(root);let token=svc.call('login',{username:'owner',password:'old-password'}).token;let c=(m,a={})=>svc.call(m,{...a,_token:token});
  assert.ok(c('listBackups').some(x=>x.name.includes('preupgrade-1_1_0-to-2_0_0')));
  const item=c('saveQuickPrice',{lookup_id:'custom',name:'First sale item',unit:'pack',price:110});
  c('quickCheckout',{items:[{id:item.id,quantity:1}]});
  const saved=await c('backup');
  c('saveQuickPrice',{id:item.id,price:140});
  assert.equal(c('quickSearch',{q:'First sale item'}).rows[0].price,14000);
  await c('restore',{name:saved.name,confirm:'RESTORE'});
  assert.throws(()=>c('quickSearch',{q:'First sale item'}),/expired/);
  token=svc.call('login',{username:'owner',password:'old-password'}).token;c=(m,a={})=>svc.call(m,{...a,_token:token});
  assert.equal(c('quickSearch',{q:'First sale item'}).rows[0].price,11000);
  assert.equal(c('listQuickSales').length,1);
 }finally{svc.close();fs.rmSync(root,{recursive:true,force:true})}
});
