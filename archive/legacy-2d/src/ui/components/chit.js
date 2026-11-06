import { el } from '../../utils/dom.js';

/**
 * The signature folded-paper chit.
 * Two states: folded (closed) and unfolded (open), with physical-feeling
 * CSS transitions. Content is injected only when opened to prevent leakage.
 */
export function createChit({ onOpen } = {}) {
  const content = el('div', { className: 'chit__content' });

  const chit = el('div', { className: 'chit', attrs: { role: 'button', tabindex: '0', 'aria-label': 'Open your role chit' } }, [
    el('div', { className: 'chit__paper' }, [
      el('div', { className: 'chit__fold chit__fold--top' }),
      el('div', { className: 'chit__fold chit__fold--bottom' }),
      el('div', { className: 'chit__seal' }, [
        el('span', { className: 'chit__seal-mark' }, ['✦']),
      ]),
      content,
    ]),
    el('div', { className: 'chit__hint' }, ['Tap to unfold']),
  ]);

  function open() {
    if (chit.classList.contains('chit--open')) return;
    chit.classList.add('chit--open');
    chit.setAttribute('aria-expanded', 'true');
    onOpen?.();
  }

  chit.addEventListener('click', open);
  chit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return { element: chit, open, content };
}