/* =====================================================================
   ACTITUD & BIENESTAR – TERAPIA EMOCIONAL
   app.js – Lógica principal de la SPA (Single Page Application)
   Versión: 2.0.0
   ===================================================================== */

/* =====================================================================
   1. DATOS ESTÁTICOS
   ===================================================================== */

/** Profesionales disponibles para citas */
const PROFESSIONALS = [
  {
    id: 1,
    nombre: 'Dra. Valentina Ríos',
    especialidad: 'Psicología Infantil',
    descripcion: 'Especialista en desarrollo infantil temprano y trastornos del comportamiento. 8 años de experiencia.',
    emoji: '🧠'
  },
  {
    id: 2,
    nombre: 'Dr. Sebastián Mora',
    especialidad: 'Psicología Adolescente',
    descripcion: 'Experto en ansiedad, depresión y desarrollo adolescente. Enfoque cognitivo-conductual.',
    emoji: '💙'
  },
  {
    id: 3,
    nombre: 'Dra. Camila Torres',
    especialidad: 'Terapia Familiar',
    descripcion: 'Psicóloga familiar con énfasis en dinámicas familiares, crianza y comunicación asertiva.',
    emoji: '🌱'
  },
  {
    id: 4,
    nombre: 'Dr. Andrés Vargas',
    especialidad: 'Neuropsicología Infantil',
    descripcion: 'Especialista en evaluación y rehabilitación neuropsicológica. TDAH, dislexia y memoria.',
    emoji: '⚡'
  }
];

/** Motivos de consulta predefinidos */
const MOTIVOS = [
  'Ansiedad o miedos excesivos',
  'Problemas de conducta o comportamiento',
  'Bajo rendimiento escolar',
  'Tristeza o aislamiento social',
  'TDAH o dificultades de atención',
  'Problemas de sueño',
  'Dificultades en la comunicación',
  'Acoso escolar (bullying)',
  'Trauma o experiencia difícil',
  'Evaluación diagnóstica general',
  'Otro'
];

/** Franjas horarias disponibles */
const TIME_SLOTS = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 17) TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

/* =====================================================================
   2. ESTADO DE LA APLICACIÓN
   ===================================================================== */
let state = {
  currentView: 'home',
  appointments: [],
  tasks: []
};

/** Objeto del formulario de cita */
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
  motivo: ''
};

/* =====================================================================
   3. PERSISTENCIA (localStorage)
   ===================================================================== */
function loadAppointments() {
  try {
    state.appointments = JSON.parse(localStorage.getItem('ayb_appointments')) || [];
  } catch { state.appointments = []; }
}

function saveAppointments() {
  localStorage.setItem('ayb_appointments', JSON.stringify(state.appointments));
}

function loadTasks() {
  try {
    state.tasks = JSON.parse(localStorage.getItem('ayb_tasks')) || [];
  } catch { state.tasks = []; }
}

function saveTasks() {
  localStorage.setItem('ayb_tasks', JSON.stringify(state.tasks));
}

/* =====================================================================
   4. UTILIDADES GENERALES
   ===================================================================== */

