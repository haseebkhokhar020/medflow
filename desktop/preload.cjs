const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('medflow',{call:(method,args)=>ipcRenderer.invoke('medflow:call',method,args)});
