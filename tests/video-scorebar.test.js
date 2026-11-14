import test from 'node:test';
import assert from 'node:assert/strict';

const { scoreBar, W } = await import('../src/arcade/video/lib.js?v=20261114-1515');

test('score cards stay compact and centered for one to four players', () => {
  for (const count of [1, 2, 4]) {
    const rectangles = [];
    const g = {
      fillRect(x, y, width, height) { rectangles.push({ x, y, width, height }); },
      fillText() {},
    };
    const layout = scoreBar(g, Array.from({ length: count }, (_, i) => [`P${i + 1}`, i, '#fff']));
    const cards = rectangles.filter(rect => rect.y === 6 && rect.height === 28 && rect.width > 5);
    const total = layout.cellWidth * count + layout.gap * (count - 1);

    assert.equal(cards.length, count);
    assert.ok(layout.cellWidth <= 130);
    assert.equal(layout.left, (W - total) / 2);
    assert.equal(cards[0].x, layout.left);
    assert.equal(cards[count - 1].x + cards[count - 1].width, layout.left + total);
    assert.ok(total < W);
  }
});
