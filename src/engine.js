import { createEngine, wasmHost } from '@pkhex-everywhere/engine';
export { draftHandle } from '@pkhex-everywhere/engine';
export function makeEngine() {
  return createEngine({ host: wasmHost({ dotnetUrl: new URL('../_framework/dotnet.js', import.meta.url).href }), lazy: true });
}
