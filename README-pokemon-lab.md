# Pokémon Lab V0.1

Aplicación web estática en español. Incluye:

- Generador de códigos Showdown / `%trade` con plantillas personalizables.
- Copiar código o descargar archivo `.txt`.
- Calculadora de DVs de Pokémon de primera generación y criterio de shiny.
- Interfaz adaptable a Android y PC.

## Publicar en GitHub Pages

1. Subir `index.html` a la raíz del repositorio `pokemon-lab` en la rama `main`.
2. Abrir **Settings → Pages**.
3. En **Build and deployment**, seleccionar **Deploy from a branch**.
4. Elegir **main** y **/(root)**, luego **Save**.
5. Abrir `https://TU_USUARIO.github.io/pokemon-lab/` después del despliegue.

No requiere Node.js, instalación de dependencias ni build.

## Limitaciones

La versión actual **no importa ni edita `.sav`**, no integra PKHeX.Core ni valida legalidad de PKHeX. Las configuraciones de Pokémon no garantizan compatibilidad con el bot de intercambio o reglas PvP. Procesamiento local: no transmite datos a servidores.

Este proyecto no está afiliado a Pokémon, Nintendo, Game Freak ni al proyecto PKHeX.
