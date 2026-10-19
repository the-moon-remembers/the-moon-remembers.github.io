// A private, browser-local collection. No request uploads a visitor's file.
export const MAX_UPLOAD_BYTES=12*1024*1024;
export const LOCAL_MEMORY_LIMIT=40;
export function validateMemoryFile(file){
  if(!file||!/^image\/(jpeg|png|webp|avif|heic|heif)$/i.test(file.type))throw new Error('Choose a JPEG, PNG, WebP, AVIF or HEIC photograph.');
  if(!file.size||file.size>MAX_UPLOAD_BYTES)throw new Error('Please choose an image smaller than 12 MB.');
}
export function memoryFields(values){
  const clean=(value,limit)=>String(value??'').trim().slice(0,limit);
  const title=clean(values.title,80),place=clean(values.place,100);
  if(!title||!place)throw new Error('Add a title and a place for this memory.');
  return{title,place,year:clean(values.year,32)||'Date unconfirmed',description:clean(values.description,500)};
}
export async function prepareMemory(file,values){
  validateMemoryFile(file);const fields=memoryFields(values);
  let bitmap,temporary;
  try{
    if(typeof createImageBitmap==='function')bitmap=await createImageBitmap(file);
    else{temporary=URL.createObjectURL(file);bitmap=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=temporary;});}
    const width=bitmap.width||bitmap.naturalWidth,height=bitmap.height||bitmap.naturalHeight;
    if(!width||!height)throw new Error('image');
    const scale=Math.min(1,1600/Math.max(width,height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d');if(!context)throw new Error('canvas');context.fillStyle='#142548';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));if(!blob)throw new Error('image');
    return{...fields,id:'local-'+(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2)),blob,addedAt:Date.now(),local:true,author:'Your local collection',license:'Private browser copy',sourceUrl:''};
  }catch(error){if(error.message&&/^(Choose|Please|Add)/.test(error.message))throw error;throw new Error('This image could not be read. Try a JPEG or PNG copy.');}
  finally{bitmap?.close?.();if(temporary)URL.revokeObjectURL(temporary);}
}
export class MemoryVault {
  open(){if(this.database)return this.database;this.database=new Promise((resolve,reject)=>{if(!globalThis.indexedDB){reject(new Error('Browser storage is unavailable.'));return;}const request=indexedDB.open('moon-remembers-local-memories',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('memories'))request.result.createObjectStore('memories',{keyPath:'id'});};request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Close another archive tab and try again.'));});return this.database;}
  async transaction(mode,operation){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('memories',mode),request=operation(tx.objectStore('memories'));let result;request.onsuccess=()=>{result=request.result;};request.onerror=()=>reject(request.error);tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage interrupted.'));});}
  list(){return this.transaction('readonly',store=>store.getAll());}
  put(record){return this.transaction('readwrite',store=>store.put(record));}
  remove(id){return this.transaction('readwrite',store=>store.delete(id));}
}
