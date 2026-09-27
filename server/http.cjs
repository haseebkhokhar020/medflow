const http=require('http');
const path=require('path');
const {createService}=require('./service.cjs');
const service=createService(process.env.MEDFLOW_DATA || path.join(__dirname,'../.medflow-data'));
http.createServer(async(req,res)=>{
  if(req.url!=='/api/call'||req.method!=='POST'){res.writeHead(404);res.end();return;}
  try{let body='';for await(const chunk of req){body+=chunk;if(body.length>2e6)throw Error('Request too large');}
    const {method,args}=JSON.parse(body);const data=await service.call(method,args||{});
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,data}));
  }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:e.message||'Operation failed'}));}
}).listen(4174,'127.0.0.1',()=>console.log('MedFlow local development API on 4174'));
