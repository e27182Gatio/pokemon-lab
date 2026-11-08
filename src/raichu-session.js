import {draftHandle} from './engine.js';
import {ORIGINS,trainingPatch} from './raichu-config.js';
import {validateUSUM,assertUSUM,verifyUSUMPreserved,boxRange} from './usum-validation.js';
import {sha256,sameBytes} from './validation.js';

export class RaichuSession {
  constructor(engine){this.engine=engine;this.current=null;this.original=null;this.name='main';this.version=null;this.targets=[];this.selected=null;this.ready=false;}
  async load(bytes,name='main'){
    validateUSUM(bytes);const previous=this.current?.slice();
    try{
      await this.engine.game.load(bytes.slice(),name);const version=await this.engine.game.version();assertUSUM(await this.engine.game.get(),version);
      const normalized=(await this.engine.game.export()).bytes;verifyUSUMPreserved(bytes,normalized);
      this.version=version.versionId;this.original=bytes.slice();this.current=bytes.slice();this.name=name;
      this.originalHash=await sha256(bytes);this.targets=[];this.selected=null;this.ready=true;
      return this.list();
    }catch(e){if(previous)await this.engine.game.load(previous,this.name);else await this.engine.game.close();throw e;}
  }
  async standalone(version,trainerName='LAB'){
    if(!Object.hasOwn(ORIGINS,version))throw new Error('Selecciona Ultra Sol o Ultra Luna.');
    if(typeof trainerName!=='string'||!trainerName.trim()||trainerName.trim().length>12)throw new Error('El entrenador debe tener entre 1 y 12 caracteres.');
    await this.engine.game.loadBlank(version);assertUSUM(await this.engine.game.get(),await this.engine.game.version());
    await this.engine.trainer.setName(trainerName.trim());
    this.version=version;this.current=(await this.engine.game.export()).bytes;this.original=null;this.targets=[];this.selected=null;this.ready=true;
  }
  async list(){return (await this.engine.box.get()).filter(p=>p.speciesId===26&&p.form.id===1&&!p.isEgg);}
  async prepare(options,at=null){
    if(!this.ready)throw new Error('Prepara un archivo o abre tu partida.');
    const patch=trainingPatch(options),before=this.current.slice();let target=at;
    try{
      if(target){
        boxRange(target);const existing=await this.engine.pokemon.details(target);
        if(existing.species!==26||existing.form!==1||existing.isEgg||![32,33].includes(existing.version))throw new Error('Solo se edita Raichu de Alola con origen Ultra Sol o Ultra Luna.');
        if(options.level<existing.metLevel)throw new Error('El nivel no puede ser inferior al nivel de encuentro.');
      }else{
        const rows=await this.engine.encounters.search(this.version,25);
        const encounter=rows.find(r=>r.speciesId===25&&r.form.id===0&&!r.isEgg&&r.ball===null&&r.name.startsWith('Wild Encounter')&&r.version===(this.version===32?'Ultra Sun':'Ultra Moon'));
        if(!encounter)throw new Error('El motor no encontró un encuentro salvaje compatible.');
        target=(await this.engine.box.addEncounter(encounter.index)).at;
      }
      await this.engine.pokemon.edit(target);
      await this.engine.pokemon.update(draftHandle,{...(!at?{species:26,form:1,ability:207,ball:11,nickname:''}:{}),...patch});
      const draft=await this.engine.pokemon.details(draftHandle);
      if(!draft.legality?.valid)throw new Error('PKHeX detectó una incompatibilidad: '+(draft.legality?.messages?.join(' ')||'sin análisis disponible'));
      await this.engine.pokemon.commit();
      const expected=await this.engine.pokemon.export(target);const exported=(await this.engine.game.export()).bytes;
      validateUSUM(exported);verifyUSUMPreserved(before,exported,[target]);
      await this.engine.game.load(exported.slice(),this.name);assertUSUM(await this.engine.game.get(),await this.engine.game.version());
      const actual=await this.engine.pokemon.export(target);
      if(!sameBytes(expected.bytes,actual.bytes))throw new Error('El Pokémon cambió al volver a abrir el archivo.');
      const details=await this.engine.pokemon.details(target);
      if(!details.legality?.valid)throw new Error('El Pokémon no superó la validación tras exportar.');
      this.current=exported.slice();this.selected={...target};this.targets.push({...target});return details;
    }catch(error){try{await this.engine.game.load(before,this.name);}catch{this.ready=false;}throw error;}
  }
  async exportPokemon(){
    if(!this.ready||!this.selected)throw new Error('Prepara primero a Raichu.');
    return this.engine.pokemon.export(this.selected);
  }
  async exportSave(){
    if(!this.original)throw new Error('Para descargar una partida, abre un respaldo real.');
    validateUSUM(this.current);verifyUSUMPreserved(this.original,this.current,this.targets);
    await this.engine.game.load(this.current.slice(),this.name);assertUSUM(await this.engine.game.get(),await this.engine.game.version());
    if(this.selected&&!(await this.engine.pokemon.details(this.selected)).legality?.valid)throw new Error('Falló la validación final de Raichu.');
    return {bytes:this.current.slice(),fileName:this.name};
  }
  async reset(){if(!this.original)throw new Error('No hay un guardado original.');return this.load(this.original.slice(),this.name);}
}
