// Leitner-style progress, saved in localStorage. Key = "<itemId>:<dir>".

export const MAX_BOX = 4;
export const LEARNED_BOX = 3;
const WEIGHTS = [6, 3, 2, 1, 0.5];

export function createProgress(storage, key = 'et-progress-v1') {
  let data = {};
  try {
    data = JSON.parse(storage.getItem(key) || '{}') || {};
  } catch {
    data = {};
  }
  const save = () => {
    try {
      storage.setItem(key, JSON.stringify(data));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  };
  return {
    getBox: (k) => data[k] || 0,
    markRight(k) {
      data[k] = Math.min(MAX_BOX, (data[k] || 0) + 1);
      save();
    },
    markWrong(k) {
      data[k] = 0;
      save();
    },
    learnedCount: (keys) => keys.filter((k) => (data[k] || 0) >= LEARNED_BOX).length,
    reset() {
      data = {};
      save();
    },
  };
}

// entries: [{ key, item, dir }]. Weighted pick without replacement, one entry per item.
export function pickRound(entries, n, getBox, rand = Math.random) {
  const pool = [...entries];
  const picked = [];
  const usedItems = new Set();
  while (picked.length < n && pool.length) {
    const weights = pool.map((e) => (usedItems.has(e.item.id) ? 0 : WEIGHTS[getBox(e.key)] ?? 0.5));
    const total = weights.reduce((s, w) => s + w, 0);
    if (total === 0) break;
    let r = rand() * total;
    let idx = weights.findIndex((w) => (r -= w) < 0);
    if (idx === -1) idx = weights.findLastIndex((w) => w > 0);
    const [e] = pool.splice(idx, 1);
    picked.push(e);
    usedItems.add(e.item.id);
  }
  return picked;
}
