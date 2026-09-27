// Read-only medicine *entry suggestions*. This is not stock, a price list,
// prescribing advice, or evidence that a drug is registered in Pakistan.
const fs=require('fs');
const path=require('path');
const zlib=require('zlib');
const region=require('../assets/medicine/pakistan.json');
const everyday=require('../assets/medicine/everyday.json');
let cache;
function load(){
 if(cache)return cache;
 const file=path.join(__dirname,'../assets/medicine/rxterms-202609.json.gz');
 const international=JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
 const rows=[...region.map(x=>({...x,market:'Pakistan',source:'Haleon Pakistan product information',category:'Medicine',priority:0})),
  ...everyday.map(x=>({...x,priority:0})),
  ...international.map(x=>({...x,market:'International / US terminology',source:'NLM RxTerms 2026-09',category:'Medicine',priority:1}))];
 const byId=new Map();
 for(const row of rows){
  row.key=[row.name,row.brand,row.generic,row.aliases].filter(Boolean).join(' ').toLocaleLowerCase('en');
  byId.set(row.id,row);
 }
 cache={rows,byId};return cache;
}
function publicRow(row){const {key,priority,...result}=row;return result}
function find(id){const row=load().byId.get(String(id||''));return row?publicRow(row):null}
function search(input,offset=0){
 const q=String(input||'').trim().toLocaleLowerCase('en').slice(0,100);
 const page=Math.max(0,Math.min(100000,Math.floor(Number(offset)||0)));
 if(!q)return {rows:[],total:0,coverage:'Pakistan manufacturer examples + NLM RxTerms (US terminology)'};
 const words=q.split(/\s+/).filter(Boolean);const hits=[];
 for(const row of load().rows){
  if(!words.every(w=>row.key.includes(w)))continue;
  const name=row.name.toLocaleLowerCase('en'),brand=row.brand.toLocaleLowerCase('en'),generic=row.generic.toLocaleLowerCase('en');
  const rank=row.priority*100+(brand===q?0:name===q?1:brand.startsWith(q)?2:name.startsWith(q)?3:generic.startsWith(q)?5:10);
  hits.push({row,rank});
 }
 hits.sort((a,b)=>a.rank-b.rank||a.row.name.localeCompare(b.row.name));
 return {rows:hits.slice(page,page+40).map(x=>publicRow(x.row)),total:hits.length,
  coverage:'Pakistan manufacturer examples + NLM RxTerms (US terminology)'};
}
module.exports={search,find,count:()=>load().rows.length};
