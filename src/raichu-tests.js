import {RaichuSession} from './raichu-session.js';
import {validateUSUM} from './usum-validation.js';
import {META,STAT_KEYS} from './raichu-config.js';
import {sameBytes} from './validation.js';
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const options={level:70,shiny:true,perfect:true,meta:true};
export async function testRaichu(engine,pass){
  for(const version of [32,33]){
    const s=new RaichuSession(engine);await s.standalone(version,'LAB');
    const d=await s.prepare(options);assert(d.version===version&&d.species===26&&d.form===1,'Origen o forma incorrectos.');
    assert(d.isShiny&&d.level===70&&d.legality.valid&&d.originalTrainerName==='LAB','Configuración inválida.');
    assert(STAT_KEYS.every(k=>d.ivs[k]===31),'IVs imperfectos.');
    assert(d.nature===15&&d.heldItem===275&&d.ball===11,'Naturaleza, objeto o Ball incorrectos.');
    assert(JSON.stringify(d.moves.map(m=>m.id))===JSON.stringify(META.moves.map(m=>m.id)),'Ataques incorrectos.');
    const file=await s.exportPokemon();
    assert(file.generation===7&&file.fileName.endsWith('.pk7')&&[232,260].includes(file.bytes.length),'Exportación PK7 incorrecta.');
    let blocked=false;try{await s.exportSave();}catch{blocked=true;}assert(blocked,'Se permitió descargar un guardado artificial.');
    pass(`${version===32?'Ultra Sol':'Ultra Luna'}: creación shiny 6IV, ataques, legalidad, exportación .pk7 y relectura del guardado.`);

    // Synthetic save with a separate Pikachu and real serialized checksums; no user data.
    await engine.trainer.setMoney(123456);
    const encounters=await engine.encounters.search(version,25);
    const other=(await engine.box.addEncounter(encounters.find(r=>r.speciesId===25&&r.form.id===0&&!r.isEgg&&r.ball===null).index)).at;
    const original=(await engine.game.export()).bytes;validateUSUM(original);
    await s.load(original,'main');assert(sameBytes((await s.exportSave()).bytes,original),'La exportación sin cambios difiere.');
    let rejected=false;try{await s.prepare(options,other);}catch{rejected=true;}assert(rejected&&sameBytes(s.current,original),'Se editó otra especie o no hubo rollback.');
    const target=(await s.list())[0].at;const otherBefore=(await engine.pokemon.export(other)).bytes;
    await s.prepare({...options,level:80},target);
    const updated=await s.exportSave();validateUSUM(updated.bytes);
    assert((await engine.pokemon.details(target)).level===80,'Edición no persistida.');
    assert(sameBytes(otherBefore,(await engine.pokemon.export(other)).bytes),'Otro Pokémon cambió.');
    const beforeInvalid=s.current.slice();rejected=false;try{await s.prepare({...options,level:101},target);}catch{rejected=true;}
    assert(rejected&&sameBytes(beforeInvalid,s.current),'Nivel inválido alteró la sesión.');
    const added=await s.prepare({...options,perfect:false,shiny:false});assert(!added.isShiny&&added.legality.valid,'Opción no shiny inválida.');
    await s.exportSave();assert((await engine.box.get()).length===3,'No se añadió exactamente un Pokémon.');
    pass(`${version===32?'Ultra Sol':'Ultra Luna'}: guardado, edición restringida, adición, progreso conservado y relectura.`);
    await s.reset();assert(sameBytes((await s.exportSave()).bytes,original),'Restauración original no exacta.');
    const corrupted=original.slice();corrupted[0x100]^=1;rejected=false;try{await s.load(corrupted,'main');}catch{rejected=true;}
    assert(rejected&&sameBytes(s.current,original),'Archivo corrupto no rechazado o sesión perdida.');
    pass(`${version===32?'Ultra Sol':'Ultra Luna'}: deshacer exacto y rechazo de corrupción sin perder sesión.`);
  }
}



