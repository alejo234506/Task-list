// ================== Configuración ==================
const CATEGORIAS = {
  personal: { emoji: '🌸', nombre: 'Personal' },
  trabajo: { emoji: '💼', nombre: 'Trabajo' },
  estudio: { emoji: '📚', nombre: 'Estudio' },
  hogar: { emoji: '🏠', nombre: 'Hogar' },
  compras: { emoji: '🛒', nombre: 'Compras' },
  salud: { emoji: '💪', nombre: 'Salud' },
};

const CLAVE = 'tareas-lista';
const EJEMPLO = [
  { texto: 'Terminar el proyecto de JavaScript', categoria: 'estudio', hecha: false },
  { texto: 'Comprar frutas', categoria: 'compras', hecha: true },
  { texto: 'Salir a caminar 30 minutos', categoria: 'salud', hecha: false },
];

// ================== Estado ==================
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    if (Array.isArray(datos)) return datos;
  } catch (e) { /* sin almacenamiento o datos dañados */ }
  return EJEMPLO.map((t) => ({ ...t, id: nuevoId() }));
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(tareas)); } catch (e) { /* sin almacenamiento */ }
}

let tareas = cargar();
let filtro = 'todas';
let editando = null;

// ================== Elementos ==================
const $ = (sel) => document.querySelector(sel);
const form = $('#formulario');
const input = $('#texto');
const selectCat = $('#categoria');
const lista = $('#lista');
const error = $('#error');

selectCat.innerHTML = Object.entries(CATEGORIAS)
  .map(([id, c]) => `<option value="${id}">${c.emoji} ${c.nombre}</option>`)
  .join('');

// ================== Render ==================
function crearItem(t) {
  const cat = CATEGORIAS[t.categoria] || CATEGORIAS.personal;
  const li = document.createElement('li');
  li.className = 'tarea' + (t.hecha ? ' hecha' : '');
  li.dataset.id = t.id;

  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'check';
  check.dataset.accion = 'completar';
  check.setAttribute('aria-pressed', String(t.hecha));
  check.setAttribute('aria-label', (t.hecha ? 'Marcar como pendiente: ' : 'Marcar como completada: ') + t.texto);
  check.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const emoji = document.createElement('span');
  emoji.className = 'emoji';
  emoji.textContent = cat.emoji;
  emoji.title = cat.nombre;
  emoji.setAttribute('aria-hidden', 'true');

  let cuerpo;
  if (editando === t.id) {
    cuerpo = document.createElement('input');
    cuerpo.className = 'editar';
    cuerpo.value = t.texto;
    cuerpo.maxLength = 120;
    cuerpo.setAttribute('aria-label', 'Editar tarea');
  } else {
    cuerpo = document.createElement('span');
    cuerpo.className = 'texto';
    cuerpo.textContent = t.texto;
    cuerpo.tabIndex = 0;
    cuerpo.title = 'Doble clic para editar';
  }

  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = cat.nombre;

  const borrar = document.createElement('button');
  borrar.type = 'button';
  borrar.className = 'borrar';
  borrar.dataset.accion = 'eliminar';
  borrar.setAttribute('aria-label', 'Eliminar tarea: ' + t.texto);
  borrar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  li.append(check, emoji, cuerpo, chip, borrar);
  return li;
}

