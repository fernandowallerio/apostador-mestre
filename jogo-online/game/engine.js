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
        shape: 'interceptor',
        weaponType: 'burst',
        projectileColor: '#7fe7ff',
        projectileSize: 2,
        projectileSpeed: 0.40,
        burstCount: 3,
        spreadAngle: 0.12
      },
      fragata: {
        type: 'Fragata',
        moveRange: 150,
        shotRange: 360,
        speed: 1.0,
        damage: 25,
        size: 14,
        hp: 120,
        shape: 'fragata',
        weaponType: 'standard',
        projectileColor: '#4da6ff',
        projectileSize: 3.2,
        projectileSpeed: 0.30
      },
      cruzador: {
        type: 'Cruzador',
        moveRange: 110,
        shotRange: 340,
        speed: 0.8,
        damage: 40,
        size: 18,
        hp: 180,
        shape: 'cruzador',
        weaponType: 'heavy',
        projectileColor: '#5f79ff',
        projectileSize: 5.2,
        projectileSpeed: 0.22
      },
      sniper: {
        type: 'Sniper',
        moveRange: 120,
        shotRange: 600,
        speed: 0.85,
        damage: 50,
        size: 12,
        hp: 70,
        shape: 'sniper',
        weaponType: 'beam',
        projectileColor: '#ffffff',
        projectileSize: 2,
        projectileSpeed: 0.80
      },
      artilharia: {
        type: 'Artilharia',
        moveRange: 90,
        shotRange: 450,
        speed: 0.6,
        damage: 60,
        size: 19,
        hp: 150,
        shape: 'artilharia',
        weaponType: 'explosive',
        projectileColor: '#ffae42',
        projectileSize: 6,
        projectileSpeed: 0.18,
        splashRadius: 34
      },
      rastreadora: {
        type: 'Rastreadora',
        moveRange: 120,
        shotRange: 420,
        speed: 0.9,
        damage: 35,
        size: 13,
        hp: 100,
        shape: 'rastreadora',
        weaponType: 'homing',
        projectileColor: '#ff5cff',
        projectileSize: 3.5,
        projectileSpeed: 0.24,
        turnRate: 0.0032
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
          angle: Math.PI / 2,
          weaponType: def.weaponType,
          projectileColor: def.projectileColor,
          projectileSize: def.projectileSize,
          projectileSpeed: def.projectileSpeed,
          burstCount: def.burstCount || 1,
          spreadAngle: def.spreadAngle || 0,
          splashRadius: def.splashRadius || 0,
          turnRate: def.turnRate || 0
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
          angle: -Math.PI / 2,
          weaponType: def.weaponType,
          projectileColor: def.projectileColor,
          projectileSize: def.projectileSize,
          projectileSpeed: def.projectileSpeed,
          burstCount: def.burstCount || 1,
          spreadAngle: def.spreadAngle || 0,
          splashRadius: def.splashRadius || 0,
          turnRate: def.turnRate || 0
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

    const DEFAULT_PROJECTILE_SPEED = 0.272;
    const HIT_RADIUS = 13;

    function getAngleToPoint(ship, point) {
      return Math.atan2(point.y - ship.y, point.x - ship.x) + Math.PI / 2;
    }

    function normalizeAngle(angle) {
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      return angle;
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

    function getEnemyShips(ownerShipId) {
      const owner = ships.find((ship) => ship.id === ownerShipId);
      if (!owner) return [];
      return getAliveShips().filter((ship) => ship.player !== owner.player);
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

    function addImpactEffect(x, y, scale = 1) {
      state.impactEffects.push({
        x,
        y,
        startedAt: performance.now(),
        duration: 240,
        scale
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
        const radius = (4 + (22 * t)) * (effect.scale || 1);
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

    function drawProjectileByType(projectile) {
      const size = projectile.projectileSize || 3;
      const color = projectile.projectileColor || '#ff5a5a';
      const weaponType = projectile.weaponType || 'standard';

      ctx.save();
      ctx.translate(projectile.x, projectile.y);

      if (weaponType !== 'standard') {
        ctx.rotate(Math.atan2(projectile.dirY, projectile.dirX) + Math.PI / 2);
      }

      switch (weaponType) {
        case 'burst':
          ctx.strokeStyle = color + '66';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(0, size * 3.2);
          ctx.lineTo(0, -size * 3.2);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'heavy':
          ctx.strokeStyle = color + '55';
          ctx.lineWidth = size + 1;
          ctx.beginPath();
          ctx.moveTo(0, size * 3.4);
          ctx.lineTo(0, -size * 2.8);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, size + 1.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffffaa';
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'beam':
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, size * 7);
          ctx.lineTo(0, -size * 7);
          ctx.stroke();

          ctx.strokeStyle = '#ffffffaa';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, size * 4);
          ctx.lineTo(0, -size * 4);
          ctx.stroke();
          break;

        case 'explosive':
          ctx.strokeStyle = color + '55';
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(0, size * 3.4);
          ctx.lineTo(0, -size * 2.6);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, size + 1, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fff4';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, size + 4, 0, Math.PI * 2);
          ctx.stroke();
          break;

        case 'homing':
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(0, -size * 1.8);
          ctx.lineTo(-size * 0.7, size * 1.0);
          ctx.lineTo(size * 0.7, size * 1.0);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = color + '55';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, size * 2.3);
          ctx.lineTo(0, size * 4.8);
          ctx.stroke();
          break;

        default:
          ctx.strokeStyle = color + '55';
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(0, size * 3);
          ctx.lineTo(0, -size * 3);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, Math.PI * 2);
          ctx.fill();
      }

      ctx.restore();
    }

    function drawProjectiles() {
      for (const projectile of state.projectiles) {
        if (!projectile.alive) continue;
        drawProjectileByType(projectile);
      }
    }

    function spawnProjectilesForShip(ship) {
      if (!ship.fireTarget) return [];

      const dx = ship.fireTarget.x - ship.x;
      const dy = ship.fireTarget.y - ship.y;
      const baseAngle = Math.atan2(dy, dx);
      const distance = Math.hypot(dx, dy) || 1;
      const dirX = dx / distance;
      const dirY = dy / distance;

      const weaponType = ship.weaponType || 'standard';
      const projectileColor = ship.projectileColor || '#ff5a5a';
      const projectileSize = ship.projectileSize || 3;
      const projectileSpeed = ship.projectileSpeed || DEFAULT_PROJECTILE_SPEED;

      if (weaponType === 'burst') {
        const count = ship.burstCount || 3;
        const spread = ship.spreadAngle || 0.10;
        const projectiles = [];

        for (let i = 0; i < count; i += 1) {
          const offsetIndex = i - (count - 1) / 2;
          const angle = baseAngle + offsetIndex * spread;
          const burstDirX = Math.cos(angle);
          const burstDirY = Math.sin(angle);

          projectiles.push({
            ownerShipId: ship.id,
            weaponType,
            projectileColor,
            projectileSize,
            projectileSpeed,
            x: ship.x,
            y: ship.y,
            dirX: burstDirX,
            dirY: burstDirY,
            damage: Math.ceil(ship.damage / count),
            impactScale: 0.8,
            alive: true
          });
        }

        return projectiles;
      }

      if (weaponType === 'heavy') {
        return [{
          ownerShipId: ship.id,
          weaponType,
          projectileColor,
          projectileSize,
          projectileSpeed,
          x: ship.x,
          y: ship.y,
          dirX,
          dirY,
          damage: ship.damage,
          impactScale: 1.45,
          alive: true
        }];
      }

      if (weaponType === 'beam') {
        return [{
          ownerShipId: ship.id,
          weaponType,
          projectileColor,
          projectileSize,
          projectileSpeed,
          x: ship.x,
          y: ship.y,
          dirX,
          dirY,
          damage: ship.damage,
          impactScale: 0.9,
          alive: true
        }];
      }

      if (weaponType === 'explosive') {
        return [{
          ownerShipId: ship.id,
          weaponType,
          projectileColor,
          projectileSize,
          projectileSpeed,
          x: ship.x,
          y: ship.y,
          dirX,
          dirY,
          damage: ship.damage,
          splashRadius: ship.splashRadius || 32,
          impactScale: 1.8,
          alive: true
        }];
      }

      if (weaponType === 'homing') {
        return [{
          ownerShipId: ship.id,
          weaponType,
          projectileColor,
          projectileSize,
          projectileSpeed,
          x: ship.x,
          y: ship.y,
          dirX,
          dirY,
          damage: ship.damage,
          turnRate: ship.turnRate || 0.003,
          impactScale: 1.1,
          alive: true
        }];
      }

      return [{
        ownerShipId: ship.id,
        weaponType,
        projectileColor,
        projectileSize,
        projectileSpeed,
        x: ship.x,
        y: ship.y,
        dirX,
        dirY,
        damage: ship.damage,
        impactScale: 1,
        alive: true
      }];
    }

    function applyExplosionDamage(projectile, impactX, impactY) {
      const splashRadius = projectile.splashRadius || 0;
      if (splashRadius <= 0) return;

      for (const target of getAliveShips()) {
        if (target.id === projectile.ownerShipId) continue;

        const distance = Math.hypot(impactX - target.x, impactY - target.y);
        if (distance > splashRadius) continue;

        const factor = 1 - (distance / splashRadius);
        const splashDamage = Math.max(8, Math.round(projectile.damage * 0.45 * factor));

        target.hp = Math.max(0, target.hp - splashDamage);
        target.hitFlashUntil = performance.now() + 160;

        if (target.hp === 0) {
          addDestructionEffect(target.x, target.y);
          target.alive = false;
          target.destination = null;
          target.fireTarget = null;
          if (state.selectedShipId === target.id) {
            state.selectedShipId = null;
          }
        }
      }
    }

    function updateHomingProjectile(projectile, dt) {
      const enemies = getEnemyShips(projectile.ownerShipId);
      if (enemies.length === 0) return;

      let closestTarget = null;
      let closestDistance = Infinity;

      for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestTarget = enemy;
        }
      }

      if (!closestTarget) return;

      const desiredAngle = Math.atan2(closestTarget.y - projectile.y, closestTarget.x - projectile.x);
      const currentAngle = Math.atan2(projectile.dirY, projectile.dirX);
      const angleDiff = normalizeAngle(desiredAngle - currentAngle);
      const maxTurn = (projectile.turnRate || 0.003) * dt;
      const appliedTurn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
      const newAngle = currentAngle + appliedTurn;

      projectile.dirX = Math.cos(newAngle);
      projectile.dirY = Math.sin(newAngle);
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

      const shootingShips = getAliveShips().filter((ship) => ship.fireTarget);

      if (movingShips.length === 0 && shootingShips.length === 0) return;

      state.animating = true;
      state.dragging = false;
      state.dragPoint = null;
      updateTurnStatus();

      state.projectiles = [];
      for (const ship of shootingShips) {
        const newProjectiles = spawnProjectilesForShip(ship);
        state.projectiles.push(...newProjectiles);
      }

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

          if (projectile.weaponType === 'homing') {
            updateHomingProjectile(projectile, dt);
          }

          const step = (projectile.projectileSpeed || DEFAULT_PROJECTILE_SPEED) * dt;
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
              addImpactEffect(projectile.x, projectile.y, projectile.impactScale || 1);

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

              if (projectile.weaponType === 'explosive') {
                applyExplosionDamage(projectile, projectile.x, projectile.y);
                addImpactEffect(projectile.x, projectile.y, 2.1);
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
