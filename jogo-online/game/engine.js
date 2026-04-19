// A lista de naves e seus atributos (HP, Dano, Alcance)
const ships = [
  { id: 1, player: 1, type: 'Interceptor', name: 'P1 Interceptor', x: 120, y: 140, moveRange: 180, shotRange: 420, speed: 1.25, damage: 15, size: 11, color: '#58a6ff', destination: null, fireTarget: null, hp: 80, maxHp: 80, alive: true, hitFlashUntil: 0 },
  { id: 2, player: 1, type: 'Fragata', name: 'P1 Fragata', x: 210, y: 240, moveRange: 150, shotRange: 360, speed: 1.0, damage: 25, size: 14, color: '#6db8ff', destination: null, fireTarget: null, hp: 120, maxHp: 120, alive: true, hitFlashUntil: 0 },
  { id: 7, player: 2, type: 'Interceptor', name: 'P2 Interceptor', x: 860, y: 140, moveRange: 180, shotRange: 420, speed: 1.25, damage: 15, size: 11, color: '#ff8a8a', destination: null, fireTarget: null, hp: 80, maxHp: 80, alive: true, hitFlashUntil: 0 },
  { id: 8, player: 2, type: 'Fragata', name: 'P2 Fragata', x: 770, y: 240, moveRange: 150, shotRange: 360, speed: 1.0, damage: 25, size: 14, color: '#ff9f9f', destination: null, fireTarget: null, hp: 120, maxHp: 120, alive: true, hitFlashUntil: 0 }
  // Adicione as outras naves conforme seu protótipo original se desejar
];

// Funções de cálculo matemático do jogo
function clampDestination(ship, point) {
  const dx = point.x - ship.x;
  const dy = point.y - ship.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= ship.moveRange) return point;
  const ratio = ship.moveRange / distance;
  return { x: ship.x + dx * ratio, y: ship.y + dy * ratio };
}

function clampFireTarget(ship, point) {
  const dx = point.x - ship.x;
  const dy = point.y - ship.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= ship.shotRange) return point;
  const ratio = ship.shotRange / distance;
  return { x: ship.x + dx * ratio, y: ship.y + dy * ratio };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Exportar funções se for usar no Node.js futuramente
if (typeof module !== 'undefined') {
  module.exports = { ships, clampDestination, clampFireTarget, easeInOutCubic };
}
