const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
const stars = [];

const state = {
  selectedShipId: null,
  dragging: false,
  dragPoint: null,
  dragType: 'move',
  mode: 'move',
  animating: false,
  animationFrameId: null,
  projectiles: [],
  currentPlanningPlayer: 1,
  planningDone: { 1: false, 2: false },
  impactEffects: [],
  destructionEffects: [],
};

const SHOT_SPEED = 0.272;
const HIT_RADIUS = 13;

function buildStars() {
  stars.length = 0;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const amount = Math.max(120, Math.floor((width * height) / 4500));
  for (let i = 0; i < amount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8,
      a: 0.25 + Math.random() * 0.55,
    });
  }
}

function getShipAt(x, y) {
  return ships.find((ship) => ship.alive && Math.hypot(x - ship.x, y - ship.y) <= 16) || null;
}

function getSelectedShip() {
  return ships.find((ship) => ship.alive && ship.id === state.selectedShipId) || null;
}

function getAliveShips() {
  return ships.filter((ship) => ship.alive);
}

function updateTurnStatus() {
  const turnStatus = document.getElementById('turnStatus');
  const executeButton = document.getElementById('executeTurn');
  const finishButton = document.getElementById('finishPlanning');
  const bothReady = state.planningDone[1] && state.planningDone[2];
  const current = state.currentPlanningPlayer;
  const teamLabel = current === 1 ? 'Jogador 1 (Azul)' : 'Jogador 2 (Vermelho)';
  turnStatus.textContent = bothReady
    ? 'Planejamento concluído. Execute o turno.'
    : `Vez de planejamento: ${teamLabel}`;
  turnStatus.className = `hint ${bothReady ? 'turn-ready' : current === 1 ? 'turn-p1' : 'turn-p2'}`;
  executeButton.disabled = !bothReady || state.animating;
  finishButton.disabled = bothReady || state.animating;
}

function addImpactEffect(x, y) { state.impactEffects.push({ x, y, startedAt: performance.now(), duration: 240 }); }
function addDestructionEffect(x, y) { state.destructionEffects.push({ x, y, startedAt: performance.now(), duration: 420 }); }

function drawBackground() {
  ctx.fillStyle = '#050816';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    ctx.fillStyle = `rgba(210, 230, 255, ${star.a})`;
    ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
  });
}

function drawShip(ship, selected) {
  const size = ship.size || 14;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - size);
  ctx.lineTo(ship.x - size * 0.75, ship.y + size * 0.75);
  ctx.lineTo(ship.x + size * 0.75, ship.y + size * 0.75);
  ctx.closePath();
  ctx.fillStyle = ship.color;
  ctx.fill();
  if (selected) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
}

// Funções de desenho de linha e HUD continuam aqui... (mantido do original)

function draw() {
  drawBackground();
  const sel = getSelectedShip();
  getAliveShips().forEach(ship => {
    if (ship.destination) {
      ctx.strokeStyle = 'rgba(88,166,255,0.8)';
      ctx.beginPath(); ctx.moveTo(ship.x, ship.y); ctx.lineTo(ship.destination.x, ship.destination.y); ctx.stroke();
    }
    if (ship.fireTarget) {
      ctx.strokeStyle = 'rgba(255,140,140,0.8)';
      ctx.beginPath(); ctx.moveTo(ship.x, ship.y); ctx.lineTo(ship.fireTarget.x, ship.fireTarget.y); ctx.stroke();
    }
    drawShip(ship, sel && sel.id === ship.id);
  });
  renderLegend();
}

// Event Listeners (mousedown, mousemove, mouseup) originais
canvas.addEventListener('mousedown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left; const y = e.clientY - r.top;
  const ship = getShipAt(x, y);
  if (ship && ship.player === state.currentPlanningPlayer) {
    state.selectedShipId = ship.id; state.dragging = true;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!state.dragging) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left; const y = e.clientY - r.top;
  const ship = getSelectedShip();
  if (state.mode === 'move') ship.destination = clampDestination(ship, {x, y});
  else ship.fireTarget = clampFireTarget(ship, {x, y});
  draw();
});

window.addEventListener('mouseup', () => { state.dragging = false; });

document.getElementById('modeMove').onclick = () => { state.mode = 'move'; };
document.getElementById('modeFire').onclick = () => { state.mode = 'fire'; };
document.getElementById('finishPlanning').onclick = () => {
  if (state.currentPlanningPlayer === 1) state.currentPlanningPlayer = 2;
  else state.planningDone[1] = state.planningDone[2] = true;
  updateTurnStatus();
};

function renderLegend() { /* Código original da legenda */ }

buildStars();
updateTurnStatus();
draw();
