/* =====================================================================
   ACTITUD & BIENESTAR – GESTIÓN TERAPÉUTICA INFANTIL Y JUVENIL
   app.js – Lógica principal de la SPA con Autenticación, Mi Directorio,
            Avisos con Timbre, Mis Tareas, Mi Agenda y Mi Historial
   Versión: 3.2.0
   ===================================================================== */

/* =====================================================================
   1. CREDENCIALES Y DATOS ESTÁTICOS
   ===================================================================== */

/** Credenciales predefinidas de acceso para demostración */
const DEMO_CREDENTIALS = {
  email: 'paola@terapia',
  password: 'pao1234567',
  name: 'Paola',
  role: 'Administrador Clínico'
};

/** Profesionales disponibles para citas */
const PROFESSIONALS = [
  {
    id: 1,
    nombre: 'Dra. Anabeli Córdoba',
    especialidad: 'Psicología Clínica',
    descripcion: 'Atención psicológica clínica integral para niños, niñas y adolescentes: evaluación, diagnóstico y tratamiento de dificultades emocionales y conductuales.',
    emoji: '🧠'
  },
  {
    id: 2,
    nombre: 'Paola Montenegro',
    especialidad: 'Terapeuta Emocional',
    descripcion: 'Acompañamiento terapéutico enfocado en el bienestar emocional: manejo de emociones, autoestima, ansiedad y desarrollo de habilidades socioemocionales.',
    emoji: '💚'
  }
];

/** Motivos de consulta predefinidos */
const MOTIVOS = [
  'Ansiedad o miedos excesivos',
  'Problemas de conducta o rabietas frecuentes',
  'Bajo rendimiento escolar o desmotivación',
  'Tristeza, desánimo o aislamiento social',
  'Déficit de atención e hiperactividad (TDAH)',
  'Dificultades en el sueño o pesadillas',
  'Problemas en la dinámica o comunicación familiar',
  'Acoso escolar (bullying)',
  'Procesos de duelo o separación familiar',
  'Evaluación psicológica/neuropsicológica integral',
  'Otro motivo'
];

/** Horarios disponibles (franjas de 5 minutos, de 08:00 a 17:30) */
const TIME_SLOTS = [];
for (let m = 8 * 60; m <= 17 * 60 + 30; m += 5) {
  TIME_SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

/** Contactos iniciales predeterminados para Mi Directorio */
const DEFAULT_CONTACTS = [
  {
    id: 'c1',
    nombre: 'Laura Morales Gómez',
    telefono: '3109876543',
    email: 'laura.morales@ejemplo.com',
    relacion: 'Madre',
    paciente: 'Lucas Morales (7 años)',
    notas: 'Madre de Lucas. Prefiere contacto por WhatsApp después de las 2:00 PM.'
  },
  {
    id: 'c2',
    nombre: 'Carlos Eduardo Restrepo',
    telefono: '3201234567',
    email: 'carlos.restrepo@ejemplo.com',
    relacion: 'Padre',
    paciente: 'Valeria Restrepo (14 años)',
    notas: 'Padre de Valeria. Seguimiento a sesiones de orientación vocacional.'
  },
  {
    id: 'c3',
    nombre: 'Dra. María Elena Suárez',
    telefono: '3005551234',
    email: 'm.suarez@colegio.edu.co',
    relacion: 'Terapeuta',
    paciente: 'Orientadora Escolar',
    notas: 'Psicoorientadora del Colegio San José. Enlace para informes escolares.'
  }
];

/* =====================================================================
   9.c CAPA DE INTEGRACIÓN CON EL BACKEND (REST + JWT)
   =====================================================================
   Centraliza TODAS las peticiones al backend:
   - Autenticación con JWT (token en localStorage/sessionStorage)
   - Credenciales y encabezados de autorización en cada petición
   - Manejo de errores: 401 → cierre de sesión; 4xx/5xx → mensaje claro
   - Respaldo automático en localStorage si el backend no responde
   ===================================================================== */

/** Constantes de almacenamiento local */
const LS_TOKEN        = 'ayb_token';
const LS_SESSION      = 'ayb_session';
const LS_APPOINTMENTS = 'ayb_appointments';
const LS_TASKS        = 'ayb_tasks';
const LS_CONTACTS     = 'ayb_contacts';

/**
 * URL base del backend. Prioridad de configuración:
 *  1. window.API_BASE_URL (defínela antes de cargar app.js si el backend
 *     está en otro servidor, ej: <script>window.API_BASE_URL='https://api...'</script>)
 *  2. El host actual si es un subdominio de pxxl.click (se asume el backend
 *     publicado bajo /api del mismo dominio).
 *  3. http://localhost:4000 (desarrollo local).
 */
const BACKEND_API_BASE = (function () {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  const host = (window.location.host || '').toLowerCase();
  if (/pxxl\.click/i.test(host)) return `${window.location.protocol}//${host}`;
  return 'http://localhost:4000';
})();

/** Estado de conexión del backend (para mostrar un aviso al usar respaldo local) */
let backendOnline = true;

/** Lee/elimina el token JWT actual de localStorage o sessionStorage */
function getToken() {
  try {
    return localStorage.getItem(LS_TOKEN) || sessionStorage.getItem(LS_TOKEN) || null;
  } catch { return null; }
}

function setToken(token, remember = false) {
  try {
    if (remember) { localStorage.setItem(LS_TOKEN, token); sessionStorage.removeItem(LS_TOKEN); }
    else          { sessionStorage.setItem(LS_TOKEN, token); localStorage.removeItem(LS_TOKEN); }
  } catch (e) { console.error('Error guardando el token:', e); }
}

function clearToken() {
  try { localStorage.removeItem(LS_TOKEN); sessionStorage.removeItem(LS_TOKEN); } catch (e) { /* ignorar */ }
}

/** Indica si la sesión actual proviene del respaldo local (sin backend).
 *  Con un token local NO se debe sincronizar contra el servidor, pues ese
 *  token falso devolvería 401 y provocaría un cierre de sesión no deseado. */
function isLocalToken() {
  const t = getToken();
  return typeof t === 'string' && t.startsWith('local-');
}

/** Encabezados por defecto, inyectando el token Bearer si existe */
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

/** Aviso de "modo respaldo local" desactivado: la app siempre funciona
 *  con copia local y se sincroniza en segundo plano sin letreros. */
function updateBackendBanner() {
  try { document.getElementById('offline-banner')?.remove(); } catch (e) { /* ignorar */ }
}

function setBackendOnline(online) {
  backendOnline = online;
}

/** Cierra la sesión ante un 401 (token inválido/expirado) y redirige al login */
function handleUnauthorized() {
  clearToken();
  clearAuthState();
  showToast('Tu sesión ha caducado. Por favor inicia sesión de nuevo.', 'info');
  window.location.hash = '#/';
  if (typeof router === 'function') router();
}

/** Mensaje por defecto según el código de error HTTP */
function defaultErrorMessage(status) {
  if (status >= 500) return 'Error del servidor. Inténtalo de nuevo más tarde.';
  if (status === 404) return 'No se encontró el recurso solicitado.';
  if (status === 400 || status === 422) return 'La información enviada no es válida.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  return 'Ocurrió un error inesperado.';
}

/**
 * fetch() unificado contra el backend.
 * - Aplica timeout para no dejar cargando indefinidamente.
 * - Envía credenciales y el token JWT automáticamente.
 * - Convierte errores 401 en cierre de sesión y 4xx/5xx en mensajes claros.
 * - Si no hay red, marca el respaldo local y lanza un error con status 0.
 */
async function apiFetch(path, { method = 'GET', body, timeout = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let res;

  try {
    res = await fetch(BACKEND_API_BASE + path, {
      method,
      headers: getAuthHeaders(),
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    setBackendOnline(false);
    const e = new Error('No se pudo conectar con el servidor. Se ha activado la copia local; verifica tu conexión e inténtalo de nuevo.');
    e.status = 0;
    throw e;
  }
  clearTimeout(timer);

  // 401 → cerrar sesión y volver al login
  if (res.status === 401) {
    handleUnauthorized();
    const e = new Error('Sesión no válida o caducada. Por favor inicia sesión de nuevo.');
    e.status = 401;
    throw e;
  }

  let data = null;
  try { data = await res.json(); } catch { data = null; }

  // 4xx / 5xx → mensaje claro
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || defaultErrorMessage(res.status);
    const e = new Error(message);
    e.status = res.status;
    e.data = data;
    throw e;
  }

  setBackendOnline(true);
  return data;
}

/** Helpers CRUD agrupados por recurso */
const API = {
  auth: {
    login: (email, password) =>
      apiFetch('/api/auth/login', { method: 'POST', body: { email, password } }),
    register: (payload) =>
      apiFetch('/api/auth/register', { method: 'POST', body: payload }),
    profile: () =>
      apiFetch('/api/auth/profile')
  },
  citas: {
    getAll:  () => apiFetch('/api/citas'),
    create:  (c) => apiFetch('/api/citas', { method: 'POST', body: c }),
    update:  (id, c) => apiFetch('/api/citas/' + id, { method: 'PUT', body: c }),
    remove:  (id) => apiFetch('/api/citas/' + id, { method: 'DELETE' })
  },
  tareas: {
    getAll:  () => apiFetch('/api/tareas'),
    create:  (t) => apiFetch('/api/tareas', { method: 'POST', body: t }),
    update:  (id, t) => apiFetch('/api/tareas/' + id, { method: 'PUT', body: t }),
    remove:  (id) => apiFetch('/api/tareas/' + id, { method: 'DELETE' })
  },
  contactos: {
    getAll:  () => apiFetch('/api/contactos'),
    create:  (c) => apiFetch('/api/contactos', { method: 'POST', body: c }),
    update:  (id, c) => apiFetch('/api/contactos/' + id, { method: 'PUT', body: c }),
    remove:  (id) => apiFetch('/api/contactos/' + id, { method: 'DELETE' })
  }
};

/* ---------------------------------------------------------------------
   Conversión de datos entre el formato del frontend (camelCase, ids de
   texto) y el formato del backend (snake_case, ids numéricos), para que
   la lógica existente de la SPA siga funcionando sin cambios.
   --------------------------------------------------------------------- */

/** Normaliza un registro devuelto por el backend al formato del frontend */
function normalizeCitaFromServer(c) {
  return {
    id: String(c.id),
    professionalId: c.professional_id,
    professionalName: c.professional_name,
    professionalSpecialty: c.professional_specialty,
    tutorNombre: c.tutor_nombre,
    pacienteNombre: c.paciente_nombre,
    pacienteEdad: c.paciente_edad,
    // PostgreSQL devuelve DATE y TIME como cadenas 'YYYY-MM-DD' y 'HH:MM:SS'
    fecha: c.fecha ? String(c.fecha).slice(0, 10) : c.fecha,
    hora: c.hora ? String(c.hora).slice(0, 5) : c.hora,
    telefono: c.telefono,
    email: c.email,
    motivo: c.motivo,
    motivoDetalle: c.motivo_detalle,
    reminderOffset: c.reminder_offset,
    reminderSound: c.reminder_sound,
    estado: c.estado || 'confirmada',
    createdAt: c.created_at
  };
}

function normalizeTaskFromServer(t) {
  return {
    id: String(t.id),
    date: t.fecha ? String(t.fecha).slice(0, 10) : t.fecha,
    time: t.hora ? String(t.hora).slice(0, 5) : t.hora,
    title: t.title,
    description: t.description,
    priority: t.priority,
    category: t.category,
    reminderOffset: t.reminder_offset,
    reminderSound: t.reminder_sound,
    done: !!t.done,
    completedAt: t.completed_at,
    createdAt: t.created_at
  };
}

function normalizeContactFromServer(c) {
  return {
    id: String(c.id),
    nombre: c.nombre,
    telefono: c.telefono,
    email: c.email,
    relacion: c.relacion,
    paciente: c.paciente,
    notas: c.notas,
    createdAt: c.created_at
  };
}

/** Convierte una cita del formato frontend al formato que espera el backend */
function citaToServer(c) {
  return {
    professionalId: c.professionalId,
    professionalName: c.professionalName,
    professionalSpecialty: c.professionalSpecialty,
    tutorNombre: c.tutorNombre,
    pacienteNombre: c.pacienteNombre,
    pacienteEdad: c.pacienteEdad,
    fecha: c.fecha,
    hora: c.hora,
    telefono: c.telefono,
    email: c.email,
    motivo: c.motivo,
    motivoDetalle: c.motivoDetalle,
    reminderOffset: c.reminderOffset,
    reminderSound: c.reminderSound,
    estado: c.estado || 'confirmada'
  };
}

function taskToServer(t) {
  return {
    date: t.date,
    time: t.time,
    title: t.title,
    description: t.description,
    priority: t.priority,
    category: t.category,
    reminderOffset: t.reminderOffset,
    reminderSound: t.reminderSound,
    done: !!t.done
  };
}

function contactToServer(c) {
  return {
    nombre: c.nombre,
    telefono: c.telefono,
    email: c.email,
    relacion: c.relacion,
    paciente: c.paciente,
    notas: c.notas
  };
}

/** Lee una clave de localStorage de forma segura */
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

/** Escribe una clave en localStorage de forma segura */
function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error('Error guardando en localStorage:', e); }
}

/** Función de autenticación real con JWT contra el backend.
 *  - Prioriza el backend: si responde, crea una sesión real con JWT.
 *  - Solo si el servidor NO está disponible (sin red o caído) cae a la
 *    cuenta local de respaldo para que la app siga siendo usable offline. */
async function authenticateLogin(email, password, remember) {
  // 1) Intentar SIEMPRE contra el backend primero (sesión real con JWT)
  try {
    const data = await API.auth.login(email, password);
    const token = data && data.token;
    const user = (data && data.user) || null;
    if (!token || !user) {
      throw new Error('El servidor no devolvió una sesión válida.');
    }
    setToken(token, remember);
    state.auth.isAuthenticated = true;
    state.auth.user = {
      email: user.email,
      name: user.nombre || 'Usuario',
      role: user.rol || 'admin'
    };
    setBackendOnline(true);
    return { ok: true, data };
  } catch (err) {
    // 2) Respaldo local SOLO cuando el backend es inalcanzable
    //    (sin red / servidor caído) y las credenciales coinciden.
    const unreachable = !err.status || err.status === 0;
    if (unreachable &&
        email.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase() &&
        password === DEMO_CREDENTIALS.password) {
      setToken('local-' + Date.now(), remember);
      state.auth.isAuthenticated = true;
      state.auth.user = {
        email: DEMO_CREDENTIALS.email,
        name: DEMO_CREDENTIALS.name,
        role: DEMO_CREDENTIALS.role
      };
      setBackendOnline(false);
      return { ok: true, offline: true, data: null };
    }
    setBackendOnline(false);
    return { ok: false, error: err.message || 'Usuario o contraseña incorrectos.' };
  }
}

/* =====================================================================
   2. ESTADO GLOBAL DE LA APLICACIÓN
   ===================================================================== */
let state = {
  auth: {
    isAuthenticated: false,
    user: null
  },
  currentView: 'home',
  appointments: [],
  tasks: [],
  contacts: []
};

/** Formulario temporal para agendamiento en Mi Agenda */
let appointmentForm = {
  step: 1,
  professionalId: null,
  date: null,
  time: null,
  tutorNombre: '',
  pacienteNombre: '',
  pacienteEdad: '',
  telefono: '',
  email: '',
  motivo: '',
  motivoDetalle: '',
  reminderOffset: null,
  reminderSound: 'timbre'
};

/** Estado del calendario de Mis Tareas */
let calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDate: new Date().toISOString().split('T')[0]
};

/* =====================================================================
   3. PERSISTENCIA EN LOCALSTORAGE / SESSIONSTORAGE
   ===================================================================== */
function loadAuthState() {
  try {
    const local = localStorage.getItem(LS_SESSION);
    const session = sessionStorage.getItem(LS_SESSION);
    const raw = local || session;
    const hasToken = Boolean(getToken());
    if (raw && hasToken) {
      const parsed = JSON.parse(raw);
      state.auth.isAuthenticated = true;
      state.auth.user = parsed.user || { email: DEMO_CREDENTIALS.email, name: DEMO_CREDENTIALS.name };
    } else {
      state.auth.isAuthenticated = false;
      state.auth.user = null;
    }
  } catch {
    state.auth.isAuthenticated = false;
    state.auth.user = null;
  }
}

function saveAuthState(remember = false) {
  const data = JSON.stringify({
    timestamp: Date.now(),
    user: state.auth.user
  });
  if (remember) {
    localStorage.setItem(LS_SESSION, data);
    sessionStorage.removeItem(LS_SESSION);
  } else {
    sessionStorage.setItem(LS_SESSION, data);
    localStorage.removeItem(LS_SESSION);
  }
}

function clearAuthState() {
  localStorage.removeItem(LS_SESSION);
  sessionStorage.removeItem(LS_SESSION);
  state.auth.isAuthenticated = false;
  state.auth.user = null;
}

/*** CITAS -----------------------------------------------------------------
 * Modelo "local-first": localStorage es la fuente inmediata para la UI y se
 * sincroniza con el backend cuando hay conexión. Si el backend falla (sin
 * red o error 4xx/5xx no crítico), la app continúa con la copia local.
 * ---------------------------------------------------------------------- */
function loadAppointments() {
  state.appointments = readLS(LS_APPOINTMENTS, []);
  syncAppointmentsFromServer();
}

function saveAppointments() {
  writeLS(LS_APPOINTMENTS, state.appointments);
  syncAppointmentsToServer();
}

