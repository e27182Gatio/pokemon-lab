import { makeEngine } from './engine.js';
import { SaveSession } from './session.js';
import { makeFixture } from './test-fixture.js';
import { validateBytes, checksum, CHECKSUM_OFFSET, sameBytes, hpDV } from './validation.js';
import { storeBackup, latestBackup, download } from './backups.js';
const out=document.getElementById('results'), run=document.getElementById('run-tests');
let fixture;
const engine=makeEngine();
function assert(ok,message){if(!ok)throw new Error(message);}
function pass(message){out.textContent+=`✓ ${message}\n`;}
async function reject(fn){let rejected=false;try{await fn();}catch{rejected=true;}assert(rejected,'Se aceptó una operación que debía rechazarse.');}
run.onclick=async()=>{
  run.disabled=true;out.dataset.result='running';out.textContent='Iniciando motor real…\n';
  try{
    fixture=await makeFixture(engine);validateBytes(fixture);pass('Fixture sintético internacional con equipo y caja.');
    const s=new SaveSession(engine);await s.load(fixture,'sav.dat');
    assert((await s.entries()).length===3,'Faltan Pokémon del fixture.');pass('Importa y lee 1 Pokémon de equipo y 2 de caja.');
    const original=fixture.slice();const clean=await s.export();assert(sameBytes(clean.bytes,original),'Exportación sin cambios distinta.');pass('Exportación sin cambios idéntica byte por byte.');
    await storeBackup(s.original,'fixture-sintetico-NO-RESTAURAR.sav');const recovered=await latestBackup();assert(recovered&&sameBytes(recovered.bytes,s.original),'Respaldo diferente.');pass('Respaldo persistente con SHA-256 y recuperación.');
    const party={source:'party',slot:0};
    await s.apply(party,{level:70,ivs:{attack:15,defense:15,speed:15,specialAttack:15,specialDefense:15},evs:{health:65535,attack:65535,defense:65535,speed:65535,specialAttack:65535,specialDefense:65535}});
    let p=await engine.pokemon.details(party);assert(p.level===70&&p.ivs.health===15&&p.evs.health===65535,'Estadísticas no persistieron.');pass('Edita nivel, DVs y experiencia de estadísticas del equipo; exporta y relee.');
    assert(sameBytes(s.original,original),'Se modificó el original.');pass('Original intacto después de editar.');
    const box={source:'box',box:0,slot:1};
    await s.apply(box,{species:6,level:71,nickname:'CHARIZARD',moves:[53,19,163,0],ivs:{attack:10,defense:10,speed:10,specialAttack:10,specialDefense:10}});
    p=await engine.pokemon.details(box);assert(p.species===6&&p.nickname==='CHARIZARD'&&p.level===71&&p.ivs.health===hpDV(p.ivs)&&p.moves[0].id===53,'Edición de caja incorrecta.');pass('Edita especie, mote, nivel, movimientos y DVs en caja; relee los cambios.');
    const exp=await s.export();validateBytes(exp.bytes);assert(sameBytes(exp.bytes.slice(0,0x2000),original.slice(0,0x2000)),'Cambió el banco opaco.');pass('Checksum correcto y banco no editado intacto.');
    const stable=s.current.slice();
    await reject(()=>s.apply(party,{level:101}));await reject(()=>s.apply(party,{ivs:{attack:31}}));
    assert(sameBytes(s.current,stable),'Cambió el estado tras un rechazo.');pass('Rechaza nivel 101 y DV 31 sin alterar la sesión.');
    const broken=original.slice();broken[0x2605]^=1;await reject(()=>s.load(broken,'roto.dat'));
    assert(sameBytes(s.current,stable),'Se perdió la sesión por importar un archivo corrupto.');pass('Rechaza checksum incorrecto y conserva la sesión anterior.');
    await reject(()=>s.load(original.slice(0,-1),'corto.sav'));await reject(()=>s.load(new Uint8Array(32768),'vacio.sav'));pass('Rechaza archivo truncado y bytes vacíos.');
    const badList=original.slice();badList[0x2f2c]=7;badList[CHECKSUM_OFFSET]=checksum(badList);await reject(()=>s.load(badList,'lista.dat'));pass('Rechaza lista de equipo inválida aunque tenga checksum correcto.');
    const realUpdate=engine.pokemon.update;
    engine.pokemon.update=async()=>{throw new Error('Fallo de motor simulado');};
    await reject(()=>s.apply(party,{level:60}));engine.pokemon.update=realUpdate;
    assert(sameBytes(s.current,stable),'No se recuperó la sesión.');assert((await engine.pokemon.details(party)).level===70,'Motor quedó alterado.');pass('Recupera el estado anterior ante un fallo del motor.');
    await s.reset();assert(sameBytes((await s.export()).bytes,original),'Deshacer no recuperó original.');pass('Deshacer recupera el archivo original exacto.');
    const yellow=await makeFixture(engine,38);
    await s.load(yellow,'yellow.sav');
    assert((await engine.game.version()).versionId===38,'Yellow no reconocido.');
    assert(sameBytes((await s.export()).bytes,yellow),'Yellow sin editar cambió.');pass('Yellow: detección e importación/exportación sin cambios exacta.');
    await s.apply(party,{level:50});
    await s.apply(box,{nickname:'AMARILLO',level:51});
    const y=(await s.export()).bytes;validateBytes(y);
    assert(y[0x271c]===139&&y[0x29c3]===0x54,'Datos Pikachu alterados.');
    assert(sameBytes(y.slice(0x271c,0x2f2c),yellow.slice(0x271c,0x2f2c)),'Progreso Yellow alterado.');
    assert((await engine.pokemon.details(party)).level===50&&(await engine.pokemon.details(box)).nickname==='AMARILLO','Yellow no persistió.');
    pass('Yellow: edición de equipo/caja, relectura y conservación de amistad, starter y progreso.');
    await s.reset();assert(sameBytes((await s.export()).bytes,yellow),'Reset Yellow incorrecto.');pass('Yellow: deshacer conserva original exacto.');
    out.textContent+='\nTODAS LAS PRUEBAS PASARON.\nDatos sintéticos; no acredita restauración en una 3DS real.\n';out.dataset.result='pass';
    document.getElementById('download-fixture').hidden=false;
  }catch(e){out.textContent+=`\nFALLO: ${e.message}\n${e.stack||''}`;out.dataset.result='fail';}
  finally{run.disabled=false;}
};
document.getElementById('download-fixture').onclick=()=>download(fixture,'fixture-sintetico-NO-RESTAURAR.sav');
