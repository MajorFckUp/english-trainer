// Answer checking. Letter case and punctuation are never "fixed": they must be right.

export function normalize(s) {
  return String(s)
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

const answerLang = (dir) => dir.split('-')[1];
export const accepts = (item, dir) => item[`${answerLang(dir)}Accept`].map(normalize);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "My name is ..." -> /^My name is [^.!?]+\.$/ ; "I am ... years old." -> /^I am [^.!?]+ years old\.$/
function blankRegex(template) {
  const t = normalize(template);
  const body = t.endsWith('...') ? t.slice(0, -3) : t;
  const parts = body.split('...').map(escapeRe);
  const end = t.endsWith('...') ? '[^.!?]+\\.' : '';
  return new RegExp(`^${parts.join('[^.!?]+')}${end}$`);
}

export function isCorrect(answer, item, dir) {
  const n = normalize(answer);
  if (!n) return false;
  if (item.blank) return accepts(item, dir).some((t) => blankRegex(t).test(n));
  return accepts(item, dir).includes(n);
}

function levenshtein(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// The answer to show the child: the accepted answer closest to what they typed.
export function closest(answer, item, dir) {
  if (item.blank) return item[`${answerLang(dir)}Example`];
  const n = normalize(answer);
  return accepts(item, dir).reduce((best, a) => (levenshtein(n, a) < levenshtein(n, best) ? a : best));
}

const stripPunct = (s) => s.replace(/[.,!?:;'"]/g, '');

export function classifyError(answer, item, dir) {
  const n = normalize(answer);
  if (item.blank) return 'Let op het vaste deel van de zin en sluit af met een punt.';
  const target = closest(answer, item, dir);
  if (n.toLowerCase() === target.toLowerCase()) return 'Let op de hoofdletters!';
  if (stripPunct(n) === stripPunct(target)) return 'Let op de leestekens!';
  if (stripPunct(n).toLowerCase() === stripPunct(target).toLowerCase()) return 'Let op de hoofdletters en leestekens!';
  return 'Let op de spelling!';
}

// Character-level comparison (longest common subsequence). Returns which characters of each
// string are not part of the match, so the UI can highlight them.
export function diff(answer, target) {
  const a = normalize(answer);
  const t = target;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(t.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = t.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === t[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const answerFlags = [...a].map((ch) => ({ ch, ok: false }));
  const targetFlags = [...t].map((ch) => ({ ch, ok: false }));
  let i = 0;
  let j = 0;
  while (i < a.length && j < t.length) {
    if (a[i] === t[j]) {
      answerFlags[i].ok = true;
      targetFlags[j].ok = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { answerFlags, targetFlags };
}