/** Descarga las citas del backend y reemplaza la copia local (optimista). */
async function syncAppointmentsFromServer() {
  if (!getToken() || isLocalToken()) return;
  try {
    const list = await API.citas.getAll();
    if (Array.isArray(list)) {
      state.appointments = list.map(normalizeCitaFromServer);
      writeLS(LS_APPOINTMENTS, state.appointments);
      setBackendOnline(true);
    }
  } catch (e) {
    // 401 ya redirige; los demás errores dejan intacta la copia local
    if (e.status && e.status !== 401) setBackendOnline(false);
  }
}

/** Envía cambios locales al backend. Los nuevos se crean y se recalculan sus
 *  ids; los existentes se actualizan; los que faltan en el backend se borran. */
async function syncAppointmentsToServer() {
  if (!getToken() || isLocalToken() || !state.appointments) return;
  try {
    let remote = await API.citas.getAll();
    if (!Array.isArray(remote)) remote = [];

    const remoteIds = new Set(remote.map(r => String(r.id)));

    // Actualizar/crear cada cita local
    for (const a of state.appointments) {
      const isNew = !remoteIds.has(String(a.id));
      if (isNew) {
        const created = await API.citas.create(citaToServer(a));
        if (created && created.id) a.id = String(created.id);
      } else {
        await API.citas.update(a.id, citaToServer(a));
      }
    }

    // Eliminar en el backend las citas que ya no existen en local
    const localIds = new Set(state.appointments.map(a => String(a.id)));
    for (const r of remote) {
      if (!localIds.has(String(r.id))) {
        try { await API.citas.remove(r.id); } catch (e) { /* ignorar borrado remoto */ }
      }
    }

    writeLS(LS_APPOINTMENTS, state.appointments);
    setBackendOnline(true);
  } catch (e) {
    if (e.status && e.status !== 401) setBackendOnline(false);
  }
}

/*** TAREAS ---------------------------------------------------------------- */
function loadTasks() {
  state.tasks = readLS(LS_TASKS, []);
  syncTasksFromServer();
}

function saveTasks() {
  writeLS(LS_TASKS, state.tasks);
  syncTasksToServer();
}

async function syncTasksFromServer() {
  if (!getToken() || isLocalToken()) return;
  try {
    const list = await API.tareas.getAll();
    if (Array.isArray(list)) {
      state.tasks = list.map(normalizeTaskFromServer);
      writeLS(LS_TASKS, state.tasks);
      setBackendOnline(true);
    }
  } catch (e) {
    if (e.status && e.status !== 401) setBackendOnline(false);
  }
}

async function syncTasksToServer() {
  if (!getToken() || isLocalToken() || !state.tasks) return;
  try {
    let remote = await API.tareas.getAll();
    if (!Array.isArray(remote)) remote = [];

    const remoteIds = new Set(remote.map(r => String(r.id)));

    for (const t of state.tasks) {
      const isNew = !remoteIds.has(String(t.id));
      if (isNew) {
        const created = await API.tareas.create(taskToServer(t));
        if (created && created.id) t.id = String(created.id);
      } else {
        await API.tareas.update(t.id, taskToServer(t));
      }
    }

    const localIds = new Set(state.tasks.map(t => String(t.id)));
    for (const r of remote) {
      if (!localIds.has(String(r.id))) {
        try { await API.tareas.remove(r.id); } catch (e) { /* ignorar */ }
      }
    }

    writeLS(LS_TASKS, state.tasks);
    setBackendOnline(true);
  } catch (e) {
    if (e.status && e.status !== 401) setBackendOnline(false);
  }
}

/*** CONTACTOS ------------------------------------------------------------- */
function loadContacts() {
  const saved = readLS(LS_CONTACTS, null);
  if (saved) {
    state.contacts = saved;
  } else {
    state.contacts = [...DEFAULT_CONTACTS];
    writeLS(LS_CONTACTS, state.contacts);
  }
  syncContactsFromServer();
}

function saveContacts() {
  writeLS(LS_CONTACTS, state.contacts);
  syncContactsToServer();
}

async function syncContactsFromServer() {
  if (!getToken() || isLocalToken()) return;
  try {
    const list = await API.contactos.getAll();
    if (Array.isArray(list)) {
      // Si el backend devuelve datos, el servidor es la fuente autoritativa.
      state.contacts = list.map(normalizeContactFromServer);
      writeLS(LS_CONTACTS, state.contacts);
      setBackendOnline(true);
    }
  } catch (e) {
    if (e.status && e.status !== 401) setBackendOnline(false);
  }
}

async function syncContactsToServer() {
  if (!getToken() || isLocalToken() || !state.contacts) return;
  try {
    let remote = await API.contactos.getAll();
    if (!Array.isArray(remote)) remote = [];

    const remoteIds = new Set(remote.map(r => String(r.id)));

    for (const c of state.contacts) {
      const isNew = !remoteIds.has(String(c.id));
      if (isNew) {
        const created = await API.contactos.create(contactToServer(c));
        if (created && created.id) c.id = String(created.id);
      } else {
        await API.contactos.update(c.id, contactToServer(c));
      }
    }

    const localIds = new Set(state.contacts.map(c => String(c.id)));
    for (const r of remote) {
      if (!localIds.has(String(r.id))) {
        try { await API.contactos.remove(r.id); } catch (e) { /* ignorar */ }
      }
    }

    writeLS(LS_CONTACTS, state.contacts);
    setBackendOnline(true);
  } catch (e) {
    if (e.status && e.status !== 401) setBackendOnline(false);
  }
}

/* =====================================================================
   4. UTILIDADES GENERALES
   ===================================================================== */
function formatDate(d) {
  if (!d) return '';
  if (typeof d === 'string') d = new Date(d + 'T12:00:00');
  else if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '';
  if (typeof d === 'string') d = new Date(d + 'T12:00:00');
  else if (!(d instanceof Date)) d = new Date(d);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${days[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\+?\d{7,15}$/.test(phone.replace(/[\s\-()]/g, ''));
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

function getNextWorkDays(n = 45) {
  const days = [];
  const today = getToday();
  let i = 0;
  while (days.length < n) {
    const d = addDays(today, i++);
    if (d.getDay() !== 0) days.push(d); // Excluir domingos
  }
  return days;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function getBookedSlots(dateStr) {
  return state.appointments
    .filter(a => a.fecha === dateStr && a.estado !== 'cancelada')
    .map(a => a.hora);
}

function getProfessional(id) {
  return PROFESSIONALS.find(p => p.id === parseInt(id));
}

/** Copiar texto al portapapeles con feedback accesible */
function copyToClipboard(text, successMessage = 'Copiado al portapapeles') {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`✓ ${successMessage}`, 'success');
    }).catch(() => fallbackCopy(text, successMessage));
  } else {
    fallbackCopy(text, successMessage);
  }
}

function fallbackCopy(text, successMessage) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(`✓ ${successMessage}`, 'success');
  } catch {
    showToast('No se pudo copiar automáticamente. Por favor cópialo manualmente.', 'error');
  }
  document.body.removeChild(ta);
}

/* =====================================================================
   5. NOTIFICACIONES TOAST & MODAL ACCESIBLE
   ===================================================================== */
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast' + (type ? ' ' + type : '');
  el.setAttribute('aria-label', msg);
  requestAnimationFrame(() => {
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3800);
  });
}

/** Abre un modal accesible */
function openModal(title, bodyHTML, footerHTML = '') {
  const container = document.getElementById('modal-container');
  const card = document.getElementById('modal-content');
  if (!container || !card) return;

  card.innerHTML = `
    <div class="modal-header">
      <h2 id="modal-title">${escapeHtml(title)}</h2>
      <button class="modal-close-btn" id="modal-close" aria-label="Cerrar ventana modal" type="button">✕</button>
    </div>
    <div class="modal-body" id="modal-body">
      ${bodyHTML}
    </div>
    ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
  `;

  container.classList.remove('hidden');
  container.setAttribute('aria-hidden', 'false');

  const closeBtn = card.querySelector('#modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Cerrar al presionar Escape o hacer click en el backdrop
  const handleKey = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleKey);
    }
  };
  document.addEventListener('keydown', handleKey);

  container.onclick = (e) => {
    if (e.target === container) closeModal();
  };

  // Foco accesible al primer input o botón
  requestAnimationFrame(() => {
    const focusable = card.querySelector('input, select, textarea, button:not(#modal-close)');
    if (focusable) focusable.focus();
  });
}

/** Cierra el modal activo */
function closeModal() {
  const container = document.getElementById('modal-container');
  if (!container) return;
  container.classList.add('hidden');
  container.setAttribute('aria-hidden', 'true');
}

/* =====================================================================
   6. ROUTER SPA & CONTROL DE ACCESO (AUTH GUARD)
   ===================================================================== */
function setActiveNav(hash) {
  document.querySelectorAll('.nav-link, .footer-nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return; // botones (Salir, Avisos) no son rutas
    a.classList.toggle('active', href === hash);
  });
}

function updateHeaderAuthState() {
  const isAuth = state.auth.isAuthenticated;
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menu-toggle');

  // Ocultar/mostrar hamburguesa según autenticación
  if (menuToggle) menuToggle.style.display = isAuth ? '' : 'none';

  // Si no está autenticado, ocultar enlaces de navegación regular y botón Salir
  if (nav) {
    nav.querySelectorAll('.nav-link:not(.nav-link--logout)').forEach(link => {
      link.style.display = isAuth ? '' : 'none';
    });
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.style.display = isAuth ? '' : 'none';
  }
}

function router() {
  loadAuthState();
  updateHeaderAuthState();

  const content = document.getElementById('content');
  if (!content) return;

  const hash = window.location.hash || '#/';
  state.currentView = hash;

  // Si el usuario no está autenticado, renderizar obligatoriamente la pantalla de Login
  if (!state.auth.isAuthenticated) {
    setActiveNav('');
    renderLogin(content);
    return;
  }

  // Si está autenticado, gestionar rutas
  setActiveNav(hash);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if      (hash === '#/' || hash === '' || hash === '#/inicio') renderHome(content);
  else if (hash === '#/agendar')                                 renderAppointment(content);
  else if (hash === '#/tareas')                                  renderTasks(content);
  else if (hash === '#/historial')                               renderHistory(content);
  else if (hash === '#/directorio')                              renderDirectory(content);
  else                                                           renderHome(content);
}

window.addEventListener('hashchange', router);

/* =====================================================================
   7. VISTA: SISTEMA DE LOGIN OBLIGATORIO
   ===================================================================== */
function renderLogin(el) {
  el.innerHTML = `
    <div class="auth-wrapper" role="region" aria-label="Pantalla de inicio de sesión">
      <div class="auth-card">
        <div class="auth-header">
          <img src="logo/LOGO ACTITUD Y BIENESTAR SIN FONDO.png"
               onerror="this.onerror=null; this.src='frontend/img/logo/LOGO ACTITUD Y BIENESTAR SIN FONDO.png';"
               alt="Actitud y Bienestar" class="auth-logo">
          <h1>Iniciar Sesión</h1>
          <p>Plataforma de Gestión y Atención Psicológica</p>
        </div>

        <div id="auth-error" class="auth-error-banner hidden" role="alert" aria-live="polite"></div>

        <form id="login-form" class="auth-form" novalidate aria-label="Formulario de inicio de sesión">
          <div class="form-group" style="margin-bottom:0">
            <label for="login-email">Usuario o Correo Electrónico <span aria-hidden="true" style="color:var(--danger)">*</span></label>
            <input type="text" id="login-email" name="email"
                   placeholder="tu_correo@terapia.com"
                   aria-required="true"
                   autocomplete="username" required>
          </div>

          <div class="form-group" style="margin-bottom:0">
            <label for="login-password">Contraseña <span aria-hidden="true" style="color:var(--danger)">*</span></label>
            <input type="password" id="login-password" name="password"
                   placeholder="••••••••"
                   aria-required="true"
                   autocomplete="current-password" required>
          </div>

          <div class="auth-options">
            <label class="auth-remember">
              <input type="checkbox" id="login-remember" checked>
              <span>Recordarme</span>
            </label>
            <a href="#" id="link-forgot-pass" class="auth-forgot" role="button">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="padding:14px;font-size:1rem;margin-top:6px"
                  aria-label="Ingresar a la plataforma">
            Ingresar a la Plataforma →
          </button>
        </form>
      </div>
    </div>
  `;

  const form = el.querySelector('#login-form');
  const errorBanner = el.querySelector('#auth-error');
  const forgotLink = el.querySelector('#link-forgot-pass');

  // Recuperación simulada de contraseña
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(
      'Recuperación de Contraseña',
      `
      <p style="margin-bottom:14px;color:var(--gray);font-size:0.92rem;line-height:1.6">
        Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña:
      </p>
      <div class="form-group">
        <label for="recovery-email">Correo Electrónico</label>
        <input type="email" id="recovery-email" placeholder="admin@terapia.com" value="${DEMO_CREDENTIALS.email}">
      </div>
      `,
      `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-sm" id="btn-send-recovery">Enviar Instrucciones</button>
      `
    );

    document.getElementById('btn-send-recovery')?.addEventListener('click', () => {
      const email = document.getElementById('recovery-email')?.value.trim();
      if (!email || !isValidEmail(email)) {
        showToast('Por favor ingresa un correo válido.', 'error');
        return;
      }
      closeModal();
      showToast(`✓ Instrucciones enviadas a ${email}. Revisa tu bandeja de entrada.`, 'success');
    });
  });

  // Procesamiento del inicio de sesión
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = el.querySelector('#login-email').value.trim();
    const password = el.querySelector('#login-password').value;
    const remember = el.querySelector('#login-remember').checked;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    if (!email || !password) {
      errorBanner.textContent = 'Por favor completa todos los campos.';
      errorBanner.classList.remove('hidden');
      return;
    }

    // Autenticación REAL contra el backend (POST /api/auth/login → JWT).
    // Si el backend no responde, cae a las credenciales demo como respaldo.
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Ingresando…';
    const result = await authenticateLogin(email, password, remember);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;

    if (result.ok) {
      errorBanner.classList.add('hidden');
      saveAuthState(remember);
      // Sin avisos de "sin conexión": la app trabaja en modo local o con
      // el servidor de forma transparente para el usuario.
      showToast(`¡Bienvenido de nuevo, ${state.auth.user.name}! 💚`, 'success');
      window.location.hash = '#/';
      router();
    } else {
      errorBanner.textContent = '⚠️ ' + (result.error || 'Usuario o contraseña incorrectos.');
      errorBanner.classList.remove('hidden');
      el.querySelector('#login-password').focus();
    }
  });
}

function handleLogout() {
  if (confirm('¿Deseas cerrar tu sesión actual?')) {
    clearToken();
    clearAuthState();
    showToast('Has cerrado sesión correctamente.', 'info');
    window.location.hash = '#/';
    router();
  }
}

/* =====================================================================
   8. VISTA 1: INICIO (PANEL CON MÉTRICAS Y RESÚMENES)
   ===================================================================== */
