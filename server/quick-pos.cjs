// Stock-free counter sales. This ledger never edits batches or represents an expiry check.
// Catalogue entries contain identification only: a locally approved price is mandatory.
const catalog=require('./medicine-catalog.cjs');
const now=()=>new Date().toISOString();
const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const str=(v,max=200)=>String(v??'').trim().slice(0,max);
const key=v=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<=0)throw Error('Invalid item.');return n};
const money=v=>{const n=Number(v);if(!Number.isFinite(n)||n<0||n>100000000||!Number.isSafeInteger(Math.round(n*100)))throw Error('Enter a valid non-negative PKR amount.');return Math.round(n*100)};
function init(db){db.exec(`
 CREATE TABLE IF NOT EXISTS quick_prices(id INTEGER PRIMARY KEY,catalog_id TEXT UNIQUE,product_id INTEGER UNIQUE REFERENCES products(id),name TEXT NOT NULL,brand TEXT DEFAULT '',generic TEXT DEFAULT '',category TEXT NOT NULL,form TEXT DEFAULT '',strength TEXT DEFAULT '',unit TEXT NOT NULL,barcode TEXT UNIQUE,price INTEGER NOT NULL CHECK(price>0),prescription INTEGER NOT NULL DEFAULT 0,source TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by INTEGER NOT NULL REFERENCES users(id));
 CREATE TABLE IF NOT EXISTS quick_sales(id INTEGER PRIMARY KEY,invoice_no TEXT NOT NULL UNIQUE,customer_id INTEGER REFERENCES customers(id),date TEXT NOT NULL,subtotal INTEGER NOT NULL,total INTEGER NOT NULL,paid INTEGER NOT NULL,change_due INTEGER NOT NULL,method TEXT NOT NULL,user_id INTEGER NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS quick_sale_items(id INTEGER PRIMARY KEY,sale_id INTEGER NOT NULL REFERENCES quick_sales(id),price_id INTEGER NOT NULL REFERENCES quick_prices(id),name TEXT NOT NULL,unit TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),price INTEGER NOT NULL CHECK(price>0),saved_price INTEGER NOT NULL,prescription INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS quick_returns(id INTEGER PRIMARY KEY,sale_id INTEGER NOT NULL REFERENCES quick_sales(id),item_id INTEGER NOT NULL REFERENCES quick_sale_items(id),quantity INTEGER NOT NULL,refund INTEGER NOT NULL,reason TEXT NOT NULL,user_id INTEGER NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_quick_prices_name ON quick_prices(name);
 CREATE INDEX IF NOT EXISTS idx_quick_sales_date ON quick_sales(date);
 `)}
