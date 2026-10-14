import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProgress, pickRound } from '../js/progress.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};

test('boxes go up on right, reset on wrong, and persist', () => {
  const st = memory();
  const p = createProgress(st);
  p.markRight('a');
  p.markRight('a');
  p.markRight('a');
  assert.equal(p.getBox('a'), 3);
  assert.equal(p.learnedCount(['a', 'b']), 1);
  assert.equal(createProgress(st).getBox('a'), 3);
  p.markWrong('a');
  assert.equal(p.getBox('a'), 0);
  for (let i = 0; i < 10; i++) p.markRight('b');
  assert.equal(p.getBox('b'), 4);
  p.reset();
  assert.equal(createProgress(st).getBox('b'), 0);
});

test('corrupt storage does not crash', () => {
  const st = { getItem: () => '{nope', setItem() {} };
  assert.equal(createProgress(st).getBox('x'), 0);
});

const entry = (id, dir = 'en-nl') => ({ key: `${id}:${dir}`, item: { id }, dir });

test('pickRound: n unique items, no repeats of the same item', () => {
  const entries = ['1', '2', '3', '4'].flatMap((id) => [entry(id, 'en-nl'), entry(id, 'nl-en')]);
  const round = pickRound(entries, 3, () => 0);
  assert.equal(round.length, 3);
  assert.equal(new Set(round.map((e) => e.item.id)).size, 3);
  assert.equal(pickRound(entries, 10, () => 0).length, 4);
});

test('pickRound favours low boxes', () => {
  const entries = [entry('low'), entry('high')];
  const boxes = { 'low:en-nl': 0, 'high:en-nl': 4 };
  let lowFirst = 0;
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 500; i++) {
    if (pickRound(entries, 1, (k) => boxes[k], rand)[0].item.id === 'low') lowFirst++;
  }
  assert.ok(lowFirst > 400, `low picked ${lowFirst}/500`);
});