function renderHome(el) {
  loadAppointments();
  loadTasks();
  loadContacts();

  const totalCitas = state.appointments.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTasks = state.tasks.filter(t => !t.done);
  const totalContacts = state.contacts.length;

  // Próximas citas ordenadas
  const upcomingAppointments = state.appointments
    .filter(a => a.fecha >= todayStr && a.estado !== 'cancelada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
    .slice(0, 3);

  // Tareas prioritarias
  const urgentTasks = pendingTasks
    .sort((a, b) => (a.priority === 'alta' ? -1 : 1))
    .slice(0, 4);

  el.innerHTML = `
    <!-- Bienvenida -->
    <div class="dashboard-welcome">
      <h1>Panel de Gestión y Bienestar 🌿</h1>
      <p>
        Bienvenido, <strong>${escapeHtml(state.auth.user?.name || 'Terapeuta')}</strong>. Aquí tienes un resumen general de tus citas en Mi Agenda, tus metas en Mis Tareas y tus contactos en Mi Directorio.
      </p>
    </div>

    <!-- Métricas en tarjetas -->
    <div class="dashboard-metrics" role="region" aria-label="Métricas de la clínica">
      <div class="metric-card">
        <div class="metric-icon metric-icon--teal" aria-hidden="true">📅</div>
        <div>
          <div class="metric-number">${totalCitas}</div>
          <div class="metric-label">Citas en Mi Agenda</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon metric-icon--green" aria-hidden="true">📋</div>
        <div>
          <div class="metric-number">${pendingTasks.length}</div>
          <div class="metric-label">Mis Tareas Pendientes</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon metric-icon--purple" aria-hidden="true">👥</div>
        <div>
          <div class="metric-number">${totalContacts}</div>
          <div class="metric-label">Contactos en Mi Directorio</div>
        </div>
      </div>
    </div>

    <!-- Columnas del Dashboard -->
    <div class="dashboard-grid">
      <!-- Próximas Citas -->
      <div class="dashboard-col">
        <div class="dashboard-col-header">
          <h2>📅 Próximas Citas en Mi Agenda</h2>
          <a href="#/agendar" class="btn btn-sm btn-primary" data-nav>+ Agendar Cita</a>
        </div>
        ${upcomingAppointments.length === 0
          ? `<p style="color:var(--gray-light);font-size:0.9rem;text-align:center;padding:24px 0">
               No hay citas programadas próximamente.<br>
               <a href="#/agendar" class="btn btn-outline btn-sm mt-8" data-nav>Abrir Mi Agenda</a>
             </p>`
          : `<div style="display:flex;flex-direction:column;gap:12px">
               ${upcomingAppointments.map(a => `
                 <div style="padding:14px;background:var(--warm-white);border-radius:var(--radius-sm);border:1px solid var(--gray-lighter);display:flex;justify-content:space-between;align-items:center;gap:10px">
                   <div>
                     <strong style="color:var(--dark);font-size:0.95rem">${escapeHtml(a.pacienteNombre)} (${a.pacienteEdad} años)</strong>
                     <div style="font-size:0.83rem;color:var(--teal);font-weight:600;margin-top:2px">👨‍⚕️ ${escapeHtml(a.professionalName)}</div>
                     <div style="font-size:0.8rem;color:var(--gray);margin-top:2px">📅 ${formatDate(a.fecha)} · ⏰ ${a.hora}</div>
                   </div>
                   <span class="badge badge-${escapeHtml(a.estado)}">${escapeHtml(a.estado)}</span>
                 </div>
               `).join('')}
               <div style="text-align:right;margin-top:6px">
                 <a href="#/historial" style="font-size:0.85rem;color:var(--teal);font-weight:700" data-nav>Ver Mi Historial completo →</a>
               </div>
             </div>`
        }
      </div>

      <!-- Tareas Prioritarias -->
      <div class="dashboard-col">
        <div class="dashboard-col-header">
          <h2>📋 Mis Tareas y Recordatorios</h2>
          <a href="#/tareas" class="btn btn-sm btn-green" data-nav>Abrir Mis Tareas</a>
        </div>
        ${urgentTasks.length === 0
          ? `<p style="color:var(--gray-light);font-size:0.9rem;text-align:center;padding:24px 0">
               ¡Excelente! No tienes tareas pendientes.<br>
               <a href="#/tareas" class="btn btn-outline btn-sm mt-8" data-nav>Crear nueva tarea</a>
             </p>`
          : `<div style="display:flex;flex-direction:column;gap:10px">
               ${urgentTasks.map(t => `
                 <div style="padding:12px 14px;background:var(--warm-white);border-radius:var(--radius-sm);border:1px solid var(--gray-lighter);display:flex;align-items:center;justify-content:space-between;gap:8px">
                   <div>
                     <div style="font-size:0.9rem;font-weight:700;color:var(--dark)">${escapeHtml(t.title)}</div>
                     <div style="font-size:0.8rem;color:var(--gray);margin-top:2px">📅 ${formatDateShort(t.date)} ${t.time ? '· ⏰ ' + escapeHtml(t.time) : ''}</div>
                   </div>
                   <span class="task-priority--${escapeHtml(t.priority)}" style="padding:3px 8px;font-size:0.75rem;border-radius:var(--radius-full);font-weight:700">${escapeHtml(t.priority)}</span>
                 </div>
               `).join('')}
               <div style="text-align:right;margin-top:6px">
                 <a href="#/tareas" style="font-size:0.85rem;color:var(--green-dark);font-weight:700" data-nav>Ver todas Mis Tareas →</a>
               </div>
             </div>`
        }
      </div>
    </div>

    <!-- Accesos rápidos -->
    <div style="margin-top:30px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
      <a href="#/agendar" class="btn btn-primary" data-nav>📅 Mi Agenda</a>
      <a href="#/tareas" class="btn btn-green" data-nav>📋 Mis Tareas</a>
      <a href="#/directorio" class="btn btn-outline" data-nav>👥 Mi Directorio</a>
      <a href="#/historial" class="btn btn-secondary" data-nav>📜 Mi Historial</a>
    </div>
  `;
}

/* =====================================================================
   9. VISTA 2: MI AGENDA (SINCRONIZACIÓN DIRECTA CON MI DIRECTORIO)
   ===================================================================== */
function renderAppointment(el) {
  Object.assign(appointmentForm, {
    step: 1,
    professionalId: null,
    date: null,
    time: null,
    tutorNombre: '',
    pacienteNombre: '',
    pacienteEdad: '',
    telefono: '',
    email: '',
    motivo: '',
    motivoDetalle: '',
    reminderOffset: null,
    reminderSound: 'timbre'
  });

  loadAppointments();
  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = state.appointments
    .filter(a => a.fecha >= todayStr && a.estado !== 'cancelada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

  const upcomingHtml = upcoming.length === 0
    ? `<p style="color:var(--gray-light);font-size:0.88rem;text-align:center;padding:14px 0 4px">
         Aún no tienes citas programadas. Agenda tu primera cita 👇
       </p>`
    : `<ul class="appt-manage-list" role="list">
         ${upcoming.map(a => `
           <li class="appt-manage-item" role="listitem">
             <div class="appt-manage-info">
               <strong>${formatDateShort(a.fecha)} · ${escapeHtml(a.hora)}</strong>
               <span>🧒 ${escapeHtml(a.pacienteNombre)} — ${escapeHtml(a.professionalName)}</span>
             </div>
             <div class="appt-manage-actions">
               <button type="button" class="btn btn-sm btn-outline" data-action="reschedule" data-id="${escapeHtml(a.id)}">🕑 Reagendar</button>
               <button type="button" class="btn btn-sm" style="color:var(--danger);background:var(--danger-bg)" data-action="cancel-appt" data-id="${escapeHtml(a.id)}">✕ Cancelar</button>
             </div>
           </li>
         `).join('')}
       </ul>`;

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Mi Agenda y Citas</h1>
      <p>Selecciona profesional, fecha y los datos del tutor y paciente (se guardan automáticamente en Mi Directorio)</p>
    </div>
    <div class="container">
      <!-- Gestión de citas próximas -->
      <section class="appt-manage" aria-labelledby="appt-manage-title">
        <h2 id="appt-manage-title" style="font-size:1.1rem;font-weight:800;color:var(--dark);margin-bottom:10px">
          📌 Mis próximas citas (${upcoming.length})
        </h2>
        ${upcomingHtml}
        <hr class="section-divider" aria-hidden="true">
      </section>

      <div class="appointment-form" id="appointment-form" role="region" aria-label="Formulario de agendamiento">
        <!-- Stepper -->
        <nav aria-label="Progreso de Mi Agenda" role="navigation">
          <div class="steps" id="steps" role="list">
            ${[
              ['1', 'Profesional'],
              ['2', 'Fecha & Hora'],
              ['3', 'Datos'],
              ['4', 'Motivo'],
              ['5', 'Aviso y Revisión']
            ].map(([num, label], i, arr) => `
              <div class="step${i === 0 ? ' active' : ''}" data-step="${num}" role="listitem"
                   aria-current="${i === 0 ? 'step' : 'false'}" aria-label="Paso ${num}: ${label}">
                <div class="step-circle" aria-hidden="true">${num}</div>
                <span class="step-label">${label}</span>
              </div>
              ${i < arr.length - 1 ? `<div class="step-connector" data-connector="${num}" aria-hidden="true"></div>` : ''}
            `).join('')}
          </div>
        </nav>
        <div id="form-step-content" aria-live="polite" aria-atomic="true"></div>
      </div>
    </div>
  `;

  // Acciones: reagendar / cancelar cita próxima
  el.querySelectorAll('[data-action="reschedule"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = state.appointments.find(x => x.id === btn.dataset.id);
      if (a) openRescheduleAppointmentModal(a, () => renderAppointment(el));
    });
  });

  el.querySelectorAll('[data-action="cancel-appt"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = state.appointments.find(x => x.id === btn.dataset.id);
      if (!a) return;
      if (confirm(`¿Cancelar la cita de ${a.pacienteNombre} el ${formatDate(a.fecha)} a las ${a.hora}?`)) {
        a.estado = 'cancelada';
        saveAppointments();
        showToast('Cita cancelada de Mi Agenda.', 'info');
        renderAppointment(el);
      }
    });
  });

  renderAppointmentStep1();
}

/** Modal para reagendar una cita existente (edita datos, fecha y hora) */
function openRescheduleAppointmentModal(appointment, onDone) {
  const renderDateOptions = () => {
    const days = getNextWorkDays(60);
    return `<select id="rs-date" aria-label="Nueva fecha">
      ${days.map(d => {
        const ds = d.toISOString().split('T')[0];
        return `<option value="${ds}" ${ds === appointment.fecha ? 'selected' : ''}>${formatDate(d)}</option>`;
      }).join('')}
    </select>`;
  };

  const renderTimeOptions = (dateStr) => {
    const booked = getBookedSlots(dateStr).filter(s => s !== appointment.hora);
    return `<select id="rs-time" aria-label="Nueva hora">
      ${TIME_SLOTS.map(t => `<option value="${t}" ${t === appointment.hora ? 'selected' : ''} ${booked.includes(t) ? 'disabled' : ''}>${t}${booked.includes(t) ? ' (ocupado)' : ''}</option>`).join('')}
    </select>`;
  };

  openModal(
    '🕑 Reagendar y Editar Cita',
    `
    <p style="margin-bottom:14px;color:var(--gray);font-size:0.9rem;line-height:1.6">
      Modifica los datos que necesites o la fecha/hora de la cita de <strong>${escapeHtml(appointment.pacienteNombre)}</strong> con ${escapeHtml(appointment.professionalName)}.
    </p>

    <div class="form-row-inline">
      <div class="form-group" style="margin:0">
        <label for="rs-date">📅 Fecha</label>
        ${renderDateOptions()}
      </div>
      <div class="form-group" style="margin:0">
        <label for="rs-paciente">🧒 Edad del paciente (años)</label>
        <input type="number" id="rs-edad" min="2" max="85" value="${escapeHtml(appointment.pacienteEdad || '')}">
      </div>
    </div>

    <div id="rs-time-wrap" class="form-group">
      <label for="rs-time">🕐 Hora</label>
      ${renderTimeOptions(appointment.fecha)}
    </div>

    <hr class="section-divider" aria-hidden="true">

    <div class="form-group">
      <label for="rs-tutor">👨‍👩‍👦 Nombre del tutor</label>
      <input type="text" id="rs-tutor" value="${escapeHtml(appointment.tutorNombre || '')}">
    </div>
    <div class="form-group">
      <label for="rs-paciente-nombre">🧒 Nombre completo del paciente</label>
      <input type="text" id="rs-paciente-nombre" value="${escapeHtml(appointment.pacienteNombre || '')}">
    </div>
    <div class="form-row-inline">
      <div class="form-group" style="margin:0">
        <label for="rs-tel">📞 Teléfono</label>
        <input type="tel" id="rs-tel" value="${escapeHtml(appointment.telefono || '')}">
      </div>
      <div class="form-group" style="margin:0">
        <label for="rs-email">✉️ Correo</label>
        <input type="email" id="rs-email" value="${escapeHtml(appointment.email || '')}">
      </div>
    </div>
    <div class="form-group">
      <label for="rs-motivo">📝 Motivo</label>
      <select id="rs-motivo">
        ${MOTIVOS.map(m => `<option value="${escapeHtml(m)}" ${m === appointment.motivo ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" style="margin-bottom:0">
      <label for="rs-motivo-detalle">Detalle adicional <span style="font-weight:400;color:var(--gray-light)">(opcional)</span></label>
      <textarea id="rs-motivo-detalle" rows="3" maxlength="600">${escapeHtml(appointment.motivoDetalle || '')}</textarea>
    </div>
    `,
    `
    <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary btn-sm" id="btn-save-reschedule">Guardar Cambios</button>
    `
  );

  document.getElementById('rs-date').addEventListener('change', (e) => {
    const day = e.target.value;
    const booked = getBookedSlots(day).filter(s => s !== appointment.hora);
    document.getElementById('rs-time-wrap').innerHTML = `
      <label for="rs-time">🕐 Hora</label>
      <select id="rs-time">
        ${TIME_SLOTS.map(t => `<option value="${t}" ${booked.includes(t) ? 'disabled' : ''}>${t}${booked.includes(t) ? ' (ocupado)' : ''}</option>`).join('')}
      </select>`;
  });

  document.getElementById('btn-save-reschedule').addEventListener('click', () => {
    const newDate = document.getElementById('rs-date').value;
    const newTime = document.getElementById('rs-time').value;
    if (!newDate || !newTime) return;

    const prevDate = appointment.fecha;
    const prevName = appointment.pacienteNombre;

    appointment.fecha = newDate;
    appointment.hora = newTime;
    appointment.tutorNombre = document.getElementById('rs-tutor').value.trim();
    appointment.pacienteNombre = document.getElementById('rs-paciente-nombre').value.trim();
    appointment.pacienteEdad = parseInt(document.getElementById('rs-edad').value, 10) || appointment.pacienteEdad;
    appointment.telefono = document.getElementById('rs-tel').value.trim();
    appointment.email = document.getElementById('rs-email').value.trim();
    appointment.motivo = document.getElementById('rs-motivo').value;
    appointment.motivoDetalle = document.getElementById('rs-motivo-detalle').value.trim();

    saveAppointments();

    // Actualizar la tarea-recordatorio vinculada (misma cita, no duplicar avisos)
    const link = state.tasks.find(t =>
      t.category === 'cita' &&
      t.date === prevDate &&
      t.time === appointment.hora &&
      t.title && t.title.includes(appointment.professionalName));
    if (link) {
      link.date = newDate;
      link.time = newTime;
      if (prevName) link.description = `Paciente: ${appointment.pacienteNombre}. Tutor: ${appointment.tutorNombre}.`;
      saveTasks();
    }

    // Limpiar el aviso ya notificado para que vuelva a avisar con la nueva fecha/hora
    const notified = loadNotified();
    if (notified[`app:${appointment.id}`]) {
      delete notified[`app:${appointment.id}`];
      saveNotified(notified);
    }

    closeModal();
    showToast('✓ Cita reagendada correctamente.', 'success');
    if (onDone) onDone();
  });
}

function updateSteps(activeStep) {
  document.querySelectorAll('.step').forEach(s => {
    const num = parseInt(s.dataset.step);
    s.classList.toggle('active', num === activeStep);
    s.classList.toggle('done', num < activeStep);
    s.setAttribute('aria-current', num === activeStep ? 'step' : 'false');
  });
  document.querySelectorAll('.step-connector').forEach(c => {
    const num = parseInt(c.dataset.connector);
    c.classList.toggle('done', num < activeStep);
  });
}

function renderAppointmentStep1() {
  const el = document.getElementById('form-step-content');
  if (!el) return;
  updateSteps(1);

  el.innerHTML = `
    <div class="form-card">
      <h2>1. Selecciona el Profesional</h2>
      <p class="form-subtitle">Elige al especialista para la atención psicológica</p>

      <div class="form-group" style="margin-bottom:20px;max-width:480px">
        <label for="f-prof-select">Profesional <span style="color:var(--danger)">*</span></label>
        <select id="f-prof-select" aria-label="Selecciona un profesional de la lista" aria-required="true">
          <option value="">— Selecciona un profesional —</option>
          ${PROFESSIONALS.map(p => `
            <option value="${p.id}" ${appointmentForm.professionalId === p.id ? 'selected' : ''}>
              ${escapeHtml(p.nombre)} – ${escapeHtml(p.especialidad)}
            </option>
          `).join('')}
        </select>
        <div class="hint">Solo trabajamos con los profesionales listados.</div>
      </div>

      <div class="form-nav">
        <div></div>
        <button class="btn btn-primary" id="btn-step-next" ${!appointmentForm.professionalId ? 'disabled' : ''}
                aria-label="Ir al paso siguiente: Fecha">Siguiente: Fecha →</button>
      </div>
    </div>
  `;

  const profSelect = el.querySelector('#f-prof-select');
  const nextBtn = el.querySelector('#btn-step-next');

  profSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      appointmentForm.professionalId = parseInt(e.target.value);
      nextBtn.disabled = false;
    } else {
      appointmentForm.professionalId = null;
      nextBtn.disabled = true;
    }
  });

  nextBtn.addEventListener('click', () => {
    if (appointmentForm.professionalId) renderAppointmentStep2();
  });
}

let apptDateView = 'dias';          // 'dias' | 'semanas' | 'meses'
let apptMonthCursor = null;         // fecha de referencia para la vista de meses

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function startOfWeek(d) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (r.getDay() + 6) % 7; // lunes = 0
  r.setDate(r.getDate() - wd);
  return r;
}

function renderAppointmentStep2() {
  const el = document.getElementById('form-step-content');
  if (!el) return;
  updateSteps(2);
  const prof = getProfessional(appointmentForm.professionalId);

  if (!apptMonthCursor) apptMonthCursor = new Date();

  el.innerHTML = `
    <div class="form-card">
      <h2>2. Elige Fecha y Hora</h2>
      <p class="form-subtitle">Profesional: <strong style="color:var(--teal)">${escapeHtml(prof.nombre)}</strong></p>

      <div class="view-tabs" role="tablist" aria-label="Cómo elegir la fecha">
        ${[
          ['dias', '📅 Por Días'],
          ['semanas', '🗓️ Por Semanas'],
          ['meses', '📆 Por Mes']
        ].map(([v, label]) => `
          <button type="button" class="view-tab ${apptDateView === v ? 'active' : ''}" data-view="${v}"
                  role="tab" aria-selected="${apptDateView === v}"
                  aria-controls="date-panel">${label}</button>
        `).join('')}
      </div>

      <div class="datetime-layout">
        <!-- Panel izquierdo: Fechas -->
        <div class="datetime-col">
          <h3 class="datetime-col-title">📅 Fecha</h3>
          <div id="date-panel" role="region" aria-label="Selección de fecha"></div>
        </div>

        <!-- Panel derecho: Horas -->
        <div class="datetime-col">
          <h3 class="datetime-col-title">🕐 Hora</h3>
          <div id="time-panel" class="time-panel">
            <p class="time-placeholder">👆 Selecciona una fecha para ver los horarios disponibles</p>
          </div>
        </div>
      </div>

      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-next" ${(!appointmentForm.date || !appointmentForm.time) ? 'disabled' : ''}>Siguiente: Datos →</button>
      </div>
    </div>
  `;

  el.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      apptDateView = tab.dataset.view;
      el.querySelectorAll('.view-tab').forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      renderApptDatePanel();
    });
  });

  renderApptDatePanel();
  renderApptTimePanel(appointmentForm.date);

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep1);
  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (appointmentForm.date && appointmentForm.time) renderAppointmentStep3();
  });
}

