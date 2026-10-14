# MEMORY.md

## Identidad del Proyecto
- **Nombre**: Actitud & Bienestar (agendaactybien)
- **Propósito**: Agenda de citas psicológicas, tareas terapéuticas y directorio.
- **Repo**: `Jomar71/agendaactybien`, rama `main`.
- **Autor**: Desarrollador colombiano, trabaja desde VS Code en Windows 11.
- **Idioma de trabajo**: Español (Colombia). UI y comentarios en español.

## Stack Técnico Confirmado
- SPA vanilla JS + Express, un solo proceso en producción (Pxxl).
- Backend: Node + Express, puerto 4000.
- Frontend: HTML + CSS + JS vanilla, router por hash.
- Base de datos: adaptador dual MySQL (local) / PostgreSQL (producción Pxxl).
- Sin tests, sin lint, sin typecheck, sin build. No inventar comandos.

## Convenciones de Código (Decisiones ya tomadas)
- Los modelos SIEMPRE escriben SQL con placeholders `?`. Nunca usar `$n` ni SQL específico del motor.
- `frontend/js/app.js` y `frontend/css/styles.css` son el código real. Los de la raíz son shims.
- Hay dos shells paralelos (`index.html` raíz y `frontend/index.html`). Cualquier cambio de markup o versión debe replicarse en ambos.
- Cache-busting: subir `?v=X.Y.Z` en AMBOS `index.html` y renombrar `CACHE` en `sw.js`.
- Commits en español, con prefijos `feat:` / `fix:` / `chore:`.

## Base de Datos
- Un solo `.env`, en `backend/.env` (gitignored). Copiar de `backend/.env.example`.
- `migrate.js` se ejecuta en cada arranque: `CREATE TABLE IF NOT EXISTS` idempotente + índices/FK (solo PG) + seed de usuarios demo.
- Reintenta en segundo plano (provisión asíncrona de Pxxl). No hay flujo de migraciones manual.
- `JWT_SECRET` tiene fallback hardcodeado en `middleware/auth.js`.

## Usuarios Demo (seeds automáticos)
- `paola@terapia` / `pao1234567` (admin)
- `anabeli@terapia` / `anabeli1234567` (terapeuta)

## Reglas de Negocio
- Auth JWT Bearer; token en localStorage/sessionStorage. Roles `admin` / `terapeuta`.
- Terapeutas: bloqueados de `/api/tareas` y `/api/contactos` (`authorizeNotTerapeuta`); ven citas por `professional_id`, no por `user_id`.
- Admin ve por `user_id`.
- CORS permite cualquier `localhost`/`127.0.0.1` en cualquier puerto, `*.pxxl.click`, `*.github.io`; demás vía `CORS_ORIGINS`.
- Frontend llama al API por `window.API_BASE_URL` > host `pxxl.click` > `http://localhost:4000`.

## Advertencias Recordadas
- No editar `js/app.js` ni `css/styles.css` de la raíz (son shims).
- No usar `$n` ni SQL específico del motor en modelos/controllers.
- No hay tests automatizados. Validar cambios en el navegador o manualmente.
- CI (`.github/workflows/verify.yml`) solo verifica existencia de archivos clave al hacer push a `main`.
- `.\verificar.ps1` compara HEAD local con `origin/main` para confirmar que el push subió.

## Preferencias del Desarrollador
- Prefiero soluciones simples y sin dependencias antes que instalar librerías nuevas.
- Cuando haya que añadir una librería, evaluar primero si se puede resolver con código nativo.
- Evitar refactorizaciones grandes sin discutirlo antes.
- Confirmar siempre los cambios en el navegador antes de dar una tarea por terminada.

## Contexto Histórico
- El proyecto evolucionó de una app 100% estática a una SPA con backend Express.
- Se adoptó el adaptador dual MySQL/PostgreSQL para funcionar local y en producción sin cambiar los modelos.
- Se mantienen dos shells HTML por compatibilidad con el manifest, el service worker y la versión en `frontend/`.
- El correo electrónico al agendar una cita es OPCIONAL: solo se valida el formato si el usuario escribe algo (frontend). El backend nunca lo exigió.