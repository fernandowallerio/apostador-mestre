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

  const arenaWrap = document.querySelector('.arena-wrap');
  const topBar = document.querySelector('.top-bar');

  function createFleetScreen() {
    const overlay = document.createElement('div');
    overlay.id = 'fleetOverlay';
    overlay.className = 'fleet-overlay';

    overlay.innerHTML = `
      <div class="fleet-panel">
        <div class="fleet-header">
          <h2>Escolha sua Frota</h2>
          <p>Selecione exatamente ${FLEET_LIMIT} naves para iniciar a batalha.</p>
        </div>

        <div id="fleetStatus" class="fleet-status">
          Selecionadas: 0 / ${FLEET_LIMIT}
        </div>

        <div id="fleetGrid" class="fleet-grid"></div>

        <div class="fleet-actions">
          <button id="clearFleetSelection" type="button">Limpar seleção</button>
          <button id="confirmFleetSelection" type="button">Confirmar frota</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  function renderFleetCards() {
    const grid = document.getElementById('fleetGrid');
    const status = document.getElementById('fleetStatus');

    if (!grid || !status) return;

    status.textContent = `Selecionadas: ${selectedFleet.length} / ${FLEET_LIMIT}`;
    grid.innerHTML = '';

    SHIP_CLASSES.forEach((shipClass) => {
      const isSelected = selectedFleet.includes(shipClass.id);

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `fleet-card ${isSelected ? 'selected' : ''}`;

      card.innerHTML = `
        <div class="fleet-card-top">
          <h3>${shipClass.name}</h3>
          <span class="fleet-badge">${shipClass.badge}</span>
        </div>
        <p class="fleet-description">${shipClass.description}</p>
        <div class="fleet-stats">
          <div><strong>HP:</strong> ${shipClass.hp}</div>
          <div><strong>Mov.:</strong> ${shipClass.move}</div>
          <div><strong>Tiro:</strong> ${shipClass.shot}</div>
          <div><strong>Dano:</strong> ${shipClass.damage}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        if (isSelected) {
          selectedFleet = selectedFleet.filter((id) => id !== shipClass.id);
        } else {
          if (selectedFleet.length >= FLEET_LIMIT) return;
          selectedFleet.push(shipClass.id);
        }

        renderFleetCards();
      });

      grid.appendChild(card);
    });
  }

  function bindFleetActions(overlay) {
    const clearButton = document.getElementById('clearFleetSelection');
    const confirmButton = document.getElementById('confirmFleetSelection');

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        selectedFleet = [];
        renderFleetCards();
      });
    }

    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        if (selectedFleet.length !== FLEET_LIMIT) {
          alert(`Escolha exatamente ${FLEET_LIMIT} naves.`);
          return;
        }

        window.selectedFleet = [...selectedFleet];

        overlay.remove();

        if (topBar) topBar.style.display = '';
        if (arenaWrap) arenaWrap.style.display = '';

        if (window.BatalhaEspacial && typeof window.BatalhaEspacial.init === 'function') {
          window.BatalhaEspacial.init();
        }
      });
    }
  }

  if (topBar) topBar.style.display = 'none';
  if (arenaWrap) arenaWrap.style.display = 'none';

  const overlay = createFleetScreen();
  renderFleetCards();
  bindFleetActions(overlay);
});
