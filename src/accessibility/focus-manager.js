/**
 * Focus management for screen transitions and modals.
 * Remembers the previously focused element and restores it on demand.
 */
class FocusManager {
  #previous = null;
  #trapStack = [];

  remember() {
    this.#previous = document.activeElement;
  }

  restore() {
    if (this.#previous && document.contains(this.#previous)) {
      try { this.#previous.focus(); } catch {}
    }
    this.#previous = null;
  }

  focusFirst(container) {
    if (!container) return;
    const focusable = container.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      try { focusable.focus(); } catch {}
    } else {
      container.setAttribute('tabindex', '-1');
      try { container.focus(); } catch {}
    }
  }

  trap(container) {
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', handler);
    this.#trapStack.push({ container, handler });
    return () => {
      container.removeEventListener('keydown', handler);
      this.#trapStack = this.#trapStack.filter(t => t.handler !== handler);
    };
  }
}

export const focusManager = new FocusManager();