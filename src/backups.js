import { sha256 } from './validation.js';
async function openDB() {
  return new Promise((resolve,reject) => {
    const req=indexedDB.open('pokemon-lab-backups',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('originals',{keyPath:'hash'});
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
export async function storeBackup(bytes, name) {
  const hash=await sha256(bytes); const db=await openDB();
  try {
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('originals','readwrite');
      const store=tx.objectStore('originals'); const get=store.get(hash);
      get.onsuccess=()=>{ if(!get.result) store.add({hash,name,bytes:bytes.slice(),created:new Date().toISOString()}); };
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error);
    });
  } finally {db.close();}
  return hash;
}
export async function latestBackup() {
  const db=await openDB();
  try {
    const rows=await new Promise((resolve,reject)=>{ const req=db.transaction('originals').objectStore('originals').getAll(); req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error); });
    const row=rows.sort((a,b)=>b.created.localeCompare(a.created))[0];
    if (row && await sha256(row.bytes)!==row.hash) throw new Error('El respaldo almacenado no coincide con su huella original.');
    return row;
  } finally { db.close(); }
}
export function download(bytes,name,type='application/octet-stream') {
  const url=URL.createObjectURL(new Blob([bytes],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
