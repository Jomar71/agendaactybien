/* =====================================================================
   ACTITUD & BIENESTAR – GESTIÓN TERAPÉUTICA INFANTIL Y JUVENIL
   app.js – Lógica principal de la SPA con Autenticación, Mi Directorio,
            Formas de Pago, Mis Tareas, Mi Agenda y Mi Historial
   Versión: 3.1.0
   ===================================================================== */

/* =====================================================================
   1. CREDENCIALES Y DATOS ESTÁTICOS
   ===================================================================== */

/** Credenciales predefinidas de acceso para demostración */
const DEMO_CREDENTIALS = {
  email: 'admin@terapia.com',
  password: '123456',
  name: 'Equipo Terapéutico',
  role: 'Administrador Clínico'
};

/** Profesionales disponibles para citas */
const PROFESSIONALS = [
  {
    id: 1,
    nombre: 'Lic. Ana Pérez',
    especialidad: 'Psicología Infantil y Terapia de Juego',
    descripcion: 'Especialista en desarrollo emocional infantil, expresión a través del juego, manejo de miedos y adaptación escolar. 8 años de experiencia.',
    emoji: '🧸'
  },
  {
    id: 2,
    nombre: 'Dr. Carlos Gómez',
    especialidad: 'Psicología Adolescente y TCC',
    descripcion: 'Experto en trastornos de ansiedad, estado de ánimo, autoestima, habilidades sociales y transición a la juventud. Enfoque cognitivo-conductual.',
    emoji: '🧠'
  },
  {
    id: 3,
    nombre: 'Lic. Marta Ríos',
    especialidad: 'Terapia Familiar y Orientación a Padres',
    descripcion: 'Psicóloga clínica enfocada en dinámicas familiares, pautas de crianza respetuosa, resolución de conflictos y comunicación asertiva.',
    emoji: '🌱'
  },
  {
    id: 4,
    nombre: 'Dr. Andrés Vargas',
    especialidad: 'Neuropsicología Infantil y TDAH',
    descripcion: 'Evaluación diagnóstica y estimulación neuropsicológica: TDAH, dificultades del aprendizaje, memoria de trabajo y funciones ejecutivas.',
    emoji: '⚡'
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

/** Horarios disponibles */
const TIME_SLOTS = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 17) TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
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
  motivoDetalle: ''
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
    const local = localStorage.getItem('ayb_session');
    const session = sessionStorage.getItem('ayb_session');
    const raw = local || session;
    if (raw) {
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
    localStorage.setItem('ayb_session', data);
    sessionStorage.removeItem('ayb_session');
  } else {
    sessionStorage.setItem('ayb_session', data);
    localStorage.removeItem('ayb_session');
  }
}

function clearAuthState() {
  localStorage.removeItem('ayb_session');
  sessionStorage.removeItem('ayb_session');
  state.auth.isAuthenticated = false;
  state.auth.user = null;
}

function loadAppointments() {
  try {
    const saved = localStorage.getItem('ayb_appointments');
    state.appointments = saved ? JSON.parse(saved) : [];
  } catch {
    state.appointments = [];
  }
}

function saveAppointments() {
  try {
    localStorage.setItem('ayb_appointments', JSON.stringify(state.appointments));
  } catch (e) {
    console.error('Error al guardar citas:', e);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem('ayb_tasks');
    state.tasks = saved ? JSON.parse(saved) : [];
  } catch {
    state.tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem('ayb_tasks', JSON.stringify(state.tasks));
  } catch (e) {
    console.error('Error al guardar tareas:', e);
  }
}

function loadContacts() {
  try {
    const saved = localStorage.getItem('ayb_contacts');
    if (saved) {
      state.contacts = JSON.parse(saved);
    } else {
      state.contacts = [...DEFAULT_CONTACTS];
      saveContacts();
    }
  } catch {
    state.contacts = [...DEFAULT_CONTACTS];
  }
}