/** Selecciona una fecha concreta y refresca ambos paneles */
function setApptDate(dStr) {
  appointmentForm.date = dStr;
  appointmentForm.time = null;
  const next = document.getElementById('btn-step-next');
  if (next) next.disabled = true;
  renderApptDatePanel();
  renderApptTimePanel(dStr);
}

/** Dibuja el panel de fechas según la vista activa (días / semanas / meses) */
function renderApptDatePanel() {
  const host = document.getElementById('date-panel');
  if (!host) return;
  const sel = appointmentForm.date;
  const days = getNextWorkDays(45);
  const dayStr = d => d.toISOString().split('T')[0];

  const bindDates = (container) => {
    container.querySelectorAll('[data-date]').forEach(b => {
      b.addEventListener('click', () => setApptDate(b.dataset.date));
    });
  };

  if (apptDateView === 'semanas') {
    const groups = [];
    days.forEach(d => {
      const skey = startOfWeek(d).toISOString().split('T')[0];
      const g = groups.find(x => x.skey === skey);
      if (g) g.days.push(d);
      else groups.push({ skey, days: [d] });
    });
    host.innerHTML = `
      <div class="week-list" role="list">
        ${groups.map(g => `
          <div class="week-card" role="listitem">
            <div class="week-title">Semana del ${formatDateShort(startOfWeek(g.days[0]))}</div>
            <div class="week-chips">
              ${g.days.map(d => {
                const ds = dayStr(d);
                return `<button type="button" class="date-chip ${sel === ds ? 'selected' : ''}" data-date="${ds}"
                                role="option" aria-selected="${sel === ds}">${formatDateShort(d)}</button>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>`;
    bindDates(host);
    return;
  }

  if (apptDateView === 'meses') {
    host.innerHTML = `
      <div class="month-nav">
        <button type="button" id="mth-prev" class="btn btn-outline btn-sm" aria-label="Mes anterior">←</button>
        <strong id="mth-label"></strong>
        <button type="button" id="mth-next" class="btn btn-outline btn-sm" aria-label="Mes siguiente">→</button>
      </div>
      <div id="mth-grid" class="month-grid" aria-label="Calendario mensual"></div>`;

    const renderMonth = () => {
      const y = apptMonthCursor.getFullYear();
      const m = apptMonthCursor.getMonth();
      document.getElementById('mth-label').textContent = `${MONTH_NAMES[m]} ${y}`;
      const grid = document.getElementById('mth-grid');
      const heads = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(h => `<span class="month-cell mth-head" aria-hidden="true">${h}</span>`).join('');
      const first = new Date(y, m, 1);
      const startPad = (first.getDay() + 6) % 7; // Lunes = primera columna
      const dim = new Date(y, m + 1, 0).getDate();
      const todayStr = new Date().toISOString().split('T')[0];
      const cells = [];
      for (let i = 0; i < startPad; i++) cells.push('<span class="month-cell mth-void" aria-hidden="true"></span>');
      for (let d = 1; d <= dim; d++) {
        const dt = new Date(y, m, d);
        const ds = dt.toISOString().split('T')[0];
        const weekend = dt.getDay() === 0 || dt.getDay() === 6;
        const past = ds < todayStr;
        const disabled = past || weekend;
        cells.push(`
          <button type="button" class="month-cell mth-day ${sel === ds ? 'selected' : ''} ${disabled ? 'disabled' : ''}"
                  data-date="${ds}" ${disabled ? 'disabled aria-disabled="true"' : ''}
                  aria-label="${formatDate(dt)}">${d}</button>`);
      }
      grid.innerHTML = heads + cells.join('');
      bindDates(grid);
      document.getElementById('mth-prev').addEventListener('click', () => {
        apptMonthCursor = new Date(y, m - 1, 1);
        renderMonth();
      });
      document.getElementById('mth-next').addEventListener('click', () => {
        apptMonthCursor = new Date(y, m + 1, 1);
        renderMonth();
      });
    };
    renderMonth();
    return;
  }

  // Vista por días (por defecto)
  host.innerHTML = `
    <div class="date-grid" role="listbox" aria-label="Fechas hábiles disponibles">
      ${days.map(d => {
        const ds = dayStr(d);
        const selected = sel === ds;
        return `
          <button type="button" class="date-btn ${selected ? 'selected' : ''}" data-date="${ds}"
                  role="option" aria-selected="${selected}"
                  aria-label="${formatDate(d)}">
            ${formatDateShort(d)}
          </button>`;
      }).join('')}
    </div>`;
  bindDates(host);
}

/** Dibuja los horarios disponibles para una fecha dada */
function renderApptTimePanel(dateStr) {
  const timePanel = document.getElementById('time-panel');
  if (!timePanel) return;
  if (!dateStr) {
    timePanel.innerHTML = `<p class="time-placeholder">👆 Selecciona una fecha para ver los horarios disponibles</p>`;
    return;
  }
  const booked = getBookedSlots(dateStr);
  timePanel.innerHTML = `
    <div class="time-grid" id="time-grid" role="listbox" aria-label="Horarios disponibles">
      ${TIME_SLOTS.map(t => {
        const isBooked = booked.includes(t);
        const selected = appointmentForm.time === t;
        return `
          <button type="button" class="time-btn ${selected ? 'selected' : ''}" data-time="${t}"
                  ${isBooked ? 'disabled aria-disabled="true"' : ''}
                  role="option" aria-selected="${selected}"
                  aria-label="${t}${isBooked ? ' – Ocupado' : ' – Disponible'}">
            ${t}${isBooked ? ' ⛔' : ''}
          </button>`;
      }).join('')}
    </div>`;

  timePanel.querySelectorAll('.time-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      timePanel.querySelectorAll('.time-btn').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-selected', 'true');
      appointmentForm.time = btn.dataset.time;
      document.getElementById('btn-step-next').disabled = false;
    });
  });
}

