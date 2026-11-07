import { draftHandle } from './engine.js';
import { validateBytes, validateGame, validatePatch, sha256, fingerprint, slotKey, verifyPreserved } from './validation.js';

export class SaveSession {
  constructor(engine) { this.engine = engine; this.original = null; this.current = null; this.name = ''; this.history = []; this.ready = false; }
  async load(bytes, name) {
    validateBytes(bytes);
    const previous = this.current?.slice();
    const oldName = this.name;
    try {
      await this.engine.game.load(bytes.slice(), name);
      validateGame(await this.engine.game.get(), await this.engine.game.version());
      const entries = await this.entries();
      if (entries.some(p => !p.editable || p.isUnknown)) throw new Error('Hay Pokémon que el motor no reconoce. Se bloquea la edición de este archivo.');
      this.original = bytes.slice(); this.current = bytes.slice(); this.name = name;
      this.originalHash = await sha256(this.original); this.history = []; this.ready = true;
      return entries;
    } catch (error) {
      if (previous) await this.engine.game.load(previous, oldName);
      else await this.engine.game.close();
      throw error;
    }
  }
  async entries() { return [...await this.engine.party.get(), ...await this.engine.box.get()]; }
  async snapshot() {
    const result = [];
    for (const p of await this.entries()) result.push([slotKey(p.at), fingerprint(await this.engine.pokemon.details(p.at))]);
    return JSON.stringify(result);
  }
  async verify(bytes, expected) {
    validateBytes(bytes);
    await this.engine.game.load(bytes.slice(), this.name);
    validateGame(await this.engine.game.get(), await this.engine.game.version());
    if (await this.snapshot() !== expected) throw new Error('La relectura no conserva todos los Pokémon. Se canceló la operación.');
  }
  async apply(at, patch) {
    if (!this.ready) throw new Error('Abre primero una partida.');
    validatePatch(patch);
    const previous = this.current.slice();
    try {
      await this.engine.pokemon.edit(at);
      await this.engine.pokemon.update(draftHandle, patch);
      const draft = await this.engine.pokemon.details(draftHandle);
      await this.engine.pokemon.commit();
      const expected = await this.snapshot();
      const exported = await this.engine.game.export();
      verifyPreserved(previous, exported.bytes);
      await this.verify(exported.bytes, expected);
      this.current = exported.bytes.slice();
      this.history.push({at: {...at}, patch: structuredClone(patch), legality: draft.legality, time: new Date().toISOString()});
      return this.engine.pokemon.details(at);
    } catch (error) {
      try { await this.engine.game.load(previous, this.name); }
      catch { this.ready = false; throw new Error('No se pudo recuperar la sesión. Conserva el respaldo original y vuelve a abrirlo.'); }
      throw error;
    }
  }
  async export() {
    if (!this.ready) throw new Error('No hay una partida lista para exportar.');
    const expected = await this.snapshot();
    const bytes = this.history.length ? this.current.slice() : this.original.slice();
    try { await this.verify(bytes, expected); }
    catch (error) { this.ready = false; throw error; }
    return {bytes, fileName:this.name, hash:await sha256(bytes), originalHash:this.originalHash, changes:structuredClone(this.history)};
  }
  async reset() { return this.load(this.original.slice(), this.name); }
}
