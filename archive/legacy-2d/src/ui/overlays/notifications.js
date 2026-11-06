import { el } from '../../utils/dom.js';

const root = () => document.getElementById('notification-root');

export function notify(message, { type = 'info', duration = 2400 } = {}) {
  const toast = el('div', { className: `toast${type !== 'info' ? ` toast--${type}` : ''}` }, [message]);
  root().appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--exiting');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}