function renderAppointmentStep3() {
  const el = document.getElementById('form-step-content');
  if (!el) return;
  updateSteps(3);

  el.innerHTML = `
    <div class="form-card">
      <h2>3. Datos del Tutor y Paciente</h2>
      <p class="form-subtitle">Los datos de contacto se guardarán automáticamente en <strong>Mi Directorio</strong></p>

      <fieldset style="border:none;margin-bottom:20px;padding:0">
        <legend style="font-weight:700;font-size:1.02rem;color:var(--teal);margin-bottom:14px">
          👨‍👩‍👦 Información del Padre / Madre / Tutor
        </legend>
        <div class="form-group">
          <label for="f-tutor-nombre">Nombre completo del tutor <span style="color:var(--danger)">*</span></label>
          <input type="text" id="f-tutor-nombre" name="tutorNombre"
                 placeholder="Ej: Ana María Rodríguez"
                 value="${escapeHtml(appointmentForm.tutorNombre)}"
                 aria-required="true" autocomplete="name">
          <div class="form-error" id="err-tutor-nombre" role="alert" aria-live="polite"></div>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label for="f-telefono">Teléfono de contacto <span style="color:var(--danger)">*</span></label>
            <input type="tel" id="f-telefono" name="telefono"
                 placeholder="Ej: 3012345678"
                 value="${escapeHtml(appointmentForm.telefono)}"
                 aria-required="true" autocomplete="tel">
            <div class="form-error" id="err-telefono" role="alert" aria-live="polite"></div>
          </div>
          <div class="form-group">
            <label for="f-email">Correo electrónico <span style="color:var(--danger)">*</span></label>
            <input type="email" id="f-email" name="email"
                   placeholder="tutor@correo.com"
                   value="${escapeHtml(appointmentForm.email)}"
                   aria-required="true" autocomplete="email">
            <div class="form-error" id="err-email" role="alert" aria-live="polite"></div>
          </div>
        </div>
      </fieldset>

      <fieldset style="border:none;padding:0">
        <legend style="font-weight:700;font-size:1.02rem;color:var(--green-dark);margin-bottom:14px">
          🧒 Información del Paciente (Niño / Niña / Adolescente)
        </legend>
        <div class="form-group">
          <label for="f-paciente-nombre">Nombre completo del paciente <span style="color:var(--danger)">*</span></label>
          <input type="text" id="f-paciente-nombre" name="pacienteNombre"
                 placeholder="Ej: Mateo Rodríguez"
                 value="${escapeHtml(appointmentForm.pacienteNombre)}"
                 aria-required="true">
          <div class="form-error" id="err-paciente-nombre" role="alert" aria-live="polite"></div>
        </div>
        <div class="form-group" style="max-width:240px">
          <label for="f-paciente-edad">Edad del paciente (años) <span style="color:var(--danger)">*</span></label>
          <input type="number" id="f-paciente-edad" name="pacienteEdad"
                 placeholder="Ej: 8"
                 value="${escapeHtml(appointmentForm.pacienteEdad)}"
                 min="2" max="85" aria-required="true">
          <div class="hint">Entre 2 y 85 años</div>
          <div class="form-error" id="err-paciente-edad" role="alert" aria-live="polite"></div>
        </div>
      </fieldset>

      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-next">Siguiente: Motivo →</button>
      </div>
    </div>
  `;

  const inputs = {
    tutorNombre:    document.getElementById('f-tutor-nombre'),
    pacienteNombre: document.getElementById('f-paciente-nombre'),
    pacienteEdad:   document.getElementById('f-paciente-edad'),
    telefono:       document.getElementById('f-telefono'),
    email:          document.getElementById('f-email')
  };

  Object.entries(inputs).forEach(([key, inp]) => {
    inp.addEventListener('input', () => {
      appointmentForm[key] = inp.value;
      const errId = `err-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      const errEl = document.getElementById(errId);
      if (errEl) errEl.textContent = '';
      inp.removeAttribute('aria-invalid');
    });
  });

  function showError(inp, errId, msg) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = msg;
    inp.setAttribute('aria-invalid', 'true');
    inp.focus();
  }

  function validateStep3() {
    let valid = true;
    const f = appointmentForm;

    if (!f.tutorNombre.trim()) { showError(inputs.tutorNombre, 'err-tutor-nombre', 'Ingresa el nombre del tutor.'); valid = false; }
    if (!f.telefono.trim() || !isValidPhone(f.telefono)) { showError(inputs.telefono, 'err-telefono', 'Ingresa un teléfono válido (7-15 dígitos).'); valid = false; }
    if (!f.email.trim() || !isValidEmail(f.email)) { showError(inputs.email, 'err-email', 'Ingresa un correo electrónico válido.'); valid = false; }
    if (!f.pacienteNombre.trim()) { showError(inputs.pacienteNombre, 'err-paciente-nombre', 'Ingresa el nombre del paciente.'); valid = false; }
    if (!f.pacienteEdad || parseInt(f.pacienteEdad) < 2 || parseInt(f.pacienteEdad) > 85) {
      showError(inputs.pacienteEdad, 'err-paciente-edad', 'Ingresa una edad entre 2 y 85 años.');
      valid = false;
    }
    return valid;
  }

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep2);
  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (validateStep3()) renderAppointmentStep4();
  });
}

function renderAppointmentStep4() {
  const el = document.getElementById('form-step-content');
  if (!el) return;
  updateSteps(4);
  const prof = getProfessional(appointmentForm.professionalId);

  el.innerHTML = `
    <div class="form-card">
      <h2>4. Motivo de Consulta</h2>
      <p class="form-subtitle">Describe la situación que motiva la atención</p>

      <div style="background:var(--teal-lighter);border-radius:var(--radius-sm);padding:16px;margin-bottom:20px;border:1px solid var(--teal-light)">
        <p style="font-size:0.9rem;color:var(--teal-darker);line-height:1.6">
          <strong>Resumen de tu cita:</strong><br>
          👨‍⚕️ Profesional: <strong>${escapeHtml(prof.nombre)}</strong> (${escapeHtml(prof.especialidad)})<br>
          📅 Fecha y Hora: <strong>${formatDate(appointmentForm.date)}</strong> a las <strong>${appointmentForm.time}</strong><br>
          🧒 Paciente: <strong>${escapeHtml(appointmentForm.pacienteNombre)}</strong> (${appointmentForm.pacienteEdad} años) — Tutor: <strong>${escapeHtml(appointmentForm.tutorNombre)}</strong>
        </p>
      </div>

      <div class="form-group">
        <label for="f-motivo-select">Motivo principal <span style="color:var(--danger)">*</span></label>
        <select id="f-motivo-select" aria-required="true">
          <option value="">— Selecciona un motivo —</option>
          ${MOTIVOS.map(m => `<option value="${escapeHtml(m)}" ${appointmentForm.motivo === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
        </select>
        <div class="form-error" id="err-motivo" role="alert" aria-live="polite"></div>
      </div>

      <div class="form-group">
        <label for="f-motivo-detalle">Descripción adicional <span style="color:var(--gray-light);font-weight:400">(opcional)</span></label>
        <textarea id="f-motivo-detalle"
                  placeholder="Detalles sobre lo observado en el paciente (conductas, emociones, entorno escolar o familiar)..."
                  rows="4" maxlength="600">${escapeHtml(appointmentForm.motivoDetalle || '')}</textarea>
        <div class="hint">Máximo 600 caracteres. Toda la información es confidencial.</div>
      </div>

      ${reminderFieldsHTML({ reminderOffset: appointmentForm.reminderOffset, reminderSound: appointmentForm.reminderSound, kindLabel: 'cita' }, 'app-rem')}

      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-submit">Siguiente: Aviso y Revisión →</button>
      </div>
    </div>
  `;

  bindReminderControls('app-rem');

  const selectMotivo = document.getElementById('f-motivo-select');
  const textareaDetalle = document.getElementById('f-motivo-detalle');

  selectMotivo.addEventListener('change', () => {
    appointmentForm.motivo = selectMotivo.value;
    document.getElementById('err-motivo').textContent = '';
  });

  textareaDetalle.addEventListener('input', () => {
    appointmentForm.motivoDetalle = textareaDetalle.value;
  });

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep3);
  document.getElementById('btn-step-submit').addEventListener('click', () => {
    if (!appointmentForm.motivo) {
      document.getElementById('err-motivo').textContent = 'Por favor selecciona el motivo principal.';
      selectMotivo.focus();
      return;
    }
    Object.assign(appointmentForm, readReminderSelection('app-rem'));
    renderAppointmentStep5();
  });
}

/** Paso 5: revisar y editar la cita antes de confirmar */
function renderAppointmentStep5() {
  const el = document.getElementById('form-step-content');
  if (!el) return;
  updateSteps(5);
  const prof = getProfessional(appointmentForm.professionalId);

  const reminderLabel = (appointmentForm.reminderOffset === null || appointmentForm.reminderOffset === undefined)
    ? 'No avisar'
    : `Te aviso ${getReminderOffsetLabel(appointmentForm.reminderOffset).toLowerCase()}`;

  el.innerHTML = `
    <div class="form-card">
      <h2>5. Revisa y Confirma tu Cita</h2>
      <p class="form-subtitle">Verifica los datos antes de confirmar. Puedes editar cualquier campo con los botones "Editar".</p>

      <div class="review-details" role="list">
        <div class="review-row" role="listitem">
          <span class="review-label">👨‍⚕️ Profesional</span>
          <span class="review-value">${escapeHtml(prof.nombre)} (${escapeHtml(prof.especialidad)})</span>
          <button type="button" class="btn-link-edit" data-goto="1">✏️ Editar</button>
        </div>
        <div class="review-row" role="listitem">
          <span class="review-label">📅 Fecha y Hora</span>
          <span class="review-value">${formatDate(appointmentForm.date)} a las ${appointmentForm.time}</span>
          <button type="button" class="btn-link-edit" data-goto="2">✏️ Editar</button>
        </div>
        <div class="review-row" role="listitem">
          <span class="review-label">🧒 Paciente</span>
          <span class="review-value">${escapeHtml(appointmentForm.pacienteNombre)} (${appointmentForm.pacienteEdad} años)</span>
          <button type="button" class="btn-link-edit" data-goto="3">✏️ Editar</button>
        </div>
        <div class="review-row" role="listitem">
          <span class="review-label">👨‍👩‍👦 Tutor y contacto</span>
          <span class="review-value">${escapeHtml(appointmentForm.tutorNombre)} · ${escapeHtml(appointmentForm.telefono)} · ${escapeHtml(appointmentForm.email)}</span>
          <button type="button" class="btn-link-edit" data-goto="3">✏️ Editar</button>
        </div>
        <div class="review-row" role="listitem">
          <span class="review-label">📝 Motivo</span>
          <span class="review-value">${escapeHtml(appointmentForm.motivo)}${appointmentForm.motivoDetalle ? ' — ' + escapeHtml(appointmentForm.motivoDetalle) : ''}</span>
          <button type="button" class="btn-link-edit" data-goto="4">✏️ Editar</button>
        </div>
        <div class="review-row" role="listitem">
          <span class="review-label">🔔 Aviso</span>
          <span class="review-value">${reminderLabel}</span>
          <button type="button" class="btn-link-edit" data-goto="4">✏️ Editar</button>
        </div>
      </div>

      <div style="background:var(--teal-lighter);border:1px solid var(--teal-light);border-radius:var(--radius-sm);padding:12px 16px;margin-top:16px">
        <p style="font-size:0.85rem;color:var(--teal-darker);line-height:1.5">
          💬 Al confirmar se guardará la cita en <strong>Mi Agenda</strong> y el tutor en <strong>Mi Directorio</strong>. Después podrás
          <strong>enviar la confirmación por WhatsApp</strong> con los datos que acabas de revisar.
        </p>
      </div>

      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-confirm">✓ Confirmar Cita</button>
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-link-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.goto);
      if (step === 1) renderAppointmentStep1();
      else if (step === 2) renderAppointmentStep2();
      else if (step === 3) renderAppointmentStep3();
      else if (step === 4) renderAppointmentStep4();
    });
  });

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep4);
  document.getElementById('btn-step-confirm').addEventListener('click', submitAppointment);
}

function submitAppointment() {
  const prof = getProfessional(appointmentForm.professionalId);

  const appointment = {
    id: generateId(),
    professionalId: appointmentForm.professionalId,
    professionalName: prof ? prof.nombre : 'Especialista',
    professionalSpecialty: prof ? prof.especialidad : 'Psicología',
    tutorNombre: appointmentForm.tutorNombre.trim(),
    pacienteNombre: appointmentForm.pacienteNombre.trim(),
    pacienteEdad: parseInt(appointmentForm.pacienteEdad),
    fecha: appointmentForm.date,
    hora: appointmentForm.time,
    telefono: appointmentForm.telefono.trim(),
    email: appointmentForm.email.trim(),
    motivo: appointmentForm.motivo,
    motivoDetalle: (appointmentForm.motivoDetalle || '').trim(),
    reminderOffset: appointmentForm.reminderOffset,
    reminderSound: appointmentForm.reminderSound,
    estado: 'confirmada',
    createdAt: new Date().toISOString()
  };

  // Si la cita tiene aviso, pedir autorización de notificaciones (clic = gesto válido)
  if (appointment.reminderOffset !== null && appointment.reminderOffset !== undefined) {
    ensureNotificationPermission();
  }

  // 1. Guardar Cita en Mi Agenda
  state.appointments.push(appointment);
  saveAppointments();

  // 2. Sincronización automática DIRECTA con MI DIRECTORIO
  loadContacts();
  const existingContact = state.contacts.find(c =>
    c.telefono === appointment.telefono || (appointment.email && c.email && c.email.toLowerCase() === appointment.email.toLowerCase())
  );

  if (existingContact) {
    existingContact.nombre = appointment.tutorNombre;
    existingContact.paciente = `${appointment.pacienteNombre} (${appointment.pacienteEdad} años)`;
    existingContact.notas = `Actualizado desde Mi Agenda con ${appointment.professionalName}. Motivo: ${appointment.motivo}`;
    saveContacts();
  } else {
    const newContact = {
      id: generateId(),
      nombre: appointment.tutorNombre,
      telefono: appointment.telefono,
      email: appointment.email,
      relacion: 'Tutor',
      paciente: `${appointment.pacienteNombre} (${appointment.pacienteEdad} años)`,
      notas: `Contacto registrado automáticamente desde Mi Agenda con ${appointment.professionalName}. Motivo: ${appointment.motivo}`
    };
    state.contacts.unshift(newContact);
    saveContacts();
  }

  // 3. Crear la cita como tarea en Mis Tareas (SIN aviso propio: el aviso lo
  //    gestiona la propia cita en Mi Agenda, así no se duplican timbres)
  const autoTask = {
    id: generateId(),
    date: appointment.fecha,
    time: appointment.hora,
    title: `Cita con ${appointment.professionalName}`,
    priority: 'alta',
    category: 'cita',
    description: `Paciente: ${appointment.pacienteNombre}. Tutor: ${appointment.tutorNombre}.`,
    reminderOffset: null,
    reminderSound: 'timbre',
    done: false,
    createdAt: new Date().toISOString()
  };
  state.tasks.push(autoTask);
  saveTasks();

  showToast('✓ Cita guardada en Mi Agenda y tutor sincronizado automáticamente con Mi Directorio.', 'success');
  updateSteps(5);

  const el = document.getElementById('form-step-content');
  if (!el) return;

  el.innerHTML = `
    <div class="form-card confirmation-card" role="region" aria-label="Confirmación de cita">
      <div class="confirmation-icon" aria-hidden="true">✓</div>
      <h2>¡Cita Agendada Exitosamente!</h2>
      <p>
        La consulta se guardó en <strong>Mi Agenda</strong> y el contacto fue sincronizado directamente en <strong>Mi Directorio</strong>.
      </p>

      <div class="confirmation-details" role="list">
        <div role="listitem"><strong>Especialista:</strong><span>${escapeHtml(appointment.professionalName)}</span></div>
        <div role="listitem"><strong>Fecha y Hora:</strong><span>${formatDate(appointment.fecha)} a las ${appointment.hora}</span></div>
        <div role="listitem"><strong>Paciente:</strong><span>${escapeHtml(appointment.pacienteNombre)} (${appointment.pacienteEdad} años)</span></div>
        <div role="listitem"><strong>Tutor:</strong><span>${escapeHtml(appointment.tutorNombre)} (${escapeHtml(appointment.telefono)})</span></div>
        <div role="listitem"><strong>Motivo:</strong><span>${escapeHtml(appointment.motivo)}</span></div>
      </div>

      <div class="whatsapp-confirm-block">
        <p class="whatsapp-confirm-title">💬 Confirmación por WhatsApp</p>
        <p class="whatsapp-confirm-hint">Revisaste tus datos y la cita está guardada. Envía la confirmación al WhatsApp de ${escapeHtml(appointment.tutorNombre)} (Tel: ${escapeHtml(appointment.telefono)}) desde aquí:</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button type="button" id="btn-send-whatsapp" class="btn btn-whatsapp">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar Confirmación por WhatsApp
          </button>
          <button type="button" id="btn-copy-whatsapp-msg" class="btn btn-outline">📋 Copiar mensaje</button>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="#/directorio" class="btn btn-primary" data-nav>Ver en Mi Directorio 👥</a>
        <a href="#/historial" class="btn btn-outline" data-nav>Ver Mi Historial 📜</a>
        <a href="#/agendar" class="btn btn-secondary" data-nav>Agendar otra Cita 📅</a>
      </div>
    </div>
  `;

  // Envío MANUAL: el usuario revisó la cita en el paso 5 y decide cuándo
  // enviar la confirmación (abre WhatsApp con el mensaje ya armado).
  document.getElementById('btn-send-whatsapp').addEventListener('click', () => {
    openWhatsAppConfirmation(appointment);
  });

  // Copiar el mensaje al portapapeles como alternativa de envío
  document.getElementById('btn-copy-whatsapp-msg').addEventListener('click', (e) => {
    copyToClipboard(buildWhatsAppMessage(appointment), 'Mensaje de confirmación copiado. Pégalo en WhatsApp.');
    const btn = e.currentTarget;
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = '📋 Copiar mensaje'; }, 2500);
  });
}

/* =====================================================================
    9.b CONFIRMACIÓN DE CITA POR WHATSAPP (wa.me)
   ===================================================================== */

/** Normaliza el teléfono del tutor para el formato internacional de wa.me */
function normalizeWhatsAppPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  // Colombia: móvil de 10 dígitos que empieza en 3 → prefijo 57
  if (digits.length === 10 && digits.startsWith('3')) digits = '57' + digits;
  return digits;
}

/** Genera el mensaje personalizado de confirmación con los datos de la cita */
function buildWhatsAppMessage(appointment) {
  return [
    '📅 *Confirmación de Cita - Actitud & Bienestar*',
    '',
    `Hola ${appointment.tutorNombre},`,
    '',
    'Tu cita ha sido agendada exitosamente:',
    '',
    `👦 Paciente: ${appointment.pacienteNombre}`,
    `👨‍⚕️ Profesional: ${appointment.professionalName}`,
    `📆 Fecha: ${formatDate(appointment.fecha)}`,
    `🕐 Hora: ${appointment.hora}`,
    `📝 Motivo: ${appointment.motivo}`,
    '',
    'Por favor, llega 10 minutos antes.',
    'Si necesitas cancelar o reprogramar, contáctanos.',
    '',
    '¡Te esperamos! 💚'
  ].join('\n');
}

/** Abre WhatsApp del tutor con el mensaje predefinido.
 *  Usa un <a> sintético con click() porque es más confiable que window.open
 *  en móviles (window.open con 'noopener' siempre retorna null y dispara
 *  falsos positivos de "popup bloqueado"). */
function openWhatsAppConfirmation(appointment) {
  const phone = normalizeWhatsAppPhone(appointment.telefono);
  const text = encodeURIComponent(buildWhatsAppMessage(appointment));
  const url = phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  requestAnimationFrame(() => anchor.remove());

  showToast('✓ Se abrió WhatsApp con el mensaje de confirmación. Presiona "Enviar" para entregárselo al tutor.', 'info');
}

/* =====================================================================
   10. VISTA 3: MIS TAREAS (CALENDARIO Y GESTIÓN CON AGREGAR Y ELIMINAR)
   ===================================================================== */
let tasksViewMode = 'dia'; // 'dia' | 'semana' | 'mes' | 'horas'

function renderTasks(el) {
  loadTasks();

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Mis Tareas y Calendario</h1>
      <p>Organiza compromisos, ejercicios terapéuticos y recordatorios</p>
    </div>
    <div class="container">
      <div class="view-tabs" role="tablist" aria-label="Vista de tareas">
        ${[
          ['dia', '📅 Día'],
          ['semana', '🗓️ Semana'],
          ['mes', '📆 Mes'],
          ['horas', '🕐 Horas']
        ].map(([v, label]) => `
          <button type="button" class="view-tab ${tasksViewMode === v ? 'active' : ''}" data-tview="${v}"
                  role="tab" aria-selected="${tasksViewMode === v}">${label}</button>
        `).join('')}
      </div>
      <div id="tasks-view-root"></div>
    </div>
  `;

  el.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tasksViewMode = tab.dataset.tview;
      el.querySelectorAll('.view-tab').forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      refreshTaskViews();
    });
  });

  refreshTaskViews();
}

/** Refresca la vista de tareas según el modo activo */
function refreshTaskViews() {
  const root = document.getElementById('tasks-view-root');
  if (!root) return;
  loadTasks();

  if (tasksViewMode === 'mes') {
    root.innerHTML = `
      <div class="tasks-layout">
        <section aria-labelledby="calendar-title">
          <div class="calendar-widget" id="calendar-widget"></div>
        </section>
        <section aria-labelledby="tasks-title">
          <div class="tasks-panel" id="tasks-panel"></div>
        </section>
      </div>`;
    buildCalendar();
    buildTasksPanel();
    return;
  }

  if (tasksViewMode === 'semana') {
    buildWeekView(root);
    return;
  }

  if (tasksViewMode === 'horas') {
    buildHoursView(root);
    return;
  }

  // 'dia'
  buildDayView(root);
}

/** Navegador de día con anterior / Hoy / siguiente */
function dayNavHTML(label, prefix) {
  return `
    <div class="task-view-nav">
      <button type="button" class="btn btn-outline btn-sm" id="${prefix}-prev" aria-label="Anterior">‹</button>
      <strong>${label}</strong>
      <button type="button" class="btn btn-outline btn-sm" id="${prefix}-next" aria-label="Siguiente">›</button>
      <button type="button" class="btn btn-sm" id="${prefix}-today" style="margin-left:8px">Hoy</button>
    </div>
  `;
}

/** Vista por DÍA: lista de tareas del día seleccionado (+ nueva tarea) */
function buildDayView(root) {
  const { selectedDate } = calendarState;
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const label = dateObj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  root.innerHTML = `
    ${dayNavHTML(label.charAt(0).toUpperCase() + label.slice(1), 'day')}
    <div class="tasks-layout">
      <div class="tasks-panel" id="tasks-panel"></div>
    </div>
  `;

  document.getElementById('day-prev').addEventListener('click', () => {
    calendarState.selectedDate = shiftISODate(selectedDate, -1);
    refreshTaskViews();
  });
  document.getElementById('day-next').addEventListener('click', () => {
    calendarState.selectedDate = shiftISODate(selectedDate, 1);
    refreshTaskViews();
  });
  document.getElementById('day-today').addEventListener('click', () => {
    calendarState.selectedDate = new Date().toISOString().split('T')[0];
    refreshTaskViews();
  });

  buildTasksPanel();
}

/** Vista por SEMANA: 7 columnas con las tareas de cada día */
function buildWeekView(root) {
  const { selectedDate } = calendarState;
  const monday = startOfWeek(new Date(selectedDate + 'T12:00:00'));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    days.push({ d, ds: d.toISOString().split('T')[0] });
  }

  const weekLabel = `Semana del ${formatDateShort(monday)} al ${formatDateShort(addDays(monday, 6))}`;

  root.innerHTML = `
    ${dayNavHTML(weekLabel, 'wk')}
    <div class="week-view-grid" id="week-view-grid">
      ${days.map(({ d, ds }) => {
        const tasks = state.tasks.filter(t => t.date === ds);
        const isToday = ds === new Date().toISOString().split('T')[0];
        return `
          <div class="week-col ${isToday ? 'today' : ''}" data-date="${ds}">
            <div class="week-col-head" role="button" tabindex="0" aria-label="Ver día ${formatDate(d)}">
              <strong>${formatDateShort(d)}</strong>
              <span class="week-col-count">${tasks.length} tarea(s)</span>
            </div>
            <div class="week-col-body task-list" role="list">
              ${tasks.length === 0
                ? `<div class="week-col-empty">Sin tareas</div>`
                : tasks.map(t => buildTaskItemHTML(t)).join('')}
            </div>
          </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('wk-prev').addEventListener('click', () => {
    calendarState.selectedDate = shiftISODate(monday.toISOString().split('T')[0], -1);
    refreshTaskViews();
  });
  document.getElementById('wk-next').addEventListener('click', () => {
    calendarState.selectedDate = shiftISODate(monday.toISOString().split('T')[0], 7);
    refreshTaskViews();
  });
  document.getElementById('wk-today').addEventListener('click', () => {
    calendarState.selectedDate = new Date().toISOString().split('T')[0];
    refreshTaskViews();
  });

  root.querySelectorAll('.week-col-head').forEach(head => {
    const go = () => {
      calendarState.selectedDate = head.closest('.week-col').dataset.date;
      tasksViewMode = 'dia';
      root.closest('.container')?.querySelectorAll('.view-tab').forEach(t => {
        const active = t.dataset.tview === 'dia';
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      refreshTaskViews();
    };
    head.addEventListener('click', go);
    head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  root.querySelectorAll('.week-col-body').forEach(col => attachTaskEvents(col));
}

/** Añadir tarea desde semana/horas llevando al día elegido */
function addTaskInto(dateStr) {
  calendarState.selectedDate = dateStr;
  tasksViewMode = 'dia';
  const root = document.getElementById('tasks-view-root');
  root.closest('.container')?.querySelectorAll('.view-tab').forEach(t => {
    const active = t.dataset.tview === 'dia';
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', String(active));
  });
  refreshTaskViews();
  requestAnimationFrame(() => {
    document.getElementById('toggle-add-task')?.click();
  });
}

/** Vista por HORAS: línea de tiempo del día seleccionado */
function buildHoursView(root) {
  const { selectedDate } = calendarState;
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const label = dateObj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const dayTasks = state.tasks.filter(t => t.date === selectedDate);
  const noTime = dayTasks.filter(t => !t.time);
  const withTime = dayTasks.filter(t => t.time);

  const slots = [];
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
  }

  const tasksBySlot = slots.reduce((acc, slot) => { acc[slot] = []; return acc; }, {});
  withTime.forEach(t => {
    const key = Object.prototype.hasOwnProperty.call(tasksBySlot, t.time) ? t.time : null;
    if (key) tasksBySlot[key].push(t);
  });

  root.innerHTML = `
    ${dayNavHTML(label.charAt(0).toUpperCase() + label.slice(1), 'hr')}
    <div class="hours-actions">
      <button type="button" class="btn btn-sm" id="hr-add" style="border-radius:999px">+ Nueva Tarea</button>
    </div>
    <div class="hours-list" role="list">
      ${noTime.length > 0 ? `
        <div class="hours-slot hours-slot--notime" role="listitem">
          <span class="hours-slot-time">Sin hora</span>
          <div class="task-list">${noTime.map(t => buildTaskItemHTML(t)).join('')}</div>
        </div>` : ''}
      ${slots.map(slot => `
        <div class="hours-slot ${tasksBySlot[slot].length ? 'has-tasks' : ''}" role="listitem">
          <span class="hours-slot-time">${slot}</span>
          <div class="task-list">
            ${tasksBySlot[slot].length ? tasksBySlot[slot].map(t => buildTaskItemHTML(t)).join('') : ''}
          </div>
        </div>`).join('')}
    </div>
  `;

  document.getElementById('hr-prev').addEventListener('click', () => {
    calendarState.selectedDate = shiftISODate(selectedDate, -1);
    refreshTaskViews();
  });
  document.getElementById('hr-next').addEventListener('click', () => {
    calendarState.selectedDate = shiftISODate(selectedDate, 1);
    refreshTaskViews();
  });
  document.getElementById('hr-today').addEventListener('click', () => {
    calendarState.selectedDate = new Date().toISOString().split('T')[0];
    refreshTaskViews();
  });
  document.getElementById('hr-add').addEventListener('click', () => addTaskInto(selectedDate));

  root.querySelectorAll('.task-list').forEach(list => attachTaskEvents(list));
}

/** Desplaza una fecha ISO en días (resultado como 'yyyy-mm-dd') */
function shiftISODate(dateStr, deltaDays) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split('T')[0];
}

function buildCalendar() {
  const widget = document.getElementById('calendar-widget');
  if (!widget) return;

  const { year, month, selectedDate } = calendarState;
  const today = getToday();

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Lunes = 0

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const tasksByDate = {};
  state.tasks.forEach(t => {
    if (!t.date) return;
    const dStr = t.date.split('T')[0];
    tasksByDate[dStr] = (tasksByDate[dStr] || 0) + 1;
  });

  let daysHTML = '';
  for (let i = 0; i < startDow; i++) {
    daysHTML += `<div class="cal-day cal-day--empty" aria-hidden="true"></div>`;
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    const isToday = dateObj.getTime() === today.getTime();
    const isSelected = dateStr === selectedDate;
    const taskCount = tasksByDate[dateStr] || 0;

    let cls = 'cal-day';
    if (isToday) cls += ' cal-day--today';
    if (isSelected && !isToday) cls += ' cal-day--selected';
    if (taskCount > 0) cls += ' cal-day--has-tasks';

    daysHTML += `
      <button class="${cls}" data-date="${dateStr}" role="gridcell"
              aria-label="${d} de ${monthNames[month]} ${year}${isToday ? ' (hoy)' : ''}${taskCount > 0 ? `, ${taskCount} tareas` : ''}">
        ${d}
      </button>`;
  }

  widget.innerHTML = `
    <div class="calendar-header">
      <button class="cal-nav-btn" id="cal-prev" aria-label="Mes anterior">‹</button>
      <h3 id="calendar-title" aria-live="polite">${monthNames[month]} ${year}</h3>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-sm btn-outline" id="cal-today-btn" style="padding:4px 10px;font-size:0.78rem">Hoy</button>
        <button class="cal-nav-btn" id="cal-next" aria-label="Mes siguiente">›</button>
      </div>
    </div>
    <div class="calendar-weekdays" aria-hidden="true">
      <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
    </div>
    <div class="calendar-days" role="grid" aria-label="Días del mes">
      ${daysHTML}
    </div>
  `;

  widget.querySelector('#cal-prev').addEventListener('click', () => {
    calendarState.month--;
    if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
    buildCalendar();
  });

  widget.querySelector('#cal-next').addEventListener('click', () => {
    calendarState.month++;
    if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
    buildCalendar();
  });

  widget.querySelector('#cal-today-btn').addEventListener('click', () => {
    const now = new Date();
    calendarState.year = now.getFullYear();
    calendarState.month = now.getMonth();
    calendarState.selectedDate = now.toISOString().split('T')[0];
    buildCalendar();
    refreshTaskViews();
  });

  widget.querySelectorAll('.cal-day[data-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      calendarState.selectedDate = btn.dataset.date;
      buildCalendar();
      refreshTaskViews();
    });
  });
}

