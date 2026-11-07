import { makeEngine } from './engine.js';
import { SaveSession } from './session.js';
import { integer, hpDV, slotKey, validatePatch, SAVE_SIZE } from './validation.js';
import { storeBackup, latestBackup, download } from './backups.js';
import { movesEs } from './moves-es.js';

const $ = id => document.getElementById(id);
const engine = makeEngine();
const session = new SaveSession(engine);
let busy=false, selected=null, currentDetails=null, entries=[], pending=false, report=null;
const stats=[['attack','Ataque'],['defense','Defensa'],['speed','Velocidad'],['specialAttack','Especial']];
function message(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function controls(){
  const loaded=session.ready, backed=$('backup-confirm').checked;
  $('save-file').disabled=busy; $('recover').disabled=busy; $('location').disabled=busy;
  $('backup').disabled=busy||!loaded; $('backup-confirm').disabled=busy||!loaded;
  $('export').disabled=busy||!loaded||!backed||pending; $('reset').disabled=busy||!loaded||!session.history.length;
  $('edit-fields').disabled=busy||!loaded||!backed;
  document.querySelectorAll('.pokemon').forEach(b=>b.disabled=busy);
  $('report').disabled=busy;
}
async function action(fn){if(busy)return;busy=true;controls();try{await fn();}catch(e){message(e.message||String(e),true);}finally{busy=false;controls();}}
function hasPending(){return pending && !confirm('Hay una edición sin aplicar. ¿Descartarla?');}
function dirty(){pending=true;$('pending').textContent='Hay cambios en el formulario sin aplicar.';controls();}
engine.onStatusChange(s=>{
  $('engine-status').textContent=s.state==='ready'?'Motor listo · PKHeX Everywhere 0.31.0':s.state==='failed'?'No se pudo iniciar el motor. Recarga la página y comprueba la conexión.':`Preparando motor… ${s.total?`${s.loaded}/${s.total} archivos`:''}`;
});
for(const [key,label] of stats) addNumber('dv-fields',`dv-${key}`,label,15);
for(const [key,label] of [['health','PS'],...stats]) addNumber('ev-fields',`ev-${key}`,label,65535);
for(let i=0;i<4;i++){
  const label=document.createElement('label');label.className='field';
  const text=document.createElement('span');text.textContent=`Movimiento ${i+1}`;
  const select=document.createElement('select');select.id=`move-${i}`;label.append(text,select);$('move-fields').append(label);
}
function addNumber(parent,id,text,max){const label=document.createElement('label');label.className='field';const span=document.createElement('span');span.textContent=text;const input=document.createElement('input');Object.assign(input,{id,type:'number',min:'0',max:String(max),step:'1',required:true,inputMode:'numeric'});label.append(span,input);$(parent).append(label);}
function updateDV(){const ivs=Object.fromEntries(stats.map(([key])=>[key,Number($(`dv-${key}`).value)]));const valid=stats.every(([key])=>Number.isInteger(ivs[key])&&ivs[key]>=0&&ivs[key]<=15);$('dv-hp').textContent=valid?`DV de PS calculado: ${hpDV(ivs)} / 15`:'Completa DVs válidos de 0 a 15.';}
function options(select,rows){select.replaceChildren(...rows.map(r=>new Option(r.name,String(r.id))));}
async function importBytes(bytes,name){
  message('Comprobando estructura y abriendo el guardado…');
  await session.load(bytes,name);
  let stored=false;
  try {await storeBackup(session.original,session.name);stored=true;}catch{}
  $('backup-status').textContent=stored?'Original respaldado en este navegador. Descarga una copia independiente antes de editar.':'El navegador no permitió guardar un respaldo local. Descarga el original antes de editar.';
  $('backup-confirm').checked=false;selected=null;currentDetails=null;pending=false;report=null;
  $('report').hidden=true;$('editor').hidden=true;$('empty').hidden=true;
  for(const id of ['file-info','roster-card','export-card'])$(id).hidden=false;
  $('file-name').textContent=session.name;$('original-hash').textContent=session.originalHash;
  const trainer=await engine.trainer.get();$('trainer').textContent=`${trainer.name} · ID ${trainer.id}`;
  options($('species'),(await engine.species.list()).map(s=>({id:s.id,name:s.name})).filter(s=>s.id>=1&&s.id<=151));
  const moves=(await engine.game.moves()).filter(m=>m.id<=165);if(!moves.some(m=>m.id===0))moves.unshift({id:0,name:'Sin movimiento'});
  const translated=moves.map(m=>({id:m.id,name:m.id===0?'Sin movimiento':(movesEs[m.id]||m.name)})).sort((a,b)=>a.id===0?-1:b.id===0?1:a.name.localeCompare(b.name,'es'));
  for(let i=0;i<4;i++)options($(`move-${i}`),translated);
  const boxes=await engine.box.list();$('location').replaceChildren(new Option('Equipo','party'),...boxes.map(b=>new Option(`Caja ${b.box+1}`,String(b.box))));
  await refresh();if(!entries.some(p=>p.at.source==='party')&&entries.length){$('location').value=String(entries[0].at.box);renderRoster();}
  message('Partida abierta. Descarga y comprueba tu respaldo antes de editar.');
}
$('save-file').addEventListener('change',()=>{
  const file=$('save-file').files[0];$('save-file').value='';if(!file)return;
  if((session.history.length||pending)&&!confirm('Abrir otra partida descarta los cambios de esta sesión. ¿Continuar?'))return;
  action(async()=>{if(file.size!==SAVE_SIZE)throw new Error('El archivo debe tener exactamente 32.768 bytes; extrae el guardado con tu gestor de partidas.');await importBytes(new Uint8Array(await file.arrayBuffer()),file.name);});
});
$('recover').onclick=()=>{if((session.history.length||pending)&&!confirm('¿Descartar esta sesión y abrir el último respaldo local?'))return;action(async()=>{const row=await latestBackup();if(!row)throw new Error('Todavía no hay respaldos en este navegador.');await importBytes(new Uint8Array(row.bytes),row.name);});};
$('backup').onclick=()=>{download(session.original,`original-${session.originalHash.slice(0,8)}-${session.name}.bak`);message('Respaldo solicitado. Comprueba la descarga y marca la casilla para habilitar la edición.');};
$('backup-confirm').onchange=controls;
async function refresh(){entries=await session.entries();$('roster-count').textContent=`${entries.length} Pokémon`;$('change-count').textContent=session.history.length?`${session.history.length} cambio(s) aplicado(s).`:'Sin cambios aplicados: exportación idéntica al original.';$('history').replaceChildren(...session.history.map((c,i)=>{const li=document.createElement('li');li.textContent=`${i+1}. ${c.at.source==='party'?'Equipo':`Caja ${c.at.box+1}`} · posición ${c.at.slot+1}`;return li;}));renderRoster();}
function renderRoster(){
  const value=$('location').value;
  const list=entries.filter(p=>value==='party'?p.at.source==='party':p.at.source==='box'&&p.at.box===Number(value));
  $('roster').replaceChildren();
  if(!list.length){const p=document.createElement('p');p.className='hint';p.textContent='Esta ubicación está vacía.';$('roster').append(p);}
  for(const p of list){
    const b=document.createElement('button');b.className='pokemon';b.type='button';b.setAttribute('aria-pressed',String(Boolean(selected&&slotKey(selected)===slotKey(p.at))));
    const name=document.createElement('span');name.textContent=p.nickname||p.species;
    const details=document.createElement('small');details.textContent=`${p.species} · Nv. ${p.level} · #${p.at.slot+1}`;b.append(name,details);
    b.onclick=()=>{if(hasPending())return;action(()=>selectPokemon(p.at));};$('roster').append(b);
  }
}
$('location').onchange=()=>{renderRoster();controls();};
async function selectPokemon(at){
  const detail=await engine.pokemon.details(at);selected={...at};currentDetails=detail;pending=false;
  $('editor').hidden=false;$('pokemon-title').textContent=detail.nickname;
  $('pokemon-origin').textContent=`Entrenador original: ${detail.originalTrainerName} · ID ${detail.trainerId} · ${at.source==='party'?'Equipo':`Caja ${at.box+1}`}, posición ${at.slot+1}`;
  $('species').value=String(detail.species);$('nickname').value=detail.nickname;$('level').value=detail.level;$('experience').textContent=detail.experience.toLocaleString('es');
  for(const [key]of stats)$(`dv-${key}`).value=detail.ivs[key];
  for(const [key]of [['health'],...stats])$(`ev-${key}`).value=detail.evs[key];
  for(let i=0;i<4;i++)$(`move-${i}`).value=String(detail.moves[i].id);
  $('pending').textContent='Los controles no modifican la partida hasta aplicar.';updateDV();showLegality(detail.legality);renderRoster();controls();
}
function showLegality(result){
  $('legality').className=`notice${result?.valid?' ok':''}`;
  $('legality').textContent=result===null?'El motor no proporcionó un análisis de legalidad.':result.valid?'PKHeX no detecta problemas en este Pokémon.':'PKHeX detecta problemas en este Pokémon. Revisa el detalle antes de restaurar.';
  $('legality-details').textContent=result?.messages?.join('\n')||(result?.valid?'Sin incidencias reportadas por el motor.':'Sin información.');
}
$('edit-form').addEventListener('input',()=>{dirty();updateDV();});
$('edit-form').addEventListener('change',dirty);
$('max-dvs').onclick=()=>{for(const [key]of stats)$(`dv-${key}`).value=15;dirty();updateDV();};
$('shiny-dvs').onclick=()=>{for(const [key]of stats)$(`dv-${key}`).value=10;dirty();updateDV();};
$('cancel-edit').onclick=()=>action(()=>selectPokemon(selected));
function formPatch(){
  const patch={};
  const species=integer($('species').value,1,151,'Especie'),level=integer($('level').value,1,100,'Nivel');
  if(species!==currentDetails.species)patch.species=species;if(level!==currentDetails.level)patch.level=level;
  if($('nickname').value!==currentDetails.nickname)patch.nickname=$('nickname').value;
  for(const [name,prefix,max,keys]of [['ivs','dv',15,stats],['evs','ev',65535,[['health'],...stats]]]){
    const values=Object.fromEntries(keys.map(([key])=>[key,integer($(`${prefix}-${key}`).value,0,max,name==='ivs'?'DV':'Experiencia de estadística')]));
    if(Object.entries(values).some(([k,v])=>v!==currentDetails[name][k])){values.specialDefense=values.specialAttack;patch[name]=values;}
  }
  const moves=Array.from({length:4},(_,i)=>integer($(`move-${i}`).value,0,165,'Movimiento'));
  if(moves.some((m,i)=>m!==currentDetails.moves[i].id))patch.moves=moves;
  return validatePatch(patch);
}
$('edit-form').onsubmit=e=>{e.preventDefault();action(async()=>{
  const patch=formPatch();if(!Object.keys(patch).length){pending=false;message('No hay cambios para aplicar.');return;}
  message('Aplicando y comprobando la relectura…');
  await session.apply(selected,patch);report=null;$('report').hidden=true;await refresh();await selectPokemon(selected);
  message('Cambio aplicado. El archivo se volvió a abrir y conserva los datos de los Pokémon.');
});};
$('reset').onclick=()=>{if(!confirm('¿Volver al original y descartar todos los cambios de esta sesión?'))return;action(async()=>{await session.reset();selected=null;pending=false;report=null;$('report').hidden=true;$('editor').hidden=true;await refresh();message('Sesión restaurada al original.');});};
$('export').onclick=()=>action(async()=>{
  message('Verificando integridad y releyendo los Pokémon…');const result=await session.export();
  report={application:'Pokémon Lab 0.2.0',engine:'@pkhex-everywhere/engine 0.31.0',time:new Date().toISOString(),file:result.fileName,bytes:result.bytes.length,sha256:result.hash,originalSha256:result.originalHash,changes:result.changes,checks:['Tamaño 32768','Estructura internacional','Listas de Pokémon','Checksum principal','Relectura y comparación de datos de todos los Pokémon'],limits:['Sin prueba física 3DS','No identifica origen VC ni distingue Rojo/Azul','No garantiza legalidad ni aceptación en servicios oficiales']};
  download(result.bytes,result.fileName);$('report').hidden=false;message('Guardado verificado y descarga solicitada. Revisa el archivo en Descargas antes de transferirlo.');
});
$('report').onclick=()=>download(JSON.stringify(report,null,2),'pokemon-lab-informe.json','application/json');
window.addEventListener('beforeunload',e=>{if(pending||session.history.length){e.preventDefault();e.returnValue='';}});
controls();
