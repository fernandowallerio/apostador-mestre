const ships = [
  { id: 1, player: 1, type: 'Interceptor', name: 'P1 Interceptor', x: 120, y: 140, moveRange: 180, shotRange: 420, speed: 1.25, damage: 15, size: 11, color: '#58a6ff', destination: null, fireTarget: null, hp: 80, maxHp: 80, alive: true, hitFlashUntil: 0 },
  { id: 2, player: 1, type: 'Fragata', name: 'P1 Fragata', x: 210, y: 240, moveRange: 150, shotRange: 360, speed: 1.0, damage: 25, size: 14, color: '#6db8ff', destination: null, fireTarget: null, hp: 120, maxHp: 120, alive: true, hitFlashUntil: 0 },
  { id: 3, player: 1, type: 'Cruzador', name: 'P1 Cruzador', x: 300, y: 120, moveRange: 110, shotRange: 340, speed: 0.8, damage: 40, size: 18, color: '#8bcbff', destination: null, fireTarget: null, hp: 180, maxHp: 180, alive: true, hitFlashUntil: 0 },
  { id: 4, player: 1, type: 'Sniper', name: 'P1 Sniper', x: 180, y: 360, moveRange: 120, shotRange: 600, speed: 0.85, damage: 50, size: 12, color: '#74b7ff', destination: null, fireTarget: null, hp: 70, maxHp: 70, alive: true, hitFlashUntil: 0 },
  { id: 5, player: 1, type: 'Artilharia', name: 'P1 Artilharia', x: 320, y: 300, moveRange: 90, shotRange: 450, speed: 0.6, damage: 60, size: 19, color: '#9ad7ff', destination: null, fireTarget: null, hp: 150, maxHp: 150, alive: true, hitFlashUntil: 0 },
  { id: 6, player: 1, type: 'Rastreadora', name: 'P1 Rastreadora', x: 380, y: 230, moveRange: 120, shotRange: 420, speed: 0.9, damage: 35, size: 13, color: '#8ec8ff', destination: null, fireTarget: null, hp: 100, maxHp: 100, alive: true, hitFlashUntil: 0 },
  { id: 7, player: 2, type: 'Interceptor', name: 'P2 Interceptor', x: 860, y: 140, moveRange: 180, shotRange: 420, speed: 1.25, damage: 15, size: 11, color: '#ff8a8a', destination: null, fireTarget: null, hp: 80, maxHp: 80, alive: true, hitFlashUntil: 0 },
  { id: 8, player: 2, type: 'Fragata', name: 'P2 Fragata', x: 770, y: 240, moveRange: 150, shotRange: 360, speed: 1.0, damage: 25, size: 14, color: '#ff9f9f', destination: null, fireTarget: null, hp: 120, maxHp: 120, alive: true, hitFlashUntil: 0 },
  { id: 9, player: 2, type: 'Cruzador', name: 'P2 Cruzador', x: 680, y: 120, moveRange: 110, shotRange: 340, speed: 0.8, damage: 40, size: 18, color: '#ffb3b3', destination: null, fireTarget: null, hp: 180, maxHp: 180, alive: true, hitFlashUntil: 0 },
  { id: 10, player: 2, type: 'Sniper', name: 'P2 Sniper', x: 800, y: 360, moveRange: 120, shotRange: 600, speed: 0.85, damage: 50, size: 12, color: '#ff9a9a', destination: null, fireTarget: null, hp: 70, maxHp: 70, alive: true, hitFlashUntil: 0 },
  { id: 11, player: 2, type: 'Artilharia', name: 'P2 Artilharia', x: 660, y: 300, moveRange: 90, shotRange: 450, speed: 0.6, damage: 60, size: 19, color: '#ffc0c0', destination: null, fireTarget: null, hp: 150, maxHp: 150, alive: true, hitFlashUntil: 0 },
  { id: 12, player: 2, type: 'Rastreadora', name: 'P2 Rastreadora', x: 600, y: 230, moveRange: 120, shotRange: 420, speed: 0.9, damage: 35, size: 13, color: '#ffb0b0', destination: null, fireTarget: null, hp: 100, maxHp: 100, alive: true, hitFlashUntil: 0 },
];

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
  if (t < 0.5) return 4 * t * t * t;
  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}
