export const ORIGINS = Object.freeze({32:'Ultra Sol',33:'Ultra Luna'});
export const STAT_KEYS = ['health','attack','defense','specialAttack','specialDefense','speed'];
export const PERFECT_IVS = Object.freeze(Object.fromEntries(STAT_KEYS.map(k=>[k,31])));
export const META_EVS = Object.freeze({health:252,attack:0,defense:4,specialAttack:252,specialDefense:0,speed:0});
export const META = Object.freeze({
  season:19, reviewed:'2026-11-08', start:'2026-10-29T06:00:00Z', end:'2026-11-13T01:59:00Z',
  rules:'https://plza-news.pokemon-home.com/en/page/51.html',
  guide:'https://gamewith.jp/pokemon-za/525028',
  learnset:'https://www.serebii.net/pokedex-sv/raichu/',
  moves:[
    {id:85,en:'Thunderbolt',es:'Rayo',use:'Daño eléctrico a distancia contra Talonflame y Feraligatr antes de megaevolucionar.'},
    {id:94,en:'Psychic',es:'Psíquico',use:'Ataque de su mismo tipo, especialmente útil contra Emboar.'},
    {id:473,en:'Psyshock',es:'Psicocarga',use:'Usa tu Ataque Especial y golpea la Defensa física del rival.'},
    {id:417,en:'Nasty Plot',es:'Maquinación',use:'Aumenta el Ataque Especial. Prepáralo cuando tengas espacio para hacerlo.'}
  ]
});
export function seasonState(now=new Date()){
  const time=now.getTime();
  if(!Number.isFinite(time))throw new Error('Fecha inválida.');
  return time<Date.parse(META.start)?'upcoming':time>=Date.parse(META.end)?'expired':'active';
}
export function validateOptions(options){
  if(!Number.isInteger(options.level)||options.level<3||options.level>100)throw new Error('El nivel debe ser un entero entre 3 y 100.');
  for(const key of ['perfect','shiny','meta'])if(typeof options[key]!=='boolean')throw new Error('Configuración incompleta.');
  return options;
}
export function trainingPatch(options){
  validateOptions(options);
  return {level:options.level,isShiny:options.shiny,
    ...(options.perfect?{ivs:{...PERFECT_IVS}}:{}),
    ...(options.meta?{nature:15,heldItem:275,evs:{...META_EVS},moves:META.moves.map(m=>m.id)}:{})};
}
export function showdown(options){
  validateOptions(options);
  if(!options.meta)throw new Error('Activa el set recomendado para copiar su código.');
  return ['%trade Raichu-Alola @ Focus Sash',`Level: ${options.level}`,`Shiny: ${options.shiny?'Yes':'No'}`,'Ball: Luxury Ball',
    'EVs: 252 HP / 252 SpA / 4 Def','Modest Nature',
    ...(options.perfect?['IVs: 31 HP / 31 Atk / 31 Def / 31 SpA / 31 SpD / 31 Spe']:[]),
    ...META.moves.map(m=>'- '+m.en)].join('\n');
}