/** Formatea una fecha como "lunes, 18 de agosto de 2026" */
function formatDate(d) {
  if (typeof d === 'string') d = new Date(d + 'T12:00:00');
  else if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Formatea fecha corta: "Lun 18/08" */
function formatDateShort(d) {
  if (typeof d === 'string') d = new Date(d + 'T12:00:00');
  else if (!(d instanceof Date)) d = new Date(d);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${days[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

/** Valida email */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida teléfono */
function isValidPhone(phone) {
  return /^\d{7,15}$/.test(phone.replace(/[\s\-()+]/g, ''));
}

/** Escapa HTML para prevenir XSS */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

/** Obtiene fecha de hoy sin hora */
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

/** Genera los próximos 45 días hábiles (excluye domingos) */
function getNextWorkDays(n = 45) {
  const days = [];
  const today = getToday();
  let i = 0;
  while (days.length < n) {
    const d = addDays(today, i++);
    if (d.getDay() !== 0) days.push(d); // 0 = domingo
  }
  return days;
}

/** Genera ID único */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/** Horarios ya tomados para una fecha dada */
function getBookedSlots(dateStr) {
  return state.appointments
    .filter(a => a.fecha === dateStr && a.estado !== 'cancelada')
    .map(a => a.hora);
}

/** Encuentra profesional por ID */
function getProfessional(id) {
  return PROFESSIONALS.find(p => p.id === id);
}

/* =====================================================================
   5. TOAST (NOTIFICACIONES)
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

/* =====================================================================
   6. NAVEGACIÓN / ROUTER
   ===================================================================== */
function setActiveNav(hash) {
  document.querySelectorAll('.nav-link, .footer-nav-link').forEach(a => {
    const href = a.getAttribute('href') || '#/';
    a.classList.toggle('active', href === hash);
  });
}

function router() {
  const hash = window.location.hash || '#/';
  state.currentView = hash;
  setActiveNav(hash);
  const content = document.getElementById('content');

  // Scroll al inicio al navegar
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if      (hash === '#/' || hash === '')    renderHome(content);
  else if (hash === '#/servicios')          renderServices(content);
  else if (hash === '#/agendar')            renderAppointment(content);
  else if (hash === '#/tareas')             renderTasks(content);
  else if (hash === '#/historial')          renderHistory(content);
  else if (hash === '#/contacto')           renderContact(content);
  else                                      renderHome(content);
}

window.addEventListener('hashchange', router);

/* =====================================================================
   7. VISTA: INICIO (HOME)
   ===================================================================== */
function renderHome(el) {
  el.innerHTML = `
    <!-- Hero -->
    <section class="hero" aria-labelledby="hero-title">
      <span class="hero-badge" aria-hidden="true">💚 Cuidando la salud emocional infantil</span>
      <h1 id="hero-title">Un espacio seguro para <span>crecer con bienestar</span></h1>
      <p>
        En Actitud &amp; Bienestar acompañamos a niños, niñas y adolescentes en su proceso de salud
        emocional. Profesionales especializados, un ambiente cálido y el apoyo que tu familia necesita.
      </p>
      <div class="hero-actions">
        <a href="#/agendar" class="btn btn-primary" data-nav aria-label="Agendar una cita psicológica">Agendar Cita</a>
        <a href="#/servicios" class="btn btn-outline" data-nav aria-label="Ver nuestros servicios">Conocer Servicios</a>
      </div>
    </section>

    <!-- Por qué elegirnos -->
    <section class="section section--white" aria-labelledby="features-title">
      <div class="container">
        <h2 class="section-title" id="features-title">¿Por qué elegirnos?</h2>
        <p class="section-subtitle">Un equipo comprometido con el bienestar de tu familia</p>
        <div class="features-grid">
          <div class="feature-card" aria-label="Profesionales especializados">
            <div class="card-icon" aria-hidden="true">🎓</div>
            <h3>Profesionales Certificados</h3>
            <p>Psicólogos con especialización en psicología infantil y adolescente, con amplia experiencia clínica.</p>
          </div>
          <div class="feature-card" aria-label="Entorno seguro y cálido">
            <div class="card-icon" aria-hidden="true">🌿</div>
            <h3>Entorno Seguro y Cálido</h3>
            <p>Un espacio diseñado para que los niños y jóvenes se sientan cómodos, seguros y escuchados.</p>
          </div>
          <div class="feature-card" aria-label="Enfoque familiar">
            <div class="card-icon" aria-hidden="true">👨‍👩‍👧</div>
            <h3>Enfoque Familiar</h3>
            <p>Trabajamos junto a la familia para construir redes de apoyo sólidas y estrategias de crianza positiva.</p>
          </div>
          <div class="feature-card" aria-label="Metodología basada en evidencia">
            <div class="card-icon" aria-hidden="true">🔬</div>
            <h3>Basados en Evidencia</h3>
            <p>Aplicamos técnicas terapéuticas respaldadas científicamente: TCC, terapia de juego, mindfulness.</p>
          </div>
          <div class="feature-card" aria-label="Atención personalizada">
            <div class="card-icon" aria-hidden="true">💎</div>
            <h3>Atención Personalizada</h3>
            <p>Cada proceso terapéutico se adapta a las necesidades únicas del paciente y su familia.</p>
          </div>
          <div class="feature-card" aria-label="Evaluación integral">
            <div class="card-icon" aria-hidden="true">📋</div>
            <h3>Evaluación Integral</h3>
            <p>Realizamos evaluaciones completas para diagnósticos precisos y planes de intervención efectivos.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Nuestros profesionales -->
    <section class="section" aria-labelledby="professionals-title">
      <div class="container">
        <h2 class="section-title" id="professionals-title">Nuestro Equipo</h2>
        <p class="section-subtitle">Especialistas comprometidos con el bienestar emocional infantil y juvenil</p>
        <div class="professionals-grid">
          ${PROFESSIONALS.map(p => `
            <article class="professional-card" aria-label="Profesional: ${escapeHtml(p.nombre)}">
              <div class="professional-avatar" aria-hidden="true">${p.emoji}</div>
              <h3>${escapeHtml(p.nombre)}</h3>
              <p class="specialty">${escapeHtml(p.especialidad)}</p>
              <p>${escapeHtml(p.descripcion)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="section section--teal-soft text-center" aria-label="Llamada a la acción">
      <div class="container">
        <h2 class="section-title">¿Listo para dar el primer paso?</h2>
        <p class="section-subtitle" style="margin-bottom:28px">
          Agenda una cita hoy y comienza el proceso de acompañamiento que tu hijo necesita.
        </p>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
          <a href="#/agendar" class="btn btn-primary" data-nav>Agendar Primera Cita</a>
          <a href="#/contacto" class="btn btn-outline" data-nav>Hablar con Nosotros</a>
        </div>
      </div>
    </section>
  `;
}

/* =====================================================================
   8. VISTA: SERVICIOS
   ===================================================================== */
function renderServices(el) {
  const servicios = [
    {
      emoji: '🧩',
      nombre: 'Evaluación Psicológica',
      desc: 'Evaluación diagnóstica completa para niños y adolescentes. Incluye valoración cognitiva, emocional y conductual.',
      duracion: '2-3 sesiones',
      edades: '4 – 18 años'
    },
    {
      emoji: '🎮',
      nombre: 'Terapia de Juego',
      desc: 'Intervención terapéutica para niños a través del juego como medio de expresión y sanación emocional.',
      duracion: '50 min/sesión',
      edades: '4 – 12 años'
    },
    {
      emoji: '🧠',
      nombre: 'Terapia Cognitivo-Conductual',
      desc: 'Técnicas estructuradas para modificar patrones de pensamiento y conducta en adolescentes y jóvenes.',
      duracion: '50 min/sesión',
      edades: '10 – 18 años'
    },
    {
      emoji: '👨‍👩‍👧',
      nombre: 'Orientación a Padres',
      desc: 'Sesiones de acompañamiento a padres y cuidadores para mejorar las estrategias de crianza positiva.',
      duracion: '60 min/sesión',
      edades: 'Padres y tutores'
    },
    {
      emoji: '🤝',
      nombre: 'Terapia Familiar',
      desc: 'Sesiones conjuntas para mejorar la comunicación, resolver conflictos y fortalecer el vínculo familiar.',
      duracion: '70 min/sesión',
      edades: 'Familia completa'
    },
    {
      emoji: '🌟',
      nombre: 'Neuropsicología Infantil',
      desc: 'Evaluación y rehabilitación para TDAH, dislexia, problemas de atención y otras necesidades neuropsicológicas.',
      duracion: '3-4 sesiones',
      edades: '5 – 16 años'
    }
  ];

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Nuestros Servicios</h1>
      <p>Atención psicológica especializada para el bienestar de niños y adolescentes</p>
    </div>
    <div class="container">
      <hr class="section-divider" aria-hidden="true">
      <section class="section" style="padding-top:0" aria-label="Listado de servicios">
        <div class="card-grid">
          ${servicios.map(s => `
            <article class="card" aria-label="Servicio: ${escapeHtml(s.nombre)}">
              <div class="card-icon" aria-hidden="true">${s.emoji}</div>
              <h3>${escapeHtml(s.nombre)}</h3>
              <p>${escapeHtml(s.desc)}</p>
              <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
                <span style="font-size:0.8rem;background:var(--teal-light);color:var(--teal-darker);padding:3px 10px;border-radius:999px;font-weight:600" aria-label="Duración: ${escapeHtml(s.duracion)}">⏱ ${escapeHtml(s.duracion)}</span>
                <span style="font-size:0.8rem;background:var(--green-light);color:var(--green-dark);padding:3px 10px;border-radius:999px;font-weight:600" aria-label="Edades: ${escapeHtml(s.edades)}">👥 ${escapeHtml(s.edades)}</span>
              </div>
              <a href="#/agendar" class="btn btn-outline btn-sm mt-16" data-nav aria-label="Agendar cita para ${escapeHtml(s.nombre)}">Agendar Cita</a>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="section section--white" style="border-radius:var(--radius);padding:36px 28px;margin-bottom:40px;box-shadow:var(--shadow-card)" aria-label="Información sobre el proceso">
        <h2 class="section-title" style="text-align:left;font-size:1.3rem">¿Cómo es el proceso?</h2>
        <br>
        <ol style="padding-left:20px;display:flex;flex-direction:column;gap:14px;color:var(--gray);font-size:0.93rem;line-height:1.7">
          <li><strong style="color:var(--teal)">1. Agenda tu cita</strong> – Elige profesional, fecha y hora disponible.</li>
          <li><strong style="color:var(--teal)">2. Primera valoración</strong> – El especialista realiza una entrevista inicial con el tutor y el niño/adolescente.</li>
          <li><strong style="color:var(--teal)">3. Plan de intervención</strong> – Se diseña un plan terapéutico personalizado.</li>
          <li><strong style="color:var(--teal)">4. Sesiones de terapia</strong> – Trabajo regular con el paciente y orientación a la familia.</li>
          <li><strong style="color:var(--teal)">5. Seguimiento y cierre</strong> – Evaluación de avances y recomendaciones finales.</li>
        </ol>
      </section>
    </div>
  `;
}

/* =====================================================================
   9. VISTA: AGENDAR CITA (FORMULARIO MULTI-PASO)
   ===================================================================== */
function renderAppointment(el) {
  // Reiniciar formulario
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
    motivo: ''
  });

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Agendar Cita</h1>
      <p>Completa los pasos para solicitar tu cita psicológica</p>
    </div>
    <div class="container">
      <div class="appointment-form" id="appointment-form" role="main">
        <!-- Stepper -->
        <nav aria-label="Pasos del formulario" role="navigation">
          <div class="steps" id="steps" role="list">
            ${[
              ['1', 'Profesional'],
              ['2', 'Fecha'],
              ['3', 'Hora'],
              ['4', 'Datos'],
              ['5', 'Motivo'],
              ['6', 'Conf.']
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

/** Actualiza el estado visual del stepper */
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

/* ---------- PASO 1: Selección de profesional ---------- */
function renderAppointmentStep1() {
  const el = document.getElementById('form-step-content');
  updateSteps(1);
  el.innerHTML = `
    <div class="form-card">
      <h2>Selecciona un Profesional</h2>
      <p class="form-subtitle">Elige al especialista que mejor se adapte a la necesidad de tu hijo/a</p>
      <div class="service-grid" role="listbox" aria-label="Profesionales disponibles" id="professional-list">
        ${PROFESSIONALS.map(p => `
          <div class="card card-select card-service ${appointmentForm.professionalId === p.id ? 'selected' : ''}"
               data-prof-id="${p.id}" role="option"
               aria-selected="${appointmentForm.professionalId === p.id}"
               tabindex="0"
               aria-label="${escapeHtml(p.nombre)} – ${escapeHtml(p.especialidad)}">
            <div class="card-service-header">
              <div>
                <span style="font-size:1.4rem" aria-hidden="true">${p.emoji}</span>
                <h3 style="margin-top:6px">${escapeHtml(p.nombre)}</h3>
              </div>
            </div>
            <p style="font-size:0.82rem;color:var(--teal);font-weight:600;margin-bottom:6px">${escapeHtml(p.especialidad)}</p>
            <p style="font-size:0.83rem;color:var(--gray)">${escapeHtml(p.descripcion)}</p>
          </div>
        `).join('')}
      </div>
      <div class="form-nav">
        <div></div>
        <button class="btn btn-primary" id="btn-step-next" disabled
                aria-label="Ir al paso siguiente: Fecha">Siguiente →</button>
      </div>
    </div>
  `;

  // Eventos de selección
  el.querySelectorAll('[data-prof-id]').forEach(card => {
    const activate = () => {
      el.querySelectorAll('[data-prof-id]').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-selected', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-selected', 'true');
      appointmentForm.professionalId = parseInt(card.dataset.profId);
      document.getElementById('btn-step-next').disabled = false;
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (appointmentForm.professionalId) renderAppointmentStep2();
  });
}

/* ---------- PASO 2: Selección de fecha ---------- */
function renderAppointmentStep2() {
  const el = document.getElementById('form-step-content');
  updateSteps(2);
  const days = getNextWorkDays(45);

  el.innerHTML = `
    <div class="form-card">
      <h2>Elige una Fecha</h2>
      <p class="form-subtitle">Selecciona el día disponible que prefieras</p>
      <div class="date-grid" id="date-grid" role="listbox" aria-label="Fechas disponibles">
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
      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev" aria-label="Volver al paso anterior">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-next" ${!appointmentForm.date ? 'disabled' : ''}
                aria-label="Ir al paso siguiente: Hora">Siguiente →</button>
      </div>
    </div>
  `;

  el.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.date-btn').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-selected', 'true');
      appointmentForm.date = btn.dataset.date;
      document.getElementById('btn-step-next').disabled = false;
    });
  });

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep1);
  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (appointmentForm.date) renderAppointmentStep3();
  });
}

/* ---------- PASO 3: Selección de hora ---------- */
function renderAppointmentStep3() {
  const el = document.getElementById('form-step-content');
  updateSteps(3);
  const booked = getBookedSlots(appointmentForm.date);

  el.innerHTML = `
    <div class="form-card">
      <h2>Elige una Hora</h2>
      <p class="form-subtitle">Fecha seleccionada: <strong style="color:var(--teal)">${formatDate(appointmentForm.date)}</strong></p>
      <div class="time-grid" id="time-grid" role="listbox" aria-label="Horarios disponibles">
        ${TIME_SLOTS.map(t => {
          const isBooked = booked.includes(t);
          const selected = appointmentForm.time === t;
          return `
            <button class="time-btn ${selected ? 'selected' : ''}" data-time="${t}"
                    ${isBooked ? 'disabled aria-disabled="true"' : ''}
                    role="option" aria-selected="${selected}"
                    aria-label="${t}${isBooked ? ' – no disponible' : ''}">
              ${t}${isBooked ? ' ⛔' : ''}
            </button>`;
        }).join('')}
      </div>
      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev" aria-label="Volver a selección de fecha">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-next" ${!appointmentForm.time ? 'disabled' : ''}
                aria-label="Ir al paso siguiente: Datos del paciente">Siguiente →</button>
      </div>
    </div>
  `;

  el.querySelectorAll('.time-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.time-btn').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-selected', 'true');
      appointmentForm.time = btn.dataset.time;
      document.getElementById('btn-step-next').disabled = false;
    });
  });

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep2);
  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (appointmentForm.time) renderAppointmentStep4();
  });
}

/* ---------- PASO 4: Datos del tutor y paciente ---------- */
function renderAppointmentStep4() {
  const el = document.getElementById('form-step-content');
  updateSteps(4);

  el.innerHTML = `
    <div class="form-card">
      <h2>Datos del Tutor y Paciente</h2>
      <p class="form-subtitle">Completa la información del padre/madre/tutor y del paciente</p>

      <fieldset style="border:none;margin-bottom:20px">
        <legend style="font-weight:700;font-size:1rem;color:var(--teal);margin-bottom:14px;display:flex;align-items:center;gap:6px">
          👨‍👩‍👦 Datos del Tutor
        </legend>
        <div class="form-group">
          <label for="f-tutor-nombre">Nombre completo del padre/madre/tutor <span aria-hidden="true" style="color:var(--danger)">*</span></label>
          <input type="text" id="f-tutor-nombre" name="tutorNombre"
                 placeholder="Ej: Ana García Rodríguez"
                 value="${escapeHtml(appointmentForm.tutorNombre)}"
                 aria-required="true"
                 aria-describedby="err-tutor-nombre"
                 autocomplete="name">
          <div class="form-error" id="err-tutor-nombre" role="alert" aria-live="polite"></div>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label for="f-telefono">Teléfono de contacto <span aria-hidden="true" style="color:var(--danger)">*</span></label>
            <input type="tel" id="f-telefono" name="telefono"
                   placeholder="3101234567"
                   value="${escapeHtml(appointmentForm.telefono)}"
                   aria-required="true"
                   aria-describedby="err-telefono"
                   autocomplete="tel">
            <div class="form-error" id="err-telefono" role="alert" aria-live="polite"></div>
          </div>
          <div class="form-group">
            <label for="f-email">Correo electrónico <span aria-hidden="true" style="color:var(--danger)">*</span></label>
            <input type="email" id="f-email" name="email"
                   placeholder="tutor@email.com"
                   value="${escapeHtml(appointmentForm.email)}"
                   aria-required="true"
                   aria-describedby="err-email"
                   autocomplete="email">
            <div class="form-error" id="err-email" role="alert" aria-live="polite"></div>
          </div>
        </div>
      </fieldset>

      <fieldset style="border:none">
        <legend style="font-weight:700;font-size:1rem;color:var(--green-dark);margin-bottom:14px;display:flex;align-items:center;gap:6px">
          🧒 Datos del Paciente
        </legend>
        <div class="form-group">
          <label for="f-paciente-nombre">Nombre completo del niño/niña/adolescente <span aria-hidden="true" style="color:var(--danger)">*</span></label>
          <input type="text" id="f-paciente-nombre" name="pacienteNombre"
                 placeholder="Ej: Sofía García López"
                 value="${escapeHtml(appointmentForm.pacienteNombre)}"
                 aria-required="true"
                 aria-describedby="err-paciente-nombre"
                 autocomplete="off">
          <div class="form-error" id="err-paciente-nombre" role="alert" aria-live="polite"></div>
        </div>
        <div class="form-group" style="max-width:220px">
          <label for="f-paciente-edad">Edad del paciente <span aria-hidden="true" style="color:var(--danger)">*</span></label>
          <input type="number" id="f-paciente-edad" name="pacienteEdad"
                 placeholder="Ej: 9"
                 value="${escapeHtml(appointmentForm.pacienteEdad)}"
                 min="2" max="20"
                 aria-required="true"
                 aria-describedby="err-paciente-edad hint-edad">
          <div class="hint" id="hint-edad">Entre 2 y 20 años</div>
          <div class="form-error" id="err-paciente-edad" role="alert" aria-live="polite"></div>
        </div>
      </fieldset>

      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev" aria-label="Volver a selección de hora">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-next" aria-label="Ir al paso siguiente: Motivo de consulta">Siguiente →</button>
      </div>
    </div>
  `;

  // Referencias a inputs
  const inputs = {
    tutorNombre:    document.getElementById('f-tutor-nombre'),
    pacienteNombre: document.getElementById('f-paciente-nombre'),
    pacienteEdad:   document.getElementById('f-paciente-edad'),
    telefono:       document.getElementById('f-telefono'),
    email:          document.getElementById('f-email')
  };

  // Sincronizar con el state al escribir
  Object.entries(inputs).forEach(([key, inp]) => {
    inp.addEventListener('input', () => {
      appointmentForm[key] = inp.value;
      clearError(inp, `err-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    });
  });

  function clearError(inp, errId) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = '';
    inp.removeAttribute('aria-invalid');
  }

  function showError(inp, errId, msg) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = msg;
    inp.setAttribute('aria-invalid', 'true');
    inp.focus();
  }

  function validateStep4() {
    let valid = true;
    const f = appointmentForm;

    if (!f.tutorNombre.trim()) { showError(inputs.tutorNombre, 'err-tutor-nombre', 'Ingresa el nombre del tutor'); valid = false; }
    if (!f.telefono.trim() || !isValidPhone(f.telefono)) { showError(inputs.telefono, 'err-telefono', 'Ingresa un teléfono válido (7-15 dígitos)'); valid = false; }
    if (!f.email.trim() || !isValidEmail(f.email)) { showError(inputs.email, 'err-email', 'Ingresa un correo electrónico válido'); valid = false; }
    if (!f.pacienteNombre.trim()) { showError(inputs.pacienteNombre, 'err-paciente-nombre', 'Ingresa el nombre del paciente'); valid = false; }
    if (!f.pacienteEdad || f.pacienteEdad < 2 || f.pacienteEdad > 20) { showError(inputs.pacienteEdad, 'err-paciente-edad', 'Ingresa una edad entre 2 y 20 años'); valid = false; }

    return valid;
  }

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep3);
  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (validateStep4()) renderAppointmentStep5();
  });
}

