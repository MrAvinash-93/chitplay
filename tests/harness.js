/**
 * Minimal zero-build test harness. Runs in the browser.
 * Open tests/index.html to execute.
 */

const results = [];
const pending = [];
let currentSuite = null;

export function describe(name, fn) {
  currentSuite = { name, tests: [] };
  results.push(currentSuite);
  fn();
  currentSuite = null;
}

export function it(name, fn) {
  const suite = currentSuite || { name: 'Ungrouped', tests: [] };
  if (!currentSuite) results.push(suite);
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      // an async test: the report waits for it
      const test = { name, passed: false, error: 'still running' };
      suite.tests.push(test);
      pending.push(result.then(() => { test.passed = true; test.error = undefined; }, (err) => { test.error = err.message || String(err); }));
      return;
    }
    suite.tests.push({ name, passed: true });
  } catch (err) {
    suite.tests.push({ name, passed: false, error: err.message || String(err) });
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) throw new Error(`Expected ${JSON.stringify(actual)} to be greater than ${JSON.stringify(expected)}`);
    },
    toContain(item) {
      if (!actual.includes(item)) throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
    },
    toHaveLength(n) {
      if (actual.length !== n) throw new Error(`Expected length ${n}, got ${actual.length}`);
    },
    toThrow() {
      let threw = false;
      try { actual(); } catch { threw = true; }
      if (!threw) throw new Error('Expected function to throw');
    },
  };
}

export async function runReport() {
  const root = document.getElementById('test-results');
  if (!root) return;
  await Promise.allSettled(pending);
  let total = 0, passed = 0;
  root.innerHTML = '';
  for (const suite of results) {
    const suiteEl = document.createElement('div');
    suiteEl.className = 'test-suite';
    suiteEl.innerHTML = `<h2>${suite.name}</h2>`;
    for (const test of suite.tests) {
      total++;
      if (test.passed) passed++;
      const testEl = document.createElement('div');
      testEl.className = `test ${test.passed ? 'test--pass' : 'test--fail'}`;
      testEl.textContent = `${test.passed ? '✓' : '✗'} ${test.name}${test.error ? ` — ${test.error}` : ''}`;
      suiteEl.appendChild(testEl);
    }
    root.appendChild(suiteEl);
  }
  const summary = document.createElement('div');
  summary.className = 'test-summary';
  summary.textContent = `${passed} / ${total} tests passed`;
  root.prepend(summary);
}