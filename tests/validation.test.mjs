import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBytes,validatePatch,checksum,CHECKSUM_OFFSET,hpDV,sha256,validateGame,verifyPreserved} from '../src/validation.js';
import {movesEs} from '../src/moves-es.js';
function minimal(){const b=new Uint8Array(32768);b[0x2f2d]=255;b[0x30c1]=255;b[CHECKSUM_OFFSET]=checksum(b);return b;}
test('checksum uses complement of sum, excluding checksum byte',()=>{const b=new Uint8Array(32768);assert.equal(checksum(b),255);b[0x2598]=1;b[0x3522]=255;assert.equal(checksum(b),255);b[0x3523]=12;assert.equal(checksum(b),255);b[0x2598]=2;assert.equal(checksum(b),254);});
test('validates size, structures and checksum without modifying input',()=>{const b=minimal(),copy=b.slice();assert.equal(validateBytes(b).size,32768);assert.deepEqual(b,copy);});
test('rejects truncated, wrapped, ROM sized and zero filled data',()=>{for(const n of [0,100,32767,32769,65536,1048576])assert.throws(()=>validateBytes(new Uint8Array(n)));assert.throws(()=>validateBytes(new Uint8Array(32768)));});
test('rejects corruption, invalid party and active box index',()=>{for(const [offset,value]of [[0x2600,1],[0x2f2c,7],[0x284c,12],[0x30c0,21]]){const b=minimal();b[offset]=value;assert.throws(()=>validateBytes(b));}});
test('rejects inconsistent species even with correct checksum',()=>{const b=minimal();b[0x2f2c]=1;b[0x2f2d]=177;b[0x2f2e]=255;b[0x2f34]=180;b[CHECKSUM_OFFSET]=checksum(b);assert.throws(()=>validateBytes(b),/especie/);});
test('rejects Japanese layout',()=>{const b=minimal();b[0x2ed6]=255;b[0x302e]=255;b[CHECKSUM_OFFSET]=checksum(b);assert.throws(()=>validateBytes(b),/japonesa/);});
test('uninitialized stored boxes ignored; initialized invalid boxes rejected',()=>{const b=minimal();b[0x4000]=250;b[CHECKSUM_OFFSET]=checksum(b);assert.doesNotThrow(()=>validateBytes(b));b[0x284c]=129;b[CHECKSUM_OFFSET]=checksum(b);assert.throws(()=>validateBytes(b),/Caja 1/);});
test('all DV parity combinations derive HP correctly',()=>{for(let i=0;i<16;i++){assert.equal(hpDV({attack:(i>>3)&1,defense:(i>>2)&1,speed:(i>>1)&1,specialAttack:i&1}),i);}assert.equal(hpDV({attack:10,defense:10,speed:10,specialAttack:10}),0);});
test('Gen1 accepts boundaries and rejects modern values',()=>{assert.doesNotThrow(()=>validatePatch({level:100,ivs:{attack:15,specialAttack:15,specialDefense:15},evs:{health:65535}}));for(const p of [{level:0},{level:101},{level:1.5},{level:''},{ivs:{attack:31}},{evs:{health:65536}},{ivs:{health:15}},{ivs:{specialAttack:10,specialDefense:11}},{nature:15}])assert.throws(()=>validatePatch(p));});
test('rejects duplicates, gaps and empty moves',()=>{for(const moves of [[0,0,0,0],[33,33,0,0],[33,0,39,0],[166,0,0,0],[33]])assert.throws(()=>validatePatch({moves}));assert.doesNotThrow(()=>validatePatch({moves:[33,39,0,0]}));});
test('rejects nickname overflow and nonrepresentable characters',()=>{assert.doesNotThrow(()=>validatePatch({nickname:'CHARIZARD'}));assert.throws(()=>validatePatch({nickname:'12345678901'}));assert.throws(()=>validatePatch({nickname:'🔥'}));});
test('Yellow accepted; other generations and hacks blocked',()=>{assert.doesNotThrow(()=>validateGame({generation:1,format:null},{versionId:35}));for(const [g,v,f]of [[2,39,null],[1,37,null],[1,35,{}]])assert.throws(()=>validateGame({generation:g,format:f},{versionId:v}));});
test('Yellow international is enabled',()=>assert.doesNotThrow(()=>validateGame({generation:1,format:null},{versionId:38})));

test('SHA-256 matches a standard known vector',async()=>assert.equal(await sha256(new TextEncoder().encode('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
test('rejects unrelated changes to story and preserves allowed editing regions',()=>{const a=minimal(),b=a.slice();b[0x29f3]^=1;assert.throws(()=>verifyPreserved(a,b));b[0x29f3]^=1;b[0x2f34]^=1;assert.doesNotThrow(()=>verifyPreserved(a,b));});
test('Spanish names preserve move IDs',()=>{assert.equal(movesEs.length,166);assert.equal(movesEs[53],'Lanzallamas');assert.equal(movesEs[57],'Surf');});
