# Migraciones de Supabase

Este directorio contiene los cambios incrementales del esquema de Space Lab a partir de la estabilización de Core V1.

## Instalación nueva

1. Ejecuta [`database_setup.sql`](../../database_setup.sql) para crear el baseline.
2. Aplica, en orden, todos los archivos de este directorio que aún no estén incluidos en ese baseline. En el snapshot actual, esto comienza en `202609260001_usage_cost_telemetry.sql`.

`database_setup.sql` no es la fuente de verdad de las funciones SaaS posteriores al baseline. La fuente de verdad incremental es este directorio. No despliegues una instalación nueva ejecutando únicamente el snapshot.

## Actualización de una instalación existente

Aplica, en orden, los archivos SQL de este directorio mediante Supabase CLI o el flujo de despliegue de base de datos del proyecto.

Reglas:

1. Una migración aplicada es inmutable: nunca se edita ni se reutiliza.
2. Cada cambio posterior crea un archivo nuevo con timestamp creciente.
3. Las migraciones describen solo cambios incrementales desde este punto; no reconstruyen artificialmente el historial anterior.
4. No se copia manualmente cada cambio nuevo al snapshot; una instalación completa se obtiene aplicando baseline + migraciones.
5. Antes de desplegar, se revisan RLS, privilegios de funciones y compatibilidad con datos existentes.

## Secuencia inicial reservada

- `202609210001_profile_hardening.sql`: protección de campos de identidad y seguridad en perfiles.
- `202609210002_ai_credits.sql`: planes, billeteras, historial y operaciones atómicas de créditos IA.
