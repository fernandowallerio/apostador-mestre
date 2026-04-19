(function () {
  const fleetSetup = document.getElementById('fleetSetup');
  if (!fleetSetup || !window.BatalhaEngine) return;

  const classDefs = window.BatalhaEngine.classDefs;
  const classNames = Object.keys(classDefs);
  const FLEET_SIZE = 4;

  const state = {
    selected: {
      1: new Set(['Interceptor', 'Fragata', 'Cruzador', 'Rastreadora']),
      2: new Set(['Interceptor', 'Fragata', 'Cruzador', 'Rastreadora']),
    },
    confirmed: { 1: false, 2: false },
  };

  function renderFleetCard(player) {
    const side = player === 1 ? 'Jogador 1 (Azul)' : 'Jogador 2 (Vermelho)';
    const checkedCount = state.selected[player].size;
    const disabled = state.confirmed[player] ? 'disabled' : '';

    const items = classNames.map((name) => {
      const def = classDefs[name];
      const checked = state.selected[player].has(name) ? 'checked' : '';
      return `
        <label class="fleet-item">
          <span>
            <strong>${name}</strong>
            <span class="fleet-meta">HP ${def.hp} • Mv ${def.moveRange} • Shot ${def.shotRange} • Dmg ${def.damage}</span>
          </span>
          <input type="checkbox" data-player="${player}" data-class="${name}" ${checked} ${disabled}>
        </label>
      `;
    }).join('');

    return `
      <div class="fleet-card" data-card="${player}">
        <h4>${side}</h4>
        <div class="fleet-meta">Selecione exatamente ${FLEET_SIZE} naves (${checkedCount}/${FLEET_SIZE})</div>
        <div class="fleet-list">${items}</div>
        <button type="button" data-confirm="${player}" ${disabled}>${state.confirmed[player] ? 'Frota confirmada' : 'Confirmar frota'}</button>
      </div>
    `;
  }

  function renderSetup() {
    fleetSetup.innerHTML = renderFleetCard(1) + renderFleetCard(2);
    if (state.confirmed[1] && state.confirmed[2]) {
      fleetSetup.innerHTML += '<div class="fleet-card"><strong>Frotas confirmadas.</strong><br>Combate pronto para começar.</div>';
    }
  }

  function updateCheck(player, className, checked) {
    if (state.confirmed[player]) return;
    const set = state.selected[player];
    if (checked && set.size >= FLEET_SIZE) return;
    if (checked) set.add(className); else set.delete(className);
    renderSetup();
  }

  function tryConfirm(player) {
    if (state.selected[player].size !== FLEET_SIZE) {
      alert(`Jogador ${player}: selecione exatamente ${FLEET_SIZE} naves.`);
      return;
    }
    state.confirmed[player] = true;

    if (state.confirmed[1] && state.confirmed[2]) {
      const ok = window.BatalhaEngine.applyFleetSelection(
        Array.from(state.selected[1]),
        Array.from(state.selected[2]),
      );
      if (ok) {
        fleetSetup.style.display = 'none';
      }
    }

    renderSetup();
  }

  fleetSetup.addEventListener('change', (event) => {
    const t = event.target;
    if (!(t instanceof HTMLInputElement) || t.type !== 'checkbox') return;
    const player = Number(t.dataset.player);
    const className = t.dataset.class;
    if (!player || !className) return;
    updateCheck(player, className, t.checked);
  });

  fleetSetup.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const player = Number(target.dataset.confirm);
    if (!player) return;
    tryConfirm(player);
  });

  renderSetup();
})();
