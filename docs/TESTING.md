# Pruebas y alcance de la evidencia

## Ejecutado localmente

- Construcción del sitio estático con Rollup, incluyendo el runtime WASM local y rutas relativas bajo `/pokemon-lab/`.
- **15 pruebas unitarias aprobadas**: tamaño, checksum, estructura, listas inválidas, rechazo de japonés, DVs, límites de edición, movimientos, SHA-256, protección de regiones no editadas y nombres españoles.
- Pruebas reales de navegador en `pruebas.html`: **14 comprobaciones aprobadas**. Se utilizó el paquete 0.31.0 real, no un mock del motor.
- Flujo visible de interfaz: recuperar el fixture, descargar respaldo, habilitar edición, seleccionar un Pokémon del equipo, cambiar nivel 5→50, aplicar y exportar. La UI confirmó la relectura y la descarga solicitada.

## Las 14 comprobaciones del motor

1. Fixture sintético internacional con listas de equipo/caja y checksum.
2. Importación y lectura de un Pokémon en equipo y dos en caja.
3. Exportación sin cambios idéntica byte por byte.
4. Guardado persistente y recuperación del respaldo con SHA-256.
5. Cambio de nivel, DVs y experiencia de estadísticas en equipo, exportación y relectura.
6. Original inmutable tras editar.
7. Cambio de especie a Charizard, mote, nivel, movimientos y DVs en una caja, con relectura.
8. Checksum válido y banco no editado intacto.
9. Nivel 101 y DV 31 rechazados sin mutación.
10. Checksum corrupto rechazado conservando la sesión anterior.
11. Archivo truncado y bytes vacíos rechazados.
12. Lista de equipo inválida rechazada aun con checksum correcto.
13. Recuperación ante un fallo inyectado en el motor.
14. Deshacer todos los cambios recupera el original exacto.

El fixture se fabrica con `loadBlank(36)` y encuentros del motor; se completa explícitamente su estructura de equipo únicamente en código de prueba. No es un guardado obtenido jugando, no contiene ROM y **no debe restaurarse en una consola**. El editor de usuario nunca completa ni repara estructuras inválidas.

## Pruebas automáticas de CI preparadas

`scripts/test-browser.mjs` ejecuta la misma batería y luego el flujo de interfaz en Chromium con viewport 390×844, incluyendo descarga y control de desbordamiento horizontal. El workflow de Pages exige que pase antes de publicar. **La ejecución de GitHub Actions sigue pendiente hasta subir los cambios.**

El entorno local restringe la creación de subprocesos: por ello se ejecutaron los tests unitarios dentro de un único proceso y la batería de navegador mediante la interfaz visible. No se afirma que el runner Playwright local ni el workflow remoto hayan pasado.

## Pendiente

- Guardado real de Blue del usuario y ensayo de restauración en 3DS XL con Luma3DS.
- Android/Chrome real, descargas del teléfono y FTP en su red.
- Verificación del selector de archivo con un guardado real. El motor y la recuperación local sí se ejercitaron.
- Medición automatizada final del viewport: la herramienta de navegador bloqueó esa comprobación por límite de uso. El ajuste final de orden móvil se verificó en código, no en una nueva captura.
- Legalidad u origen auténtico de cada Pokémon; aceptación en Banco/HOME u otros juegos.

No se amplía el soporte por extensión de archivo, por el nombre `sav.dat`, ni porque el motor general soporte otras generaciones. Cada formato adicional requiere pruebas independientes.
## Yellow (v0.3)

Se habilita Yellow internacional (versionId 38 del motor). Pasaron 16 pruebas unitarias y 17 comprobaciones de motor: las 14 anteriores de Blue y 3 de Yellow (importar/exportar exacto, editar equipo/caja preservando datos de Pikachu/progreso y deshacer exacto).

Se probó localmente una copia privada de un guardado real Yellow: 26 Pokémon leídos, exportación sin cambios idéntica, edición de nivel con relectura y checksum, región 0x271c..0x2f2b intacta y deshacer exacto. El archivo original no se modificó y no se incluye en el repositorio ni en el despliegue. Restauración física en 3DS y Android real aún pendientes.
