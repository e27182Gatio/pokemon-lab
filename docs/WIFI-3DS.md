# 3DS XL con Luma3DS ↔ Android sin PC

La edición funciona en el navegador del teléfono. La transferencia requiere un cliente FTP en Android y [ftpd](https://github.com/mtheall/ftpd) en 3DS. La web no implementa FTP ni acceso directo a la SD.

## Traer el guardado

1. Guarda dentro de Pokémon Blue y cierra el juego.
2. En [Checkpoint](https://github.com/BernardoGiordano/Checkpoint) o el gestor que ya utilizas, crea un respaldo nuevo. Conserva ese respaldo original. Si el juego no aparece, revisa la documentación y el reconocimiento del título en ese gestor; no manipules a ciegas los datos cifrados de la SD.
3. Abre ftpd con la consola y Android en la misma red local. Usa la IP, el puerto y las credenciales que muestre tu configuración; no se presupone un puerto o contraseña universal.
4. En el cliente FTP de Android, descarga el archivo del respaldo. Checkpoint utiliza `/3ds/Checkpoint/saves/`; el nombre de la carpeta depende del título y de tu respaldo. No se inventa un Title ID regional.
5. El archivo de Blue VC suele llamarse `sav.dat`. Abre el archivo extraído en Pokémon Lab; la extensión no determina la compatibilidad. Esta versión exige 32.768 bytes y estructura internacional válida.
6. Descarga también el respaldo original desde Pokémon Lab y comprueba que existe fuera del navegador. IndexedDB puede borrarse al limpiar datos del sitio.

## Devolverlo

1. Aplica un cambio pequeño, revisa el resultado del motor y exporta.
2. Crea un segundo respaldo en el gestor de la consola para usarlo como destino de prueba.
3. Con ftpd, sustituye solo el archivo correspondiente dentro de ese segundo respaldo. Conserva los demás archivos que haya creado el gestor.
4. Verifica nombre exacto y tamaño. Android puede añadir `(1)` al nombre descargado; corrígelo en el destino. No copies un `.bak` como si fuera el guardado editado.
5. Cierra ftpd y restaura el segundo respaldo con el mismo gestor que lo creó.
6. Abre Blue y comprueba entrenador, progreso, equipo y cajas. Si algo falla, cierra el juego y restaura el respaldo original con el gestor.

No escribas directamente en los datos cifrados de la carpeta `Nintendo 3DS`. FTP sin cifrar debe usarse en una red local de confianza; cierra el servidor al terminar. Una red de invitados con aislamiento puede impedir la conexión entre dispositivos.

## Evidencia

Las fuentes oficiales anteriores documentan las herramientas de respaldo y FTP. Esta guía describe el flujo previsto, no una prueba completada en la consola del usuario. Sigue pendiente comprobar exportación/restauración con su versión de Blue, su gestor y su teléfono. Luma3DS instalado por sí solo no proporciona la transferencia FTP ni certifica el guardado.