function buildTasksPanel() {
  const panel = document.getElementById('tasks-panel');
  if (!panel) return;

  const { selectedDate } = calendarState;
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dayTasks = state.tasks.filter(t => t.date === selectedDate);
  const pendingCount = dayTasks.filter(t => !t.done).length;
  const formattedDate = dateObj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  panel.innerHTML = `
    <div class="tasks-panel-header">
      <div>
        <h3 id="tasks-title">📋 ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}</h3>
        <span style="font-size:0.8rem;opacity:0.9">${dayTasks.length} tarea(s) · ${pendingCount} pendiente(s)</span>
      </div>
      <button class="btn btn-sm" id="toggle-add-task"
              style="background:rgba(255,255,255,0.25);color:#fff;border-radius:999px;font-weight:700"
              aria-label="Agregar nueva tarea" aria-expanded="false" aria-controls="add-task-form">
        + Nueva Tarea
      </button>
    </div>
    <div class="tasks-panel-body">
      <form class="add-task-form hidden" id="add-task-form" novalidate>
        <div class="form-group" style="margin-bottom:0">
          <label for="task-title-input" style="font-size:0.85rem">Título de la tarea <span style="color:var(--danger)">*</span></label>
          <input type="text" id="task-title-input" name="taskTitle"
                 placeholder="Ej: Revisar registro de conducta con la terapeuta"
                 aria-required="true" maxlength="120">
        </div>

        <div class="form-row-inline">
          <div>
            <label for="task-date-input" style="font-size:0.82rem;font-weight:600;display:block;margin-bottom:4px">Fecha</label>
            <input type="date" id="task-date-input" name="taskDate" value="${selectedDate}">
          </div>
          <div>
            <label for="task-time-input" style="font-size:0.82rem;font-weight:600;display:block;margin-bottom:4px">Hora (opcional)</label>
            <input type="time" id="task-time-input" name="taskTime">
          </div>
        </div>

        <div class="form-row-inline">
          <div>
            <label for="task-priority" style="font-size:0.82rem;font-weight:600;display:block;margin-bottom:4px">Prioridad</label>
            <select id="task-priority" name="taskPriority">
              <option value="baja">🟢 Baja</option>
              <option value="media" selected>🟡 Media</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>
          <div>
            <label for="task-category" style="font-size:0.82rem;font-weight:600;display:block;margin-bottom:4px">Categoría</label>
            <select id="task-category" name="taskCategory">
              <option value="cita">📅 Cita Terapéutica</option>
              <option value="medicacion">💊 Hábito / Medicación</option>
              <option value="tarea">📚 Tarea Escolar</option>
              <option value="ejercicio">🎯 Ejercicio Emocional</option>
              <option value="otro" selected>📌 General</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label for="task-desc-input" style="font-size:0.82rem;font-weight:600">Descripción breve</label>
          <input type="text" id="task-desc-input" name="taskDesc" placeholder="Observaciones o notas" maxlength="200">
        </div>

        ${reminderFieldsHTML({ reminderOffset: null, reminderSound: 'timbre', kindLabel: 'tarea' }, 'task-rem')}

        <div style="display:flex;gap:8px;margin-top:6px">
          <button type="submit" class="btn btn-green btn-sm" style="flex:1">✓ Guardar Tarea</button>
          <button type="button" class="btn btn-secondary btn-sm" id="cancel-add-task">Cancelar</button>
        </div>
      </form>

      <div class="task-list" id="task-list" role="list">
        ${dayTasks.length === 0
          ? `<div style="text-align:center;padding:28px 16px;color:var(--gray-light);font-size:0.9rem">
               <div style="font-size:2.2rem;margin-bottom:8px">🌱</div>
               No hay tareas para este día.<br>Haz clic en <strong>"+ Nueva Tarea"</strong> para crear una.
             </div>`
          : dayTasks.map(t => buildTaskItemHTML(t)).join('')
        }
      </div>
    </div>
  `;

  const toggleBtn = panel.querySelector('#toggle-add-task');
  const addForm   = panel.querySelector('#add-task-form');

  bindReminderControls('task-rem');

  toggleBtn.addEventListener('click', () => {
    const isOpen = !addForm.classList.contains('hidden');
    addForm.classList.toggle('hidden', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) panel.querySelector('#task-title-input')?.focus();
  });

  panel.querySelector('#cancel-add-task').addEventListener('click', () => {
    addForm.classList.add('hidden');
    toggleBtn.setAttribute('aria-expanded', 'false');
    addForm.reset();
  });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = panel.querySelector('#task-title-input');
    const dateInput  = panel.querySelector('#task-date-input');
    const timeInput  = panel.querySelector('#task-time-input');
    const priority   = panel.querySelector('#task-priority').value;
    const category   = panel.querySelector('#task-category').value;
    const descInput  = panel.querySelector('#task-desc-input');

    const titleVal = titleInput.value.trim();
    if (!titleVal) {
      titleInput.focus();
      showToast('Ingresa el título de la tarea.', 'error');
      return;
    }

    const newTask = {
      id: generateId(),
      date: dateInput.value || selectedDate,
      time: timeInput.value || '',
      title: titleVal,
      description: (descInput.value || '').trim(),
      priority,
      category,
      reminderOffset: null,
      reminderSound: 'timbre',
      done: false,
      createdAt: new Date().toISOString()
    };
    Object.assign(newTask, readReminderSelection('task-rem'));

    if (newTask.reminderOffset !== null && newTask.reminderOffset !== undefined) {
      ensureNotificationPermission();
    }

    state.tasks.push(newTask);
    saveTasks();
    showToast('✓ Tarea agregada con éxito a Mis Tareas.', 'success');

    calendarState.selectedDate = newTask.date;
    refreshTaskViews();
  });

  attachTaskEvents(panel);
}

function buildTaskItemHTML(t) {
  const catEmojis = { cita:'📅 Cita', medicacion:'💊 Hábito', tarea:'📚 Escolar', ejercicio:'🎯 Ejercicio', otro:'📌 General' };
  return `
    <div class="task-item ${t.done ? 'done' : ''}" data-task-id="${escapeHtml(t.id)}" role="listitem">
      <button class="task-checkbox" data-action="toggle" data-id="${escapeHtml(t.id)}"
              aria-label="${t.done ? 'Marcar como pendiente' : 'Marcar como completada'}">
        ${t.done ? '✓' : ''}
      </button>
      <div class="task-content">
        <div class="task-title">${escapeHtml(t.title)}</div>
        ${t.description ? `<p style="font-size:0.82rem;color:var(--gray);margin-bottom:4px">${escapeHtml(t.description)}</p>` : ''}
        <div class="task-meta">
          <span>${catEmojis[t.category] || '📌 General'}</span>
          ${t.time ? `<span>⏰ ${escapeHtml(t.time)}</span>` : ''}
          <span class="task-priority--${escapeHtml(t.priority)}">${escapeHtml(t.priority)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-delete-btn" data-action="edit" data-id="${escapeHtml(t.id)}" title="Editar o reagendar tarea">✏️</button>
        <button class="task-delete-btn" data-action="delete" data-id="${escapeHtml(t.id)}" title="Eliminar tarea">✕</button>
      </div>
    </div>
  `;
}

function attachTaskEvents(panel) {
  panel.querySelectorAll('[data-action="toggle"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.done = !task.done;
        if (task.done) task.completedAt = new Date().toISOString();
        saveTasks();
        refreshTaskViews();
        showToast(task.done ? '✓ Tarea completada.' : 'Tarea reactivada.', task.done ? 'success' : 'info');
      }
    });
  });

  panel.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const task = state.tasks.find(t => t.id === id);
      if (task) openTaskEditModal(task, refreshTaskViews);
    });
  });

  panel.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('¿Eliminar esta tarea de Mis Tareas?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveTasks();
        refreshTaskViews();
        showToast('Tarea eliminada de Mis Tareas.', 'info');
      }
    });
  });
}

/** Modal para editar o reagendar una tarea existente (fecha, hora, aviso propio) */
function openTaskEditModal(task, onDone) {
  const todayStr = new Date().toISOString().split('T')[0];

  openModal(
    '✏️ Editar / Reagendar Tarea',
    `
    <div class="form-group">
      <label for="t-edit-title">Título de la tarea <span style="color:var(--danger)">*</span></label>
      <input type="text" id="t-edit-title" value="${escapeHtml(task.title)}" maxlength="120">
    </div>

    <div class="form-row-inline">
      <div>
        <label for="t-edit-date">Fecha</label>
        <input type="date" id="t-edit-date" value="${escapeHtml(task.date || todayStr)}">
      </div>
      <div>
        <label for="t-edit-time">Hora (opcional)</label>
        <input type="time" id="t-edit-time" value="${escapeHtml(task.time || '')}">
      </div>
    </div>

    <div class="form-row-inline">
      <div>
        <label for="t-edit-priority">Prioridad</label>
        <select id="t-edit-priority">
          <option value="baja" ${task.priority === 'baja' ? 'selected' : ''}>🟢 Baja</option>
          <option value="media" ${task.priority === 'media' ? 'selected' : ''}>🟡 Media</option>
          <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>🔴 Alta</option>
        </select>
      </div>
      <div>
        <label for="t-edit-category">Categoría</label>
        <select id="t-edit-category">
          <option value="cita" ${task.category === 'cita' ? 'selected' : ''}>📅 Cita Terapéutica</option>
          <option value="medicacion" ${task.category === 'medicacion' ? 'selected' : ''}>💊 Hábito / Medicación</option>
          <option value="tarea" ${task.category === 'tarea' ? 'selected' : ''}>📚 Tarea Escolar</option>
          <option value="ejercicio" ${task.category === 'ejercicio' ? 'selected' : ''}>🎯 Ejercicio Emocional</option>
          <option value="otro" ${task.category === 'otro' ? 'selected' : ''}>📌 General</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="t-edit-desc">Descripción breve</label>
      <input type="text" id="t-edit-desc" value="${escapeHtml(task.description || '')}" maxlength="200">
    </div>

    ${reminderFieldsHTML({ reminderOffset: task.reminderOffset, reminderSound: task.reminderSound, kindLabel: 'tarea' }, 'task-edit-rem')}
    `,
    `
    <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary btn-sm" id="btn-save-edit-task">Guardar Cambios</button>
    `
  );

  bindReminderControls('task-edit-rem');

  const titleInput = document.getElementById('t-edit-title');
  titleInput.focus();

  document.getElementById('btn-save-edit-task').addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      showToast('Ingresa el título de la tarea.', 'error');
      return;
    }

    const prevDate = task.date;
    task.title = title;
    task.date = document.getElementById('t-edit-date').value || task.date;
    task.time = document.getElementById('t-edit-time').value || '';
    task.priority = document.getElementById('t-edit-priority').value;
    task.category = document.getElementById('t-edit-category').value;
    task.description = document.getElementById('t-edit-desc').value.trim();
    Object.assign(task, readReminderSelection('task-edit-rem'));

    if (task.reminderOffset !== null && task.reminderOffset !== undefined) {
      ensureNotificationPermission();
    }

    saveTasks();

    // Si es la tarea-recordatorio de una cita, mantén actualizada la cita en Mi Agenda
    if (task.category === 'cita' && task.date && prevDate !== task.date) {
      const linked = state.appointments.find(a =>
        a.professionalName && task.title.includes(a.professionalName) &&
        a.fecha === prevDate && (a.hora === task.time || task.time === a.hora));
      if (linked) {
        linked.fecha = task.date;
        if (task.time) linked.hora = task.time;
        saveAppointments();
      }
    }

    closeModal();
    showToast('✓ Tarea actualizada correctamente.', 'success');
    if (onDone) onDone();
  });
}

/* =====================================================================
   11. VISTA 4: MI HISTORIAL (CITAS + TAREAS CON FILTROS DINÁMICOS)
   ===================================================================== */
