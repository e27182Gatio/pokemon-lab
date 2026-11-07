// Gen 1 international SRAM layout; see docs/ENGINE.md for primary sources.
export const SAVE_SIZE = 0x8000;
export const CHECKSUM_OFFSET = 0x3523;
export function checksum(bytes) {
  let sum = 0;
  for (let i = 0x2598; i < CHECKSUM_OFFSET; i++) sum = (sum + bytes[i]) & 255;
  return sum ^ 255;
}
function checkList(bytes, offset, capacity, stride, label) {
  const count = bytes[offset];
  if (count > capacity || bytes[offset + count + 1] !== 255) throw new Error(`${label}: lista de Pokémon incompleta o dañada.`);
  for (let i = 0; i < count; i++) {
    const species = bytes[offset + 1 + i];
    if (!species || species > 190 || species !== bytes[offset + capacity + 2 + i * stride]) throw new Error(`${label}: especie o estructura incoherente.`);
  }
}
export function validateBytes(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length !== SAVE_SIZE) throw new Error('Se necesita un guardado SRAM de 32.768 bytes. No se admiten ROM, CIA, ZIP ni estados de emulador.');
  // Reject Japanese structure even if arbitrary bytes happen to match INT checksum.
  if (bytes[0x2ed5] <= 6 && bytes[0x2ed6 + bytes[0x2ed5]] === 255 && bytes[0x302d] <= 30 && bytes[0x302e + bytes[0x302d]] === 255) throw new Error('La estructura japonesa no está habilitada en esta versión.');
  checkList(bytes, 0x2f2c, 6, 44, 'Equipo');
  checkList(bytes, 0x30c0, 20, 33, 'Caja activa');
  const active = bytes[0x284c] & 127;
  if (active >= 12) throw new Error('El índice de caja activa no es válido.');
  if (bytes[0x284c] & 128) {
    for (let box = 0; box < 12; box++) {
      // The active box's authoritative data lives at 0x30c0, not its stale mirror.
      if (box === active) continue;
      checkList(bytes, (box < 6 ? 0x4000 : 0x6000) + (box % 6) * 0x462, 20, 33, `Caja ${box + 1}`);
    }
  }
  if (bytes[CHECKSUM_OFFSET] !== checksum(bytes)) throw new Error('La suma de comprobación no coincide. No se reparará ni editará automáticamente este archivo.');
  return { size: bytes.length, layout: 'Gen 1 internacional', checksum: 'correcta', activeBox: active };
}
export function validateGame(summary, version) {
  // Engine 0.31.0 exposes Red (35) for shared RB data; Blue INT is 36.
  if (!summary || summary.generation !== 1 || summary.format || ![35,36].includes(version?.versionId)) throw new Error('Esta versión solo habilita la estructura internacional Rojo/Azul. El motor detectó otro juego.');
}
export function integer(value, min, max, name) {
  if (value === '' || value === null || value === undefined || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`${name}: introduce un entero entre ${min} y ${max}.`);
  return Number(value);
}
export function hpDV(ivs) { return ((ivs.attack & 1) << 3) | ((ivs.defense & 1) << 2) | ((ivs.speed & 1) << 1) | (ivs.specialAttack & 1); }
export function validatePatch(patch) {
  const allowed = ['species', 'nickname', 'level', 'ivs', 'evs', 'moves'];
  if (Object.keys(patch).some(k => !allowed.includes(k))) throw new Error('Campo no permitido para Blue.');
  if ('species' in patch) integer(patch.species, 1, 151, 'Especie');
  if ('level' in patch) integer(patch.level, 1, 100, 'Nivel');
  if ('nickname' in patch && (typeof patch.nickname !== 'string' || !/^[A-Za-z0-9 .!?♂♀-]{0,10}$/.test(patch.nickname))) throw new Error('El mote admite hasta 10 caracteres: letras sin acentos, números, espacio, . ! ? - ♂ ♀.');
  for (const [key, max] of [['ivs',15], ['evs',65535]]) {
    if (!patch[key]) continue;
    for (const [stat, value] of Object.entries(patch[key])) {
      if (!['health','attack','defense','speed','specialAttack','specialDefense'].includes(stat)) throw new Error('Estadística desconocida.');
      integer(value, 0, max, key === 'ivs' ? 'DV' : 'Experiencia de estadística');
    }
    if ('specialAttack' in patch[key] && patch[key].specialAttack !== patch[key].specialDefense) throw new Error('Blue guarda un único valor Especial.');
    if (key === 'ivs' && 'health' in patch[key]) throw new Error('El DV de PS se deriva automáticamente.');
  }
  if (patch.moves) {
    if (patch.moves.length !== 4) throw new Error('Deben existir cuatro casillas de movimientos.');
    patch.moves.forEach(m => integer(m,0,165,'Movimiento'));
    const used = patch.moves.filter(Boolean);
    if (!used.length || new Set(used).size !== used.length) throw new Error('Debe haber al menos un movimiento y no puede repetirse.');
    if (patch.moves.some((m,i) => m !== 0 && patch.moves.slice(0,i).includes(0))) throw new Error('Deja las casillas vacías al final.');
  }
  return patch;
}
export async function sha256(bytes) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2,'0')).join(''); }
export function sameBytes(a,b) { return a.length === b.length && a.every((v,i)=>v===b[i]); }
export function verifyPreserved(before,after) {
  if(before.length!==after.length)throw new Error('La exportación cambió el tamaño del guardado.');
  for(let i=0;i<before.length;i++) {
    // Engine may update Pokédex, box initialization, party/active box/checksum and box banks.
    const allowed=(i>=0x25a3&&i<0x25c9)||i===0x284c||(i>=0x2f2c&&i<=0x3523)||i>=0x4000;
    if(!allowed&&before[i]!==after[i])throw new Error(`El motor cambió datos ajenos a los Pokémon (0x${i.toString(16)}). Se canceló la edición.`);
  }
}
export function slotKey(at) { return `${at.source}:${at.box ?? ''}:${at.slot}`; }
export function fingerprint(p) {
  return JSON.stringify({species:p.species,nickname:p.nickname,level:p.level,experience:p.experience,ivs:p.ivs,evs:p.evs,moves:p.moves.map(m=>({id:m.id,pp:m.pp})),trainerId:p.trainerId,originalTrainerName:p.originalTrainerName});
}
