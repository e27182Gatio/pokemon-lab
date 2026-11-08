import {makeEngine} from './engine.js';
import {RaichuSession} from './raichu-session.js';
import {META,ORIGINS,STAT_KEYS,seasonState,showdown} from './raichu-config.js';
import {download} from './backups.js';
const $=id=>document.getElementById(id),engine=makeEngine(),session=new RaichuSession(engine);
let busy=false,dirty=true,rows=[],resultOrigin=32;
const statLabels=['PS','Ataque','Defensa','At. Especial','Def. Especial','Velocidad'];
function message(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function options(){return {level:Number($('level').value),perfect:$('perfect').checked,shiny:$('shiny').checked,meta:$('use-meta').checked};}
function controls(){
  const loaded=Boolean(session.original),backed=$('backup-confirm').checked;
  $('settings').disabled=busy;for(const id of ['main-file','target','backup-confirm','copy-code'])$(id).disabled=busy;
  $('origin').disabled=busy||loaded;$('trainer-name').disabled=busy||loaded;
  $('prepare').disabled=busy||(loaded&&!backed);$('backup').disabled=busy||!loaded;$('reset').disabled=busy||!loaded;
  $('download-pk7').disabled=busy||dirty||!session.selected;
  $('download-save').disabled=busy||dirty||!session.selected||!backed;
  $('prepare').textContent=loaded?($('target').value==='new'?'Añadir Raichu a una caja vacía':'Aplicar a este Raichu'):'Crear Raichu de Alola';
}
async function action(fn){if(busy)return;busy=true;controls();try{await fn();}catch(e){message(e.message||String(e),true);}finally{busy=false;controls();}}
function updatePreview(){try{$('trade-code').value=showdown(options());}catch(e){$('trade-code').value=e.message;}}
function changed(){dirty=true;$('result').hidden=true;updatePreview();controls();}
function season(){const s=seasonState();$('season-status').textContent=s==='active'?'Temporada 19 en curso · finaliza el 13/11/2026 a las 01:59 UTC.':s==='expired'?'Temporada 19 finalizada. Este es un set histórico: consulta las reglas actuales antes de competir.':'Set preparado para la temporada 19, aún no iniciada.';if(s!=='active'){$('use-meta').checked=false;$('meta-toggle-label').textContent='Aplicar el set guardado de temporada 19 (no vigente).';}}
for(const move of META.moves){const li=document.createElement('li'),strong=document.createElement('strong');strong.textContent=`${move.es} (${move.en})`;li.append(strong,document.createElement('br'),document.createTextNode(move.use));$('moves').append(li);}
engine.onStatusChange(s=>{$('engine-status').textContent=s.state==='ready'?'Motor listo · PKHeX Everywhere 0.31.0':s.state==='failed'?'No se pudo iniciar el motor. Recarga para volver a intentarlo.':'Preparando motor…';});
async function refreshTargets(){
  rows=await session.list();$('target').replaceChildren(new Option('Añadir Raichu a la primera posición vacía','new'));
  rows.forEach((r,i)=>$('target').add(new Option(`Raichu · caja ${r.at.box+1}, posición ${r.at.slot+1} · Nv. ${r.level}`,String(i))));
}
async function opened(){
  $('origin').value=String(session.version);$('save-panel').hidden=false;$('backup-confirm').checked=false;
  $('save-info').textContent=`${session.name} · ${ORIGINS[session.version]} · original conservado`;
  await refreshTargets();changed();message('Guardado abierto. Descarga y conserva el respaldo original antes de editar.');
}
$('main-file').onchange=()=>{const file=$('main-file').files[0];$('main-file').value='';if(!file)return;
  if(session.targets.length&&!confirm('¿Descartar los cambios de esta sesión y abrir otro guardado?'))return;
  action(async()=>{await session.load(new Uint8Array(await file.arrayBuffer()),file.name);await opened();});};
$('backup').onclick=()=>{download(session.original,`original-${session.originalHash.slice(0,8)}-${session.name}.bak`);message('Descarga solicitada. Comprueba el respaldo y marca la casilla para continuar.');};
$('backup-confirm').onchange=controls;
$('reset').onclick=()=>action(async()=>{await session.reset();await opened();});
$('target').onchange=()=>action(async()=>{changed();if($('target').value!=='new'){const d=await engine.pokemon.details(rows[Number($('target').value)].at);$('level').value=d.level;$('shiny').checked=d.isShiny;updatePreview();}});
for(const id of ['level','perfect','shiny','use-meta','origin','trainer-name'])$(id).addEventListener('input',changed);
$('prepare').onclick=()=>action(async()=>{
  dirty=true;$('result').hidden=true;
  if(session.original&&!$('backup-confirm').checked)throw new Error('Conserva primero el respaldo original.');
  message('Preparando a Raichu y comprobando su origen, movimientos y exportación…');
  if(!session.original)await session.standalone(Number($('origin').value),$('trainer-name').value);
  const at=session.original&&$('target').value!=='new'?rows[Number($('target').value)].at:null;
  const d=await session.prepare(options(),at);dirty=false;resultOrigin=d.version;
  $('summary').textContent=`Raichu de Alola · Nv. ${d.level} · ${d.isShiny?'Shiny':'Normal'} · origen ${ORIGINS[d.version]}`;
  $('stats').replaceChildren(...STAT_KEYS.map((k,i)=>{const p=document.createElement('p');p.textContent=`${statLabels[i]}: IV ${d.ivs[k]} · EV ${d.evs[k]}`;return p;}));
  $('legality').textContent='PKHeX no detectó incompatibilidades. El Pokémon conserva sus datos al exportar y volver a abrir.';$('legality').className='notice ok';
  $('details').textContent=`Entrenador: ${d.originalTrainerName}\nID: ${d.trainerId}\nJuego: ${ORIGINS[d.version]}\nNivel de encuentro: ${d.metLevel}\nFecha: ${d.metDate}\nMovimientos: ${d.moves.map(m=>m.name).join(', ')}\nLa validación del archivo no garantiza aceptación por servicios oficiales.`;
  $('download-save').hidden=!session.original;$('result').hidden=false;
  if(session.original){const selected=session.selected;await refreshTargets();const index=rows.findIndex(r=>r.at.box===selected.box&&r.at.slot===selected.slot);$('target').value=String(index);}
  message('Raichu preparado y verificado. Ya puedes descargarlo.');
});
$('download-pk7').onclick=()=>action(async()=>{const file=await session.exportPokemon();download(file.bytes,`Raichu-Alola-${resultOrigin===32?'Ultra-Sol':'Ultra-Luna'}.pk7`);message('Descarga del Pokémon solicitada.');});
$('download-save').onclick=()=>action(async()=>{const file=await session.exportSave();download(file.bytes,file.fileName);message('Guardado verificado: se conservan los datos ajenos a los cambios de Raichu. Descarga solicitada.');});
$('copy-code').onclick=async()=>{try{const code=showdown(options());await navigator.clipboard.writeText(code);$('copy-status').textContent='Código copiado.';}catch{$('trade-code').focus();$('trade-code').select();$('copy-status').textContent='Selecciona y copia el código del recuadro.';}};
window.addEventListener('beforeunload',e=>{if(session.original&&session.targets.length){e.preventDefault();e.returnValue='';}});
season();updatePreview();controls();

