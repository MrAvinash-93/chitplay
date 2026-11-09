/**
 * Small dialogs used everywhere: "Are you sure?" with what it costs, and plain notices.
 * Built from text only (never HTML from data), keyboard friendly, and closed with Escape.
 */
function make(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

/** Resolves true for OK, false for Cancel. lines: [[label, value, tone?], …] shown as a little bill. */
export function ask({ icon = '❓', title, body = '', lines = [], ok = 'OK', cancel = 'Cancel', tone = '' } = {}) {
  // one at a time: a second tap while one is open doesn't stack another on top
  if (document.querySelector('.dlg')) return Promise.resolve(false);
  return new Promise((resolve) => {
    const shade = make('div', 'dlg');
    shade.setAttribute('role', 'dialog');
    shade.setAttribute('aria-modal', 'true');
    const box = make('div', `dlg__box${tone ? ` dlg__box--${tone}` : ''}`);
    box.append(make('span', 'dlg__icon', icon), make('strong', 'dlg__title', title));
    if (body) box.append(make('p', 'dlg__body', body));
    if (lines.length) {
      const bill = make('dl', 'dlg__bill');
      lines.forEach(([k, v, t]) => { const dt = make('dt', '', k); const dd = make('dd', t ? `dlg__${t}` : '', v); bill.append(dt, dd); });
      box.append(bill);
    }
    const row = make('div', 'dlg__row');
    const done = (v) => { removeEventListener('keydown', onKey); shade.remove(); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') done(false); };
    if (cancel) { const c = make('button', 'dlg__btn', cancel); c.type = 'button'; c.onclick = () => done(false); row.append(c); }
    const o = make('button', 'dlg__btn dlg__btn--ok', ok); o.type = 'button'; o.onclick = () => done(true);
    row.append(o);
    box.append(row);
    shade.append(box);
    shade.addEventListener('pointerdown', (e) => { if (e.target === shade && cancel) done(false); });
    addEventListener('keydown', onKey);
    document.body.append(shade);
    o.focus({ preventScroll: true });
  });
}
export const notice = (opts) => ask({ cancel: '', ok: 'OK', ...opts });

/** The usual check before spending coins. Resolves true only if the player can and does agree. */
export async function confirmSpend({ what, price, coins, icon = '🛍️' }) {
  if (coins < price) {
    await notice({ icon: '🪙', tone: 'warn', title: 'Not enough coins', body: `${what} costs ${price} coins.`, lines: [['You have', String(coins)], ['You need', `${price - coins} more`, 'bad']], ok: 'Play to earn coins' });
    return false;
  }
  return ask({ icon, title: `Buy ${what}?`, lines: [['Price', `${price} coins`], ['You have', `${coins} coins`], ['Left after', `${coins - price} coins`, 'good']], ok: `Buy for ${price}`, cancel: 'Not now' });
}
