import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { mkdir, cp, copyFile, writeFile, rm, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const projectRoot=resolve(fileURLToPath(new URL('..',import.meta.url)));
const target=resolve(projectRoot,'dist');
if(resolve(process.cwd())!==projectRoot || target!==projectRoot+sep+'dist')throw new Error('Ejecuta el build desde la raíz del proyecto.');
if(existsSync(target)){
  if(await realpath(target)!==target)throw new Error('dist no puede ser un enlace a otra carpeta.');
  await rm(target,{recursive:true});
}
await mkdir('dist/assets', { recursive: true });
const inputs = {app: 'src/app.js', selftest: 'src/selftest.js'};
const bundle = await rollup({ input: inputs, plugins: [nodeResolve({ browser: true }), commonjs()], onwarn(w, warn) { if (w.code !== 'CIRCULAR_DEPENDENCY') warn(w); } });
await bundle.write({ dir: 'dist/assets', format: 'es', entryFileNames: '[name].js', chunkFileNames: '[name]-[hash].js' });
await bundle.close();
for (const name of ['index.html', 'herramientas.html', 'pruebas.html']) await copyFile(name, `dist/${name}`);
await cp('public', 'dist', { recursive: true });
await cp('node_modules/@pkhex-everywhere/engine/_framework', 'dist/_framework', { recursive: true, filter: p => !/\.(br|gz)$/.test(p) });
await copyFile('node_modules/@pkhex-everywhere/engine/notices.json', 'dist/notices.json');
if (existsSync('LICENSE')) await copyFile('LICENSE', 'dist/LICENSE');
await writeFile('dist/.nojekyll', '');
console.log('Sitio construido en dist; motor 0.31.0 alojado con la aplicación.');
