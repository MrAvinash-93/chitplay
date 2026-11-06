import { el } from '../../utils/dom.js';
import { audioManager } from '../../audio/audio-manager.js';

export function createButton({
  label,
  variant = 'secondary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  onClick,
  disabled = false,
  type = 'button',
  ariaLabel,
  className = '',
  block = false,
} = {}) {
  const classes = ['btn', `btn--${variant}`];
  if (size === 'lg') classes.push('btn--lg');
  if (size === 'sm') classes.push('btn--sm');
  if (block) classes.push('btn--block');
  if (className) classes.push(className);

  const children = [];
  if (icon && iconPosition === 'left') children.push(el('span', { className: 'btn__icon' }, [icon()]));
  children.push(label);
  if (icon && iconPosition === 'right') children.push(el('span', { className: 'btn__icon' }, [icon()]));

  const btn = el('button', {
    className: classes.join(' '),
    type,
    disabled,
    attrs: { 'aria-label': ariaLabel || undefined },
    onClick: (e) => {
      if (btn.disabled) return;
      e.preventDefault();
      audioManager.play('button');
      onClick?.(e);
    },
  }, children);

  return btn;
}