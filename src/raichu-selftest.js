import {makeEngine} from './engine.js';
import {testRaichu} from './raichu-tests.js';
const button=document.getElementById('run'),out=document.getElementById('results');
button.onclick=async()=>{button.disabled=true;out.dataset.result='running';out.textContent='Preparando motor…';try{await testRaichu(makeEngine(),text=>out.textContent+='\nOK · '+text);out.dataset.result='pass';out.textContent+='\nTODAS LAS PRUEBAS RAICHU PASARON.';}catch(e){out.dataset.result='fail';out.textContent+='\nFALLO: '+e.message+'\n'+e.stack;}finally{button.disabled=false;}};
