// Practice items: "Words to know" (page 22) and the sentences from sentences.md.
// Slash forms like "He / She" or "neef / nicht" are expanded into accepted variants.

const SLASH = /[\p{L}']+(?: \/ [\p{L}']+)+/u;

export function expand(text) {
  const m = text.match(SLASH);
  if (!m) return [text];
  const cap = (o) => o[0].toUpperCase() + o.slice(1);
  // At the start of a sentence (not a plain word) every alternative needs a capital ("Hij / zij" -> "Zij ...").
  const opts = m[0].split(' / ').map((o) => (m.index === 0 && /[.?!]$/.test(text) ? cap(o) : o));
  const lowerRest = opts.map((o, i) => (i ? o[0].toLowerCase() + o.slice(1) : o)).join(' / ');
  const upperRest = opts.map((o, i) => (i ? o[0].toUpperCase() + o.slice(1) : o)).join(' / ');
  const out = opts.map((o) => text.replace(m[0], o));
  for (const j of new Set([m[0], lowerRest, upperRest])) out.push(text.replace(m[0], j));
  return out;
}

const unique = (list) => [...new Set(list)];
const accept = (main, extra = []) => unique([main, ...extra].flatMap(expand));

const word = (en, nl, hintNl) => ({ set: 'words', topic: null, en, nl, hintNl });

const sentence = (topic, en, nl, extra = {}) => ({
  set: 'sentences',
  topic,
  en,
  nl,
  enAlso: [],
  nlAlso: [],
  ...extra,
});

const T_FROM = 'What does somebody say when he wants to know where you are from?';
const T_ASK = 'What do you ask when you meet somebody?';
const T_ANSWER = 'How do you answer?';

