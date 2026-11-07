# Pokémon Lab · v0.2

Editor local y experimental para guardados **Pokémon Rojo/Azul internacionales de 32.768 bytes**, orientado a usar desde Android los respaldos extraídos de Consola Virtual 3DS. No requiere PC para el flujo de usuario una vez publicado.

**Estado:** implementación y pruebas locales; publicación de esta versión pendiente de acceso autenticado a GitHub. No se ha probado una partida real del usuario ni una restauración física en su 3DS.

## Funciones

- Importar `.sav` o `sav.dat` por su contenido, con tamaño, listas y checksum comprobados.
- Ver equipo y doce cajas; editar Pokémon existentes: especie, nivel, mote, DVs, experiencia de estadísticas y movimientos.
- Motor real `@pkhex-everywhere/engine` 0.31.0, con PKHeX.Core en WebAssembly.
- Original conservado byte por byte; respaldo local en IndexedDB, descarga independiente y SHA-256.
- Edición transaccional: borrador, exportación, relectura y comparación. Recuperación ante fallos.
- Bloqueo si el motor altera datos fuera de las regiones previstas. La Pokédex puede actualizarse al cambiar especie.
- Exportación sin cambios idéntica al archivo importado. Informe de cambios descargable.
- Análisis de legalidad de PKHeX separado de la integridad del archivo; no es una garantía de servicios oficiales.
- Interfaz en español, adaptable a móvil, y guía de transferencia por Wi-Fi.
- Generador Showdown y calculadora de DVs anteriores conservados en `herramientas.html`.

La web no sube partidas, no conecta con Nintendo ni realiza FTP. El teléfono transfiere archivos mediante un cliente FTP y la consola ejecuta ftpd. [Guía 3DS ↔ Android](docs/WIFI-3DS.md).

## Límites

Rojo y Azul comparten estructura: PKHeX puede mostrar `Red` al abrir Blue. Un nombre `sav.dat` no prueba origen de Consola Virtual. Se rechazan japonés, Yellow, otras generaciones, ROM hacks, ROM/CIA/ZIP y estados de emulador. No se crean Pokémon desde cero ni se editan eventos, inventario o dinero.

Las pruebas actuales son sintéticas; no acreditan compatibilidad de cada región, una partida jugable, funcionamiento de Android real, restauración en consola ni aceptación en Banco/HOME. Nunca restaures el fixture de pruebas. Conserva un respaldo independiente antes de experimentar.

## Desarrollo y comprobación

Requiere Node.js 22 o posterior; CI usa Node 24 y pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm build
pnpm preview
```

Abrir `http://127.0.0.1:4173/pokemon-lab/`. El build genera `dist/` y copia el runtime de forma local; no basta con publicar el HTML fuente. Cada build limpia únicamente la carpeta generada `dist` tras verificar su ruta.

Con el servidor activo:

```sh
pnpm exec playwright install chromium
pnpm test:browser
```

Alternativa visible: `/pokemon-lab/pruebas.html`, botón **Ejecutar pruebas**. Comprueba el motor real sin una ROM. La prueba de almacenamiento crea un respaldo sintético claramente identificado. [Evidencia y límites de pruebas](docs/TESTING.md).

## GitHub Pages

El flujo `.github/workflows/pages.yml` prueba, construye y publica `dist` en `main`. Las solicitudes de cambio ejecutan pruebas sin desplegar. El trabajo de publicación depende de que las pruebas terminen correctamente.

En Settings → Pages, la fuente debe ser **GitHub Actions**, no la raíz de `main` usada por v0.1. Destino previsto: `https://e27182Gatio.github.io/pokemon-lab/`. La existencia de esta URL no demuestra que v0.2 haya sido desplegada; comprobar la ejecución de Actions y la versión visible antes de anunciarlo.

## Licencia

GPL-3.0-or-later. Incluye `LICENSE`, avisos de dependencias y enlaces al código correspondiente de los motores. [Decisiones técnicas, versiones y fuentes](docs/ENGINE.md). Proyecto independiente, sin afiliación con Nintendo, Game Freak o PKHeX.
