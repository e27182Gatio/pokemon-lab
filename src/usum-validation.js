// Layout and CRC algorithm: PKHeX.Core, SaveBlockAccessor7USUM and BlockInfo3DS (GPL-3.0).
export const USUM_SIZE=0x6cc00;
export const BLOCKS=[
  [0,0xe28],[0x1000,0x7c],[0x1200,0x14],[0x1400,0xc0],[0x1600,0x61c],
  [0x1e00,0xe00],[0x2c00,0xf78],[0x3c00,0x228],[0x4000,0x30c],[0x4400,0x1fc],
  [0x4600,0x4c],[0x4800,4],[0x4a00,0x58],[0x4c00,0x5e6],[0x5200,0x36600],
  [0x3b800,0x572c],[0x41000,8],[0x41200,0x1218],[0x42600,0x1a08],
  [0x44200,0x6408],[0x4a800,0x6408],[0x50e00,0x3998],[0x54800,0x100],
  [0x54a00,0x100],[0x54c00,0x10528],[0x65200,0x204],[0x65600,0xb60],
  [0x66200,0x3f50],[0x6a200,0x358],[0x6a600,0x728],[0x6ae00,0x200],
  [0x6b000,0x718],[0x6b800,0x1fc],[0x6ba00,0x200],[0x6bc00,0x120],
  [0x6be00,0x1c8],[0x6c000,0x200],[0x6c200,0x39c],[0x6c600,0x400]
];
export function crc16(bytes){
  let crc=0xffff;
  for(const b of bytes){crc^=b;for(let bit=0;bit<8;bit++)crc=crc&1?(crc>>>1)^0xa001:crc>>>1;}
  return (~crc)&0xffff;
}
export function validateUSUM(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length!==USUM_SIZE)throw new Error('Abre el archivo main de Ultra Sol o Ultra Luna (445.440 bytes), extraído con tu gestor de partidas.');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  for(let id=0;id<BLOCKS.length;id++){
    const [offset,length]=BLOCKS[id];const block=bytes.slice(offset,offset+length);
    // PKHeX clears the 128-byte MemeCrypto signature before checking block 36.
    if(id===36)block.fill(0,0x100,0x180);
    if(crc16(block)!==view.getUint16(0x6ca00+0x14+id*8+6,true))throw new Error(`El bloque ${id} no supera la comprobación de integridad. Vuelve a extraer el respaldo.`);
  }
}
export function assertUSUM(game,version){
  if(game?.generation!==7||game.format||![32,33].includes(version?.versionId))throw new Error('Esta sección solo admite Ultra Sol y Ultra Luna oficiales.');
}
export function boxRange(at){
  if(at?.source!=='box'||!Number.isInteger(at.box)||at.box<0||at.box>=32||!Number.isInteger(at.slot)||at.slot<0||at.slot>=30)throw new Error('Selecciona una posición de caja válida.');
  const start=0x5200+(at.box*30+at.slot)*232;return [start,start+232];
}
export function verifyUSUMPreserved(before,after,targets=[]){
  if(before.length!==USUM_SIZE||after.length!==USUM_SIZE)throw new Error('El tamaño del guardado cambió.');
  // Only the chosen box records, Pokédex, capture counters, signature and corresponding CRCs may change.
  const ranges=[...targets.map(boxRange),[0x6c100,0x6c180]];
  const ids=targets.length?[6,14,28,36]:[36];
  if(targets.length)ranges.push([0x2c00,0x3b78],[0x6a200,0x6a558]);
  for(const id of ids){const off=0x6ca00+0x14+id*8+6;ranges.push([off,off+2]);}
  for(let i=0;i<before.length;i++)if(before[i]!==after[i]&&!ranges.some(([a,b])=>i>=a&&i<b))throw new Error(`Cambió un dato ajeno a Raichu (0x${i.toString(16)}). Se canceló la edición.`);
}