function make({getDb,audit,getStore}){
 const db=()=>getDb();
 const one=(s,...args)=>db().prepare(s).get(...args);
 const all=(s,...args)=>db().prepare(s).all(...args);
 function search(input){
  const q=str(input,100).toLowerCase(),like='%'+q+'%';
  const saved=all('SELECT * FROM quick_prices WHERE lower(name) LIKE ? OR lower(brand) LIKE ? OR lower(generic) LIKE ? OR barcode=? ORDER BY updated_at DESC LIMIT 35',like,like,like,q).map(x=>({...x,lookup_id:'price:'+x.id,approved:true}));
  const stored=q?all('SELECT p.* FROM products p LEFT JOIN quick_prices qp ON qp.product_id=p.id WHERE qp.id IS NULL AND p.active=1 AND (lower(p.name) LIKE ? OR lower(p.generic) LIKE ? OR p.barcode=?) ORDER BY p.name LIMIT 10',like,like,q).map(x=>({lookup_id:'product:'+x.id,name:x.name,brand:x.brand,generic:x.generic,category:x.category,unit:x.unit||'unit',form:x.form,strength:x.strength,price:x.retail||0,approved:false,barcode:x.barcode,market:'Your existing product — Owner price approval needed'})):[];
  const featured=['pk:haleon:panadol-regular-500-tablet','everyday:condoms','everyday:sanitary-pads','everyday:face-wash','everyday:baby-diapers','everyday:toothpaste'];
  const suggestions=(q?catalog.search(q,0).rows:featured.map(catalog.find).filter(Boolean)).filter(x=>!one('SELECT id FROM quick_prices WHERE catalog_id=?',x.id)).slice(0,30).map(x=>({...x,lookup_id:'catalog:'+x.id,approved:false,price:0}));
  return {rows:[...saved,...stored,...suggestions].slice(0,50),total:saved.length+stored.length+suggestions.length,notice:'Unpriced references require Owner approval; no live Pakistan price feed is connected.'};
 }
 function savePrice(args,uid){
  const price=money(args.price);if(!price)throw Error('Owner must enter a positive selling price.');
  return db().transaction(()=>{
   let existing=args.id?one('SELECT * FROM quick_prices WHERE id=?',key(args.id)):null;
   if(args.id&&!existing)throw Error('Saved item was not found.');
   let base=null,ref=null,productId=null;
   if(!existing){ref=str(args.lookup_id,150);
    if(ref.startsWith('catalog:')){base=catalog.find(ref.slice(8));if(!base)throw Error('Catalogue entry not found.');ref=base.id}
    else if(ref.startsWith('product:')){productId=key(ref.slice(8));base=one('SELECT * FROM products WHERE id=? AND active=1',productId);if(!base)throw Error('Product not found.');ref=null}
    else if(ref==='custom')ref=null;
    else throw Error('Select a known item or choose Add custom item.');
    if((ref&&one('SELECT id FROM quick_prices WHERE catalog_id=?',ref))||(productId&&one('SELECT id FROM quick_prices WHERE product_id=?',productId)))throw Error('Item already has an approved price. Refresh the search.');
   }
   const category=base?.category||existing?.category||str(args.category,80)||'Everyday item';
   const medicine=category==='Medicine';
   const name=str(args.name||base?.name||existing?.name,160),unit=str(args.unit||base?.unit||existing?.unit,30);
   if(!name||!unit)throw Error('Enter an item name and its selling unit (tablet, pack, bottle, etc.).');
   // A medicine reference is always treated as medicine even if a request tries to relabel it.
   const barcode=str(args.barcode!==undefined?args.barcode:(base?.barcode||existing?.barcode),80)||null;
   const conflict=one('SELECT id FROM quick_prices WHERE lower(name)=lower(?) AND id<>? LIMIT 1',name,existing?.id||0);
   if(conflict)throw Error('Another item with this name already has a price. Use a distinct pack/strength name.');
   const at=now();let itemId;
   if(existing){db().prepare('UPDATE quick_prices SET name=?,unit=?,barcode=?,price=?,updated_at=?,updated_by=? WHERE id=?').run(name,unit,barcode,price,at,uid,existing.id);itemId=existing.id}
   else itemId=db().prepare('INSERT INTO quick_prices(catalog_id,product_id,name,brand,generic,category,form,strength,unit,barcode,price,prescription,source,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(ref,productId,name,base?.brand||'',base?.generic||'',category,base?.form||'',base?.strength||'',unit,barcode,price,medicine||base?.prescription?1:0,base?.source||'Owner-created local item',at,uid).lastInsertRowid;
   audit(uid,existing?'update':'approve','quick_price',itemId,{old_price:existing?.price??null,new_price:price,unit,source:base?.source||existing?.source||'Owner-created local item'});
   return {id:itemId,name,price,unit,category,prescription:medicine||base?.prescription?1:0};
  })();
 }
 function checkout(args,uid){return db().transaction(()=>{
  if(!Array.isArray(args.items)||!args.items.length||args.items.length>50)throw Error('Add 1 to 50 items to the bill.');
  const seen=new Set();let subtotal=0,hasMedicine=false;const items=[];
  for(const row of args.items){const p=one('SELECT * FROM quick_prices WHERE id=?',key(row.id));if(!p)throw Error('An item has no Owner-approved price.');if(one('SELECT 1 FROM products pr JOIN batches b ON b.product_id=pr.id WHERE pr.id=? OR lower(pr.name)=lower(?) OR (pr.barcode IS NOT NULL AND pr.barcode=?) LIMIT 1',p.product_id||0,p.name,p.barcode||''))throw Error('This item has tracked batches. Use Advanced → Batch sales so expiry and available stock are checked.');if(seen.has(p.id))throw Error('Duplicate cart item.');seen.add(p.id);
   const quantity=key(row.quantity);if(quantity>10000)throw Error('Quantity is too high.');
   const price=row.price===undefined?p.price:money(row.price);
   if(!price)throw Error('Selling price must be positive.');
   subtotal+=price*quantity;if(!Number.isSafeInteger(subtotal)||subtotal>10000000000)throw Error('Bill total is too large.');
   if(p.prescription)hasMedicine=true;
   items.push({p,quantity,price});
  }
  if(hasMedicine&&!args.prescriptionConfirmed)throw Error('Confirm that you have checked the actual pack, expiry and applicable prescription rules before selling medicines without tracked batches.');
  const customer=args.customer_id?one('SELECT id FROM customers WHERE id=?',key(args.customer_id)):null;
  if(args.customer_id&&!customer)throw Error('Customer not found.');
  const received=args.received===undefined?subtotal:money(args.received);
  if(received<subtotal)throw Error('Quick checkout requires full payment. Choose a received amount at least equal to the total.');
  const method=str(args.method,40)||'Cash',invoice='Q-'+Date.now().toString(36).toUpperCase()+'-'+require('crypto').randomBytes(3).toString('hex').toUpperCase();
  const sale=db().prepare('INSERT INTO quick_sales(invoice_no,customer_id,date,subtotal,total,paid,change_due,method,user_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(invoice,customer?.id||null,day(),subtotal,subtotal,subtotal,received-subtotal,method,uid,now());
  for(const {p,quantity,price} of items){db().prepare('INSERT INTO quick_sale_items(sale_id,price_id,name,unit,quantity,price,saved_price,prescription) VALUES(?,?,?,?,?,?,?,?)').run(sale.lastInsertRowid,p.id,p.name,p.unit,quantity,price,p.price,p.prescription);
   if(price!==p.price)audit(uid,'price_override','quick_sale',sale.lastInsertRowid,{item:p.name,approved_price:p.price,charged_price:price,unit:p.unit});
  }
  audit(uid,'sale','quick_sale',sale.lastInsertRowid,{invoice,subtotal,items:items.length,stock:'untracked'});
  return {id:sale.lastInsertRowid,invoice_no:invoice};
 })()}
 function getSale(id){const sale=one("SELECT s.*,coalesce(c.name,'Walk-in') customer,u.name cashier FROM quick_sales s LEFT JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=s.user_id WHERE s.id=?",key(id));if(!sale)throw Error('Quick sale not found.');const items=all('SELECT si.*,coalesce((SELECT sum(quantity) FROM quick_returns WHERE item_id=si.id),0) returned FROM quick_sale_items si WHERE sale_id=?',sale.id);return {sale,items,returns:all('SELECT * FROM quick_returns WHERE sale_id=? ORDER BY id',sale.id),store:getStore(),stock:'untracked'}}
 function listSales(){return all("SELECT s.*,coalesce(c.name,'Walk-in') customer,u.name cashier,coalesce((SELECT sum(refund) FROM quick_returns WHERE sale_id=s.id),0) refunded FROM quick_sales s LEFT JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=s.user_id ORDER BY s.id DESC LIMIT 200")}
 function refund(args,uid){return db().transaction(()=>{
  const item=one('SELECT si.*,s.invoice_no FROM quick_sale_items si JOIN quick_sales s ON s.id=si.sale_id WHERE si.id=?',key(args.item_id));if(!item)throw Error('Bill item not found.');const quantity=key(args.quantity),returned=one('SELECT coalesce(sum(quantity),0) n FROM quick_returns WHERE item_id=?',item.id).n;
  if(quantity>item.quantity-returned)throw Error('Return exceeds units sold.');const reason=str(args.reason,500);if(!reason)throw Error('Enter a return reason.');
  const refund=quantity*item.price;const r=db().prepare('INSERT INTO quick_returns(sale_id,item_id,quantity,refund,reason,user_id,created_at) VALUES(?,?,?,?,?,?,?)').run(item.sale_id,item.id,quantity,refund,reason,uid,now());audit(uid,'return','quick_sale',item.sale_id,{item:item.name,quantity,refund,stock:'untracked'});return {id:r.lastInsertRowid,refund};
 })()}
 return {search,savePrice,checkout,getSale,listSales,refund};
}
module.exports={init,make};
