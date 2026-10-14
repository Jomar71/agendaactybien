# AGENTS.md

Proyecto "Actitud & Bienestar" (agenda de citas psicológicas, tareas terapéuticas y directorio). SPA vanilla JS + Express, un solo proceso en producción (Pxxl). UI y comentarios en español; mantener ese idioma en textos de UI y comentarios.

## Comandos (todo se ejecuta en `backend/`; el `package.json` raíz solo reenvía con `npm --prefix backend`)

- `npm start` → backend en producción (`node src/index.js`, puerto 4000)
- `npm run dev` → nodemon
- `npm run seed` → `backend/src/seed.js` (resetea contraseñas demo con `SEED_FORCE_PASSWORD=true`)
- `node backend/src/migrate.js` → init manual de BD (normalmente no hace falta: arranca solo)
- **No hay tests, lint, typecheck ni build.** No inventes comandos que no existen.
- CI (`.github/workflows/verify.yml`) solo verifica que `index.html`, `frontend/js/app.js` y `backend/src/index.js` existan al hacer push a `main`.
- `.\verificar.ps1` → compara HEAD local con `origin/main` (confirma que el push subió).

## Arquitectura

- `backend/src/index.js`: Express que sirve **el raíz del repo como estático** + `/api/{auth,citas,tareas,contactos}`. Bloquea rutas sensibles (`/backend`, `/database`, `/.env`, `/.git`, `package.json`, `pxxl.toml`) con 404.
- `frontend/` contiene el código real: `frontend/js/app.js` (~5000 líneas, SPA con router por hash: `#/`, `#/agendar`, `#/tareas`, `#/historial`, `#/directorio`) y `frontend/css/styles.css`.
- **`js/app.js` y `css/styles.css` de la raíz son shims** (loader de script / `@import`), no código real. No editar ahí.
- Hay **dos shells paralelos**: `index.html` (raíz, con manifest + SW + fallback) y `frontend/index.html`. Cambios de markup/versiones deben replicarse en ambos.
- `pxxl.toml`: despliegue en Pxxl como servicio Node (`npm install --prefix backend`, port 4000). Repo: `Jomar71/agendaactybien`, rama `main`.

## Base de datos — adaptador dual MySQL/PostgreSQL (`backend/src/config/db.js`)

- Motor por `DATABASE_URL`: prefijo `postgresql://` → PG (producción Pxxl, SSL activo en hosts remotos); `mysql://` o vars `DB_*` → MySQL (local).
- **Los modelos SIEMPRE escriben SQL con placeholders `?`**; el adaptador los convierte a `$n` en PG, y agrega `RETURNING id` a los INSERT en PG. No usar `$n` ni SQL específico del motor en modelos/controllers.
- `migrate.js` se ejecuta en cada arranque: `CREATE TABLE IF NOT EXISTS` idempotente + índices/FK (solo PG) + seed de usuarios demo. Reintenta en segundo plano (provisión asíncrona de Pxxl). No hay flujo de migraciones manual.
- Un solo `.env`, en `backend/.env` (gitignored); copiar de `backend/.env.example`. `JWT_SECRET` tiene fallback hardcodeado en `middleware/auth.js`.

## Convenciones y reglas de negocio

- Auth JWT Bearer; token en localStorage/sessionStorage. Roles `admin` / `terapeuta`.
- Terapeutas: bloqueados de `/api/tareas` y `/api/contactos` (`authorizeNotTerapeuta`); ven citas por `professional_id`, no por `user_id`. Admin ve por `user_id`.
- Demo (seeds automáticos): `paola@terapia` / `pao1234567` (admin), `anabeli@terapia` / `anabeli1234567` (terapeuta).
- CORS permite cualquier `localhost`/`127.0.0.1` en cualquier puerto, `*.pxxl.click`, `*.github.io`; demás vía `CORS_ORIGINS`.
- **Cache-busting**: al cambiar la shell, subir `?v=X.Y.Z` en AMBOS `index.html` y renombrar `CACHE` en `sw.js` (hoy `?v=6.3.0` / `ayb-v6.3`).
- Frontend llama al API por `window.API_BASE_URL` > host `pxxl.click` > `http://localhost:4000`.
- Commits en español, a menudo con prefijos `feat:` / `fix:` / `chore:`.

## Memoria - Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas. - Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar. - Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte. - Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria. - No guardes nunca datos sensibles (claves, tokens, datos personales).
