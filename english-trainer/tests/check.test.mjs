import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../js/data.js';
import { isCorrect, classifyError, normalize, diff, closest } from '../js/check.js';

const find = (en) => ITEMS.find((i) => i.en === en);

test('data integrity', () => {
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  for (const i of ITEMS) {
    assert.ok(i.en && i.nl, i.id);
    assert.ok(i.enAccept.includes(i.en) || i.blank, `${i.id} en`);
    assert.ok(i.nlAccept.includes(i.nl) || i.blank, `${i.id} nl`);
  }
});

test('exact match required for case and punctuation', () => {
  const it = find('Where are you from?');
  assert.ok(isCorrect('Waar kom je vandaan?', it, 'en-nl'));
  assert.ok(!isCorrect('waar kom je vandaan?', it, 'en-nl'));
  assert.ok(!isCorrect('Waar kom je vandaan', it, 'en-nl'));
  assert.ok(!isCorrect('Waar kom je vandan?', it, 'en-nl'));
  assert.ok(isCorrect('  Waar  kom je vandaan?  ', it, 'en-nl'));
});

test('both directions', () => {
  const it = find('Christmas');
  assert.ok(isCorrect('Kerstmis', it, 'en-nl'));
  assert.ok(!isCorrect('kerstmis', it, 'en-nl'));
  assert.ok(isCorrect('Christmas', it, 'nl-en'));
  assert.ok(!isCorrect('christmas', it, 'nl-en'));
});

test('slash variants are all accepted', () => {
  const it = find('He / She is from Turkey.');
  for (const a of ['Hij komt uit Turkije.', 'Zij komt uit Turkije.', 'Hij / zij komt uit Turkije.', 'Hij/zij komt uit Turkije.']) {
    assert.ok(isCorrect(a, it, 'en-nl'), a);
  }
  for (const a of ['He is from Turkey.', 'She is from Turkey.', 'He / She is from Turkey.']) {
    assert.ok(isCorrect(a, it, 'nl-en'), a);
  }
  assert.ok(!isCorrect('hij komt uit Turkije.', it, 'en-nl'));
});

test('word with alternatives', () => {
  const it = find('cousin');
  assert.ok(isCorrect('neef', it, 'en-nl'));
  assert.ok(isCorrect('nicht', it, 'en-nl'));
  assert.ok(isCorrect('neef / nicht', it, 'en-nl'));
  assert.ok(!isCorrect('oom', it, 'en-nl'));
});

test('blank sentences', () => {
  const it = find('My name is ...');
  assert.ok(isCorrect('Ik heet Sam.', it, 'en-nl'));
  assert.ok(isCorrect('Ik heet Anna Jansen.', it, 'en-nl'));
  assert.ok(!isCorrect('Ik heet Sam', it, 'en-nl'));
  assert.ok(!isCorrect('Ik heet .', it, 'en-nl'));
  assert.ok(!isCorrect('ik heet Sam.', it, 'en-nl'));
  assert.ok(!isCorrect('Mijn naam is Sam.', it, 'en-nl'));
  const age = find('I am ... years old.');
  assert.ok(isCorrect('I am 10 years old.', age, 'nl-en'));
  assert.ok(!isCorrect('I am 10 year old.', age, 'nl-en'));
});

test('curly apostrophes are normalised', () => {
  const it = find("I'm fine. How are you?");
  assert.equal(normalize('I’m fine'), "I'm fine");
  assert.ok(isCorrect('I’m fine. How are you?', it, 'nl-en'));
});

test('error classification', () => {
  const it = find('Where do you live?');
  assert.equal(classifyError('waar woon je?', it, 'en-nl'), 'Let op de hoofdletters!');
  assert.equal(classifyError('Waar woon je', it, 'en-nl'), 'Let op de leestekens!');
  assert.equal(classifyError('waar woon je', it, 'en-nl'), 'Let op de hoofdletters en leestekens!');
  assert.equal(classifyError('Waar won je?', it, 'en-nl'), 'Let op de spelling!');
});

test('closest accepted answer and diff', () => {
  const it = find('He / She is Turkish.');
  assert.equal(closest('Zij is Turk.', it, 'en-nl'), 'Zij is Turks.');
  const { targetFlags } = diff('Zij is Turk.', 'Zij is Turks.');
  assert.deepEqual(targetFlags.filter((f) => !f.ok).map((f) => f.ch), ['s']);
});
