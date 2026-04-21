(() => {
  function createGame() {
    const canvas = document.getElementById('spaceCanvas');
    const ctx = canvas.getContext('2d');

    const stars = [];

    const CLASS_DEFS = {
      interceptor: {
        type: 'Interceptor',
        moveRange: 180,
        shotRange: 420,
        speed: 1.25,
        damage: 15,
        size: 11,
        hp: 80,
        shape: 'interceptor'
      },
      fragata: {
        type: 'Fragata',
        moveRange: 150,
        shotRange: 360,
        speed: 1.0,
        damage: 25,
        size: 14,
        hp: 120,
        shape: 'fragata'
      },
      cruzador: {
        type: 'Cruzador',
        moveRange: 110,
        shotRange: 340,
        speed: 0.8,
        damage: 40,
        size: 18,
        hp: 180,
        shape: 'cruzador'
      },
      sniper: {
        type: 'Sniper',
        moveRange: 120,
        shotRange: 600,
        speed: 0.85,
        damage: 50,
        size: 12,
        hp: 70,
        shape: 'sniper'
      },
      artilharia: {
        type: 'Artilharia',
        moveRange: 90,
        shotRange: 450,
        speed: 0.6,
        damage: 60,
        size: 19,
        hp: 150,
        shape: 'artilharia'
      },
      rastreadora: {
        type: 'Rastreadora',
        moveRange: 120,
        shotRange: 420,
        speed: 0.9,
        damage: 35,
        size: 13,
        hp: 100,
        shape: 'rastreadora'
      }
    };

    function buildShipsFromFleet() {
      const fallbackFleet = ['interceptor', 'fragata', 'cruzador'];
      const selectedFleet = Array.isArray(window.selectedFleet) && window.selectedFleet.length === 3
        ? window.selectedFleet
        : fallbackFleet;

      const p1Positions = [
        { x: 180, y: 120 },
        { x: 180, y: 240 },
        { x: 180, y: 360 }
      ];

      const p2Positions = [
        { x: 820, y: 120 },
        { x: 820, y: 240 },
        { x: 820, y: 360 }
      ];

      const ships = [];
      let idCounter = 1;

      selectedFleet.forEach((classId, index) => {
        const def = CLASS_DEFS[classId];
        if (!def) return;

        ships.push({
          id: idCounter++,
          classId,
          player: 1,
          type: def.type,
          name: `P1 ${def.type}`,
          x: p1Positions[index].x,
          y: p1Positions[index].y,
          moveRange: def.moveRange,
          shotRange: def.shotRange,
          speed: def.speed,
          damage: def.damage,
          size: def.size,
          shape: def.shape,
          color: '#8ec8ff',
          destination: null,
          fireTarget: null,
          hp: def.hp,
          maxHp: def.hp,
          alive: true,
          hitFlashUntil: 0,
          angle: Math.PI / 2
        });
      });

      selectedFleet.forEach((classId, index) => {
        const def = CLASS_DEFS[classId];
        if (!def) return;

        ships.push({
          id: idCounter++,
          classId,
          player: 2,
          type: def.type,
          name: `P2 ${def.type}`,
          x: p2Positions[index].x,
          y: p2Positions[index].y,
          moveRange: def.moveRange,
          shotRange: def.shotRange,
          speed: def.speed,
          damage: def.damage,
          size: def.size,
          shape: def.shape,
          color: '#ffb0b0',
          destination: null,
          fireTarget: null,
          hp: def.hp,
          maxHp: def.hp,
          alive: true,
          hitFlashUntil: 0,
          angle: -Math.PI / 2
        });
      });

      return ships;
    }

    const ships = buildShipsFromFleet();

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

    function getAngleToPoint(ship, point) {
      return Math.atan2(point.y - ship.y, point.x - ship.x) + Math.PI / 2;
    }

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
      for (let i = 0; i < amount; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.8,
          a: 0.25 + Math.random() * 0.55,
        });
      }
    }

    function clampDestination(ship, point) {
      const dx = point.x - ship.x;
      const dy = point.y - ship.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= ship.moveRange) return point;
      const ratio = ship.moveRange / distance;
      return {
        x: ship.x + dx * ratio,
        y: ship.y + dy * ratio,
      };
    }

    function clampFireTarget(ship, point) {
      const dx = point.x - ship.x;
      const dy = point.y - ship.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= ship.shotRange) return point;
      const ratio = ship.shotRange / distance;
      return {
        x: ship.x + dx * ratio,
        y: ship.y + dy * ratio,
      };
    }

    function getShipAt(x, y) {
      return ships.find((ship) => ship.alive && Math.hypot(x - ship.x, y - ship.y) <= 22) || null;
    }

    function getSelectedShip() {
      return ships.find((ship) => ship.alive && ship.id === state.selectedShipId) || null;
    }

    function getAliveShips() {
      return ships.filter((ship) => ship.alive);
    }

    function getPlanningShips(player) {
      return getAliveShips().filter((ship) => ship.player === player);
    }

    function canControlShip(ship) {
      return ship && ship.alive && ship.player === state.currentPlanningPlayer && !state.animating;
    }

    function updateTurnStatus() {
      const turnStatus = document.getElementById('turnStatus');
      const executeButton = document.getElementById('executeTurn');
      const finishButton = document.getElementById('finishPlanning');
      const bothReady = state.planningDone[1] && state.planningDone[2];
      const current = state.currentPlanningPlayer;
      const teamLabel = current === 1 ? 'Jogador 1 (Azul)' : 'Jogador 2 (Vermelho)';
      const aliveCount = getPlanningShips(current).length;

      turnStatus.textContent = bothReady
        ? 'Planejamento concluído para os dois jogadores. Pode executar o turno.'
        : `Vez de planejamento: ${teamLabel} - naves ativas: ${aliveCount}.`;

      turnStatus.className = `hint ${bothReady ? 'turn-ready' : current === 1 ? 'turn-p1' : 'turn-p2'}`;
      executeButton.disabled = !bothReady || state.animating;
      finishButton.disabled = bothReady || state.animating;
    }

    function addImpactEffect(x, y) {
      state.impactEffects.push({
        x,
        y,
        startedAt: performance.now(),
        duration: 240,
      });
    }

    function addDestructionEffect(x, y) {
      state.destructionEffects.push({
        x,
        y,
        startedAt: performance.now(),
        duration: 420,
      });
    }

    function updateVisualEffects(now) {
      state.impactEffects = state.impactEffects.filter((effect) => (now - effect.startedAt) < effect.duration);
      state.destructionEffects = state.destructionEffects.filter((effect) => (now - effect.startedAt) < effect.duration);
      return state.impactEffects.length > 0 || state.destructionEffects.length > 0;
    }

    function drawBackground() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#070d1f');
      grad.addColorStop(1, '#030611');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const star of stars) {
        ctx.fillStyle = `rgba(210, 230, 255, ${star.a})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawRange(ship) {
      ctx.strokeStyle = 'rgba(139, 255, 207, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.moveRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawInterceptor(ship) {
      const s = ship.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.45);
      ctx.lineTo(-s * 0.32, -s * 0.1);
      ctx.lineTo(-s * 0.68, s * 0.95);
      ctx.lineTo(0, s * 0.35);
      ctx.lineTo(s * 0.68, s * 0.95);
      ctx.lineTo(s * 0.32, -s * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-s * 0.18, s * 0.22);
      ctx.lineTo(0, s * 0.7);
      ctx.lineTo(s * 0.18, s * 0.22);
      ctx.closePath();
      ctx.fill();
    }

    function drawFragata(ship) {
      const s = ship.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.15);
      ctx.lineTo(-s * 0.72, -s * 0.05);
      ctx.lineTo(-s * 0.58, s * 0.9);
      ctx.lineTo(s * 0.58, s * 0.9);
      ctx.lineTo(s * 0.72, -s * 0.05);
      ctx.closePath();
      ctx.fill();
    }

    function drawCruzador(ship) {
      const s = ship.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.05);
      ctx.lineTo(-s * 1.0, -s * 0.05);
      ctx.lineTo(-s * 0.82, s * 0.35);
      ctx.lineTo(-s * 0.58, s * 1.05);
      ctx.lineTo(s * 0.58, s * 1.05);
      ctx.lineTo(s * 0.82, s * 0.35);
      ctx.lineTo(s * 1.0, -s * 0.05);
      ctx.closePath();
      ctx.fill();

      ctx.fillRect(-s * 0.18, -s * 0.5, s * 0.36, s * 0.95);
    }

    function drawSniper(ship) {
      const s = ship.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.75);
      ctx.lineTo(-s * 0.22, -s * 0.15);
      ctx.lineTo(-s * 0.42, s * 1.0);
      ctx.lineTo(0, s * 0.48);
      ctx.lineTo(s * 0.42, s * 1.0);
      ctx.lineTo(s * 0.22, -s * 0.15);
      ctx.closePath();
      ctx.fill();

      ctx.fillRect(-s * 0.06, -s * 1.95, s * 0.12, s * 0.5);
    }

    function drawArtilharia(ship) {
      const s = ship.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.95);
      ctx.lineTo(-s * 1.05, -s * 0.1);
      ctx.lineTo(-s * 0.9, s * 0.28);
      ctx.lineTo(-s * 0.7, s * 1.05);
      ctx.lineTo(s * 0.7, s * 1.05);
      ctx.lineTo(s * 0.9, s * 0.28);
      ctx.lineTo(s * 1.05, -s * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.fillRect(-s * 0.16, -s * 1.55, s * 0.32, s * 0.9);
      ctx.fillRect(-s * 0.42, -s * 0.25, s * 0.84, s * 0.2);
    }

    function drawRastreadora(ship) {
      const s = ship.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.2);
      ctx.lineTo(-s * 0.88, -s * 0.05);
      ctx.lineTo(0, s * 1.1);
      ctx.lineTo(s * 0.88, -s * 0.05);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.25);
      ctx.lineTo(0, -s * 0.75);
      ctx.lineTo(s * 0.55, -s * 0.25);
      ctx.stroke();
    }

    function drawShip(ship, selected) {
      const now = performance.now();
      const hitFlashOn = ship.hitFlashUntil > now && Math.floor(now / 55) % 2 === 0;

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle || 0);

      ctx.fillStyle = hitFlashOn ? '#ffffff' : ship.color;
      ctx.strokeStyle = selected ? '#ffffff' : 'rgba(230, 240, 255, 0.7)';
      ctx.lineWidth = selected ? 2.5 : 1.2;

      switch (ship.shape) {
        case 'interceptor':
          drawInterceptor(ship);
          break;
        case 'fragata':
          drawFragata(ship);
          break;
        case 'cruzador':
          drawCruzador(ship);
          break;
        case 'sniper':
          drawSniper(ship);
          break;
        case 'artilharia':
          drawArtilharia(ship);
          break;
        case 'rastreadora':
          drawRastreadora(ship);
          break;
        default:
          drawFragata(ship);
      }

      ctx.stroke();
      ctx.restore();

      const hpRatio = Math.max(0, ship.hp) / ship.maxHp;
      const barWidth = 34;
      const barX = ship.x - barWidth / 2;
      const barY = ship.y - ship.size - 16;

      ctx.fillStyle = 'rgba(15, 25, 45, 0.9)';
      ctx.fillRect(barX, barY, barWidth, 4);
      ctx.fillStyle = hpRatio > 0.5 ? '#70e070' : hpRatio > 0.25 ? '#ffd46a' : '#ff6b6b';
      ctx.fillRect(barX, barY, barWidth * hpRatio, 4);
    }

    function drawImpactEffects(now) {
      for (const effect of state.impactEffects) {
        const t = Math.min(1, (now - effect.startedAt) / effect.duration);
        const radius = 4 + (22 * t);
        const alpha = 1 - t;
        ctx.strokeStyle = `rgba(255, 230, 180, ${Math.max(0.1, alpha).toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawDestructionEffects(now) {
      for (const effect of state.destructionEffects) {
        const t = Math.min(1, (now - effect.startedAt) / effect.duration);
        const alpha = 1 - t;
        const radius = 8 + (24 * t);

        ctx.fillStyle = `rgba(255, 140, 90, ${(0.55 * alpha).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 220, 160, ${(0.9 * alpha).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawDragPreview(ship) {
      if (!state.dragging || !state.dragPoint || state.selectedShipId !== ship.id) return;

      const isFire = state.dragType === 'fire';

      if (isFire) {
        ctx.strokeStyle = 'rgba(255, 130, 130, 0.35)';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y);
        ctx.lineTo(state.dragPoint.x, state.dragPoint.y);
        ctx.stroke();
      }

      ctx.strokeStyle = isFire ? 'rgba(255, 125, 125, 0.95)' : 'rgba(255, 138, 138, 0.95)';
      ctx.lineWidth = isFire ? 2.1 : 1;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(state.dragPoint.x, state.dragPoint.y);
      ctx.stroke();

      ctx.fillStyle = isFire ? 'rgba(255, 118, 118, 0.95)' : 'rgba(255, 138, 138, 0.95)';
      ctx.beginPath();
      ctx.arc(state.dragPoint.x, state.dragPoint.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawProjectiles() {
      for (const projectile of state.projectiles) {
        if (!projectile.alive) continue;

        const trailLen = 14;
        ctx.strokeStyle = 'rgba(255, 120, 120, 0.42)';
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(projectile.x - projectile.dirX * trailLen, projectile.y - projectile.dirY * trailLen);
        ctx.lineTo(projectile.x, projectile.y);
        ctx.stroke();

        ctx.fillStyle = '#ff5a5a';
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function draw() {
      const now = performance.now();
      updateVisualEffects(now);
      drawBackground();

      const selectedShip = getSelectedShip();
      if (!selectedShip && state.selectedShipId !== null) {
        state.selectedShipId = null;
      }

      if (selectedShip) drawRange(selectedShip);
      if (selectedShip) drawDragPreview(selectedShip);

      drawProjectiles();
      drawImpactEffects(now);
      drawDestructionEffects(now);

      for (const ship of getAliveShips()) {
        drawShip(ship, selectedShip && selectedShip.id === ship.id);
      }
    }

    function toCanvasPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    function easeInOutCubic(t) {
      if (t < 0.5) return 4 * t * t * t;
      return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function executeTurn() {
      if (state.animating) return;
      if (!(state.planningDone[1] && state.planningDone[2])) return;

      const movingShips = getAliveShips()
        .filter((ship) => ship.destination)
        .map((ship) => {
          const target = { ...ship.destination };
          const distance = Math.hypot(target.x - ship.x, target.y - ship.y);
          return {
            ship,
            startX: ship.x,
            startY: ship.y,
            endX: target.x,
            endY: target.y,
            duration: Math.max(460, Math.min(2900, (distance * 6.9) / ship.speed)),
            angle: getAngleToPoint(ship, target)
          };
        });

      const shootingShips = getAliveShips()
        .filter((ship) => ship.fireTarget)
        .map((ship) => {
          const dx = ship.fireTarget.x - ship.x;
          const dy = ship.fireTarget.y - ship.y;
          const distance = Math.hypot(dx, dy) || 1;
          return {
            ship,
            startX: ship.x,
            startY: ship.y,
            dirX: dx / distance,
            dirY: dy / distance,
            damage: ship.damage,
          };
        });

      if (movingShips.length === 0 && shootingShips.length === 0) return;

      state.animating = true;
      state.dragging = false;
      state.dragPoint = null;
      updateTurnStatus();

      state.projectiles = shootingShips.map((shot) => ({
        ship: shot.ship,
        ownerShipId: shot.ship.id,
        x: shot.startX,
        y: shot.startY,
        dirX: shot.dirX,
        dirY: shot.dirY,
        damage: shot.damage,
        alive: true,
      }));

      const startedAt = performance.now();
      let lastNow = startedAt;

      function tick(now) {
        const elapsed = now - startedAt;
        const dt = now - lastNow;
        lastNow = now;
        let anyShipMoving = false;
        let anyProjectileAlive = false;

        for (const movement of movingShips) {
          const t = Math.min(1, elapsed / movement.duration);
          const eased = easeInOutCubic(t);
          movement.ship.x = movement.startX + (movement.endX - movement.startX) * eased;
          movement.ship.y = movement.startY + (movement.endY - movement.startY) * eased;
          movement.ship.angle = movement.angle;
          if (t < 1) anyShipMoving = true;
        }

        for (const projectile of state.projectiles) {
          if (!projectile.alive) continue;

          const step = SHOT_SPEED * dt;
          projectile.x += projectile.dirX * step;
          projectile.y += projectile.dirY * step;

          const outMargin = 8;
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;

          if (
            projectile.x < -outMargin ||
            projectile.y < -outMargin ||
            projectile.x > w + outMargin ||
            projectile.y > h + outMargin
          ) {
            projectile.alive = false;
            continue;
          }

          for (const target of getAliveShips()) {
            if (target.id === projectile.ownerShipId) continue;

            if (Math.hypot(projectile.x - target.x, projectile.y - target.y) <= HIT_RADIUS) {
              addImpactEffect(projectile.x, projectile.y);
              target.hp = Math.max(0, target.hp - projectile.damage);
              target.hitFlashUntil = performance.now() + 180;

              if (target.hp === 0) {
                addDestructionEffect(target.x, target.y);
                target.alive = false;
                target.destination = null;
                target.fireTarget = null;
                if (state.selectedShipId === target.id) {
                  state.selectedShipId = null;
                }
              }

              projectile.alive = false;
              break;
            }
          }

          if (!projectile.alive) continue;
          anyProjectileAlive = true;
        }

        const anyVisualEffects = updateVisualEffects(now);
        draw();

        if (anyShipMoving || anyProjectileAlive || anyVisualEffects) {
          state.animationFrameId = requestAnimationFrame(tick);
          return;
        }

        for (const movement of movingShips) {
          movement.ship.x = movement.endX;
          movement.ship.y = movement.endY;
          movement.ship.destination = null;
        }

        for (const ship of getAliveShips()) {
          ship.fireTarget = null;
        }

        state.animating = false;
        state.animationFrameId = null;
        state.projectiles = [];
        state.planningDone[1] = false;
        state.planningDone[2] = false;
        state.currentPlanningPlayer = 1;
        state.selectedShipId = null;
        updateTurnStatus();
        draw();
      }

      state.animationFrameId = requestAnimationFrame(tick);
    }

    function bindEvents() {
      canvas.addEventListener('mousedown', (event) => {
        if (state.animating) return;
        if (state.planningDone[state.currentPlanningPlayer]) return;

        const point = toCanvasPoint(event);
        const clickedShip = getShipAt(point.x, point.y);

        if (clickedShip && canControlShip(clickedShip)) {
          state.selectedShipId = clickedShip.id;
          state.dragging = true;
          state.dragType = state.mode;
          state.dragPoint = { x: clickedShip.x, y: clickedShip.y };
          draw();
          return;
        }

        state.selectedShipId = null;
        state.dragging = false;
        state.dragPoint = null;
        draw();
      });

      canvas.addEventListener('mousemove', (event) => {
        if (state.animating) return;
        if (!state.dragging) return;

        const selectedShip = getSelectedShip();
        if (!canControlShip(selectedShip)) return;

        const point = toCanvasPoint(event);
        state.dragPoint = state.dragType === 'fire'
          ? clampFireTarget(selectedShip, point)
          : clampDestination(selectedShip, point);

        selectedShip.angle = getAngleToPoint(selectedShip, state.dragPoint);
        draw();
      });

      window.addEventListener('mouseup', () => {
        if (state.animating) return;
        if (!state.dragging) return;

        const selectedShip = getSelectedShip();
        if (canControlShip(selectedShip) && state.dragPoint) {
          if (state.dragType === 'fire') {
            selectedShip.fireTarget = { ...state.dragPoint };
            selectedShip.angle = getAngleToPoint(selectedShip, state.dragPoint);
          } else {
            selectedShip.destination = { ...state.dragPoint };
            selectedShip.angle = getAngleToPoint(selectedShip, state.dragPoint);
          }
        }

        state.dragging = false;
        state.dragPoint = null;
        draw();
      });

      document.getElementById('modeMove').addEventListener('click', () => {
        if (state.animating) return;
        state.mode = 'move';
        document.getElementById('modeMove').classList.add('active');
        document.getElementById('modeFire').classList.remove('active');
      });

      document.getElementById('modeFire').addEventListener('click', () => {
        if (state.animating) return;
        state.mode = 'fire';
        document.getElementById('modeFire').classList.add('active');
        document.getElementById('modeMove').classList.remove('active');
      });

      document.getElementById('finishPlanning').addEventListener('click', () => {
        if (state.animating) return;
        if (state.planningDone[state.currentPlanningPlayer]) return;

        state.planningDone[state.currentPlanningPlayer] = true;
        state.selectedShipId = null;
        state.dragging = false;
        state.dragPoint = null;

        if (!state.planningDone[2]) {
          state.currentPlanningPlayer = 2;
        }

        updateTurnStatus();
        draw();
      });

      document.getElementById('executeTurn').addEventListener('click', () => {
        executeTurn();
      });

      document.getElementById('clearDestinations').addEventListener('click', () => {
        if (state.animating) return;

        for (const ship of getAliveShips()) {
          ship.destination = null;
          ship.fireTarget = null;
        }

        if (!state.animating) {
          state.selectedShipId = null;
        }

        draw();
      });

      window.addEventListener('resize', resizeCanvas);
    }

    function init() {
      bindEvents();
      updateTurnStatus();
      resizeCanvas();
      draw();
    }

    return { init };
  }

  window.BatalhaEspacial = createGame();
})();
