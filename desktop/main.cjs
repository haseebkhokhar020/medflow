const {app, BrowserWindow, ipcMain, dialog, shell} = require('electron');
const path = require('path');
let win, service;
if(!app.requestSingleInstanceLock())app.quit();
else{
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
app.whenReady().then(()=>{
  service=require('../server/service.cjs').createService(path.join(app.getPath('userData'),'data'));
  ipcMain.handle('medflow:call',async (_event, method, args)=>{
    if(method==='chooseBackup'){ const r=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'MedFlow backup',extensions:['sqlite']}]}); return r.canceled?null:r.filePaths[0]; }
    if(method==='openBackups'){await shell.openPath(service.backupDir);return true;}
    return service.call(method,args||{});
  });
  win=new BrowserWindow({width:1440,height:900,minWidth:1060,minHeight:680,backgroundColor:'#f6f8fa',show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:false}});
  win.once('ready-to-show',()=>win.show());
  win.loadFile(path.join(__dirname,'../dist/index.html'));
  win.on('closed',()=>{win=null});
}).catch(error=>{dialog.showErrorBox('MedFlow could not start',error.message||String(error));app.quit()});
}
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('before-quit',()=>{try{service?.close()}catch{}});
