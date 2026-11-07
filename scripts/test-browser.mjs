import { chromium } from '@playwright/test';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/pokemon-lab/pruebas.html');
  await page.getByRole('button',{name:'Ejecutar pruebas',exact:true}).click();
  await page.waitForFunction(()=>['pass','fail'].includes(document.querySelector('#results').dataset.result),null,{timeout:180000});
  console.log(await page.locator('#results').textContent());
  if(await page.locator('#results').getAttribute('data-result')!=='pass')throw new Error('Fallaron pruebas del motor real.');
  await page.goto('http://127.0.0.1:4173/pokemon-lab/');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Desbordamiento horizontal en móvil.');
  await page.getByRole('button',{name:'Recuperar último respaldo local'}).click();
  await page.locator('#file-info').waitFor({state:'visible',timeout:60000});
  await page.locator('#backup-confirm').check();
  await page.locator('.pokemon').first().click();
  await page.locator('#level').fill('50');
  await page.getByRole('button',{name:'Aplicar y comprobar',exact:true}).click();
  await page.getByText('Cambio aplicado. El archivo se volvió a abrir y conserva los datos de los Pokémon.',{exact:true}).waitFor({timeout:60000});
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Verificar y exportar',exact:true}).click();
  const download=await event;if(download.suggestedFilename()!=='fixture-sintetico-NO-RESTAURAR.sav')throw new Error('Nombre de exportación incorrecto.');
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Interfaz móvil: recuperar, editar y descargar OK.');
} finally {await browser.close();}
