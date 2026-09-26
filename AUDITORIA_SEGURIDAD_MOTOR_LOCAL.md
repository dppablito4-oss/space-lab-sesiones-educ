# Reporte Oficial de Auditoría Técnica y Certificado de Seguridad

**Software Evaluado:** Motor Local de Exportación Space Lab (`pablitopyhost.exe` / `pablitohost.exe`)  
**Versión Auditada:** `v1.3.0`  
**Fecha de Publicación / Compilación:** 2026-09-21 04:54:41 UTC  
**Tipo de Aplicación:** Microservicio local en segundo plano (FastAPI / Python) para renderizado de documentos Word `.docx` (OMML) y PDF A4  
**Repositorio Oficial de Código Fuente:** [https://github.com/dppablito4-oss/space-lab-sesiones-educ](https://github.com/dppablito4-oss/space-lab-sesiones-educ)  
**Código Fuente del Backend:** [https://github.com/dppablito4-oss/space-lab-sesiones-educ/tree/main/backend](https://github.com/dppablito4-oss/space-lab-sesiones-educ/tree/main/backend)  
**Release Oficial:** [https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/tag/v1.3.0](https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/tag/v1.3.0)  

---

## 1. Ficha Técnica de Integridad y Verificación

| Parámetro | Valor de Verificación |
| :--- | :--- |
| **Nombre de archivo** | `pablitopyhost.exe` |
| **Versión canónica** | `1.3.0` (definida en `backend/version.py`) |
| **Etiqueta Git (Tag)** | `v1.3.0` (commit reproducible en GitHub) |
| **Hash Criptográfico SHA-256** | `98BFBCD7FA8D431E44B64EA9F892A1537C9D94EEF4E1B269D83D420FEB429105` |
| **Tamaño exacto del archivo** | `96,189,779 bytes` (~91.7 MB) |
| **Fecha y hora de compilación** | `2026-09-21 04:54:41 UTC` |
| **Entorno de compilación** | Servidor limpio automatizado en **GitHub Actions** (`windows-latest`, Python 3.11.x, PyInstaller) |
| **Enlace de descarga directa** | [Descargar pablitopyhost.exe (v1.3.0)](https://github.com/dppablito4-oss/space-lab-sesiones-educ/releases/download/v1.3.0/pablitopyhost.exe) |

---

## 2. Estado de Firma Digital y Windows SmartScreen

### 2.1. ¿Por qué Windows muestra una alerta de "Editor Desconocido"?
Microsoft Windows integra la tecnología **SmartScreen**, la cual alerta sobre cualquier archivo ejecutable `.exe` que no haya sido firmado con un certificado digital comercial **EV (Extended Validation)** u **OV (Organization Validation)** emitido por entidades de pago como DigiCert, Sectigo o GlobalSign (cuyos costos anuales oscilan entre $300 y $600 USD).

Al tratarse de un proyecto independiente y de código abierto sin fines comerciales corporativos:
- El binario **no cuenta con firma comercial Authenticode de pago**.
- **No obstante, la autenticidad e integridad del binario son 100% verificables** gracias a la firma hash criptográfica **SHA-256** y a que el binario es generado públicamente en los servidores de GitHub Actions a través de un flujo de CI/CD inmutable.

### 2.2. Verificación del Hash SHA-256 en Windows
Cualquier docente, administrador de sistemas o departamento de TI puede contrastar que el archivo descargado no ha sido alterado ni infectado:

Abra **PowerShell** en la carpeta donde descargó el archivo y ejecute:
```powershell
Get-FileHash -Path .\pablitopyhost.exe -Algorithm SHA256
```

El resultado debe coincidir exactamente con:
```text
Algorithm       Hash                                                               Path
---------       ----                                                               ----
SHA256          98BFBCD7FA8D431E44B64EA9F892A1537C9D94EEF4E1B269D83D420FEB429105   ...\pablitopyhost.exe
```

---

## 3. Auditoría de Código: Acceso al Sistema de Archivos

Se realizó una inspección estática del código fuente en `backend/`:

### 3.1. Hallazgos
- **Sin exploración del disco del usuario**: El código **no contiene** llamadas a funciones de rastreo o escaneo del sistema de archivos (como `os.walk`, enumeración recursiva de unidades de disco `C:\`, ni accesos a carpetas del usuario como `%USERPROFILE%\Documents`, `Desktop`, `Pictures` o `%APPDATA%`).
- **Archivos estrictamente gestionados**:
  1. `connection_token.txt`: Archivo local generado en el mismo directorio de ejecución para persistir temporalmente el token criptográfico rotativo de enlace.
  2. Archivos temporales de exportación: Al presionar "Exportar Word" en la aplicación web, el motor genera un archivo `.docx` en el directorio temporal del sistema (`tempfile`), lo transmite por streaming HTTP al navegador del usuario y lo libera.
  3. Recursos embebidos: Solo lee sus propias librerías internas empaquetadas por PyInstaller (`sys._MEIPASS`), como la plantilla base de Word y las librerías matemáticas de Matplotlib.

---

## 4. Auditoría de Código: Red y Conexiones Externas

### 4.1. Interfaz de Red y Aislamiento (Loopback Only)
- El servidor FastAPI se enlaza exclusivamente a la dirección de bucle local:
  ```python
  host = "127.0.0.1"  # localhost
  port = 8000
  ```
- **Inaccesible desde redes externas**: Al vincularse a `127.0.0.1`, el puerto `8000` **no acepta conexiones entrantes provenientes de internet ni de la red local (LAN / Wi-Fi)**. Solo el navegador web que corre en la misma máquina física puede comunicarse con el motor.

### 4.2. Conexiones Salientes y Ausencia de Telemetría
- **Cero telemetría**: El motor **no envía analíticas**, no recopila estadísticas de uso, ni se conecta a plataformas de seguimiento (Google Analytics, Mixpanel, Sentry, Datadog, etc.).
- **Cero subida de datos**: El contenido de las sesiones de aprendizaje, nombres de alumnos y propósitos curriculares **se procesan enteramente en la RAM y procesador local**. No se transmiten a ningún servidor externo.
- **Única conexión saliente opcional y documentada**:
  - En `backend/main.py` (función `descargar_chromium_nativo`), **únicamente si el usuario solicita exportación a PDF y la computadora no posee instalado Google Chrome, Microsoft Edge ni Brave**, el motor ofrece descargar de forma segura el paquete oficial de Chromium portable desde el repositorio oficial de Google:
    `https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/1182249/chrome-win.zip`.
  - Si el equipo ya cuenta con Microsoft Edge o Google Chrome (estándar en Windows 10/11), **no se realiza ninguna conexión a internet**.

### 4.3. Seguridad Web y Protección contra Ataques (PNA y Token Rotativo)
- **Token de Sesión Criptográfico**: Cada vez que el motor inicia, genera un token hexadecimal seguro de 64 caracteres (`secrets.token_hex(32)`). Las solicitudes web sin este token son rechazadas con código `HTTP 401 Unauthorized`.
- **Private Network Access (PNA)**: Implementa los encabezados requeridos por las normativas W3C y navegadores modernos (`Access-Control-Allow-Private-Network`), impidiendo que páginas web de terceros puedan realizar ataques de Cross-Site Request Forgery (CSRF) o DNS Rebinding contra el puerto local.

---

## 5. Compilación Reproducible e Independiente

Cualquier entidad educativa o técnica puede auditar el código fuente y compilar su propio ejecutable sin necesidad de utilizar el binario precompilado:

```powershell
# 1. Clonar el repositorio público
git clone https://github.com/dppablito4-oss/space-lab-sesiones-educ.git
cd space-lab-sesiones-educ

# 2. Instalar las dependencias oficiales
python -m pip install -r backend/requirements.txt
python -m pip install pyinstaller

# 3. Compilar el ejecutable localmente
cd backend
pyinstaller pablitopyhost.spec --clean --noconfirm
```

El ejecutable resultante se ubicará en `backend/dist/pablitopyhost.exe`, con comportamiento idéntico al distribuido en GitHub Releases.

---

## 6. Dictamen de Seguridad

| Criterio Evaluado | Estado | Justificación Técnica |
| :--- | :---: | :--- |
| **Integridad del Binario** | **CONFORME** | Hash SHA-256 verificado y coincidente con release GitHub. |
| **Privacidad de Archivos** | **CONFORME** | No realiza lectura ni escaneo de archivos del usuario. |
| **Aislamiento de Red** | **CONFORME** | Enlace exclusivo a `127.0.0.1:8000`. Sin telemetría. |
| **Transparencia** | **CONFORME** | 100% del código fuente disponible públicamente bajo control de versiones Git. |
| **Reproducibilidad** | **CONFORME** | Compilación auditable y reproducible mediante GitHub Actions y PyInstaller. |

**Conclusión:** El ejecutable `pablitopyhost.exe` cumple con los estándares de seguridad técnica requeridos para herramientas de uso docente y pedagógico en entornos educativos.
