const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

// Configurações visuais e de jogo
const SHOT_SPEED = 0.272;
const HIT_RADIUS = 13;

// Estado local da interface
let selectedShipId = null;
let dragging = false;
let dragPoint = null;
let mode = 'move'; 

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 1. Desenha as naves (Usando os dados que vêm do engine.js)
  ships.forEach(ship => {
    if (ship.alive) {
      // Desenha o corpo da nave
      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Se houver destino planejado, desenha a linha
      if (ship.destination) {
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y);
        ctx.lineTo(ship.destination.x, ship.destination.y);
        ctx.stroke();
      }
    }
  });

  // 2. Desenha o rastro do que você está arrastando agora
  if (dragging && dragPoint) {
    const s = ships.find(sh => sh.id === selectedShipId);
    ctx.strokeStyle = mode === 'fire' ? '#ff8a8a' : '#8bffcf';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(dragPoint.x, dragPoint.y);
    ctx.stroke();
  }
}

// --- CONTROLES DE MOUSE ---
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Procura se clicou em alguma nave
  const clicked = ships.find(s => s.alive && Math.hypot(x - s.x, y - s.y) <= 20);
  if (clicked) {
    selectedShipId = clicked.id;
    dragging = true;
    dragPoint = { x, y };
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  dragPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  draw();
});

window.addEventListener('mouseup', () => {
  if (dragging) {
    const ship = ships.find(s => s.id === selectedShipId);
    if (mode === 'move') ship.destination = { ...dragPoint };
    else ship.fireTarget = { ...dragPoint };
  }
  dragging = false;
  draw();
});

// --- BOTÕES DA INTERFACE ---
document.getElementById('modeMove').onclick = () => { mode = 'move'; };
document.getElementById('modeFire').onclick = () => { mode = 'fire'; };
document.getElementById('executeTurn').onclick = () => {
  // Aqui futuramente chamaremos a animação do engine.js
  alert("Turno executado! (Lógica sendo conectada...)");
};

// Inicialização
window.addEventListener('resize', () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  draw();
});
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
draw();
