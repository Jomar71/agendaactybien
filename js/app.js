/* Copia espejo en js/app.js para compatibilidad de carga directa desde la raíz */
const script = document.createElement('script');
script.src = 'frontend/js/app.js';
document.head.appendChild(script);