function saveContacts() {
  try {
    localStorage.setItem('ayb_contacts', JSON.stringify(state.contacts));
  } catch (e) {
    console.error('Error al guardar contactos:', e);
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
    const href = a.getAttribute('href') || '#/';
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
  else if (hash === '#/pagos')                                   renderPayments(content);
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

        <div class="auth-demo-badge" role="note" aria-label="Credenciales de demostración">
          <div>🔑 <strong>Credenciales de prueba:</strong></div>
          <div>Usuario: <code>${DEMO_CREDENTIALS.email}</code></div>
          <div>Contraseña: <code>${DEMO_CREDENTIALS.password}</code></div>
        </div>

        <div id="auth-error" class="auth-error-banner hidden" role="alert" aria-live="polite"></div>

        <form id="login-form" class="auth-form" novalidate aria-label="Formulario de inicio de sesión">
          <div class="form-group" style="margin-bottom:0">
            <label for="login-email">Usuario o Correo Electrónico <span aria-hidden="true" style="color:var(--danger)">*</span></label>
            <input type="email" id="login-email" name="email"
                   placeholder="ejemplo@terapia.com"
                   value="${DEMO_CREDENTIALS.email}"
                   aria-required="true"
                   autocomplete="username" required>
          </div>

          <div class="form-group" style="margin-bottom:0">
            <label for="login-password">Contraseña <span aria-hidden="true" style="color:var(--danger)">*</span></label>
            <input type="password" id="login-password" name="password"
                   placeholder="••••••••"
                   value="${DEMO_CREDENTIALS.password}"
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
      showToast(`✓ Instrucciones enviadas a ${email} (Simulado: Tu clave es 123456)`, 'success');
    });
  });

  // Procesamiento del inicio de sesión
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = el.querySelector('#login-email').value.trim();
    const password = el.querySelector('#login-password').value;
    const remember = el.querySelector('#login-remember').checked;

    if (!email || !password) {
      errorBanner.textContent = 'Por favor completa todos los campos.';
      errorBanner.classList.remove('hidden');
      return;
    }

    // Validación de credenciales
    if (email.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase() && password === DEMO_CREDENTIALS.password) {
      errorBanner.classList.add('hidden');
      state.auth.isAuthenticated = true;
      state.auth.user = {
        email: DEMO_CREDENTIALS.email,
        name: DEMO_CREDENTIALS.name,
        role: DEMO_CREDENTIALS.role
      };
      saveAuthState(remember);
      showToast(`¡Bienvenido de nuevo, ${state.auth.user.name}! 💚`, 'success');
      window.location.hash = '#/';
      router();
    } else {
      errorBanner.textContent = '⚠️ Usuario o contraseña incorrectos. Usa las credenciales de prueba.';
      errorBanner.classList.remove('hidden');
      el.querySelector('#login-password').focus();
    }
  });
}

