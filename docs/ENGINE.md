# Motor y licencias

Se integra `@pkhex-everywhere/engine` **0.31.0**, fijado en `package.json` y `pnpm-lock.yaml`. Ejecuta .NET WebAssembly y PKHeX.Core dentro del navegador. No hay servidor que reciba partidas. El motor y sus recursos se sirven desde el mismo sitio; no se usa un CDN para ejecutar código.

## Fuentes exactas

- [PKHeX Everywhere correspondiente al paquete](https://github.com/arleypadua/PKHeX.Everywhere/tree/a38e4f71ff07c87ad119e1b1335bffb4563fad1c). `gitHead` verificado con el registro npm de la versión 0.31.0.
- [Licencia del motor en ese commit](https://github.com/arleypadua/PKHeX.Everywhere/blob/a38e4f71ff07c87ad119e1b1335bffb4563fad1c/LICENSE): GPL v3; el manifiesto declara `GPL-3.0-or-later`.
- [PKHeX.Core incluido](https://github.com/arleypadua/PKHeX/tree/02c9ec108fe3c96735f6c2397eaebc10e29a049f), versión indicada en `notices.json`: **26.8.26**, GPL-3.0-or-later. Es el fork incluido por Everywhere, no una promesa de equivalencia con el último PKHeX oficial.
- [PKHeX oficial](https://github.com/kwsch/PKHeX), referencia comparativa. Compilar directamente Core requeriría mantener una capa .NET/WASM propia; se eligió el SDK publicado por su API de guardados y su runtime ya distribuido.
- [Documentación del SDK](https://docs.pkhex-everywhere.fyi/docs/). Se contrastó con los `.d.ts` efectivamente instalados.
- [Offsets de SAV1 del motor fijado](https://github.com/arleypadua/PKHeX/blob/02c9ec108fe3c96735f6c2397eaebc10e29a049f/PKHeX.Core/Saves/Substructures/Gen12/SAV1Offsets.cs).
- [Checksum y serialización SAV1](https://github.com/arleypadua/PKHeX/blob/02c9ec108fe3c96735f6c2397eaebc10e29a049f/PKHeX.Core/Saves/SAV1.cs).
- [Nombres de movimientos en español](https://github.com/arleypadua/PKHeX/blob/02c9ec108fe3c96735f6c2397eaebc10e29a049f/PKHeX.Core/Resources/text/other/es/text_Moves_es.txt): los índices 0–165 se incluyen en `src/moves-es.js`, bajo GPL-3.0-or-later. Los mensajes detallados de legalidad se conservan en el idioma que devuelve el motor.

`LICENSE` contiene GPL v3. El proyecto declara GPL-3.0-or-later para permitir la distribución de la integración. `dist/notices.json` conserva los avisos del paquete, con versiones y fuentes de todos sus componentes. La web enlaza el código fuente completo del proyecto, las fuentes correspondientes de los motores y sus avisos. Conservar estas referencias, licencia y fuentes al redistribuir.

## Alcance deliberado

Solo se admite SRAM internacional de 32.768 bytes con estructura Rojo/Azul y checksum principal correcto. El nombre `sav.dat` no acredita que venga de Consola Virtual. El motor puede devolver `Red` al leer Blue: la estructura compartida no determina por sí sola la edición. Se bloquean japonés, Yellow, otras generaciones, hacks, archivos empaquetados y estados de emulador. Los formatos rechazados no se convierten ni reparan.

El validador comprueba longitud, listas de equipo/caja activa/cajas inicializadas, correspondencia de índices de especie, índice de caja activa y complemento de la suma `0x2598..0x3522` almacenado en `0x3523`. No sustituye una validación exhaustiva de todo el progreso o de cada byte del juego.

Se editan Pokémon existentes del equipo y las cajas: especie, mote limitado a caracteres admitidos, nivel, DVs, experiencia de estadísticas y movimientos. No se añaden ni borran Pokémon, ni se modifican historia, dinero o inventario. Cambiar especie puede actualizar la Pokédex mediante el motor. No se exponen campos inexistentes en Blue como naturaleza, habilidad u objeto equipado.

## Transacciones

1. Copia independiente del original; SHA-256 y respaldo IndexedDB, además de descarga manual.
2. Cambios sobre el borrador `pokemon.edit` → `pokemon.update(draftHandle, patch)` → `pokemon.commit`.
3. Exportación del motor. Se bloquean cambios fuera de las regiones de Pokémon, Pokédex, indicador de cajas y checksum.
4. Comprobación de estructura y checksum; recarga secuencial y comparación de especie, mote, nivel, EXP, DVs, experiencia de estadísticas, movimientos/PP y entrenador de todos los Pokémon.
5. Si falla una edición, se recarga el último guardado validado. Si falla también la recuperación, se bloquea exportar.
6. Exportar sin cambios devuelve los bytes originales, no una reserialización.

El runtime es único por página: no se instancian dos motores supuestamente independientes. El análisis de legalidad se muestra tal como lo devuelve PKHeX, separado de las comprobaciones estructurales. No certifica origen, legitimidad, compatibilidad con HOME ni aceptación por servicios oficiales.

## Pendiente de verificar

No se recibió una partida real del usuario ni se tuvo acceso físico a su 3DS o Android. Las pruebas sintéticas y el viewport móvil son evidencia de software, no de restauración en hardware. Una prueba real debe comenzar con un respaldo independiente, un único cambio, restauración mediante el gestor de saves y revisión dentro del juego.
