# Plan futuro — Exportación híbrida local y en la nube

**Estado:** diferido  
**Fecha de registro:** 2026-09-27  
**Objetivo futuro:** ofrecer exportación documental mediante el motor local de
Windows y, como beneficio adicional de suscripción, mediante un servicio en la
nube desplegado en Render.

---

## 1. Decisión actual

Por ahora se conserva el motor local y su funcionamiento actual:

```text
Aplicación web
→ pablitopyhost.exe
→ SessionDocument v1
→ DOCX nativo
→ Word o Chromium para PDF
```

No se retira Chromium todavía y no se despliega el conversor en Render.

Esta decisión evita introducir un segundo entorno de exportación antes de
terminar y validar el flujo de Planificación articulada V1.

---

## 2. Por qué no conviene aplicarlo todavía

### 2.1. Chromium sigue siendo un respaldo necesario en Windows

El motor local intenta convertir el DOCX con Microsoft Word. Si Word no está
instalado o la conversión falla, Chromium permite generar el PDF.

Retirarlo ahora dejaría sin exportación PDF a una parte de los usuarios. Antes
de eliminarlo debe existir y probarse un reemplazo local con LibreOffice.

### 2.2. El servicio de Render todavía no existe

Faltan el contenedor, LibreOffice, las fuentes compatibles, el arranque con el
puerto dinámico de Render y las pruebas dentro de Linux.

No basta con cambiar una dependencia: el PDF debe conservar el formato A4, los
márgenes, las fórmulas y las tablas MINEDU de hasta 13 columnas.

### 2.3. La autenticación local no sirve para la nube

El token generado por `pablitopyhost.exe` protege una conexión en localhost.
No debe reutilizarse como secreto público en Render ni incluirse dentro del
JavaScript del navegador.

La exportación en la nube debe validar la sesión de Supabase y comprobar una
capacidad comercial como `export.cloud` en el servidor.

### 2.4. Faltan límites de uso y costos definidos

LibreOffice consume memoria y CPU por cada conversión. Antes de habilitarlo se
deben definir:

- planes que pueden usar la función;
- exportaciones incluidas por ciclo;
- costo en créditos, si corresponde;
- límite de tamaño y tiempo por documento;
- concurrencia máxima y manejo de cola;
- política de reintentos y errores.

### 2.5. La prioridad actual es Planificación articulada V1

El proyecto ya tiene en curso una vertical de Experiencias, Unidades y
Proyectos. Agregar simultáneamente otra arquitectura de despliegue aumentaría
el alcance y dificultaría distinguir errores del wizard, Supabase y el motor
de documentos.

---

## 3. Arquitectura objetivo

```text
                       ┌─────────────────────────┐
                       │ Núcleo documental común │
                       │ SessionDocument v1      │
                       │ docx_builder_v1         │
                       └────────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
          ┌─────────▼─────────┐          ┌──────────▼─────────┐
          │ Motor local       │          │ Servicio en Render │
          │ Windows           │          │ Linux              │
          │ Tkinter + token   │          │ FastAPI sin GUI    │
          │ Word/LibreOffice  │          │ LibreOffice        │
          └───────────────────┘          └────────────────────┘
```

Los dos modos deben consumir el mismo `SessionDocument v1` y el mismo generador
DOCX. Esto evita que el PDF local y el PDF de la nube tengan diseños distintos.

---

## 4. Propuesta comercial futura

### Motor local

- Disponible como opción base.
- Procesamiento dentro de la computadora del docente.
- Puede funcionar sin subir documentos pedagógicos.
- No genera costos de conversión en el servidor.
- Útil para trabajo sin conexión y privacidad máxima.

### Exportación en la nube

- Beneficio para planes superiores o uso mediante créditos.
- No requiere instalar el ejecutable.
- Disponible desde móviles, tabletas, Chromebook y equipos sin Word.
- Procesamiento temporal; los archivos deben eliminarse al terminar.
- Debe mostrar al usuario cuándo se usará la nube.

Capacidad comercial sugerida:

```text
export.cloud
```

La autorización debe resolverse en el servidor mediante Supabase. La interfaz
solo solicita la exportación y presenta el resultado.

---

## 5. Cambios futuros necesarios

### Núcleo del backend

1. Crear un módulo `pdf_converter.py` independiente de FastAPI y Tkinter.
2. Implementar `convert_docx_to_pdf(input_docx, output_pdf)`.
3. Usar Microsoft Word o LibreOffice en Windows.
4. Usar LibreOffice Headless en Linux.
5. Crear un directorio y perfil de LibreOffice independiente por petición.
6. Aplicar tiempo máximo, limpieza garantizada y nombres internos aleatorios.

### Endpoints

1. Migrar `/exportar-pdf-json` al flujo:

   ```text
   SessionDocument v1 → DOCX canónico → PDF
   ```

2. Mantener temporalmente `/exportar-pdf` para compatibilidad.
3. Convertir esa ruta al nuevo pipeline o retirarla después de confirmar que no
   existen clientes antiguos.
