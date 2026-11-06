import { el } from '../../utils/dom.js';
import { focusManager } from '../../accessibility/focus-manager.js';

export function showModal({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'primary', onConfirm, onCancel, hideCancel = false }) {
  const root = document.getElementById('modal-root');
  focusManager.remember();

  const backdrop = el('div', { className: 'modal-backdrop', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' } });

  let releaseTrap = null;

  const close = (result) => {
    releaseTrap?.();
    backdrop.style.animation = 'fadeOut 150ms ease forwards';
    setTimeout(() => {
      backdrop.remove();
      focusManager.restore();
    }, 150);
    if (result === 'confirm') onConfirm?.();
    else onCancel?.();
  };

  const confirmBtn = el('button', {
    className: `btn btn--${variant}`,
    type: 'button',
    onClick: () => close('confirm'),
  }, [confirmLabel]);

  const cancelBtn = el('button', {
    className: 'btn btn--ghost',
    type: 'button',
    onClick: () => close('cancel'),
  }, [cancelLabel]);

  const actions = el('div', { className: 'modal__actions' }, [
    hideCancel ? null : cancelBtn,
    confirmBtn,
  ]);

  const modal = el('div', { className: 'modal' }, [
    el('h2', { className: 'modal__title', attrs: { id: 'modal-title' } }, [title]),
    el('p', { className: 'modal__body' }, [body]),
    actions,
  ]);

  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close('cancel'); });
  backdrop.addEventListener('keydown', (e) => { if (e.key === 'Escape') close('cancel'); });

  root.appendChild(backdrop);
  releaseTrap = focusManager.trap(backdrop);
  focusManager.focusFirst(modal);

  return { close };
}