function handleLogout() {
  if (confirm('¿Deseas cerrar tu sesión actual?')) {
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

      <div class="metric-card">
        <div class="metric-icon metric-icon--orange" aria-hidden="true">💳</div>
        <div>
          <div class="metric-number">2</div>
          <div class="metric-label">Cuentas para Pagos</div>
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
      <a href="#/pagos" class="btn btn-secondary" data-nav>💳 Formas de Pago</a>
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
    motivoDetalle: ''
  });

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Mi Agenda – Citas Psicológicas</h1>
      <p>Selecciona profesional, fecha y los datos del tutor y paciente (se guardan automáticamente en Mi Directorio)</p>
    </div>
    <div class="container">
      <div class="appointment-form" id="appointment-form" role="region" aria-label="Formulario de agendamiento">
        <!-- Stepper -->
        <nav aria-label="Progreso de Mi Agenda" role="navigation">
          <div class="steps" id="steps" role="list">
            ${[
              ['1', 'Profesional'],
              ['2', 'Fecha & Hora'],
              ['3', 'Datos'],
              ['4', 'Motivo'],
              ['5', 'Confirmación']
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

  renderAppointmentStep1();
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

      <div class="form-group" style="margin-bottom:20px">
        <label for="f-prof-select">Desplegable de profesionales <span style="color:var(--danger)">*</span></label>
        <select id="f-prof-select" aria-label="Selecciona un profesional de la lista">
          <option value="">— Selecciona un profesional —</option>
          ${PROFESSIONALS.map(p => `
            <option value="${p.id}" ${appointmentForm.professionalId === p.id ? 'selected' : ''}>
              ${escapeHtml(p.nombre)} – ${escapeHtml(p.especialidad)}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="service-grid" role="listbox" aria-label="Tarjetas de profesionales disponibles" id="professional-list">
        ${PROFESSIONALS.map(p => `
          <div class="card card-select card-service ${appointmentForm.professionalId === p.id ? 'selected' : ''}"
               data-prof-id="${p.id}" role="option"
               aria-selected="${appointmentForm.professionalId === p.id}"
               tabindex="0"
               aria-label="${escapeHtml(p.nombre)} – ${escapeHtml(p.especialidad)}">
            <div class="card-service-header">
              <div>
                <span style="font-size:1.5rem" aria-hidden="true">${p.emoji}</span>
                <h3 style="margin-top:6px;font-size:1.05rem">${escapeHtml(p.nombre)}</h3>
              </div>
            </div>
            <p style="font-size:0.83rem;color:var(--teal);font-weight:700;margin-bottom:6px">${escapeHtml(p.especialidad)}</p>
            <p style="font-size:0.84rem;color:var(--gray)">${escapeHtml(p.descripcion)}</p>
          </div>
        `).join('')}
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

  const selectProf = (id) => {
    appointmentForm.professionalId = parseInt(id);
    profSelect.value = id;
    el.querySelectorAll('[data-prof-id]').forEach(c => {
      const match = parseInt(c.dataset.profId) === appointmentForm.professionalId;
      c.classList.toggle('selected', match);
      c.setAttribute('aria-selected', String(match));
    });
    nextBtn.disabled = false;
  };

  profSelect.addEventListener('change', (e) => {
    if (e.target.value) selectProf(e.target.value);
    else {
      appointmentForm.professionalId = null;
      el.querySelectorAll('[data-prof-id]').forEach(c => c.classList.remove('selected'));
      nextBtn.disabled = true;
    }
  });

  el.querySelectorAll('[data-prof-id]').forEach(card => {
    const act = () => selectProf(card.dataset.profId);
    card.addEventListener('click', act);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
    });
  });

  nextBtn.addEventListener('click', () => {
    if (appointmentForm.professionalId) renderAppointmentStep2();
  });
}

function renderAppointmentStep2() {
  const el = document.getElementById('form-step-content');
  if (!el) return;
  updateSteps(2);
  const days = getNextWorkDays(45);
  const prof = getProfessional(appointmentForm.professionalId);

  const renderTimeSlots = (dateStr) => {
    const booked = getBookedSlots(dateStr);
    const timePanel = document.getElementById('time-panel');
    if (!timePanel) return;
    if (!dateStr) {
      timePanel.innerHTML = `<p class="time-placeholder">👆 Selecciona una fecha para ver los horarios disponibles</p>`;
      return;
    }
    timePanel.innerHTML = `
      <div class="time-grid" id="time-grid" role="listbox" aria-label="Horarios disponibles">
        ${TIME_SLOTS.map(t => {
          const isBooked = booked.includes(t);
          const selected = appointmentForm.time === t;
          return `
            <button class="time-btn ${selected ? 'selected' : ''}" data-time="${t}"
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
  };

  el.innerHTML = `
    <div class="form-card">
      <h2>2. Elige Fecha y Hora</h2>
      <p class="form-subtitle">Profesional: <strong style="color:var(--teal)">${escapeHtml(prof.nombre)}</strong></p>

      <div class="datetime-layout">
        <!-- Panel izquierdo: Fechas -->
        <div class="datetime-col">
          <h3 class="datetime-col-title">📅 Fecha</h3>
          <div class="date-grid" id="date-grid" role="listbox" aria-label="Fechas hábiles disponibles">
            ${days.map(d => {
              const dStr = d.toISOString().split('T')[0];
              const selected = appointmentForm.date === dStr;
              return `
                <button class="date-btn ${selected ? 'selected' : ''}" data-date="${dStr}"
                        role="option" aria-selected="${selected}"
                        aria-label="${formatDate(d)}">
                  ${formatDateShort(d)}
                </button>`;
            }).join('')}
          </div>
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

  // Si ya hay fecha seleccionada, renderizar horas inmediatamente
  if (appointmentForm.date) renderTimeSlots(appointmentForm.date);

  el.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.date-btn').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-selected', 'true');
      appointmentForm.date = btn.dataset.date;
      appointmentForm.time = null; // resetear hora al cambiar fecha
      document.getElementById('btn-step-next').disabled = true;
      renderTimeSlots(appointmentForm.date);
    });
  });

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep1);
  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (appointmentForm.date && appointmentForm.time) renderAppointmentStep3();
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
                 min="2" max="20" aria-required="true">
          <div class="hint">Entre 2 y 20 años</div>
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
    if (!f.pacienteEdad || parseInt(f.pacienteEdad) < 2 || parseInt(f.pacienteEdad) > 20) {
      showError(inputs.pacienteEdad, 'err-paciente-edad', 'Ingresa una edad entre 2 y 20 años.');
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

      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-submit">✓ Confirmar en Mi Agenda</button>
      </div>
    </div>
  `;

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
    submitAppointment();
  });
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
    estado: 'confirmada',
    createdAt: new Date().toISOString()
  };

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

  // 3. Crear recordatorio en Mis Tareas
  const autoTask = {
    id: generateId(),
    date: appointment.fecha,
    time: appointment.hora,
    title: `Cita con ${appointment.professionalName}`,
    priority: 'alta',
    category: 'cita',
    description: `Paciente: ${appointment.pacienteNombre}. Tutor: ${appointment.tutorNombre}.`,
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
        <p class="whatsapp-confirm-title">💬 Confirma la cita con el tutor por WhatsApp</p>
        <p class="whatsapp-confirm-hint">Se abrirá WhatsApp con un mensaje predefinido para ${escapeHtml(appointment.tutorNombre)} (Tel: ${escapeHtml(appointment.telefono)}). Solo debes presionar "Enviar".</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button type="button" id="btn-send-whatsapp" class="btn btn-whatsapp">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar por WhatsApp
          </button>
          <button type="button" id="btn-copy-whatsapp-msg" class="btn btn-outline">📋 Copiar mensaje</button>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="#/directorio" class="btn btn-primary" data-nav>Ver en Mi Directorio 👥</a>
        <a href="#/historial" class="btn btn-outline" data-nav>Ver Mi Historial 📜</a>
        <a href="#/pagos" class="btn btn-secondary" data-nav>Formas de Pago 💳</a>
      </div>
    </div>
  `;

  // Botón manual de WhatsApp (útil si el navegador bloqueó la apertura automática)
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

  // Apertura automática de WhatsApp al confirmar la cita
  openWhatsAppConfirmation(appointment);
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
    '📅 *Confirmación de Cita - Centro Terapéutico*',
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
    '¡Te esperamos! 💙'
  ].join('\n');
}

