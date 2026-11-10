const $ = id => document.getElementById(id);
const cv = $('lienzo'), cx = cv.getContext('2d');
const W = 800, H = 450;

// Cada habitación: plataformas [x,y,ancho,alto], puerta [x,y] y un reto.
const salas = [
  { inicio: [40, 370], puerta: [710, 140],
    plat: [[0,410,800,40],[190,340,140,16],[400,280,140,16],[600,210,200,16]],
    reto: { tipo: 'operacion', titulo: 'Puerta 1 · Operación',
      texto: 'let a = 7;\nlet b = 3;\n¿Cuánto vale a * b + 2?', resp: '23' } },
  { inicio: [40, 370], puerta: [710, 340],
    plat: [[0,410,260,40],[340,410,460,40],[480,330,120,16]],
    reto: { tipo: 'condicion', titulo: 'Puerta 2 · Condición',
      texto: 'let edad = 15;\n¿Qué condición es verdadera?',
      opciones: ['edad >= 18', 'edad < 18 && edad > 10', 'edad === 20'], correcta: 1 } },
  { inicio: [40, 370], puerta: [710, 100],
    plat: [[0,410,800,40],[120,350,100,16],[280,290,100,16],[440,230,100,16],[600,170,200,16]],
    reto: { tipo: 'secuencia', titulo: 'Puerta 3 · Secuencia',
      texto: 'Ordena las instrucciones para sumar los números del 1 al 3 y mostrar el resultado.',
      pasos: ['total = 0', 'para i de 1 a 3:', '    total = total + i', 'mostrar total'] } }
];

const teclas = {};
let n = 0, abierta = false, pausa = false;
const jug = { x: 0, y: 0, w: 24, h: 34, vx: 0, vy: 0, suelo: false };
const sala = () => salas[n];
const choca = (j, p) => j.x < p[0] + p[2] && j.x + j.w > p[0] && j.y < p[1] + p[3] && j.y + j.h > p[1];
const rectPuerta = () => [sala().puerta[0], sala().puerta[1], 44, 70];
const cerca = () => choca(jug, rectPuerta());

function cargar(i) {
  n = i; abierta = false; pausa = false;
  $('sala').textContent = n + 1; $('total').textContent = salas.length;
  reaparecer();
}
function reaparecer() { [jug.x, jug.y] = sala().inicio; jug.vx = jug.vy = 0; }

function mover() {
  jug.vx = ((teclas.arrowright || teclas.d) ? 1 : 0) - ((teclas.arrowleft || teclas.a) ? 1 : 0);
  jug.vx *= 3.2;
  if ((teclas.arrowup || teclas.w || teclas[' ']) && jug.suelo) { jug.vy = -11; jug.suelo = false; }
  jug.vy += 0.55;
  jug.x += jug.vx;
  for (const p of sala().plat) if (choca(jug, p)) jug.x = jug.vx > 0 ? p[0] - jug.w : p[0] + p[2];
  jug.y += jug.vy; jug.suelo = false;
  for (const p of sala().plat) if (choca(jug, p)) {
    if (jug.vy > 0) { jug.y = p[1] - jug.h; jug.suelo = true; } else jug.y = p[1] + p[3];
    jug.vy = 0;
  }
  jug.x = Math.max(0, Math.min(W - jug.w, jug.x));
  if (jug.y > H + 80) reaparecer();
  if (abierta && cerca()) siguiente();
}

function siguiente() {
  if (n + 1 < salas.length) return cargar(n + 1);
  pausa = true;
  mostrar('¡Completaste todas las habitaciones!', 'Has resuelto operaciones, condiciones y secuencias.');
  const b = boton('Jugar de nuevo', () => { ocultar(); cargar(0); });
  $('m-cuerpo').append(b); $('m-cerrar').classList.add('oculto');
}

function boton(t, f) { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = f; return b; }
function mostrar(titulo, texto) {
  $('m-titulo').textContent = titulo; $('m-texto').textContent = texto;
  $('m-msg').textContent = ''; $('m-msg').className = ''; $('m-cuerpo').innerHTML = '';
  $('m-cerrar').classList.remove('oculto'); $('modal').classList.remove('oculto');
}
function ocultar() { $('modal').classList.add('oculto'); pausa = false; for (const k in teclas) teclas[k] = false; }

function validar(ok) {
  const m = $('m-msg');
  if (ok) { m.textContent = '¡Correcto! La puerta se abre.'; m.className = 'ok'; abierta = true; setTimeout(ocultar, 900); }
  else { m.textContent = 'Todavía no. Revisa y vuelve a intentarlo.'; m.className = 'mal'; }
}

function abrirReto() {
  const r = sala().reto, c = $('m-cuerpo');
  pausa = true; mostrar(r.titulo, r.texto);
  if (r.tipo === 'operacion') {
    const i = document.createElement('input'); i.setAttribute('aria-label', 'Respuesta');
    const b = boton('Comprobar', () => validar(i.value.trim() === r.resp));
    i.onkeydown = e => { if (e.key === 'Enter') b.click(); };
    c.append(i, b); i.focus();
  } else if (r.tipo === 'condicion') {
    r.opciones.forEach((o, k) => c.append(boton(o, () => validar(k === r.correcta))));
  } else {
    const sel = [], lista = document.createElement('ol');
    [...r.pasos].sort(() => Math.random() - 0.5).forEach(p => {
      const b = boton(p.trim(), () => {
        sel.push(p); const li = document.createElement('li'); li.textContent = p; lista.append(li); b.disabled = true;
      });
      c.append(b);
    });
    c.append(lista, boton('Ejecutar', () => validar(sel.join('|') === r.pasos.join('|'))), boton('Reiniciar', abrirReto));
  }
}

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape' && !$('m-cerrar').classList.contains('oculto')) return ocultar();
  if (pausa) return;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  teclas[k] = true;
  if (k === 'e' && cerca() && !abierta) abrirReto();
});
addEventListener('keyup', e => { teclas[e.key.toLowerCase()] = false; });
$('m-cerrar').onclick = ocultar;

function dibujar() {
  cx.clearRect(0, 0, W, H);
  cx.fillStyle = '#f3efe4';
  for (const p of sala().plat) { cx.fillRect(...p); }
  cx.fillStyle = '#c9c1a8';
  for (const p of sala().plat) cx.fillRect(p[0], p[1], p[2], 4);
  const [dx, dy, dw, dh] = rectPuerta();
  cx.fillStyle = abierta ? '#0b171b' : '#f2a516'; cx.fillRect(dx, dy, dw, dh);
  cx.strokeStyle = '#f3efe4'; cx.lineWidth = 3; cx.strokeRect(dx, dy, dw, dh);
  if (!abierta) { cx.fillStyle = '#10242b'; cx.beginPath(); cx.arc(dx + 32, dy + 38, 4, 0, 7); cx.fill(); }
  cx.fillStyle = '#4fd1c5'; cx.fillRect(jug.x, jug.y, jug.w, jug.h);
  cx.fillStyle = '#10242b'; cx.fillRect(jug.x + 14, jug.y + 8, 5, 5);
  if (cerca() && !abierta) {
    cx.fillStyle = '#f3efe4'; cx.font = '16px Georgia'; cx.textAlign = 'center';
    cx.fillText('Pulsa E para abrir', dx + 22, dy - 10);
  }
}

function bucle() { if (!pausa) mover(); dibujar(); requestAnimationFrame(bucle); }
cargar(0); bucle();
