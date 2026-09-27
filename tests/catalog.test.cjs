const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createService}=require('../server/service.cjs');
const catalog=require('../server/medicine-catalog.cjs');

test('offline dictionary searches Pakistan-first brand forms and international generics',()=>{
 assert.ok(catalog.count()>17000,'substantial pre-bundled offline data');
 const p=catalog.search('p');assert.equal(p.rows.length,40);
 assert.equal(p.rows[0].market,'Pakistan');
 assert.ok(catalog.search('Panadol').rows.some(x=>x.name.includes('Tablet')));
 const syrup=catalog.search('panadol syrup');
 assert.ok(syrup.rows.some(x=>x.name.includes('Liquid 160 mg/5 mL')));
 assert.ok(syrup.rows.some(x=>x.name.includes('Forte Suspension 250 mg/5 mL')));
 assert.ok(catalog.search('amoxicillin 250').rows.some(x=>x.market.startsWith('International')));
 assert.equal(catalog.search('').total,0);
 assert.equal(catalog.find('not-real'),null);
});

test('quick add is permission-checked, price-checked, auditable and never creates stock',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'medflow-catalog-'));
 const svc=createService(root);
 try{
  const direct=(m,a={})=>svc.call(m,a);
  direct('setup',{store:'Training Pharmacy',name:'Owner',username:'owner',password:'test-password-123'});
  const owner=direct('login',{username:'owner',password:'test-password-123'}).token;
  const call=(m,a={})=>direct(m,{...a,_token:owner});
  assert.equal(call('listMedicineSuggestions',{q:'panadol syrup'}).rows[0].market,'Pakistan');
  assert.equal(call('listProducts').total,0,'looking up medicines must not add products');
  assert.throws(()=>call('addMedicineFromCatalog',{catalog_id:'rx:invalid',retail:100}),/dictionary entry/);
  assert.throws(()=>call('addMedicineFromCatalog',{catalog_id:'pk:haleon:panadol-regular-500-tablet',retail:0}),/selling price/);
  assert.throws(()=>call('addMedicineFromCatalog',{catalog_id:'pk:haleon:panadol-regular-500-tablet',retail:-2}),/non-negative/);
  const added=call('addMedicineFromCatalog',{catalog_id:'pk:haleon:panadol-regular-500-tablet',retail:120,barcode:'9800000099991',name:'Spoofed',prescription:false});
  const product=call('listProducts').rows[0];
  assert.equal(added.id,product.id);assert.equal(product.name,'Panadol Regular 500 mg Tablet');
  assert.equal(product.strength,'500 mg');assert.equal(product.form,'Tablet');
  assert.equal(product.stock,0);assert.equal(product.retail,12000);
  assert.equal(product.prescription,1,'unknown regulatory status must default to requiring review');
  assert.ok(call('listAudit').some(a=>a.entity==='product'&&a.entity_id===product.id));
  assert.throws(()=>call('addMedicineFromCatalog',{catalog_id:'pk:haleon:panadol-regular-500-tablet',retail:150}),/already in your catalog/);
  direct('saveUser',{_token:owner,name:'Cashier',username:'cashier',password:'test-password-123',role:'Cashier'});
  const cashier=direct('login',{username:'cashier',password:'test-password-123'}).token;
  assert.throws(()=>direct('addMedicineFromCatalog',{_token:cashier,catalog_id:'rx:200977',retail:100}),/authorized user/i);
  const intl=call('addMedicineFromCatalog',{catalog_id:'rx:200977',retail:100});
  assert.ok(intl.id>0);assert.equal(call('listProducts').total,2);
 }finally{svc.close();fs.rmSync(root,{recursive:true,force:true})}
});

test('upgrading an existing 1.0.1 store preserves products and creates a safety backup',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'medflow-dictionary-upgrade-'));
 let svc=createService(root);
 try{
  svc.call('setup',{store:'Prior Store',name:'Owner',username:'owner',password:'test-password-123'});
  const token=svc.call('login',{username:'owner',password:'test-password-123'}).token;
  svc.call('saveProduct',{_token:token,name:'Existing Inventory Item',retail:23,barcode:'OLD001'});
  svc.close();
  const Database=require('better-sqlite3');
  const old=new Database(path.join(root,'medflow.sqlite'));
  old.prepare('UPDATE settings SET value=? WHERE key=?').run(JSON.stringify('1.0.1'),'appVersion');old.close();
  svc=createService(root);
  const auth=svc.call('login',{username:'owner',password:'test-password-123'}).token;
  assert.equal(svc.call('listProducts',{_token:auth}).rows[0].name,'Existing Inventory Item');
  assert.equal(svc.call('listMedicineSuggestions',{_token:auth,q:'Panadol'}).rows.length>0,true);
  const back=svc.call('listBackups',{_token:auth}).find(x=>x.name.includes('preupgrade-1_0_1-to-1_1_0'));
  assert.ok(back,'verified pre-upgrade backup for the existing store');
  const snapshot=new Database(path.join(root,'backups',back.name),{readonly:true});
  assert.equal(snapshot.prepare('SELECT name FROM products WHERE barcode=?').get('OLD001').name,'Existing Inventory Item');snapshot.close();
 }finally{svc.close();fs.rmSync(root,{recursive:true,force:true})}
});
