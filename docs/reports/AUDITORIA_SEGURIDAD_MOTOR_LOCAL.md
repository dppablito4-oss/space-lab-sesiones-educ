# Verificación técnica del motor local de exportación

**Versión:** 1.4.1 · **Publicación:** 2026-10-19 22:31:42 UTC.

Este informe registra comprobaciones del binario descargado de GitHub. Su
alcance es integridad y exportación; no constituye una certificación independiente
ni una garantía de ausencia de vulnerabilidades.

## Artefacto verificado

| Dato | Valor |
| --- | --- |
| Archivo | `pablitopyhost.exe` |
| Tag | `v1.4.1` |
| Commit del motor | `f5a069cd647caa609e679adc44dc9956a1d4af86` |
| Tamaño | 95 950 603 bytes |
| SHA-256 | `BB224881BA5B595507BDBF137A67F301B00F3E4FA8233153383D3B5BDD97B0CB` |
| Compilación | GitHub Actions, Windows, Python 3.11, PyInstaller |
| Release | [Motor 1.4.1](https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/tag/v1.4.1) |
| Descarga | [pablitopyhost.exe](https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/download/v1.4.1/pablitopyhost.exe) |

El hash descargado coincide con el digest del asset de GitHub. Para comprobar
tu archivo en PowerShell:

```powershell
Get-FileHash -LiteralPath .\pablitopyhost.exe -Algorithm SHA256
```

El hash compara archivos; no sustituye una firma Authenticode ni acredita por sí
solo la seguridad del programa. La compilación publicada no dispone de firma
comercial de editor.

## Pruebas realizadas

- La compilación y las pruebas de GitHub Actions finalizaron correctamente.
- CI ejecutó el EXE y comprobó DOCX de planificación con 12 tablas y PDF canónico.
- Se descargó el asset publicado en carpeta separada y se verificaron tamaño,
  SHA-256 e inicio del servidor como versión 1.4.1.
- Esa descarga produjo DOCX válido de 66 168 bytes y PDF válido de 118 456 bytes,
  ambos HTTP 200. Se cerró el proceso temporal después de comprobarlo.
- El EXE 1.4.0 devolvía 422 para PDF canónico. Se corrigió el adaptador entre
  actividades y procesos; una regresión y la prueba del EXE protegen ese caso.

## Alcance y límites

El servidor del motor se configura en `127.0.0.1:8000`. La exportación utiliza
un token generado localmente que debe mantenerse privado. El programa puede
escribir ese token y archivos temporales o recursos del renderizador.
La sincronización e IA de la aplicación web utilizan servicios externos según
sus funciones y el aviso de privacidad.

Las pruebas cubren las muestras indicadas; no todas las plantillas, antivirus,
versiones de Windows o configuraciones de navegador. Los tamaños de documentos
generados pueden variar entre entornos.

## Compilar y verificar desde el código

```powershell
git checkout v1.4.1
python -m pip install -r backend/requirements.txt
python -m pip install pyinstaller
Push-Location backend
pyinstaller pablitopyhost.spec --clean --noconfirm
Pop-Location
python tests/verify_compiled_exe.py
```

El resultado se ubica en `backend/dist/pablitopyhost.exe`. Una compilación local
puede tener otro SHA-256 por diferencias del entorno y dependencias.