function render() {
  const visibles = tareas.filter((t) =>
    filtro === 'pendientes' ? !t.hecha : filtro === 'completadas' ? t.hecha : true);

  lista.replaceChildren(...visibles.map(crearItem));

  const vacio = $('#vacio');
  vacio.hidden = visibles.length > 0;
  vacio.textContent = tareas.length === 0
    ? '🎉 No tienes tareas. ¡Agrega la primera!'
    : filtro === 'completadas' ? 'Aún no has completado ninguna tarea.' : '✨ ¡Todo listo! No hay tareas pendientes.';

  const hechas = tareas.filter((t) => t.hecha).length;
  const pendientes = tareas.length - hechas;
  const pct = tareas.length ? Math.round((hechas / tareas.length) * 100) : 0;
  $('#resumen').textContent = tareas.length
    ? `${pendientes} pendiente${pendientes === 1 ? '' : 's'} · ${hechas} completada${hechas === 1 ? '' : 's'}`
    : 'Sin tareas por ahora';
  $('#porcentaje').textContent = pct + '%';
  $('#anillo').style.setProperty('--pct', pct);
  $('#limpiar').hidden = hechas === 0;

  document.querySelectorAll('.filtro').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro)));

  const campo = lista.querySelector('.editar');
  if (campo) { campo.focus(); campo.select(); }
}

// ================== Acciones ==================
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = input.value.trim();
  if (!texto) {
    error.textContent = 'Escribe una tarea antes de crearla.';
    input.focus();
    return;
  }
  error.textContent = '';
  tareas.unshift({ id: nuevoId(), texto, categoria: selectCat.value, hecha: false });
  if (filtro === 'completadas') filtro = 'todas';
  input.value = '';
  guardar();
  render();
  input.focus();
});

input.addEventListener('input', () => { error.textContent = ''; });

lista.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;
  const li = boton.closest('.tarea');
  const tarea = tareas.find((t) => t.id === li.dataset.id);
  if (!tarea) return;

  if (boton.dataset.accion === 'completar') {
    tarea.hecha = !tarea.hecha;
    guardar();
    render();
    const nuevo = lista.querySelector(`[data-id="${tarea.id}"] .check`);
    if (nuevo) nuevo.focus();
  } else if (boton.dataset.accion === 'eliminar') {
    li.classList.add('saliendo');
    const quitar = () => {
      tareas = tareas.filter((t) => t.id !== tarea.id);
      guardar();
      render();
      input.focus();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) quitar();
    else li.addEventListener('animationend', quitar, { once: true });
  }
});

function empezarEdicion(li) {
  if (!li) return;
  editando = li.dataset.id;
  render();
}

function terminarEdicion(guardarCambios) {
  const campo = lista.querySelector('.editar');
  if (!campo || editando === null) return;
  const tarea = tareas.find((t) => t.id === editando);
  const texto = campo.value.trim();
  if (guardarCambios && tarea && texto) tarea.texto = texto;
  const id = editando;
  editando = null;
  guardar();
  render();
  const span = lista.querySelector(`[data-id="${id}"] .texto`);
  if (span) span.focus();
}

lista.addEventListener('dblclick', (e) => {
  if (e.target.classList.contains('texto')) empezarEdicion(e.target.closest('.tarea'));
});

lista.addEventListener('keydown', (e) => {
  if (e.target.classList.contains('texto') && (e.key === 'Enter' || e.key === 'F2')) {
    e.preventDefault();
    empezarEdicion(e.target.closest('.tarea'));
  } else if (e.target.classList.contains('editar')) {
    if (e.key === 'Enter') terminarEdicion(true);
    if (e.key === 'Escape') terminarEdicion(false);
  }
});

lista.addEventListener('focusout', (e) => {
  if (e.target.classList.contains('editar')) terminarEdicion(true);
});

document.querySelectorAll('.filtro').forEach((b) =>
  b.addEventListener('click', () => { filtro = b.dataset.filtro; render(); }));

$('#limpiar').addEventListener('click', () => {
  tareas = tareas.filter((t) => !t.hecha);
  guardar();
  render();
});

// ================== Tema claro / oscuro ==================
const botonTema = $('#tema');
function temaActual() {
  return document.documentElement.dataset.theme
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function pintarBotonTema() {
  botonTema.setAttribute('aria-label', temaActual() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}
botonTema.addEventListener('click', () => {
  const nuevo = temaActual() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nuevo;
  try { localStorage.setItem('tareas-tema', nuevo); } catch (e) { /* sin almacenamiento */ }
  pintarBotonTema();
});

pintarBotonTema();
render();
