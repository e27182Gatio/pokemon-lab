# Pokémon Lab · v0.4

Editor local en español. [Abrir Pokémon Lab](https://e27182gatio.github.io/pokemon-lab/).

## Raichu de Alola

Nueva sección `raichu.html`, limitada a este Pokémon:

- Crear un .pk7 con origen Ultra Sol o Ultra Luna, entrenador configurable, shiny opcional y Luxury Ball.
- Opción perfecto: seis IVs de 31. Los EVs se distribuyen por separado.
- Set recomendado para Z-A, temporada 19: Modesta, Banda Focus, 252 PS / 252 At. Especial / 4 Defensa; Rayo, Psíquico, Psicocarga y Maquinación.
- Recomendación revisada el 08/11/2026, con fuentes y fecha de caducidad. No se actualiza automáticamente; al terminar la temporada aparece como histórica.
- Abrir un `main` USUM de 445.440 bytes para añadirlo a una caja vacía o editar un Raichu de Alola existente con origen USUM.
- Descarga independiente del respaldo original, comprobación de CRC, legalidad y relectura del guardado; comparación de bytes para conservar otros Pokémon y el progreso.
- Código %trade copiable. El código no fija el origen; el .pk7 sí.

El archivo .pk7 es de séptima generación, no un archivo de Z-A. Las transferencias se realizan fuera de esta web y pueden cambiar movimientos u objetos. La restauración USUM en consola física no se ha probado. Los guardados artificiales de pruebas no se ofrecen como partidas descargables.

## Editor Rojo, Azul y Yellow

El editor existente admite guardados internacionales de 32.768 bytes: equipo, cajas, nivel, mote, DVs, experiencia de estadísticas y movimientos. Mantiene respaldo local en IndexedDB, exportación sin cambios idéntica e informe de cambios. Las herramientas Showdown/DVs siguen en `herramientas.html`.

La web no sube partidas ni conecta con Nintendo. Motor PKHeX Everywhere 0.31.0 alojado con la aplicación. La legalidad de PKHeX no garantiza aceptación por servicios oficiales. [Guía 3DS y Android](docs/WIFI-3DS.md).

## Desarrollo

Node 22 o posterior; CI usa Node 24 y pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm build
pnpm preview
pnpm exec playwright install chromium
pnpm test:browser
```

Abrir http://127.0.0.1:4173/pokemon-lab/. El build crea `dist/` con el runtime; no basta publicar el HTML fuente. Pruebas visibles en `pruebas.html` y `pruebas-raichu.html`, con datos sintéticos. Las pruebas USUM cubren ambos orígenes, IVs, shiny, ataques, exportación PK7, edición, adición, conservación del guardado, deshacer y rechazo de corrupción. La relectura de séptima generación se hace mediante el guardado completo; `pokemon.read` del motor solo admite generaciones 3–5.

GitHub Actions comprueba y publica `dist/` en main únicamente si pasan las pruebas, incluida la interfaz móvil y las descargas.

## Fuentes y licencia

[Temporada 19 oficial](https://plza-news.pokemon-home.com/en/page/51.html), [guía competitiva](https://gamewith.jp/pokemon-za/525028), [movimientos](https://www.serebii.net/pokedex-sv/raichu/).

GPL-3.0-or-later. [Motor y avisos](docs/ENGINE.md). Proyecto independiente, sin afiliación con Nintendo, Game Freak o PKHeX.
