import { el } from '../../utils/dom.js';

export function createCharacter(role, { className = '', mood = 'curious' } = {}) {
  return el('span', {
    className: `character character--${role} character--${mood}${className ? ` ${className}` : ''}`,
    attrs: { 'aria-hidden': 'true' },
  }, [
    el('span', { className: 'character__shadow' }),
    el('span', { className: 'character__body' }, [
      el('span', { className: 'character__badge' }),
    ]),
    el('span', { className: 'character__head' }, [
      el('span', { className: 'character__hair' }),
      el('span', { className: 'character__eyes' }, [
        el('span', { className: 'character__eye' }),
        el('span', { className: 'character__eye' }),
      ]),
      el('span', { className: 'character__mouth' }),
      el('span', { className: 'character__accessory' }),
    ]),
    el('span', { className: 'character__hat' }),
  ]);
}