function renderHistory(el) {
  loadAppointments();
  loadTasks();

  let filterType = 'all'; // 'all', 'appointments', 'tasks'
  let filterProf = 'all';
  let searchQuery = '';

  const renderHistoryContent = () => {
    let apps = [...state.appointments];
    let tasks = state.tasks.filter(t => t.done);

    // Filtrar citas
    if (filterProf !== 'all') {
      apps = apps.filter(a => String(a.professionalId) === filterProf);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      apps = apps.filter(a =>
        a.pacienteNombre.toLowerCase().includes(q) ||
        a.tutorNombre.toLowerCase().includes(q) ||
        a.professionalName.toLowerCase().includes(q) ||
        a.motivo.toLowerCase().includes(q)
      );
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    const showApps = filterType === 'all' || filterType === 'appointments';
    const showTasks = filterType === 'all' || filterType === 'tasks';

    return `
      <!-- Barra de Filtros -->
      <div class="history-filters-bar">
        <div class="history-filter-item">
          <label for="hist-search">Buscar en historial</label>
          <input type="search" id="hist-search" placeholder="Paciente, tutor, motivo o tarea..." value="${escapeHtml(searchQuery)}">
        </div>

        <div class="history-filter-item">
          <label for="hist-type">Tipo de registro</label>
          <select id="hist-type">
            <option value="all" ${filterType === 'all' ? 'selected' : ''}>Mostrar Todo (Citas y Tareas)</option>
            <option value="appointments" ${filterType === 'appointments' ? 'selected' : ''}>Solo Citas de Mi Agenda</option>
            <option value="tasks" ${filterType === 'tasks' ? 'selected' : ''}>Solo Tareas Completadas</option>
          </select>
        </div>

        <div class="history-filter-item">
          <label for="hist-prof">Filtrar por Profesional</label>
          <select id="hist-prof">
            <option value="all" ${filterProf === 'all' ? 'selected' : ''}>Todos los profesionales</option>
            ${PROFESSIONALS.map(p => `<option value="${p.id}" ${filterProf === String(p.id) ? 'selected' : ''}>${escapeHtml(p.nombre)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Sección de Citas -->
      ${showApps ? `
        <div style="margin-bottom:36px">
          <h2 style="font-size:1.25rem;font-weight:800;color:var(--dark);margin-bottom:16px;display:flex;align-items:center;gap:8px">
            📅 Citas en Mi Agenda (${apps.length})
          </h2>
          ${apps.length === 0
            ? `<div class="history-empty" style="text-align:center;padding:24px;background:var(--white);border-radius:var(--radius);border:1px solid var(--gray-lighter)">
                 <p style="color:var(--gray)">No se encontraron citas con los filtros seleccionados.</p>
               </div>`
            : `<div class="history-list" role="list">
                 ${apps.map(a => `
                   <article class="history-card status-${escapeHtml(a.estado)}" role="listitem">
                     <div class="history-card-header">
                       <div>
                         <h3>${escapeHtml(a.professionalName)}</h3>
                         <p style="font-size:0.84rem;color:var(--teal);font-weight:700;margin-top:2px">${escapeHtml(a.motivo)}</p>
                       </div>
                       <span class="badge badge-${escapeHtml(a.estado)}">${escapeHtml(a.estado)}</span>
                     </div>
                     <div class="history-card-body">
                       <div>📅 <strong>Fecha:</strong> ${formatDate(a.fecha)}</div>
                       <div>⏰ <strong>Hora:</strong> ${a.hora}</div>
                       <div>🧒 <strong>Paciente:</strong> ${escapeHtml(a.pacienteNombre)} (${a.pacienteEdad} años)</div>
                       <div>👤 <strong>Tutor:</strong> ${escapeHtml(a.tutorNombre)} (📱 ${escapeHtml(a.telefono)})</div>
                       ${a.motivoDetalle ? `<div style="font-size:0.82rem;color:var(--gray);background:var(--warm-white);padding:8px;border-radius:var(--radius-xs);margin-top:6px"><em>${escapeHtml(a.motivoDetalle)}</em></div>` : ''}
                       <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
                         <button class="btn btn-sm btn-outline" data-action="view-app" data-id="${escapeHtml(a.id)}">Ver Detalle Completo</button>
                         <button class="btn btn-sm btn-secondary" data-action="toggle-status" data-id="${escapeHtml(a.id)}">
                           ${a.estado === 'atendida' ? 'Marcar Confirmada' : 'Marcar Atendida ✓'}
                         </button>
                         <button class="btn btn-sm" data-action="delete-history" data-type="appointment" data-id="${escapeHtml(a.id)}" style="color:var(--danger);background:var(--danger-bg)">🗑 Eliminar</button>
                       </div>
                     </div>
                   </article>
                 `).join('')}
               </div>`
          }
        </div>
      ` : ''}

      <!-- Sección de Tareas Completadas -->
      ${showTasks ? `
        <div>
          <h2 style="font-size:1.25rem;font-weight:800;color:var(--dark);margin-bottom:16px;display:flex;align-items:center;gap:8px">
            ✓ Tareas Terapéuticas Completadas (${tasks.length})
          </h2>
          ${tasks.length === 0
            ? `<div style="text-align:center;padding:24px;background:var(--white);border-radius:var(--radius);border:1px solid var(--gray-lighter)">
                 <p style="color:var(--gray)">No hay tareas completadas registradas.</p>
               </div>`
            : `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:14px">
                 ${tasks.map(t => `
                   <div style="padding:16px;background:var(--white);border-radius:var(--radius-sm);border:1px solid var(--gray-lighter);box-shadow:var(--shadow-sm)">
                     <div style="font-weight:700;color:var(--dark);text-decoration:line-through">${escapeHtml(t.title)}</div>
                     ${t.description ? `<p style="font-size:0.82rem;color:var(--gray);margin-top:4px">${escapeHtml(t.description)}</p>` : ''}
                     <div style="font-size:0.78rem;color:var(--gray-light);margin-top:8px">
                       📅 Programada: ${formatDateShort(t.date)}<br>
                       ${t.completedAt ? `✓ Finalizada: ${new Date(t.completedAt).toLocaleDateString('es-CO')}` : '✓ Finalizada'}
                     </div>
                     <button class="btn btn-sm" data-action="delete-history" data-type="task" data-id="${escapeHtml(t.id)}" style="color:var(--danger);background:var(--danger-bg);margin-top:10px;width:100%">🗑 Eliminar del historial</button>
                   </div>
                 `).join('')}
               </div>`
          }
        </div>
      ` : ''}
    `;
  };

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Mi Historial de Citas y Tareas</h1>
      <p>Consulta registros de consultas psicológicas y metas terapéuticas alcanzadas</p>
      <div style="margin-top:14px">
        <button class="btn btn-sm" id="btn-clear-history" style="color:var(--danger);background:var(--danger-bg)">
          🗑 Borrar Todo el Historial
        </button>
      </div>
    </div>
    <div class="container" id="history-container">
      <hr class="section-divider" aria-hidden="true">
      <div id="history-dynamic-content">
        ${renderHistoryContent()}
      </div>
    </div>
  `;

  const attachFilterEvents = () => {
    const searchInp = document.getElementById('hist-search');
    const typeSelect = document.getElementById('hist-type');
    const profSelect = document.getElementById('hist-prof');

    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        refresh();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        filterType = e.target.value;
        refresh();
      });
    }

    if (profSelect) {
      profSelect.addEventListener('change', (e) => {
        filterProf = e.target.value;
        refresh();
      });
    }

    // Botones de acción en citas
    document.querySelectorAll('[data-action="view-app"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const a = state.appointments.find(item => item.id === id);
        if (!a) return;
        openModal(
          `Cita: ${a.pacienteNombre}`,
          `
          <div style="display:flex;flex-direction:column;gap:10px;font-size:0.92rem;color:var(--dark)">
            <div><strong>Profesional:</strong> ${escapeHtml(a.professionalName)} (${escapeHtml(a.professionalSpecialty || 'Psicología')})</div>
            <div><strong>Fecha y Hora:</strong> ${formatDate(a.fecha)} a las ${a.hora}</div>
            <div><strong>Paciente:</strong> ${escapeHtml(a.pacienteNombre)} (${a.pacienteEdad} años)</div>
            <div><strong>Tutor:</strong> ${escapeHtml(a.tutorNombre)}</div>
            <div><strong>Teléfono:</strong> <a href="tel:${escapeHtml(a.telefono)}" style="color:var(--teal)">${escapeHtml(a.telefono)}</a></div>
            <div><strong>Correo:</strong> <a href="mailto:${escapeHtml(a.email)}" style="color:var(--teal)">${escapeHtml(a.email)}</a></div>
            <div><strong>Motivo Principal:</strong> ${escapeHtml(a.motivo)}</div>
            ${a.motivoDetalle ? `<div><strong>Descripción Detallada:</strong><br><span style="color:var(--gray)">${escapeHtml(a.motivoDetalle)}</span></div>` : ''}
            <div><strong>Estado Actual:</strong> <span class="badge badge-${escapeHtml(a.estado)}">${escapeHtml(a.estado)}</span></div>
          </div>
          `,
          `<button class="btn btn-primary btn-sm" onclick="closeModal()">Cerrar</button>`
        );
      });
    });

    document.querySelectorAll('[data-action="toggle-status"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const a = state.appointments.find(item => item.id === id);
        if (a) {
          a.estado = a.estado === 'atendida' ? 'confirmada' : 'atendida';
          saveAppointments();
          showToast(`Estado de cita actualizado a: ${a.estado}`, 'success');
          refresh();
        }
      });
    });

    document.querySelectorAll('[data-action="delete-history"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        if (type === 'appointment') {
          const a = state.appointments.find(item => item.id === id);
          if (a && confirm(`¿Seguro que deseas eliminar del historial la cita de ${a.pacienteNombre} (${formatDateShort(a.fecha)} a las ${a.hora})? También se quitará de Mi Agenda. Esta acción no se puede deshacer.`)) {
            state.appointments = state.appointments.filter(item => item.id !== id);
            saveAppointments();
            showToast('Cita eliminada del historial y de Mi Agenda.', 'success');
            refresh();
          }
        } else if (type === 'task') {
          const t = state.tasks.find(item => item.id === id);
          if (t && confirm(`¿Seguro que deseas eliminar del historial la tarea "${t.title}"? Esta acción no se puede deshacer.`)) {
            state.tasks = state.tasks.filter(item => item.id !== id);
            saveTasks();
            showToast('Tarea eliminada del historial.', 'success');
            refresh();
          }
        }
      });
    });
  };

  const refresh = () => {
    const dyn = document.getElementById('history-dynamic-content');
    if (dyn) {
      dyn.innerHTML = renderHistoryContent();
      attachFilterEvents();
    }
  };

  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    const totalRegistros = state.appointments.length + state.tasks.length;
    if (totalRegistros === 0) {
      showToast('No hay registros en el historial para eliminar.', 'info');
      return;
    }
    if (confirm(`¿Seguro que deseas borrar TODO el historial (${totalRegistros} registro${totalRegistros === 1 ? '' : 's'})?\n\nSe eliminarán TODAS las citas y TODAS las tareas (completadas y pendientes). Esta acción no se puede deshacer.`)) {
      state.appointments = [];
      state.tasks = [];
      saveAppointments();
      saveTasks();
      showToast('Todo el historial ha sido eliminado.', 'success');
      refresh();
    }
  });

  attachFilterEvents();
}

/* =====================================================================
   12. VISTA 5: MI DIRECTORIO (CRUD COMPLETO: AGREGAR, EDITAR, ELIMINAR Y BUSCAR)
   ===================================================================== */
