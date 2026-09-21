# Migraciones de Supabase

Este directorio contiene cambios incrementales del esquema de Space Lab a partir de la estabilización de Core V1.

## Instalación nueva

Ejecuta [`database_setup.sql`](../../database_setup.sql). Ese archivo es el snapshot/bootstrap completo y debe dejar una instalación nueva en el mismo estado final que todas las migraciones vigentes.

## Actualización de una instalación existente

Aplica, en orden, los archivos SQL de este directorio mediante Supabase CLI o el flujo de despliegue de base de datos del proyecto.

Reglas:

1. Una migración aplicada es inmutable: nunca se edita ni se reutiliza.
2. Cada cambio posterior crea un archivo nuevo con timestamp creciente.
3. Las migraciones describen solo cambios incrementales desde este punto; no reconstruyen artificialmente el historial anterior.
4. Todo cambio también debe reflejarse en `database_setup.sql` para instalaciones nuevas.
5. Antes de desplegar, se revisan RLS, privilegios de funciones y compatibilidad con datos existentes.

## Secuencia inicial reservada

- `202609210001_profile_hardening.sql`: protección de campos de identidad y seguridad en perfiles.
- `202609210002_ai_credits.sql`: planes, billeteras, historial y operaciones atómicas de créditos IA.
