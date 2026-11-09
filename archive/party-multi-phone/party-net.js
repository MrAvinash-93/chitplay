/**
 * Party games on several phones: the host's phone runs the game and every other phone shows a
 * copy of the host's screen. Screens travel as plain data (tag, a few safe attributes, text),
 * never as HTML, and are rebuilt here from an allow-list: a modified host can't run script on a
 * guest's phone. A guest's tap goes back as "button number N of view V"; the host presses its own
 * button, so the game logic lives in one place.
 */
const TAGS = new Set(['header', 'section', 'div', 'p', 'span', 'strong', 'small', 'em', 'i', 'h1', 'h2', 'ol', 'ul', 'li', 'a', 'button', 'textarea', 'input']);
const ATTRS = new Set(['class', 'href', 'disabled', 'placeholder', 'maxlength', 'rows', 'aria-label', 'role', 'style', 'data-left', 'data-copy', 'value']);
const SAFE_HREF = /^(?:\.\.?\/)[\w\-/]*(?:\?game=[\w-]+)?$|^\?game=[\w-]+$/;
const SAFE_STYLE = /^(?:\s*(?:width|left|animation-delay|background)\s*:\s*[#\w.%\s-]+;?)*$/;
const MAX_NODES = 2500;

/**
 * The host's side: these elements as plain data, plus the live buttons and text boxes in the
 * same order, so a guest's "button 3" finds the real button. Elements marked .host-only stay home.
 */
export function ser(nodes) {
  const buttons = [], inputs = [];
  let count = 0;
  const walk = (n) => {
    if (++count > MAX_NODES) return null;
    if (n.nodeType === 3) return n.data;
    if (n.nodeType !== 1) return null;
    const tag = n.tagName.toLowerCase();
    if (!TAGS.has(tag) || n.classList.contains('host-only')) return null;
    const a = {};
    for (const at of n.attributes) if (ATTRS.has(at.name)) a[at.name] = at.value;
    if (tag === 'button') { a.pid = buttons.push(n) - 1; if (n.disabled) a.disabled = ''; else delete a.disabled; }
    if (tag === 'textarea' || tag === 'input') { a.iid = inputs.push(n) - 1; a.value = n.value; }
    return [tag, a, [...n.childNodes].map(walk).filter(x => x != null)];
  };
  return { tree: nodes.map(walk).filter(x => x != null), buttons, inputs };
}

/**
 * The guest's side: rebuild a view from the host's data. onPress(pid, values) is called when a
 * button is tapped, with what was typed into the text boxes.
 */
export function deser(tree, onPress) {
  let count = 0;
  const fields = [];
  const values = () => Object.fromEntries(fields.map(f => [f.dataset.iid, f.value.slice(0, 200)]));
  const build = (x, depth) => {
    if (++count > MAX_NODES || depth > 30) return null;
    if (typeof x === 'string') return document.createTextNode(x.slice(0, 2000));
    if (!Array.isArray(x) || !TAGS.has(x[0])) return null;
    const [tag, a = {}, kids = []] = x;
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(a || {})) {
      if (!ATTRS.has(k) || typeof v !== 'string') continue;
      if (k === 'href' && !SAFE_HREF.test(v)) continue;
      if (k === 'style' && (!SAFE_STYLE.test(v) || /url|expression/i.test(v))) continue;
      if (k === 'value') { e.value = v.slice(0, 200); continue; }
      e.setAttribute(k, v.slice(0, 300));
    }
    if ((tag === 'textarea' || tag === 'input') && Number.isInteger(a.iid)) {
      e.dataset.iid = String(a.iid);
      if (tag === 'input') e.type = 'text';
      fields.push(e);
    }
    if (tag === 'button') {
      e.type = 'button';
      const copy = a['data-copy'];
      if (typeof copy === 'string') {
        // copying happens on this phone
        e.addEventListener('click', async () => { try { await navigator.clipboard.writeText(copy); e.textContent = 'Copied!'; } catch { e.textContent = 'Couldn’t copy'; } });
      } else if (Number.isInteger(a.pid)) {
        e.addEventListener('click', () => onPress(a.pid, values()));
      }
    }
    for (const k of Array.isArray(kids) ? kids : []) { const c = build(k, depth + 1); if (c) e.append(c); }
    return e;
  };
  return (Array.isArray(tree) ? tree : []).map(x => build(x, 0)).filter(Boolean);
}

/** Room effects a guest may replay, with their arguments tidied up. */
const OPS = new Set(['sit', 'pose', 'emote', 'say', 'effect', 'point', 'celebrate', 'confetti']);
export function cleanOp(op, args) {
  if (!OPS.has(op) || !Array.isArray(args)) return null;
  const tidy = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(-1, Math.min(10, v))
    : typeof v === 'string' ? v.slice(0, 220)
      : v === null ? null
        : Array.isArray(v) ? v.slice(0, 4).map(s => String(s ?? '').slice(0, 14)) : undefined);
  return args.slice(0, 4).map(tidy);
}