/* ---------- PASO 5: Motivo de consulta ---------- */
function renderAppointmentStep5() {
  const el = document.getElementById('form-step-content');
  updateSteps(5);
  const prof = getProfessional(appointmentForm.professionalId);

  el.innerHTML = `
    <div class="form-card">
      <h2>Motivo de Consulta</h2>
      <p class="form-subtitle">Cuéntanos brevemente por qué buscas atención psicológica para tu hijo/a</p>

      <div style="background:var(--teal-lighter);border-radius:var(--radius-sm);padding:14px;margin-bottom:20px;border:1px solid var(--teal-light)">
        <p style="font-size:0.88rem;color:var(--teal-darker)">
          <strong>Resumen:</strong> Cita con <strong>${escapeHtml(prof.nombre)}</strong> —
          ${formatDate(appointmentForm.date)} a las <strong>${appointmentForm.time}</strong>
          para <strong>${escapeHtml(appointmentForm.pacienteNombre)}</strong> (${appointmentForm.pacienteEdad} años)
        </p>
      </div>

      <div class="form-group">
        <label for="f-motivo-select">Motivo principal de consulta <span aria-hidden="true" style="color:var(--danger)">*</span></label>
        <select id="f-motivo-select" aria-required="true" aria-describedby="err-motivo">
          <option value="">— Selecciona un motivo —</option>
          ${MOTIVOS.map(m => `<option value="${escapeHtml(m)}" ${appointmentForm.motivo === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
        </select>
        <div class="form-error" id="err-motivo" role="alert" aria-live="polite"></div>
      </div>

      <div class="form-group">
        <label for="f-motivo-detalle">Descripción adicional <span style="color:var(--gray-light);font-weight:400">(opcional)</span></label>
        <textarea id="f-motivo-detalle"
                  placeholder="Describe brevemente la situación que motiva la consulta. Esta información es confidencial y ayuda al profesional a prepararse..."
                  rows="4"
                  aria-describedby="hint-detalle"
                  maxlength="500">${escapeHtml(appointmentForm.motivoDetalle || '')}</textarea>
        <div class="hint" id="hint-detalle">Máximo 500 caracteres. Esta información es completamente confidencial.</div>
      </div>

      <div class="form-nav">
        <button class="btn btn-secondary" id="btn-step-prev" aria-label="Volver a datos del tutor y paciente">← Anterior</button>
        <button class="btn btn-primary" id="btn-step-next" aria-label="Confirmar cita">Confirmar Cita ✓</button>
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

  document.getElementById('btn-step-prev').addEventListener('click', renderAppointmentStep4);
  document.getElementById('btn-step-next').addEventListener('click', () => {
    if (!appointmentForm.motivo) {
      document.getElementById('err-motivo').textContent = 'Selecciona el motivo principal de consulta';
      selectMotivo.setAttribute('aria-invalid', 'true');
      selectMotivo.focus();
      return;
    }
    submitAppointment();
  });
}

/* ---------- CONFIRMACIÓN DE CITA ---------- */
function submitAppointment() {
  const prof = getProfessional(appointmentForm.professionalId);

  const appointment = {
    id: generateId(),
    professionalId: appointmentForm.professionalId,
    professionalName: prof.nombre,
    tutorNombre: appointmentForm.tutorNombre.trim(),
    pacienteNombre: appointmentForm.pacienteNombre.trim(),
    pacienteEdad: parseInt(appointmentForm.pacienteEdad),
    fecha: appointmentForm.date,
    hora: appointmentForm.time,
    telefono: appointmentForm.telefono.trim(),
    email: appointmentForm.email.trim(),
    motivo: appointmentForm.motivo,
    motivoDetalle: (appointmentForm.motivoDetalle || '').trim(),
    estado: 'pendiente',
    createdAt: new Date().toISOString()
  };

  state.appointments.push(appointment);
  saveAppointments();
  showToast('✓ Cita agendada exitosamente. Nos comunicaremos pronto.', 'success');

  // Actualizar paso visual
  updateSteps(6);

  const el = document.getElementById('form-step-content');
  el.innerHTML = `
    <div class="form-card confirmation-card" role="region" aria-label="Confirmación de cita agendada">
      <div class="confirmation-icon" aria-hidden="true">✓</div>
      <h2>¡Cita Solicitada con Éxito!</h2>
      <p>
        Hemos recibido tu solicitud. Un miembro de nuestro equipo se comunicará contigo al
        <strong>${escapeHtml(appointment.telefono)}</strong> o a
        <strong>${escapeHtml(appointment.email)}</strong> para confirmar la cita.
      </p>
      <div class="confirmation-details" role="list" aria-label="Detalles de la cita">
        <div role="listitem"><strong>Profesional</strong><span>${escapeHtml(appointment.professionalName)}</span></div>
        <div role="listitem"><strong>Fecha</strong><span>${formatDate(appointment.fecha)}</span></div>
        <div role="listitem"><strong>Hora</strong><span>${appointment.hora}</span></div>
        <div role="listitem"><strong>Tutor</strong><span>${escapeHtml(appointment.tutorNombre)}</span></div>
        <div role="listitem"><strong>Paciente</strong><span>${escapeHtml(appointment.pacienteNombre)} (${appointment.pacienteEdad} años)</span></div>
        <div role="listitem"><strong>Motivo</strong><span>${escapeHtml(appointment.motivo)}</span></div>
      </div>
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="#/" class="btn btn-outline" data-nav>Ir al Inicio</a>
        <a href="#/historial" class="btn btn-primary" data-nav>Ver mis Citas</a>
      </div>
      <p style="margin-top:16px;font-size:0.82rem;color:var(--gray)">
        💚 Toda la información proporcionada es confidencial y protegida.
      </p>
    </div>
  `;
}

/* =====================================================================
   10. VISTA: HISTORIAL DE CITAS
   ===================================================================== */
function renderHistory(el) {
  loadAppointments();
  const apps = state.appointments;

  if (apps.length === 0) {
    el.innerHTML = `
      <div class="page-header">
        <h1>Mi Historial</h1>
        <p>Tus citas agendadas</p>
      </div>
      <div class="container">
        <div class="history-empty" role="status">
          <div class="empty-icon" aria-hidden="true">📅</div>
          <p>No tienes citas agendadas aún.</p>
          <a href="#/agendar" class="btn btn-primary mt-16" data-nav>Agendar mi primera cita</a>
        </div>
      </div>
    `;
    return;
  }

  const sorted = [...apps].sort((a, b) => {
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
    return b.hora.localeCompare(a.hora);
  });

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Mi Historial de Citas</h1>
      <p>Tienes ${apps.length} cita${apps.length > 1 ? 's' : ''} registrada${apps.length > 1 ? 's' : ''}</p>
    </div>
    <div class="container">
      <hr class="section-divider" aria-hidden="true">
      <div class="history-list" role="list" aria-label="Lista de citas">
        ${sorted.map(a => `
          <article class="history-card status-${escapeHtml(a.estado)}" role="listitem"
                   aria-label="Cita con ${escapeHtml(a.professionalName)} el ${formatDate(a.fecha)}">
            <div class="history-card-header">
              <div>
                <h3>${escapeHtml(a.professionalName)}</h3>
                <p style="font-size:0.83rem;color:var(--teal);font-weight:600;margin-top:2px">${escapeHtml(a.motivo)}</p>
              </div>
              <span class="badge badge-${escapeHtml(a.estado)}" aria-label="Estado: ${escapeHtml(a.estado)}">${escapeHtml(a.estado)}</span>
            </div>
            <div class="history-card-body">
              <div>📅 ${formatDate(a.fecha)}</div>
              <div>⏰ ${a.hora}</div>
              <div>🧒 Paciente: ${escapeHtml(a.pacienteNombre)} — ${a.pacienteEdad} años</div>
              <div>👤 Tutor: ${escapeHtml(a.tutorNombre)}</div>
              <div>📱 ${escapeHtml(a.telefono)} · ✉️ ${escapeHtml(a.email)}</div>
              ${a.createdAt ? `<div style="margin-top:6px;font-size:0.78rem;color:var(--gray-light)">Agendada el ${new Date(a.createdAt).toLocaleDateString('es-CO')}</div>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

/* =====================================================================
   11. VISTA: TAREAS Y CALENDARIO
   ===================================================================== */

// Estado del calendario
let calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDate: new Date().toISOString().split('T')[0]
};

function renderTasks(el) {
  loadTasks();

  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Tareas y Calendario</h1>
      <p>Organiza recordatorios y tareas importantes para el proceso terapéutico</p>
    </div>
    <div class="container">
      <hr class="section-divider" aria-hidden="true">
      <div class="tasks-layout" id="tasks-layout">
        <!-- Calendario -->
        <section aria-labelledby="calendar-title">
          <div class="calendar-widget" id="calendar-widget">
            <!-- Se renderiza con buildCalendar() -->
          </div>
        </section>

        <!-- Panel de tareas -->
        <section aria-labelledby="tasks-title">
          <div class="tasks-panel" id="tasks-panel">
            <!-- Se renderiza con buildTasksPanel() -->
          </div>
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // lunes = 0

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Fechas con tareas en este mes
  const datesWithTasks = new Set(
    state.tasks
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(t => t.date.split('T')[0])
  );

  let daysHTML = '';
  // Días vacíos del inicio
  for (let i = 0; i < startDow; i++) {
    daysHTML += `<div class="cal-day cal-day--empty" aria-hidden="true"></div>`;
  }
  // Días del mes
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    const isToday    = dateObj.getTime() === today.getTime();
    const isSelected = dateStr === selectedDate;
    const isPast     = dateObj < today && !isToday;
    const hasTasks   = datesWithTasks.has(dateStr);

    let cls = 'cal-day';
    if (isToday)    cls += ' cal-day--today';
    if (isSelected && !isToday) cls += ' cal-day--selected';
    if (isPast)     cls += ' cal-day--past';
    if (hasTasks)   cls += ' cal-day--has-tasks';

    const label = `${d} de ${monthNames[month]}${isToday ? ' (hoy)' : ''}${hasTasks ? ', tiene tareas' : ''}`;

    daysHTML += `
      <button class="${cls}" data-date="${dateStr}"
              aria-label="${label}" ${isPast ? 'aria-disabled="true"' : ''}>
        ${d}
      </button>`;
  }

  widget.innerHTML = `
    <div class="calendar-header">
      <button class="cal-nav-btn" id="cal-prev" aria-label="Mes anterior">‹</button>
      <h3 id="calendar-title" aria-live="polite">${monthNames[month]} ${year}</h3>
      <button class="cal-nav-btn" id="cal-next" aria-label="Mes siguiente">›</button>
    </div>
    <div class="calendar-weekdays" aria-hidden="true">
      <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
    </div>
    <div class="calendar-days" role="grid" aria-label="Días del mes">
      ${daysHTML}
    </div>
  `;

  // Navegación de meses
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

  // Selección de día
  widget.querySelectorAll('.cal-day[data-date]').forEach(btn => {
    if (btn.classList.contains('cal-day--past') && !btn.classList.contains('cal-day--today')) return;
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

  const formattedDate = dateObj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  panel.innerHTML = `
    <div class="tasks-panel-header">
      <h3 id="tasks-title">
        📋 ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
      </h3>
      <button class="btn btn-sm" id="toggle-add-task"
              style="background:rgba(255,255,255,0.25);color:#fff;border-radius:999px"
              aria-label="Agregar nueva tarea" aria-expanded="false"
              aria-controls="add-task-form">
        + Agregar
      </button>
    </div>
    <div class="tasks-panel-body">
      <!-- Formulario para agregar tarea (oculto por defecto) -->
      <form class="add-task-form hidden" id="add-task-form"
            aria-label="Formulario para agregar tarea" novalidate>
        <div class="form-group" style="margin-bottom:0">
          <label for="task-title-input" style="font-size:0.85rem">Descripción de la tarea <span style="color:var(--danger)">*</span></label>
          <input type="text" id="task-title-input" name="taskTitle"
                 placeholder="Ej: Recordar llevar reporte escolar"
                 aria-required="true" maxlength="120"
                 autocomplete="off">
        </div>
        <div class="form-row-inline">
          <div>
            <label for="task-priority" style="font-size:0.82rem;font-weight:600;display:block;margin-bottom:4px">Prioridad</label>
            <select id="task-priority" name="taskPriority" style="font-size:0.85rem;padding:8px 12px">
              <option value="baja">🟢 Baja</option>
              <option value="media" selected>🟡 Media</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>
          <div>
            <label for="task-category" style="font-size:0.82rem;font-weight:600;display:block;margin-bottom:4px">Categoría</label>
            <select id="task-category" name="taskCategory" style="font-size:0.85rem;padding:8px 12px">
              <option value="cita">📅 Cita</option>
              <option value="medicacion">💊 Medicación</option>
              <option value="tarea">📚 Tarea</option>
              <option value="ejercicio">🎯 Ejercicio</option>
              <option value="otro" selected>📌 Otro</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button type="submit" class="btn btn-green btn-sm" style="flex:1" aria-label="Guardar tarea">
            ✓ Guardar Tarea
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="cancel-add-task">
            Cancelar
          </button>
        </div>
      </form>

      <!-- Lista de tareas -->
      <div class="task-list" id="task-list" role="list" aria-label="Lista de tareas para el día seleccionado"
           aria-live="polite">
        ${dayTasks.length === 0
          ? `<div class="task-list__empty" style="text-align:center;padding:24px;color:var(--gray-light);font-size:0.88rem">
               <div aria-hidden="true" style="font-size:2rem;margin-bottom:8px">📋</div>
               No hay tareas para este día.<br>¡Agrega una para mantenerte organizado!
             </div>`
          : dayTasks.map(t => buildTaskItemHTML(t)).join('')
        }
      </div>
    </div>
  `;

  // Toggle del formulario de agregar tarea
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

  // Envío del formulario
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = panel.querySelector('#task-title-input');
    const priority   = panel.querySelector('#task-priority').value;
    const category   = panel.querySelector('#task-category').value;

    const titleVal = titleInput.value.trim();
    if (!titleVal) {
      titleInput.setAttribute('aria-invalid', 'true');
      titleInput.focus();
      showToast('Por favor escribe la descripción de la tarea.', 'error');
      return;
    }

    const newTask = {
      id: generateId(),
      date: selectedDate,
      title: titleVal,
      priority,
      category,
      done: false,
      createdAt: new Date().toISOString()
    };

    state.tasks.push(newTask);
    saveTasks();
    showToast('✓ Tarea agregada exitosamente.', 'success');

    addForm.classList.add('hidden');
    toggleBtn.setAttribute('aria-expanded', 'false');
    addForm.reset();

    buildCalendar();
    buildTasksPanel();
  });

  // Eventos de checkbox y eliminar
  attachTaskEvents(panel);
}

function buildTaskItemHTML(t) {
  const catEmojis = { cita:'📅', medicacion:'💊', tarea:'📚', ejercicio:'🎯', otro:'📌' };
  const emoji = catEmojis[t.category] || '📌';

  return `
    <div class="task-item ${t.done ? 'done' : ''}" data-task-id="${escapeHtml(t.id)}" role="listitem">
      <button class="task-checkbox" data-action="toggle" data-id="${escapeHtml(t.id)}"
              aria-label="${t.done ? 'Marcar tarea como pendiente' : 'Marcar tarea como completada'}"
              aria-pressed="${t.done}">
        ${t.done ? '✓' : ''}
      </button>
      <div class="task-content">
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          <span>${emoji} ${escapeHtml(t.category || 'otro')}</span>
          <span class="task-priority--${escapeHtml(t.priority)}">${escapeHtml(t.priority)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-delete-btn" data-action="delete" data-id="${escapeHtml(t.id)}"
                aria-label="Eliminar tarea: ${escapeHtml(t.title)}">
          ✕
        </button>
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
        saveTasks();
        buildCalendar();
        buildTasksPanel();
        showToast(task.done ? '✓ Tarea completada.' : 'Tarea marcada como pendiente.', task.done ? 'success' : '');
      }
    });
  });

  panel.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('¿Eliminar esta tarea?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveTasks();
        buildCalendar();
        buildTasksPanel();
        showToast('Tarea eliminada.', '');
      }
    });
  });
}

/* =====================================================================
   12. VISTA: CONTACTO
   ===================================================================== */
function renderContact(el) {
  el.innerHTML = `
    <div class="page-header" role="banner">
      <h1>Contáctanos</h1>
      <p>Estamos aquí para acompañarte en cada paso del proceso</p>
    </div>
    <div class="container">
      <hr class="section-divider" aria-hidden="true">
      <section class="section" style="padding-top:0" aria-label="Información de contacto y formulario">
        <div class="contact-grid">
          <!-- Información de contacto -->
          <div>
            <h2 class="section-title" style="text-align:left;font-size:1.2rem;margin-bottom:20px">Información de Contacto</h2>

            <div class="contact-info-card">
              <div class="ci-icon" aria-hidden="true">📍</div>
              <div>
                <h3>Dirección</h3>
                <p>Bogotá, Colombia<br>(Dirección disponible al confirmar cita)</p>
              </div>
            </div>

            <div class="contact-info-card">
              <a href="https://wa.me/573012345678" target="_blank" rel="noopener noreferrer"
                 style="display:contents" aria-label="WhatsApp: +57 301 234 5678">
                <div class="ci-icon" aria-hidden="true">💬</div>
                <div>
                  <h3>WhatsApp</h3>
                  <p>+57 301 234 5678<br><span style="font-size:0.8rem;color:var(--teal)">Haz clic para chatear</span></p>
                </div>
              </a>
            </div>

            <div class="contact-info-card">
              <div class="ci-icon" aria-hidden="true">✉️</div>
              <div>
                <h3>Correo Electrónico</h3>
                <p><a href="mailto:info@actitudybienestar.com" style="color:var(--teal)">info@actitudybienestar.com</a></p>
              </div>
            </div>

            <div class="contact-info-card">
              <div class="ci-icon" aria-hidden="true">🕐</div>
              <div>
                <h3>Horarios de Atención</h3>
                <p>Lun – Vie: 8:00 AM – 6:00 PM</p>
                <p>Sábados: 9:00 AM – 2:00 PM</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>

            <div style="margin-top:20px;padding:16px;background:var(--teal-lighter);border-radius:var(--radius-sm);border:1px solid var(--teal-light)">
              <p style="font-size:0.87rem;color:var(--teal-darker);line-height:1.7">
                💚 <strong>Para urgencias</strong>, recuerda que siempre puedes comunicarte con la <strong>Línea 106</strong> (Línea de Salud Mental) o acudir al servicio de urgencias más cercano.
              </p>
            </div>
          </div>

          <!-- Formulario de contacto -->
          <div>
            <h2 class="section-title" style="text-align:left;font-size:1.2rem;margin-bottom:20px">Envíanos un Mensaje</h2>
            <div class="form-card" style="box-shadow:none;border:1.5px solid var(--gray-lighter)">
              <form id="contact-form" novalidate aria-label="Formulario de contacto">
                <div class="form-group">
                  <label for="c-nombre">Nombre completo <span aria-hidden="true" style="color:var(--danger)">*</span></label>
                  <input type="text" id="c-nombre" name="nombre"
                         placeholder="Tu nombre completo"
                         aria-required="true"
                         aria-describedby="err-c-nombre"
                         autocomplete="name">
                  <div class="form-error" id="err-c-nombre" role="alert" aria-live="polite"></div>
                </div>
                <div class="form-group">
                  <label for="c-email">Correo electrónico <span aria-hidden="true" style="color:var(--danger)">*</span></label>
                  <input type="email" id="c-email" name="email"
                         placeholder="tu@email.com"
                         aria-required="true"
                         aria-describedby="err-c-email"
                         autocomplete="email">
                  <div class="form-error" id="err-c-email" role="alert" aria-live="polite"></div>
                </div>
                <div class="form-group">
                  <label for="c-asunto">Asunto</label>
                  <select id="c-asunto" name="asunto">
                    <option value="">— Selecciona un asunto —</option>
                    <option value="informacion">Solicitud de información</option>
                    <option value="cita">Dudas sobre mi cita</option>
                    <option value="servicios">Información sobre servicios</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="c-mensaje">Mensaje <span aria-hidden="true" style="color:var(--danger)">*</span></label>
                  <textarea id="c-mensaje" name="mensaje"
                            placeholder="Escribe tu consulta aquí..."
                            rows="4"
                            aria-required="true"
                            aria-describedby="err-c-mensaje"
                            maxlength="800"></textarea>
                  <div class="form-error" id="err-c-mensaje" role="alert" aria-live="polite"></div>
                </div>
                <button type="submit" class="btn btn-primary btn-block"
                        aria-label="Enviar mensaje de contacto">
                  Enviar Mensaje 💬
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre  = document.getElementById('c-nombre').value.trim();
    const email   = document.getElementById('c-email').value.trim();
    const mensaje = document.getElementById('c-mensaje').value.trim();

    let valid = true;
    if (!nombre)  { document.getElementById('err-c-nombre').textContent = 'Por favor ingresa tu nombre.'; valid = false; }
    if (!email || !isValidEmail(email)) { document.getElementById('err-c-email').textContent = 'Ingresa un correo válido.'; valid = false; }
    if (!mensaje) { document.getElementById('err-c-mensaje').textContent = 'Por favor escribe tu mensaje.'; valid = false; }

    if (!valid) return;

    showToast('✓ Mensaje enviado correctamente. Te responderemos pronto.', 'success');
    e.target.reset();
  });
}

/* =====================================================================
   13. MENÚ MÓVIL
   ===================================================================== */
function initMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav    = document.getElementById('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('open');
    nav.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  });

  // Cerrar menú al hacer click en un enlace
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú de navegación');
    });
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      toggle.classList.remove('open');
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* =====================================================================
   14. DELEGACIÓN DE EVENTOS DE NAVEGACIÓN (data-nav)
   =====================================================================
   Los links con data-nav usan hash routing; aquí aseguramos que
   todos los links internos generados dinámicamente también funcionen.
   ===================================================================== */
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-nav]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href && href.startsWith('#')) {
    e.preventDefault();
    window.location.hash = href;
  }
});

/* =====================================================================
   15. INICIALIZACIÓN
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadAppointments();
  loadTasks();
  initMenu();
  router();
});
