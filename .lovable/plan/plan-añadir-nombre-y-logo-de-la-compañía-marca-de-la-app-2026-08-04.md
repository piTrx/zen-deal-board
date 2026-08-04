# Plan: Añadir nombre y logo de la compañía (marca de la app)

## Objetivo
Reemplazar la marca genérica "Dealflow" (texto + logo DMark) que aparece en la barra lateral por el **nombre** y **logo** de la empresa del usuario, subidos desde Ajustes. El logo se sube a Storage (bucket `avatars` existente) y se guarda en el perfil.

## Estado actual (verificado)
- `AppSidebar.tsx` muestra el texto **"Dealflow"** y el componente `DMark` de forma fija en el `SidebarHeader`.
- `profiles` ya tiene la columna `company text` (nombre de empresa), editable en Ajustes → Perfil.
- No existe campo para el **logo** de la empresa.
- El bucket público `avatars` ya existe y se usa para avatares de usuario.
- `ProfileSettings.tsx` ya sube archivos a `avatars` (patrón reutilizable) y guarda `avatar_url` en `profiles`.

## Cambios

### 1. Migración de base de datos
Añadir una columna a `profiles` para el logo de la empresa:
```sql
alter table public.profiles
  add column if not exists company_logo_url text;
```
Las políticas RLS de `profiles` ya permiten `UPDATE`/`SELECT` al propio usuario, así que no hacen falta políticas nuevas ni `GRANT`.

### 2. Regenerar tipos
Tras la migración, regenerar `src/integrations/supabase/types.ts` para incluir `company_logo_url` en `profiles`.

### 3. UI: subir logo en Ajustes → Perfil
Extender `src/components/settings/ProfileSettings.tsx`:
- Añadir un **uploader de logo de empresa** (junto al campo "Company" existente), reutilizando el mismo patrón que el avatar: subir a `avatars` en la ruta `company-logos/<user_id>/logo.<ext>` y guardar la URL pública en `profiles.company_logo_url`.
- Mantener el campo "Company" existente como nombre de la empresa.
- Validar tipo (jpeg/png/webp/svg) y tamaño (<2 MB), como hace el avatar.

### 4. Barra lateral usa la marca real
Actualizar `src/components/AppSidebar.tsx`:
- La query actual ya lee `profiles`; ampliarla para traer también `company, company_logo_url`.
- En el `SidebarHeader`:
  - Si hay `company_logo_url`, mostrar la imagen del logo (con `object-contain`, tamaño ~28px).
  - Si no, mostrar `DMark` como fallback.
  - Si hay `company`, mostrar ese texto como nombre de la app; si no, mostrar "Dealflow".
- Invalidar/actualizar la query `profile-sidebar` al guardar para que la marca cambie en caliente.

## Fuera de alcance
- No se cambia la landing pública ni el `<title>` del navegador (ese es branding del producto Lovable, no de la empresa del usuario). Se puede hacer después si lo pides.
- No se crea una tabla de "branding de equipo" compartida; se guarda en el perfil del usuario. Suficiente para el flujo actual de un único administrador.

## Verificación
- Build sin errores de tipos (`tsgo`).
- En el preview: ir a Ajustes → Perfil, subir un logo y poner un nombre de empresa → guardar; la barra lateral debe mostrar el nuevo logo + nombre en vez de "Dealflow"/DMark.
