# Auditoría técnica — Space Lab Sesiones Educativas

Fecha: 2026-08-15  
Rama base revisada: `main` (`1dc837d1ea4c970d00b000f25ee24685e1d0100d`)

## Resultado ejecutivo

La aplicación tiene una base funcional: el frontend estático carga, el motor FastAPI inicia, la normalización acepta el JSON esperado y las exportaciones DOCX/PDF se generan correctamente en pruebas de humo. Se detectaron fallos de integración y seguridad que debían corregirse antes de ampliar funciones.

## Correcciones incluidas

1. **Datos generados por IA que se perdían.** `handleGenerateAI` no copiaba competencias transversales, enfoques, recursos, alumnos ni diseño al objeto de sesión. Ahora conserva todas esas secciones y mantiene la fecha original al regenerar.
2. **Lista de alumnos ausente en Word/PDF.** `getFormDataJSON` no enviaba los nombres editados al backend. Ahora los obtiene del textarea y los incluye en la exportación.
3. **Sesiones eliminadas que podían reaparecer.** `saveSession` leía solo registros activos y descartaba los tombstones pendientes. Ahora guarda sobre el conjunto completo, incluidos los eliminados.
4. **Fórmulas matemáticas en línea sin renderizar.** El prompt pedía `$...$`, pero KaTeX no registraba ese delimitador. Se añadió el delimitador correspondiente.
5. **Escalada de privilegios en RLS.** `is_admin()` confiaba en `user_metadata`, que el usuario puede modificar. Ahora consulta `profiles` mediante una función `SECURITY DEFINER`, restringe inserciones de perfiles a rol `user` y sincroniza roles únicamente a `app_metadata`.
6. **Suplantación de logs.** La política permitía insertar registros con cualquier `user_id`. Ahora cada usuario solo puede registrar acciones con su propio ID.
7. **Tabla de alumnos incompleta en la instalación principal.** Se integró el esquema idempotente de `alumnos` en `database_setup.sql` y se hizo reejecutable `student_roster.sql`.
8. **Routers de IA expuestos.** Gemini, DeepSeek y OpenAI ahora verifican una sesión Supabase válida antes de consumir créditos del proveedor.
9. **Token local persistente y versionado.** El motor rota el token en cada arranque; el archivo ya no se conserva como fuente y quedó ignorado por Git.
10. **Defaults mutables en Pydantic.** Las listas usan `Field(default_factory=list)` para evitar estado compartido accidental.
11. **Inyección HTML en el encabezado de usuario.** El correo y apodo se escapan antes de insertarlos en la interfaz.
12. **Ausencia de validación automática.** Se añadieron pruebas de humo y un workflow de GitHub Actions para Python, JavaScript, JSON, almacenamiento y exportación DOCX.

## Validaciones ejecutadas

- Sintaxis de `backend/main.py` y `backend/docx_builder.py`: correcta.
- Sintaxis de todos los archivos JavaScript: correcta.
- `data/competencias.json`: JSON válido.
- Prueba de almacenamiento: correcta; un guardado nuevo conserva tombstones.
- Motor FastAPI: endpoint de estado correcto y token incorrecto rechazado con HTTP 401.
- Exportación DOCX real: correcta, archivo OOXML de 40 KB generado.
- Exportación PDF real con Chromium: correcta, PDF de 29 KB generado.
- Carga del frontend en Chromium: correcta, sin excepciones JavaScript de página; pestañas y modal de autenticación respondieron.
- IDs estáticos: sin duplicados; las referencias faltantes detectadas corresponden a nodos creados dinámicamente.

## Pendientes para aplicar en infraestructura

1. Ejecutar `database_setup.sql` en Supabase para activar las políticas corregidas y crear `alumnos` si aún no existe.
2. Volver a desplegar las cuatro Edge Functions para que la autenticación de routers entre en vigor.
3. Generar y publicar una nueva versión del `.exe`; el binario actual no incorpora la rotación de token ni los cambios del backend.
4. Renombrar el repositorio de `space-lab-sesiones-educ.` a `space-lab-sesiones-educ` (sin punto final). El enlace entregado sin punto devuelve 404.
5. Sacar `backend/build/`, `backend/dist/`, `__pycache__/` y binarios grandes del historial futuro. El repositorio reporta aproximadamente 478 MB y contiene artefactos generados; lo ideal es publicar el `.exe` mediante GitHub Releases.

## Observaciones

- La clave `sb_publishable_...` de Supabase está diseñada para ser pública en el navegador; la seguridad depende de RLS. No debe sustituirse por una `service_role` en el frontend.
- `gpt-5.4-mini` es un identificador válido y admite Chat Completions, por lo que no se cambió.
- No se modificó el diseño visual ni la estructura pedagógica; esta intervención prioriza que lo existente funcione y quede protegido.
