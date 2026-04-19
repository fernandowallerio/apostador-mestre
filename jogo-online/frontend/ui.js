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

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStars();
  draw();
}

function buildStars() {
  stars.length = 0;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const amount = Math.max(120, Math.floor((width * height) / 4500));
  for (let i = 0; i < amount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.8, a: 0.25 + Math.random() * 0.5 });
  }
}

// ... (Aqui você deve colar todo o restante do código que está dentro da tag <script> do seu arquivo batalha-espacial.html)
// Use exatamente as funções getShipAt, updateTurnStatus, drawShip, executeTurn, etc., que você me enviou.