/** Abre WhatsApp del tutor con el mensaje predefinido; retorna true si se abrió */
function openWhatsAppConfirmation(appointment) {
  const phone = normalizeWhatsAppPhone(appointment.telefono);
  const text = encodeURIComponent(buildWhatsAppMessage(appointment));
  const url = phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;

  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Popup bloqueado: ofrecer apertura manual
    showToast('No se pudo abrir WhatsApp automáticamente. Usa el botón "Enviar por WhatsApp".', 'error');
    return false;
  }
  showToast('✓ WhatsApp abierto con el mensaje de confirmación listo para enviar.', 'success');
  return true;
}

/* =====================================================================
   10. VISTA 3: MIS TAREAS (CALENDARIO Y GESTIÓN CON AGREGAR Y ELIMINAR)
   ===================================================================== */
function renderTasks(el) {
  loadTasks();

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Mis Tareas y Calendario</h1>
      <p>Organiza compromisos, ejercicios terapéuticos y recordatorios</p>
    </div>
    <div class="container">
      <hr class="section-divider" aria-hidden="true">
      <div class="tasks-layout" id="tasks-layout">
        <!-- Calendario Mensual -->
        <section aria-labelledby="calendar-title">
          <div class="calendar-widget" id="calendar-widget"></div>
        </section>

        <!-- Panel de Tareas -->
        <section aria-labelledby="tasks-title">
          <div class="tasks-panel" id="tasks-panel"></div>
        </section>
      </div>
    </div>
  `;

  buildCalendar();
  buildTasksPanel();
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
    buildTasksPanel();
  });

  widget.querySelectorAll('.cal-day[data-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      calendarState.selectedDate = btn.dataset.date;
      buildCalendar();
      buildTasksPanel();
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
      done: false,
      createdAt: new Date().toISOString()
    };

    state.tasks.push(newTask);
    saveTasks();
    showToast('✓ Tarea agregada con éxito a Mis Tareas.', 'success');

    calendarState.selectedDate = newTask.date;
    buildCalendar();
    buildTasksPanel();
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
        buildCalendar();
        buildTasksPanel();
        showToast(task.done ? '✓ Tarea completada.' : 'Tarea reactivada.', task.done ? 'success' : 'info');
      }
    });
  });

  panel.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('¿Eliminar esta tarea de Mis Tareas?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveTasks();
        buildCalendar();
        buildTasksPanel();
        showToast('Tarea eliminada de Mis Tareas.', 'info');
      }
    });
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
                       <div style="margin-top:10px;display:flex;gap:8px">
                         <button class="btn btn-sm btn-outline" data-action="view-app" data-id="${escapeHtml(a.id)}">Ver Detalle Completo</button>
                         <button class="btn btn-sm btn-secondary" data-action="toggle-status" data-id="${escapeHtml(a.id)}">
                           ${a.estado === 'atendida' ? 'Marcar Confirmada' : 'Marcar Atendida ✓'}
                         </button>
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
  };

  const refresh = () => {
    const dyn = document.getElementById('history-dynamic-content');
    if (dyn) {
      dyn.innerHTML = renderHistoryContent();
      attachFilterEvents();
    }
  };

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
   13. VISTA 6: FORMAS DE PAGO (BANCOLOMBIA & NEQUI)
   ===================================================================== */
function renderPayments(el) {
  const bancolombiaCuenta = '123-456789-01';
  const nequiNumero = '3001234567';
  const titular = 'Centro Terapéutico Actitud & Bienestar';

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Formas de Pago Autorizadas</h1>
      <p>Cuentas oficiales para abonos de consultas psicológicas y talleres</p>
    </div>
    <div class="container">
      <hr class="section-divider" aria-hidden="true">

      <!-- Tarjetas de pago Bancolombia & Nequi -->
      <div class="payment-methods-grid">
        <!-- Tarjeta Bancolombia -->
        <article class="payment-card payment-card--bancolombia" aria-label="Datos de cuenta Bancolombia">
          <div>
            <div class="payment-badge-logo payment-badge-logo--bancolombia">
              <span>🏦</span> BANCOLOMBIA
            </div>
            <h3>Cuenta de Ahorros</h3>

            <div class="payment-field">
              <div class="payment-field-label">Titular de la cuenta</div>
              <div style="font-weight:700;color:var(--dark);font-size:1.05rem">${escapeHtml(titular)}</div>
            </div>

            <div class="payment-field">
              <div class="payment-field-label">Tipo de cuenta</div>
              <div style="font-weight:600;color:var(--dark)">Ahorros</div>
            </div>

            <div class="copy-box">
              <div>
                <div class="payment-field-label">Número de cuenta</div>
                <div class="payment-field-value" id="val-bancolombia">${bancolombiaCuenta}</div>
              </div>
              <button class="btn-copy" id="btn-copy-bancolombia" aria-label="Copiar número de cuenta Bancolombia">
                📋 Copiar
              </button>
            </div>
          </div>

          <p style="font-size:0.84rem;color:var(--gray);line-height:1.5">
            ✓ Transferencias gratuitas desde cualquier cuenta Bancolombia o corresponsal bancario.
          </p>
        </article>

        <!-- Tarjeta Nequi -->
        <article class="payment-card payment-card--nequi" aria-label="Datos de cuenta Nequi">
          <div>
            <div class="payment-badge-logo payment-badge-logo--nequi">
              <span>📱</span> NEQUI
            </div>
            <h3>Transferencia Móvil Nequi</h3>

            <div class="payment-field">
              <div class="payment-field-label">Titular asociado</div>
              <div style="font-weight:700;color:var(--dark);font-size:1.05rem">${escapeHtml(titular)}</div>
            </div>

            <div class="payment-field">
              <div class="payment-field-label">Plataforma</div>
              <div style="font-weight:600;color:var(--dark)">Nequi Colombia / Llaves PSE</div>
            </div>

            <div class="copy-box">
              <div>
                <div class="payment-field-label">Número celular Nequi</div>
                <div class="payment-field-value" id="val-nequi">${nequiNumero}</div>
              </div>
              <button class="btn-copy" id="btn-copy-nequi" aria-label="Copiar número de celular Nequi">
                📋 Copiar
              </button>
            </div>
          </div>

          <p style="font-size:0.84rem;color:var(--gray);line-height:1.5">
            ✓ Envío directo e instantáneo desde la App Nequi o recarga por PSE.
          </p>
        </article>
      </div>

      <!-- Instrucciones de confirmación del pago -->
      <div class="payment-steps-card">
        <h2 style="font-size:1.25rem;font-weight:800;color:var(--dark)">¿Cómo reportar tu pago?</h2>
        <div class="payment-steps-list">
          <div class="payment-step-item">
            <div class="payment-step-num">1</div>
            <div>
              <strong>Realiza la transferencia:</strong> Utiliza el número de cuenta de Bancolombia o el número de Nequi detallados arriba.
            </div>
          </div>
          <div class="payment-step-item">
            <div class="payment-step-num">2</div>
            <div>
              <strong>Guarda el comprobante:</strong> Toma una captura de pantalla o descarga el PDF con el número de aprobación de la transacción.
            </div>
          </div>
          <div class="payment-step-item">
            <div class="payment-step-num">3</div>
            <div>
              <strong>Envía el soporte vía WhatsApp:</strong> Comparte el comprobante al número de atención <strong>+57 301 234 5678</strong> indicando el nombre completo del paciente y la fecha de la cita.
            </div>
          </div>
          <div class="payment-step-item">
            <div class="payment-step-num">4</div>
            <div>
              <strong>Confirmación del espacio:</strong> Nuestro equipo validará el abono y te enviará el recordatorio formal para la sesión.
            </div>
          </div>
        </div>

        <div style="margin-top:24px;text-align:center">
          <a href="https://wa.me/573012345678?text=Hola,%20adjunto%20comprobante%20de%20pago%20para%20la%20cita%20psicol%C3%B3gica"
             target="_blank" rel="noopener noreferrer" class="btn btn-green" aria-label="Enviar comprobante por WhatsApp">
            💬 Enviar Comprobante por WhatsApp (+57 301 234 5678)
          </a>
        </div>
      </div>
    </div>
  `;

  // Eventos para copiar al portapapeles
  const btnBancolombia = document.getElementById('btn-copy-bancolombia');
  const btnNequi = document.getElementById('btn-copy-nequi');

  if (btnBancolombia) {
    btnBancolombia.addEventListener('click', () => {
      copyToClipboard(bancolombiaCuenta, 'Número de cuenta Bancolombia copiado: ' + bancolombiaCuenta);
      btnBancolombia.textContent = '✓ Copiado';
      btnBancolombia.classList.add('copied');
      setTimeout(() => {
        btnBancolombia.textContent = '📋 Copiar';
        btnBancolombia.classList.remove('copied');
      }, 2500);
    });
  }

  if (btnNequi) {
    btnNequi.addEventListener('click', () => {
      copyToClipboard(nequiNumero, 'Número de Nequi copiado: ' + nequiNumero);
      btnNequi.textContent = '✓ Copiado';
      btnNequi.classList.add('copied');
      setTimeout(() => {
        btnNequi.textContent = '📋 Copiar';
        btnNequi.classList.remove('copied');
      }, 2500);
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
  initGlobalEvents();
  router();
});
