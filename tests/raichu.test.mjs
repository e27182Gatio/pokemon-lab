import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonState,trainingPatch,showdown,META,STAT_KEYS} from '../src/raichu-config.js';
import {crc16,validateUSUM,verifyUSUMPreserved,assertUSUM,boxRange,USUM_SIZE} from '../src/usum-validation.js';
test('meta date boundaries never advertise expired season as current',()=>{
  assert.equal(seasonState(new Date(META.start)),'active');assert.equal(seasonState(new Date(META.end)),'expired');
  assert.equal(seasonState(new Date('2026-10-01')),'upcoming');assert.equal(seasonState(new Date('2027-01-01')),'expired');
});
test('perfect option and Z-A training are independent; EV total remains legal',()=>{
  const p=trainingPatch({level:70,perfect:true,shiny:true,meta:true});assert.equal(STAT_KEYS.length,6);assert(STAT_KEYS.every(k=>p.ivs[k]===31));
  assert.equal(Object.values(p.evs).reduce((a,b)=>a+b),508);assert.deepEqual(p.moves,[85,94,473,417]);
  assert.equal(trainingPatch({level:70,perfect:false,shiny:false,meta:false}).ivs,undefined);
  for(const level of [2,101,NaN,70.5])assert.throws(()=>trainingPatch({level,perfect:true,shiny:true,meta:true}));
});
test('trade text targets Alolan form without promising origin or Mega',()=>{
  const s=showdown({level:70,perfect:true,shiny:true,meta:true});assert(s.startsWith('%trade Raichu-Alola @ Focus Sash'));assert(!s.includes('Version:'));assert(!s.includes('Alpha:'));
});
test('CRC16 reference vector and corrupted files',()=>{
  assert.equal(crc16(new TextEncoder().encode('123456789')),0xb4c8);assert.throws(()=>validateUSUM(new Uint8Array(USUM_SIZE)));assert.throws(()=>validateUSUM(new Uint8Array(32768)));
});
test('only USUM allowed and only valid box slots editable',()=>{
  for(const v of [32,33])assert.doesNotThrow(()=>assertUSUM({generation:7,format:null},{versionId:v}));
  for(const v of [30,31,36])assert.throws(()=>assertUSUM({generation:7},{versionId:v}));
  assert.throws(()=>boxRange({source:'party',slot:0}));assert.throws(()=>boxRange({source:'box',box:32,slot:0}));
});
test('preservation blocks edits to trainer, inventory, party, progress and other boxes',()=>{
  const a=new Uint8Array(USUM_SIZE),at={source:'box',box:0,slot:0};
  for(const i of [0,0x1400,0x1600,0x1e00,0x41000,0x5200+232,0x6ca00]){const b=a.slice();b[i]=1;assert.throws(()=>verifyUSUMPreserved(a,b,[at]));}
  for(const i of [0x5200,0x2c00,0x6a200,0x6c100]){const b=a.slice();b[i]=1;assert.doesNotThrow(()=>verifyUSUMPreserved(a,b,[at]));}
});
