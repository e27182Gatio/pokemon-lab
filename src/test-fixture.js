// Synthetic data only: never a ROM or a user's save. Not suitable for playing.
import { checksum, CHECKSUM_OFFSET } from './validation.js';
export async function makeFixture(engine) {
  await engine.game.loadBlank(36); // Blue international, as listed by engine 0.31.0.
  await engine.trainer.setName('LAB');
  for (const species of [7,4]) {
    const encounters=await engine.encounters.search(36,species);
    await engine.box.addEncounter(encounters[0].index);
  }
  const mon=await engine.pokemon.details({source:'box',box:0,slot:0});
  const {bytes}=await engine.game.export();
  // Blank saves have no playable party. Construct one explicitly in this fixture.
  const party=0x2f2c, box=0x30c0, record=party+8;
  bytes[party]=1;bytes[party+1]=bytes[box+1];bytes[party+2]=255;
  bytes.set(bytes.slice(box+22,box+22+33),record);
  bytes[record+33]=mon.level;
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  view.setUint16(record+1,mon.stats.health);
  ['health','attack','defense','speed','specialAttack'].forEach((s,i)=>view.setUint16(record+34+i*2,mon.stats[s]));
  bytes.set(bytes.slice(box+22+20*33,box+22+20*33+11),party+8+6*44);
  bytes.set(bytes.slice(box+22+20*33+20*11,box+22+20*33+20*11+11),party+8+6*44+6*11);
  // Sentinel in an opaque bank verifies unrelated bytes survive edits.
  bytes.set([11,22,33,44,55,66,77,88],0x1700);
  bytes[CHECKSUM_OFFSET]=checksum(bytes);
  return bytes;
}
