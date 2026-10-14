import { ITEMS } from './data.js';
import { isCorrect, closest, classifyError, diff } from './check.js';
import { createProgress, pickRound, LEARNED_BOX } from './progress.js';

const ROUND_SIZE = 10;
const REQUEUE_GAP = 3;
const SETTINGS_KEY = 'et-settings-v1';

const $ = (id) => document.getElementById(id);
const progress = createProgress(window.localStorage);

let settings = { set: 'words', dir: 'en-nl' };
try {
  settings = { ...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
} catch { /* ignore */ }

// Round state
let queue = [];
let current = null;
let state = 'answering'; // 'answering' | 'retyping' | 'done'
let firstTry = 0;
let total = 0;
let roundSize = 0;
let finished = 0;
let mistakes = [];

const keyOf = (item, dir) => `${item.id}:${dir}`;
const dirsFor = (d) => (d === 'mix' ? ['en-nl', 'nl-en'] : [d]);
const itemsFor = (s) => ITEMS.filter((i) => s === 'all' || i.set === s);
const entriesFor = (s, d) =>
  itemsFor(s).flatMap((item) => dirsFor(d).map((dir) => ({ key: keyOf(item, dir), item, dir })));

function show(view) {
  for (const v of ['start', 'practice', 'result']) $(`view-${v}`).hidden = v !== view;
  window.scrollTo(0, 0);
}

// ---------- Start view ----------
function renderStart() {
  for (const [id, key] of [['choice-set', 'set'], ['choice-dir', 'dir']]) {
    for (const b of $(id).querySelectorAll('button')) {
      b.setAttribute('aria-pressed', String(b.dataset.value === settings[key]));
    }
  }
  const keys = entriesFor(settings.set, settings.dir).map((e) => e.key);
  $('progress-line').textContent = `Geleerd: ${progress.learnedCount(keys)} van ${keys.length}`;
}

for (const [id, key] of [['choice-set', 'set'], ['choice-dir', 'dir']]) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    settings[key] = b.dataset.value;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
    renderStart();
  });
}

$('btn-reset').addEventListener('click', () => {
  if (confirm('Weet je zeker dat je alle voortgang wilt wissen?')) {
    progress.reset();
    renderStart();
  }
});

// ---------- Practice ----------
function startRound() {
  queue = pickRound(entriesFor(settings.set, settings.dir), ROUND_SIZE, progress.getBox);
  total = roundSize = queue.length;
  finished = 0;
  firstTry = 0;
  mistakes = [];
  show('practice');
  next();
}

function next() {
  if (!queue.length) return showResult();
  current = { ...queue.shift() };
  state = 'answering';
  const { item, dir } = current;
  const fromEn = dir === 'en-nl';

  $('count').textContent = `${Math.min(finished + 1, total)} / ${total}`;
  $('bar-fill').style.width = `${(finished / total) * 100}%`;
  $('topic').textContent = item.topic || '';
  $('direction').textContent = fromEn ? 'Vertaal naar het Nederlands:' : 'Translate to English:';
  $('prompt').textContent = fromEn ? item.en : item.nl;
  $('hint').textContent = item.blank
    ? 'Vul zelf iets in op de puntjes. Vergeet de punt aan het eind niet!'
    : (!fromEn && item.hintNl) || '';
  $('feedback').replaceChildren();

  const input = $('answer');
  input.value = '';
  input.readOnly = false;
  input.lang = fromEn ? 'nl' : 'en';
  $('answer-label').textContent = 'Jouw antwoord';
  $('btn-check').textContent = 'Controleer';
  input.focus();
}

function markedText(flags, className) {
  const span = document.createElement('span');
  span.className = className;
  for (const { ch, ok } of flags) {
    if (ok) span.append(ch);
    else {
      const m = document.createElement('mark');
      m.textContent = ch === ' ' ? ' ' : ch;
      span.append(m);
    }
  }
  return span;
}

function line(label, node) {
  const p = document.createElement('p');
  const l = document.createElement('span');
  l.className = 'label';
  l.textContent = label;
  p.append(l, document.createElement('br'), node);
  return p;
}

function plain(text) {
  const s = document.createElement('span');
  s.className = 'text';
  s.textContent = text;
  return s;
}

function feedbackBox(cls, ...children) {
  const box = document.createElement('div');
  box.className = `fb ${cls}`;
  box.append(...children);
  $('feedback').replaceChildren(box);
}

function finishItem() {
  state = 'done';
  finished++;
  $('bar-fill').style.width = `${(finished / total) * 100}%`;
  $('answer').readOnly = true;
  $('btn-check').textContent = 'Volgende';
  $('btn-check').focus();
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (state === 'done') return next();

  const answer = $('answer').value;
  const { item, dir } = current;

  if (!answer.trim()) {
    feedbackBox('bad', plain('Typ eerst een antwoord.'));
    return;
  }

  if (isCorrect(answer, item, dir)) {
    if (state === 'answering') {
      if (!current.retry) {
        firstTry++;
        progress.markRight(current.key);
      }
      feedbackBox('ok', plain('Goed zo! ✓'));
    } else {
      feedbackBox('ok', plain('Goed! Nu weet je het. ✓'));
    }
    return finishItem();
  }

  // Wrong answer
  const target = closest(answer, item, dir);
  const { answerFlags, targetFlags } = diff(answer, target);
  const tip = document.createElement('p');
  tip.textContent = state === 'answering' ? classifyError(answer, item, dir) : 'Nog niet goed. Kijk goed naar het antwoord.';
  const targetLabel = item.blank ? 'Bijvoorbeeld:' : 'Het goede antwoord:';
  feedbackBox(
    'bad',
    tip,
    line('Jouw antwoord:', markedText(answerFlags, 'text')),
    line(targetLabel, markedText(targetFlags, 'text')),
    Object.assign(document.createElement('p'), { textContent: 'Typ het goede antwoord nu zelf over.' }),
  );

  if (state === 'answering') {
    state = 'retyping';
    if (!current.retry) {
      progress.markWrong(current.key);
      mistakes.push(current);
    }
    queue.splice(Math.min(REQUEUE_GAP, queue.length), 0, { key: current.key, item, dir, retry: true });
    total++; // the requeued copy counts as an extra step in the progress bar
  }
  $('answer-label').textContent = 'Typ het goede antwoord over';
  $('answer').value = '';
  $('answer').focus();
});

$('btn-stop').addEventListener('click', () => {
  renderStart();
  show('start');
});

// ---------- Result ----------
function showResult() {
  $('score').textContent = `${firstTry} van ${roundSize} meteen goed`;
  const box = $('mistakes');
  box.replaceChildren();
  if (mistakes.length) {
    const h = document.createElement('h2');
    h.textContent = 'Dit moet je nog oefenen:';
    const ul = document.createElement('ul');
    for (const m of mistakes) {
      const li = document.createElement('li');
      li.textContent = `${m.item.en} = ${m.item.nl}`;
      ul.append(li);
    }
    box.append(h, ul);
  } else {
    box.textContent = 'Alles meteen goed. Super!';
  }
  show('result');
}

$('btn-again').addEventListener('click', startRound);
$('btn-home').addEventListener('click', () => {
  renderStart();
  show('start');
});
$('btn-start').addEventListener('click', startRound);

renderStart();
show('start');
