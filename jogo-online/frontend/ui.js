const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

// Configurações visuais
const SHOT_SPEED = 0.272;
const HIT_RADIUS = 13;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Desenha o fundo e as naves
  ships.forEach(ship => {
    if (ship.alive) {
      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Inicia o desenho
window.addEventListener('resize', () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  draw();
});
draw();
