document.addEventListener('DOMContentLoaded', () => {
  const FLEET_LIMIT = 3;

  const SHIP_CLASSES = [
    {
      id: 'interceptor',
      name: 'Interceptor',
      badge: 'Rápida',
      description: 'Nave leve, veloz e ótima para reposicionamento rápido.',
      hp: 80,
      move: 180,
      shot: 420,
      damage: 15
    },
    {
      id: 'fragata',
      name: 'Fragata',
      badge: 'Equilibrada',
      description: 'Boa resistência e desempenho equilibrado em combate.',
      hp: 120,
      move: 150,
      shot: 360,
      damage: 25
    },
    {
      id: 'cruzador',
      name: 'Cruzador',
      badge: 'Pesada',
      description: 'Alta durabilidade e grande presença na linha de frente.',
      hp: 180,
      move: 110,
      shot: 340,
      damage: 40
    },
    {
      id: 'sniper',
      name: 'Sniper',
      badge: 'Longo alcance',
      description: 'Baixa resistência, mas com poder de ataque à distância.',
      hp: 70,
      move: 120,
      shot: 600,
      damage: 50
    },
    {
      id: 'artilharia',
      name: 'Artilharia',
      badge: 'Impacto',
      description: 'Pouco móvel, porém com dano alto e pressão pesada.',
      hp: 150,
      move: 90,
      shot: 450,
      damage: 60
    },
    {
      id: 'rastreadora',
      name: 'Rastreadora',
      badge: 'Tática',
      description: 'Boa leitura de campo, alcance sólido e mobilidade moderada.',
      hp: 100,
      move: 120,
      shot: 420,
      damage: 35
    }
  ];

  let selectedFleet = [];

  const fleetOverlay = document.getElementById('fleetOverlay');
  const waitingOverlay = document.getElementById('waitingOverlay');
  const fleetOptions = document.getElementById('fleetOptions');
  const fleetStatus = document.getElementById('fleetStatus');
  const confirmFleetBtn = document.getElementById('confirmFleetBtn');

  const topBar = document.querySelector('.top-bar');
  const arenaWrap = document.querySelector('.arena-wrap');

  function updateFleetStatus() {
    if (!fleetStatus) return;

    const count = selectedFleet.length;

    if (count === 0) {
      fleetStatus.textContent = `Escolha ${FLEET_LIMIT} naves para continuar.`;
    } else if (count < FLEET_LIMIT) {
      fleetStatus.textContent = `Selecionadas: ${count} / ${FLEET_LIMIT}`;
    } else {
      fleetStatus.textContent = `Frota pronta: ${count} / ${FLEET_LIMIT}`;
    }

    if (confirmFleetBtn) {
      confirmFleetBtn.disabled = count !== FLEET_LIMIT;
    }
  }

  function toggleShipSelection(shipId) {
    const alreadySelected = selectedFleet.includes(shipId);

    if (alreadySelected) {
      selectedFleet = selectedFleet.filter((id) => id !== shipId);
    } else {
      if (selectedFleet.length >= FLEET_LIMIT) return;
      selectedFleet.push(shipId);
    }

    renderFleetOptions();
    updateFleetStatus();
  }

  function createStat(label, value) {
    return `
      <div class="fleet-stat"><strong>${label}:</strong> ${value}</div>
    `;
  }

  function renderFleetOptions() {
    if (!fleetOptions) return;

    fleetOptions.innerHTML = '';

    SHIP_CLASSES.forEach((shipClass) => {
      const isSelected = selectedFleet.includes(shipClass.id);
      const isDisabled = !isSelected && selectedFleet.length >= FLEET_LIMIT;

      const card = document.createElement('div');
      card.className = `fleet-card${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`;

      card.innerHTML = `
        <div class="fleet-card-title">
          <h3>${shipClass.name}</h3>
          <span class="fleet-card-badge">${shipClass.badge}</span>
        </div>
        <p class="fleet-card-desc">${shipClass.description}</p>
        <div class="fleet-stats">
          ${createStat('HP', shipClass.hp)}
          ${createStat('Mov.', shipClass.move)}
          ${createStat('Tiro', shipClass.shot)}
          ${createStat('Dano', shipClass.damage)}
        </div>
      `;

      card.addEventListener('click', () => {
        if (isDisabled) return;
        toggleShipSelection(shipClass.id);
      });

      fleetOptions.appendChild(card);
    });
  }

  function startBattleAfterFleetSelection() {
    if (fleetOverlay) {
      fleetOverlay.classList.add('hidden');
    }

    if (waitingOverlay) {
      waitingOverlay.classList.add('hidden');
    }

    if (topBar) {
      topBar.style.display = '';
    }

    if (arenaWrap) {
      arenaWrap.style.display = '';
    }

    if (window.BatalhaEspacial && typeof window.BatalhaEspacial.init === 'function') {
      window.BatalhaEspacial.init();
    }
  }

  function confirmFleetSelection() {
    if (selectedFleet.length !== FLEET_LIMIT) {
      alert(`Escolha exatamente ${FLEET_LIMIT} naves.`);
      return;
    }

    window.selectedFleet = [...selectedFleet];

    if (fleetOverlay) {
      fleetOverlay.classList.add('hidden');
    }

    if (waitingOverlay) {
      waitingOverlay.classList.remove('hidden');
    }

    // TEMPORÁRIO:
    // como o online real ainda não existe, vamos simular a confirmação
    // e iniciar a batalha após um pequeno intervalo.
    setTimeout(() => {
      startBattleAfterFleetSelection();
    }, 1200);
  }

  function initFleetUI() {
    if (topBar) {
      topBar.style.display = 'none';
    }

    if (arenaWrap) {
      arenaWrap.style.display = 'none';
    }

    if (fleetOverlay) {
      fleetOverlay.classList.remove('hidden');
    }

    if (waitingOverlay) {
      waitingOverlay.classList.add('hidden');
    }

    renderFleetOptions();
    updateFleetStatus();

    if (confirmFleetBtn) {
      confirmFleetBtn.addEventListener('click', confirmFleetSelection);
    }
  }

  initFleetUI();
});