function renderDirectory(el) {
  loadContacts();
  let searchTerm = '';

  const renderContactsGrid = () => {
    let list = [...state.contacts];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.paciente && c.paciente.toLowerCase().includes(q)) ||
        (c.relacion && c.relacion.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      return `
        <div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:var(--white);border-radius:var(--radius);border:1px solid var(--gray-lighter)">
          <div style="font-size:3rem;margin-bottom:12px">👥</div>
          <h3 style="color:var(--dark);margin-bottom:6px">No se encontraron contactos en Mi Directorio</h3>
          <p style="color:var(--gray);font-size:0.9rem">Prueba con otro término de búsqueda o agrega un nuevo contacto.</p>
          <button class="btn btn-primary btn-sm mt-16" id="btn-add-empty">+ Agregar Contacto a Mi Directorio</button>
        </div>
      `;
    }

    return list.map(c => {
      const badgeClass = `badge--${(c.relacion || 'otro').toLowerCase()}`;
      return `
        <article class="contact-card" role="listitem" aria-label="Contacto: ${escapeHtml(c.nombre)}">
          <div class="contact-header">
            <div>
              <div class="contact-name">${escapeHtml(c.nombre)}</div>
              ${c.paciente ? `<div style="font-size:0.82rem;color:var(--teal-dark);font-weight:600">🧒 Paciente: ${escapeHtml(c.paciente)}</div>` : ''}
            </div>
            <span class="contact-badge ${badgeClass}">${escapeHtml(c.relacion || 'Contacto')}</span>
          </div>

          <div class="contact-info-list">
            <div class="contact-info-item">
              <span aria-hidden="true">📱</span>
              <a href="tel:${escapeHtml(c.telefono)}" aria-label="Llamar a ${escapeHtml(c.nombre)}">${escapeHtml(c.telefono)}</a>
            </div>
            ${c.email ? `
              <div class="contact-info-item">
                <span aria-hidden="true">✉️</span>
                <a href="mailto:${escapeHtml(c.email)}" aria-label="Enviar correo a ${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>
              </div>
            ` : ''}
          </div>

          ${c.notas ? `<div class="contact-notes">${escapeHtml(c.notas)}</div>` : ''}

          <div class="contact-actions">
            <a href="https://wa.me/57${c.telefono.replace(/\D/g,'')}" target="_blank" rel="noopener noreferrer"
               class="btn btn-sm btn-outline" style="flex:1;text-align:center" aria-label="WhatsApp a ${escapeHtml(c.nombre)}">
              💬 WhatsApp
            </a>
            <button class="btn btn-sm btn-secondary" data-action="edit-contact" data-id="${escapeHtml(c.id)}" aria-label="Editar contacto">
              ✏️ Editar
            </button>
            <button class="btn btn-sm" style="color:var(--danger);background:var(--danger-bg)" data-action="delete-contact" data-id="${escapeHtml(c.id)}" aria-label="Eliminar contacto">
              🗑️ Eliminar
            </button>
          </div>
        </article>
      `;
    }).join('');
  };

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Mi Directorio</h1>
      <p>Gestión de padres, tutores, orientadores escolares y red de apoyo familiar</p>
    </div>
    <div class="container">
      <hr class="section-divider" aria-hidden="true">

      <!-- Toolbar con búsqueda y agregar -->
      <div class="directory-toolbar">
        <div class="directory-search">
          <input type="search" id="dir-search" placeholder="Buscar por nombre, teléfono, paciente o relación..." aria-label="Buscar en Mi Directorio">
        </div>
        <button class="btn btn-primary" id="btn-add-contact" aria-label="Registrar nuevo contacto en Mi Directorio">
          + Agregar Nuevo Contacto
        </button>
      </div>

      <!-- Grid de contactos -->
      <div class="directory-grid" id="contacts-grid" role="list">
        ${renderContactsGrid()}
      </div>
    </div>
  `;

  const refreshGrid = () => {
    const grid = document.getElementById('contacts-grid');
    if (grid) {
      grid.innerHTML = renderContactsGrid();
      attachContactGridEvents();
    }
  };

  const openContactFormModal = (contact = null) => {
    const isEdit = Boolean(contact);
    const title = isEdit ? 'Editar Contacto' : 'Nuevo Contacto en Mi Directorio';

    openModal(
      title,
      `
      <form id="modal-contact-form" novalidate>
        <div class="form-group">
          <label for="m-nombre">Nombre completo del contacto / tutor <span style="color:var(--danger)">*</span></label>
          <input type="text" id="m-nombre" value="${isEdit ? escapeHtml(contact.nombre) : ''}" placeholder="Ej: Marcela Gómez" required>
        </div>

        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label for="m-telefono">Teléfono <span style="color:var(--danger)">*</span></label>
            <input type="tel" id="m-telefono" value="${isEdit ? escapeHtml(contact.telefono) : ''}" placeholder="Ej: 3012345678" required>
          </div>
          <div class="form-group">
            <label for="m-relacion">Relación / Parentesco</label>
            <select id="m-relacion">
              <option value="Madre" ${isEdit && contact.relacion === 'Madre' ? 'selected' : ''}>Madre</option>
              <option value="Padre" ${isEdit && contact.relacion === 'Padre' ? 'selected' : ''}>Padre</option>
              <option value="Tutor" ${isEdit && contact.relacion === 'Tutor' ? 'selected' : ''}>Tutor Legal</option>
              <option value="Familiar" ${isEdit && contact.relacion === 'Familiar' ? 'selected' : ''}>Familiar</option>
              <option value="Terapeuta" ${isEdit && contact.relacion === 'Terapeuta' ? 'selected' : ''}>Terapeuta / Orientador</option>
              <option value="Otro" ${isEdit && contact.relacion === 'Otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="m-email">Correo electrónico</label>
          <input type="email" id="m-email" value="${isEdit ? escapeHtml(contact.email || '') : ''}" placeholder="contacto@ejemplo.com">
        </div>

        <div class="form-group">
          <label for="m-paciente">Nombre del paciente relacionado</label>
          <input type="text" id="m-paciente" value="${isEdit ? escapeHtml(contact.paciente || '') : ''}" placeholder="Ej: David Gómez (9 años)">
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label for="m-notas">Notas o pautas de contacto</label>
          <textarea id="m-notas" rows="2" placeholder="Observaciones especiales sobre el contacto...">${isEdit ? escapeHtml(contact.notas || '') : ''}</textarea>
        </div>
      </form>
      `,
      `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-sm" id="btn-save-modal-contact">${isEdit ? 'Guardar Cambios' : 'Registrar Contacto'}</button>
      `
    );

    document.getElementById('btn-save-modal-contact')?.addEventListener('click', () => {
      const nombre = document.getElementById('m-nombre')?.value.trim();
      const telefono = document.getElementById('m-telefono')?.value.trim();
      const email = document.getElementById('m-email')?.value.trim();
      const relacion = document.getElementById('m-relacion')?.value;
      const paciente = document.getElementById('m-paciente')?.value.trim();
      const notas = document.getElementById('m-notas')?.value.trim();

      if (!nombre) {
        showToast('El nombre es obligatorio.', 'error');
        document.getElementById('m-nombre')?.focus();
        return;
      }
      if (!telefono || !isValidPhone(telefono)) {
        showToast('Ingresa un número de teléfono válido.', 'error');
        document.getElementById('m-telefono')?.focus();
        return;
      }

      if (isEdit) {
        contact.nombre = nombre;
        contact.telefono = telefono;
        contact.email = email;
        contact.relacion = relacion;
        contact.paciente = paciente;
        contact.notas = notas;
        showToast('✓ Contacto actualizado correctamente en Mi Directorio.', 'success');
      } else {
        const newC = {
          id: generateId(),
          nombre,
          telefono,
          email,
          relacion,
          paciente,
          notas
        };
        state.contacts.unshift(newC);
        showToast('✓ Nuevo contacto añadido a Mi Directorio.', 'success');
      }

      saveContacts();
      closeModal();
      refreshGrid();
    });
  };

  const attachContactGridEvents = () => {
    document.querySelectorAll('[data-action="edit-contact"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const c = state.contacts.find(item => item.id === id);
        if (c) openContactFormModal(c);
      });
    });

    document.querySelectorAll('[data-action="delete-contact"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const c = state.contacts.find(item => item.id === id);
        if (c && confirm(`¿Seguro que deseas eliminar a ${c.nombre} de Mi Directorio?`)) {
          state.contacts = state.contacts.filter(item => item.id !== id);
          saveContacts();
          showToast('Contacto eliminado de Mi Directorio.', 'info');
          refreshGrid();
        }
      });
    });

    document.getElementById('btn-add-empty')?.addEventListener('click', () => openContactFormModal());
  };

  // Eventos de barra de búsqueda y botón nuevo
  document.getElementById('dir-search')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    refreshGrid();
  });

  document.getElementById('btn-add-contact')?.addEventListener('click', () => openContactFormModal());

  attachContactGridEvents();
}

/* =====================================================================
   13. AVISOS Y RECORDATORIOS (NOTIFICACIONES CON TIMBRE EN EL TELÉFONO)
   ===================================================================== */

/** Antelaciones disponibles para cada aviso (en minutos) */
const REMINDER_OPTIONS = [
  { value: 0,    label: 'En el momento exacto' },
  { value: 5,    label: '5 minutos antes' },
  { value: 10,   label: '10 minutos antes' },
  { value: 15,   label: '15 minutos antes' },
  { value: 30,   label: '30 minutos antes' },
  { value: 60,   label: '1 hora antes' },
  { value: 120,  label: '2 horas antes' },
  { value: 1440, label: 'Un día antes' }
];

/** Timbres predefinidos (generados con Web Audio API) */
const REMINDER_SOUNDS = {
  timbre:   { label: '🔔 Timbre clásico' },
  campana:  { label: '🎐 Campana suave' },
  marimba:  { label: '🎵 Marimba alegre' },
  beep:     { label: '📢 Beep doble' },
  silencio: { label: '🔇 Silencio' }
};

/** Sonidos subidos por el usuario: { id: { nombre, dataUrl } } */
const CUSTOM_SOUNDS_KEY = 'ayb_custom_sounds';
const NOTIFIED_KEY = 'ayb_reminder_notified';

let customSounds = {};

function loadCustomSounds() {
  try { customSounds = JSON.parse(localStorage.getItem(CUSTOM_SOUNDS_KEY)) || {}; }
  catch { customSounds = {}; }
}

function saveCustomSounds() {
  try {
    localStorage.setItem(CUSTOM_SOUNDS_KEY, JSON.stringify(customSounds));
    return true;
  } catch (e) {
    console.error('Error al guardar el sonido personalizado:', e);
    return false;
  }
}

/** Registro de avisos ya enviados (para no repetirlos) */
function loadNotified() {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || {}; }
  catch { return {}; }
}

function saveNotified(map) {
  // Limpiar registros de hace más de 15 días
  const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;
  Object.keys(map).forEach(k => { if (map[k] < cutoff) delete map[k]; });
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map)); }
  catch (e) { console.error('Error al guardar avisos enviados:', e); }
}

function getReminderOffsetLabel(min) {
  const opt = REMINDER_OPTIONS.find(o => o.value === min);
  return opt ? opt.label : `${min} minutos antes`;
}

/** Sonidos disponibles: predefinidos + los subidos por el usuario */
function getAvailableSounds() {
  const list = { ...REMINDER_SOUNDS };
  Object.keys(customSounds).forEach(id => {
    list[`custom:${id}`] = { label: `🎧 ${customSounds[id].nombre || 'Sonido propio'}` };
  });
  return list;
}

/** Etiquetas <option> de selección de timbre (predefinidos + subidos) */
function soundOptionsHTML(selectedKey) {
  return Object.keys(getAvailableSounds()).map(k => {
    const selected = selectedKey === k;
    return `<option value="${escapeHtml(k)}" ${selected ? 'selected' : ''}>${escapeHtml(getAvailableSounds()[k].label)}</option>`;
  }).join('');
}

/** ¿El navegador admite notificaciones del sistema? */
function isNotificationSupported() {
  return 'Notification' in window;
}

/** Solicita permiso de notificación (ideal llamarlo desde un clic) */
function ensureNotificationPermission() {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied' && typeof Notification.requestPermission === 'function') {
    Notification.requestPermission().catch(() => {});
  }
  return Notification.permission === 'granted';
}

/** -- Reproducción de sonidos (Web Audio API + audio subido) -- */
let _reminderAudioCtx = null;

function getAudioCtx() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  _reminderAudioCtx = _reminderAudioCtx || new AudioCtx();
  if (_reminderAudioCtx.state === 'suspended') _reminderAudioCtx.resume();
  return _reminderAudioCtx;
}

function tone(ctx, freq, start, dur, vol = 0.8) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Resuelve el sonido personalizado de una clave tipo "custom:id" */
function resolveCustomSound(key) {
  if (typeof key === 'string' && key.startsWith('custom:')) {
    return customSounds[key.slice(7)] || null;
  }
  return null;
}

/** Reproduce cualquier sonido: predefinido, "silencio" o subido por el usuario */
function playSoundByKey(key, customDataUrl) {
  try {
    if (!key || key === 'silencio') return;

    // Sonido propio subido por el usuario
    if (typeof key === 'string' && key.startsWith('custom:')) {
      const dataUrl = customDataUrl || resolveCustomSound(key)?.dataUrl;
      if (dataUrl) {
        const audio = new Audio(dataUrl);
        audio.play().catch(() => {});
      }
      return;
    }

    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (key) {
      case 'campana':
        tone(ctx, 1046.5, now, 1.1);            // C6
        tone(ctx, 783.99, now + 0.28, 1.1);     // G5
        tone(ctx, 659.25, now + 0.56, 1.2);     // E5
        break;
      case 'marimba':
        tone(ctx, 783.99, now, 0.22, 0.6);      // G5
        tone(ctx, 1046.5, now + 0.14, 0.22, 0.6); // C6
        tone(ctx, 1318.51, now + 0.28, 0.3, 0.5); // E6
        break;
      case 'beep':
        tone(ctx, 880, now, 0.18, 0.5);
        tone(ctx, 880, now + 0.28, 0.18, 0.5);
        break;
      case 'timbre':
      default:
        tone(ctx, 659.25, now, 0.9);            // E5
        tone(ctx, 523.25, now + 0.35, 0.9);     // C5
        break;
    }
  } catch (e) {
    console.warn('No se pudo reproducir el sonido:', e);
  }
}

/** Desbloquea el audio del móvil con el primer toque/tecla del usuario.
 *  Sin esto, el AudioContext queda 'suspended' en iOS/Android y la alarma
 *  no emite sonido aunque el temporizador funcione. */
function unlockAudioOnGesture() {
  const warm = () => { getAudioCtx(); };
  document.addEventListener('pointerdown', warm);
  document.addEventListener('keydown', warm);
  document.addEventListener('touchstart', warm);
}

/** Alarma visible dentro de la app (funciona aunque las notificaciones
 *  del sistema estén bloqueadas). Se reemplaza si hay varias a la vez. */
function openAlarmOverlay(title, body) {
  const existing = document.getElementById('alarm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'alarm-overlay';
  overlay.className = 'alarm-overlay';
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'alarm-title');
  overlay.innerHTML = `
    <div class="alarm-card">
      <div class="alarm-icon" aria-hidden="true">🔔</div>
      <h2 id="alarm-title">${escapeHtml(title)}</h2>
      <div class="alarm-body">${escapeHtml(body)}</div>
      <button type="button" class="btn btn-primary" id="alarm-ok">✓ Entendido</button>
    </div>`;
  document.body.appendChild(overlay);

  const ok = overlay.querySelector('#alarm-ok');
  ok.focus();
  ok.addEventListener('click', () => overlay.remove());

  showToast(`🔔 ${body}`, 'info');
}

/** Lanza el aviso: alarma visible + notificación del sistema + timbre */
function fireReminder(item) {
  const isAppt = item.kind === 'appointment';
  const title = isAppt ? '🔔 Cita próxima' : '🔔 Tarea próxima';
  const dayLabel = item.fecha ? formatDateShort(item.fecha) : '';
  const body = isAppt
    ? `Cita: ${item.pacienteNombre} · ${item.professionalName} · ${dayLabel} a las ${item.hora}`
    : `${item.title} · ${dayLabel}${item.time ? ' a las ' + item.time : ''}`;

  // Vibración en móviles (se usa junto con el sonido)
  if (navigator.vibrate) navigator.vibrate([300, 120, 300]);

  openAlarmOverlay(title, body);

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: 'img/logo/LOGO ACTITUD Y BIENESTAR SIN FONDO.png',
        tag: item.key,
        vibrate: [120, 80, 120]
      });
      notification.onclick = () => {
        window.focus();
        window.location.hash = isAppt ? '#/agendar' : '#/tareas';
        notification.close();
      };
    } catch (e) {
      console.warn('No se pudo mostrar la notificación:', e);
    }
  }

  // Sonido elegido para ESTA cita o tarea concreta
  const custom = resolveCustomSound(item.reminderSound);
  playSoundByKey(item.reminderSound || 'timbre', custom && custom.dataUrl);
}

/** Convierte fecha+hora (o por defecto 09:00) en un Date */
function eventDateTime(item) {
  if (!item.fecha) return null;
  const time = item.hora ? item.hora : '09:00';
  const d = new Date(item.fecha + 'T' + time + ':00');
  return isNaN(d.getTime()) ? null : d;
}

/** Revisa cada cita y tarea con SU PROPIO aviso (offset y timbre individuales) */
function checkReminders() {
  loadAppointments();
  loadTasks();
  loadCustomSounds();

  const now = Date.now();
  const notified = loadNotified();
  let changed = false;

  const items = [];

  // Citas: solo las que tienen un AVIOS PROPIO configurado
  state.appointments
    .filter(a => a.estado !== 'cancelada' && a.reminderOffset !== null && a.reminderOffset !== undefined)
    .forEach(a => items.push({
      key: `app:${a.id}`,
      kind: 'appointment',
      fecha: a.fecha,
      hora: a.hora,
      pacienteNombre: a.pacienteNombre,
      professionalName: a.professionalName,
      reminderOffset: a.reminderOffset,
      reminderSound: a.reminderSound
    }));

  // Tareas: pendientes, con fecha y hora, y con aviso propio
  state.tasks
    .filter(t => !t.done && t.date && t.time && t.reminderOffset !== null && t.reminderOffset !== undefined)
    .forEach(t => items.push({
      key: `task:${t.id}`,
      kind: 'task',
      fecha: t.date,
      hora: t.time,
      title: t.title,
      reminderOffset: t.reminderOffset,
      reminderSound: t.reminderSound
    }));

  const due = items.filter(item => {
    const evt = eventDateTime(item);
    if (!evt) return false;
    const offsetMs = item.reminderOffset * 60 * 1000;
    const windowStart = evt.getTime() - offsetMs;
    if (now < windowStart || now > evt.getTime()) return false;
    return !notified[item.key];
  });

  due.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

  due.forEach(item => {
    notified[item.key] = Date.now();
    changed = true;
    fireReminder(item);
  });

  if (changed) saveNotified(notified);
}

let reminderInterval = null;

/** Inicia la vigilancia periódica de avisos (cada 30 segundos).
 *  Se protege con try/catch para que la alarma siga activa aunque la
 *  revisión de una cita/tarea en particular falle. */
function initReminderWatcher() {
  loadCustomSounds();

  const safeCheck = () => {
    try { checkReminders(); } catch (e) { console.error('Error revisando avisos:', e); }
  };

  safeCheck();
  if (reminderInterval) clearInterval(reminderInterval);
  reminderInterval = setInterval(safeCheck, 30000);

  // Revisar al volver a la pestaña (los temporizadores se pausan en segundo plano)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) safeCheck();
  });
}

/** HTML de los campos de "aviso propio" (reutilizado en citas y tareas) */
function reminderFieldsHTML(values = {}, prefix = 'rem') {
  const hasOffset = values.reminderOffset !== null && values.reminderOffset !== undefined;
  const currentOffset = hasOffset ? values.reminderOffset : null;
  const currentSound = values.reminderSound || 'timbre';

  const offsetOptions = [
    `<option value="none" ${!hasOffset ? 'selected' : ''}>No avisar</option>`
  ].concat(REMINDER_OPTIONS.map(o =>
    `<option value="${o.value}" ${currentOffset === o.value ? 'selected' : ''}>${o.label}</option>`
  )).join('');

  return `
    <fieldset class="reminder-fieldset">
      <legend class="reminder-legend">🔔 Aviso para esta ${values.kindLabel || 'cita/tarea'}</legend>

      <div class="form-row-inline">
        <div>
          <label for="${prefix}-offset">Avisar</label>
          <select id="${prefix}-offset">
            ${offsetOptions}
          </select>
        </div>
        <div>
          <label for="${prefix}-sound">Timbre / sonido</label>
          <select id="${prefix}-sound">
            ${soundOptionsHTML(currentSound)}
          </select>
        </div>
      </div>

      <div class="reminder-actions">
        <button type="button" class="btn btn-outline btn-sm" id="${prefix}-test">▶ Probar sonido</button>
        <label class="btn btn-outline btn-sm" for="${prefix}-upload" style="margin:0;display:inline-flex;align-items:center;gap:6px">
          🎧 Subir mi propio sonido
        </label>
        <input type="file" id="${prefix}-upload" accept="audio/*" style="display:none" aria-label="Subir un archivo de audio propio">
      </div>
      <div class="hint" id="${prefix}-sound-hint">Elige si quieres que suene un timbre antes de esta cita/tarea. Puedes subir tu propio audio (máx. 800 KB).</div>
    </fieldset>
  `;
}

/** Lee la selección actual de aviso de los campos generados */
function readReminderSelection(prefix) {
  const offsetEl = document.getElementById(`${prefix}-offset`);
  const soundEl = document.getElementById(`${prefix}-sound`);
  const rawOffset = offsetEl ? offsetEl.value : 'none';
  const offset = rawOffset === 'none' || rawOffset === '' ? null : parseInt(rawOffset, 10);
  return {
    reminderOffset: offset,
    reminderSound: (soundEl ? soundEl.value : 'timbre') || 'timbre'
  };
}

/** Pre-rellena los campos de aviso tras guardar/probar (por si se recarga) */
function updateReminderFieldsFrom(prefix, values) {
  const offsetEl = document.getElementById(`${prefix}-offset`);
  const soundEl = document.getElementById(`${prefix}-sound`);
  if (!offsetEl || !soundEl) return;
  const hasOffset = values.reminderOffset !== null && values.reminderOffset !== undefined;
  offsetEl.value = hasOffset ? String(values.reminderOffset) : 'none';
  soundEl.innerHTML = soundOptionsHTML(values.reminderSound || 'timbre');
  soundEl.value = values.reminderSound || 'timbre';
}

/** Conecta "Probar sonido" + "Subir audio" de un bloque de avisos */
function bindReminderControls(prefix) {
  const testBtn = document.getElementById(`${prefix}-test`);
  const uploadInput = document.getElementById(`${prefix}-upload`);
  const soundSel = document.getElementById(`${prefix}-sound`);

  if (testBtn) {
    testBtn.addEventListener('click', () => {
      ensureNotificationPermission();
      const key = soundSel ? soundSel.value : 'timbre';
      const custom = resolveCustomSound(key);
      playSoundByKey(key, custom && custom.dataUrl);
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', () => {
      const file = uploadInput.files && uploadInput.files[0];
      if (!file) return;
      if (!/^audio\//.test(file.type)) {
        showToast('Por favor sube un archivo de audio válido.', 'error');
        uploadInput.value = '';
        return;
      }
      if (file.size > 800 * 1024) {
        showToast('El audio supera los 800 KB. Sube uno más corto.', 'error');
        uploadInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const id = generateId();
        customSounds[id] = { nombre: file.name, dataUrl: reader.result };
        if (!saveCustomSounds()) return;
        if (soundSel) {
          soundSel.innerHTML = soundOptionsHTML('custom:' + id);
          soundSel.value = 'custom:' + id;
        }
        showToast('✓ Sonido subido y seleccionado como tu timbre.', 'success');
      };
      reader.readAsDataURL(file);
    });
  }
}

/* =====================================================================
   14. EVENTOS GLOBALES DE NAVEGACIÓN Y CIERRE DE SESIÓN
   ===================================================================== */
function initGlobalEvents() {
  // ── Botón de Salir / Cerrar sesión ──
  const btnLogoutNav = document.getElementById('btn-logout');
  if (btnLogoutNav) btnLogoutNav.addEventListener('click', handleLogout);

  // ── Sidebar Hamburguesa ──
  const menuToggle = document.getElementById('menu-toggle');
  const nav        = document.getElementById('nav');
  const overlay    = document.getElementById('nav-overlay');

  function openSidebar() {
    if (!nav || !menuToggle || !overlay) return;
    nav.classList.add('open');
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    // Mover el foco al primer enlace navegable (accesibilidad por teclado)
    requestAnimationFrame(() => {
      const firstLink = nav.querySelector('.nav-link:not([style*="none"])');
      if (firstLink) firstLink.focus();
    });
  }

  function closeSidebar({ restoreFocus = false } = {}) {
    if (!nav || !menuToggle || !overlay) return;
    const wasOpen = nav.classList.contains('open');
    nav.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    // Devolver el foco al botón hamburguesa tras cerrar con teclado
    if (wasOpen && restoreFocus) menuToggle.focus();
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      nav.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }

  // Cerrar al hacer clic en el overlay
  if (overlay) overlay.addEventListener('click', () => closeSidebar({ restoreFocus: true }));

  // Cerrar con tecla Escape y devolver el foco al botón
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav && nav.classList.contains('open')) closeSidebar({ restoreFocus: true });
  });

  // Si la ventana crece a escritorio (>1024px) con el menú abierto, limpiar estado
  const desktopMQ = window.matchMedia('(min-width: 1025px)');
  const handleDesktopChange = (mq) => { if (mq.matches) closeSidebar(); };
  if (typeof desktopMQ.addEventListener === 'function') desktopMQ.addEventListener('change', handleDesktopChange);
  else if (typeof desktopMQ.addListener === 'function') desktopMQ.addListener(handleDesktopChange);

  // Exponer closeSidebar globalmente para usarla al navegar
  window._closeSidebar = closeSidebar;
}

/* Delegación de enlaces SPA + cierre automático del sidebar */
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-nav]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href && href.startsWith('#')) {
    e.preventDefault();
    // Cerrar sidebar si está abierto
    if (typeof window._closeSidebar === 'function') window._closeSidebar();
    window.location.hash = href;
  }
});

/* =====================================================================
   15. INICIALIZACIÓN GLOBAL
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadAuthState();
  loadAppointments();
  loadTasks();
  loadContacts();
  loadCustomSounds();
  // Desbloquear el audio en el primer toque/tecla (clave para iOS/Android)
  unlockAudioOnGesture();
  // Iniciar la alarma ANTES que cualquier render, para que no quede sin
  // arrancar si ocurre un error al dibujar la ruta actual.
  try { initReminderWatcher(); } catch (e) { console.error('Error iniciando avisos:', e); }
  initGlobalEvents();
  try { router(); } catch (e) { console.error('Error al renderizar la ruta:', e); }
});