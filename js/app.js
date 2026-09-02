/* Copia espejo en js/app.js para compatibilidad de carga directa desde la raíz.
   El ?v= fuerza al navegador a descargar la última versión del app real. */
const script = document.createElement('script');
script.src = 'frontend/js/app.js?v=5.4.0';
document.head.appendChild(script);
