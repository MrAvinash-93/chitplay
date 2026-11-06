/**
 * Tiny DOM helpers — keeps component code declarative and avoids
 * repeated boilerplate. No virtual DOM; direct, efficient manipulation.
 */

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') {
      // CSS custom properties (--chip) need setProperty; Object.assign silently drops them
      for (const [k, v] of Object.entries(value)) {
        if (v == null) continue;
        if (k.startsWith('--')) node.style.setProperty(k, String(v));
        else node.style[k] = v;
      }
    }
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'disabled' || key === 'checked' || key === 'selected' || key === 'hidden' || key === 'readOnly') {
      node[key] = Boolean(value);
      if (!value) node.removeAttribute(key);
    } else if (key === 'value') {
      node.value = value;
    } else if (key === 'attrs') {
      for (const [a, v] of Object.entries(value)) {
        if (v === false || v == null) continue;
        if (v === true) node.setAttribute(a, '');
        else node.setAttribute(a, v);
      }
    } else node.setAttribute(key, value);
  }
  appendChildren(node, children);
  return node;
}

export function appendChildren(parent, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      parent.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      parent.appendChild(child);
    } else if (Array.isArray(child)) {
      appendChildren(parent, child);
    }
  }
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function mount(target, node) {
  clear(target);
  target.appendChild(node);
  return node;
}

export function svg(pathData, options = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(ns, 'svg');
  svgEl.setAttribute('viewBox', options.viewBox || '0 0 24 24');
  svgEl.setAttribute('fill', options.fill || 'none');
  svgEl.setAttribute('stroke', options.stroke || 'currentColor');
  svgEl.setAttribute('stroke-width', options.strokeWidth || '1.5');
  svgEl.setAttribute('stroke-linecap', 'round');
  svgEl.setAttribute('stroke-linejoin', 'round');
  if (options.className) svgEl.setAttribute('class', options.className);
  if (options.ariaHidden !== false) svgEl.setAttribute('aria-hidden', 'true');

  const paths = Array.isArray(pathData) ? pathData : [pathData];
  for (const p of paths) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', p);
    svgEl.appendChild(path);
  }
  return svgEl;
}