4. Devolver errores públicos breves y conservar los detalles solo en logs.

### Separación de aplicaciones

Crear entradas distintas:

```text
desktop_main.py  → ejecutable local con Tkinter
server_main.py   → servicio FastAPI para Render
```

El servidor de Render no debe importar Tkinter, abrir navegadores, crear tokens
locales ni buscar programas instalados en Windows.

### Dependencias

Separar dependencias de producción y desarrollo:

```text
requirements-core.txt
requirements-desktop.txt
requirements-cloud.txt
requirements-dev.txt
```

Playwright puede eliminarse del backend de Render cuando no participe en la
conversión. Debe mantenerse como dependencia de desarrollo porque las pruebas
visuales del frontend usan Chromium.

### Render

1. Crear `backend/Dockerfile`.
2. Instalar `libreoffice-writer`.
3. Instalar fuentes Carlito y Liberation como sustitutos compatibles.
4. Arrancar Uvicorn en `0.0.0.0` y `$PORT`.
5. Añadir un endpoint de salud.
6. Definir límites de memoria, concurrencia y tiempo.

### Frontend

Actualizar `LocalExportClient` para aceptar URLs base completas:

```text
https://servicio-render.example
http://localhost:8000
http://127.0.0.1:8000
```

Flujo recomendado:

```text
Usuario con export.cloud
→ ofrecer "Exportar en la nube"

Motor local conectado
→ ofrecer "Exportar con este equipo"

Sin permiso de nube y sin motor local
→ mostrar descarga y guía de conexión
```

---

## 6. Seguridad requerida

- Validar JWT de Supabase en el servicio de Render.
- Verificar `export.cloud` en el servidor.
- No exponer `service_role` ni secretos dentro del frontend.
- No usar un token compartido incluido en JavaScript.
- Limitar el tamaño del JSON y de imágenes incorporadas.
- No aceptar argumentos de LibreOffice proporcionados por el usuario.
- Usar directorios temporales independientes.
- Eliminar DOCX, PDF e imágenes temporales en un bloque `finally`.
- Registrar identificadores de solicitud sin almacenar el contenido docente.
- Aplicar límites de tiempo y concurrencia.

---

## 7. Pruebas necesarias antes de activarlo

### Pruebas funcionales

- Exportar los fixtures de Inicial, Primaria y Secundaria.
- Confirmar que el PDF comienza con una firma PDF válida.
- Verificar tamaño A4, número de páginas y texto esperado.
- Probar fórmulas matemáticas, listas de cotejo, logos y ficha de trabajo.

### Fidelidad visual

- Comparar páginas renderizadas del DOCX y PDF.
- Revisar anchos, bordes, saltos de página y tablas de 13 columnas.
- Definir una tolerancia visual reproducible.

### Concurrencia

- Ejecutar varias conversiones simultáneas.
- Confirmar que LibreOffice no reutiliza un perfil bloqueado.
- Verificar que un fallo no elimina archivos pertenecientes a otra solicitud.

### Seguridad y suscripción

- Rechazar usuarios sin sesión.
- Rechazar planes sin `export.cloud`.
- Cobrar o reservar créditos de forma idempotente.
- Reembolsar créditos cuando la conversión falla.
- Impedir que un usuario consulte el trabajo de otro.

---

## 8. Condiciones para retomar este plan

Iniciar el trabajo cuando se cumplan estas condiciones:

- Planificación articulada V1 está estable.
- Existe una decisión comercial para `export.cloud`.
- Se dispone de un entorno Render de prueba.
- Se acepta instalar LibreOffice y sus fuentes en la imagen.
- Hay fixtures representativos para comparar DOCX y PDF.
- Se ha definido si el motor local conservará Chromium durante una transición.

---

## 9. Orden recomendado de implementación

```text
1. Extraer núcleo documental compartido
2. Implementar conversor LibreOffice
3. Crear y probar Docker de Render
4. Comparar fidelidad DOCX/PDF
5. Añadir autenticación y export.cloud
6. Integrar selector local/nube en frontend
7. Ejecutar piloto limitado
8. Retirar Chromium de Render
9. Evaluar retiro de Chromium en Windows
```

---

## 10. Regla para retirar Chromium

Chromium puede retirarse de Render cuando:

- todos los endpoints PDF usan el DOCX canónico;
- LibreOffice funciona en el contenedor;
- las pruebas de fidelidad y concurrencia pasan;
- el servicio tiene autenticación, límites y limpieza temporal.

Chromium puede retirarse del ejecutable de Windows cuando:

- Word y LibreOffice cubren los equipos soportados;
- el fallo de ambos produce una guía clara para el usuario;
- se confirma que ningún endpoint activo necesita HTML → PDF;
- la nueva versión se prueba en equipos sin Microsoft Word.

Hasta entonces, Chromium permanece como mecanismo de compatibilidad local.