const RAW = [
  word('alphabet', 'alfabet'),
  word('aunt', 'tante'),
  word('Austria', 'Oostenrijk'),
  word('Austrian', 'Oostenrijks'),
  word('autumn', 'herfst'),
  word('Belgium', 'België'),
  word('Belgian', 'Belgisch'),
  word('brother', 'broer'),
  word('children', 'kinderen'),
  word('Christmas', 'Kerstmis'),
  word('country', 'land'),
  word('cousin', 'neef / nicht', '(kind van oom of tante)'),
  word('England', 'Engeland'),
  word('English', 'Engels'),
  word('family members', 'familieleden / gezinsleden'),
  word('family', 'familie / gezin'),
  word('father', 'vader'),
  word('first name', 'voornaam'),
  word('France', 'Frankrijk'),
  word('French', 'Frans'),
  word('Germany', 'Duitsland'),
  word('German', 'Duits'),
  word('grandmother and grandfather', 'oma en opa'),
  word('Greece', 'Griekenland'),
  word('Greek', 'Grieks'),
  word('holiday', 'vakantie'),
  word('husband and wife', 'echtgenoot en echtgenote'),
  word('mother', 'moeder'),
  word('nephew', 'neef', '(zoon van broer of zus)'),
  word('the Netherlands', 'Nederland'),
  word('Dutch', 'Nederlands'),
  word('niece', 'nicht', '(dochter van broer of zus)'),
  word('numbers', 'getallen'),
  word('picture', 'plaatje / schilderij / foto'),
  word('Poland', 'Polen'),
  word('Polish', 'Pools'),
  word('public holiday', 'nationale feestdag'),
  word('sister', 'zus'),
  word('son and daughter', 'zoon en dochter'),
  word('spring', 'lente'),
  word('summer', 'zomer'),
  word('surname', 'achternaam'),
  word('the months of the year', 'de maanden van het jaar'),
  word('to have a party', 'een feest geven'),
  word('to pretend', 'doen alsof'),
  word('Turkey', 'Turkije'),
  word('Turkish', 'Turks'),
  word('uncle', 'oom'),
  word('winter', 'winter'),

  sentence(T_FROM, 'Where are you from?', 'Waar kom je vandaan?', { nlAlso: ['Waar kom jij vandaan?'] }),
  sentence(T_FROM, 'I am from England.', 'Ik kom uit Engeland.', { enAlso: ["I'm from England."] }),
  sentence(T_FROM, 'I am English.', 'Ik ben Engels.', { enAlso: ["I'm English."] }),
  sentence(T_FROM, 'Where is he / she from?', 'Waar komt hij / zij vandaan?', { nlAlso: ['Waar komt ze vandaan?'] }),
  sentence(T_FROM, 'He / She is from Turkey.', 'Hij / zij komt uit Turkije.', { enAlso: ["He's from Turkey.", "She's from Turkey."], nlAlso: ['Ze komt uit Turkije.'] }),
  sentence(T_FROM, 'He / She is Turkish.', 'Hij / zij is Turks.', { enAlso: ["He's Turkish.", "She's Turkish."], nlAlso: ['Ze is Turks.'] }),
  sentence(T_FROM, 'Where are they from?', 'Waar komen zij vandaan?', { nlAlso: ['Waar komen ze vandaan?'] }),
  sentence(T_FROM, 'They are from Poland.', 'Zij komen uit Polen.', { enAlso: ["They're from Poland."], nlAlso: ['Ze komen uit Polen.'] }),
  sentence(T_FROM, 'They are Polish.', 'Zij zijn Pools.', { enAlso: ["They're Polish."], nlAlso: ['Ze zijn Pools.'] }),
  sentence(T_FROM, 'Where are you from, Tom and Wouter?', 'Waar komen jullie vandaan, Tom en Wouter?'),
  sentence(T_FROM, 'We are from the Netherlands.', 'Wij komen uit Nederland.', { enAlso: ["We're from the Netherlands."], nlAlso: ['We komen uit Nederland.'] }),
  sentence(T_FROM, 'We are Dutch.', 'Wij zijn Nederlands.', { enAlso: ["We're Dutch."], nlAlso: ['We zijn Nederlands.', 'Wij zijn Nederlanders.', 'We zijn Nederlanders.'] }),

  sentence(T_ASK, 'What is your name?', 'Hoe heet je?', { enAlso: ["What's your name?"], nlAlso: ['Hoe heet jij?'] }),
  sentence(T_ASK, 'How are you?', 'Hoe gaat het met je?', { nlAlso: ['Hoe gaat het met jou?'] }),
  sentence(T_ASK, "I'm fine. How are you?", 'Met mij gaat het goed. Hoe gaat het met jou?', {
    enAlso: ['I am fine. How are you?'],
    nlAlso: ['Met mij gaat het goed. Hoe gaat het met je?'],
  }),
  sentence(T_ASK, 'How old are you?', 'Hoe oud ben je?', { nlAlso: ['Hoe oud ben jij?'] }),
  sentence(T_ASK, 'Where do you live?', 'Waar woon je?', { nlAlso: ['Waar woon jij?'] }),

  sentence(T_ANSWER, 'My name is ...', 'Ik heet ...', { blank: true, enExample: 'My name is Sam.', nlExample: 'Ik heet Sam.' }),
  sentence(T_ANSWER, 'I am ... years old.', 'Ik ben ... jaar.', { blank: true, enExample: 'I am 10 years old.', nlExample: 'Ik ben 10 jaar.' }),
  sentence(T_ANSWER, 'I live in ...', 'Ik woon in ...', { blank: true, enExample: 'I live in Utrecht.', nlExample: 'Ik woon in Utrecht.' }),
];

export const ITEMS = RAW.map((r, i) => {
  const { enAlso = [], nlAlso = [], ...item } = r;
  const blank = !!item.blank;
  return {
    ...item,
    id: `${item.set === 'words' ? 'w' : 's'}${i + 1}`,
    blank,
    enAccept: blank ? [item.en] : accept(item.en, enAlso),
    nlAccept: blank ? [item.nl] : accept(item.nl, nlAlso),
  };
});
