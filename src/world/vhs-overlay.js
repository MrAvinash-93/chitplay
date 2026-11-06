/**
 * VHS / home-camcorder overlay: grain, scanlines, warm vignette, a REC
 * indicator and a 1998 date stamp. Pure CSS layer, pointer-events: none.
 */
import { gameBus, EVENTS } from '../core/event-bus.js';
import { settingsStore } from '../persistence/settings-store.js?v=20261014-profile-v4';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function initVhsOverlay() {
  const html = document.documentElement;
  html.dataset.phase = 'HOME';

  const overlay = document.createElement('div');
  overlay.className = 'vhs';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="vhs__tint"></div>
    <div class="vhs__grain"></div>
    <div class="vhs__scan"></div>
    <div class="vhs__track"></div>
    <div class="vhs__hud">
      <div class="vhs__rec"><span class="vhs__dot"></span>REC</div>
      <div class="vhs__time"></div>
      <div class="vhs__date"></div>
    </div>`;
  document.body.appendChild(overlay);

  const timeEl = overlay.querySelector('.vhs__time');
  const dateEl = overlay.querySelector('.vhs__date');
  const track = overlay.querySelector('.vhs__track');

  function tick() {
    const d = new Date();
    const h = d.getHours();
    const ampm = h < 12 ? 'AM' : 'PM';
    timeEl.textContent = `${ampm} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
    dateEl.textContent = `${MONTHS[d.getMonth()]}. ${d.getDate()} 1998`;
  }
  tick();
  setInterval(tick, 15000);

  function apply(on) {
    html.classList.toggle('has-vhs', on !== false);
  }
  apply(settingsStore.get('vhsFilter'));

  gameBus.on(EVENTS.PHASE_CHANGED, ({ phase } = {}) => {
    if (!phase) return;
    html.dataset.phase = phase;
    // VCR tracking glitch on every scene change
    track.classList.remove('vhs__track--run');
    void track.offsetWidth;
    track.classList.add('vhs__track--run');
  });

  gameBus.on(EVENTS.SETTINGS_CHANGED, (payload = {}) => {
    if (payload.key === 'vhsFilter') apply(payload.value);
    else if (!payload.key && payload.settings) apply(payload.settings.vhsFilter);
  });
}
