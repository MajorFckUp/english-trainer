# Engels oefenen (groep 7)

Static web app (HTML/CSS/JS, no build step) to practise the "Words to know" list and the sentences
from `input/`, English → Dutch and Dutch → English. Spelling, capitals and punctuation must be exact.
Works in the browser on the Galaxy Tab S9 FE. Progress is stored only on the tablet (localStorage).

## Deploy (GitHub Pages)
1. Push this folder to your repo (`main`).
2. Settings → Pages → "Deploy from branch" → `main` / `(root)`.
3. Open the Pages URL on the tablet. Optional: Chrome menu → "Add to Home screen".

Note: Pages for a **private** repo needs a paid GitHub plan, and the published site URL is
publicly reachable. The site only contains textbook words and sentences, no personal data.

## Tablet tip
If the Samsung keyboard still capitalises or autocorrects, turn off "Automatic capitalisation" and
predictive text in Samsung Keyboard settings. The input field already disables these where the browser allows.

## How it works
- A round is 10 items, picked more often from items the child still gets wrong (Leitner boxes 0–4;
  "learned" = box 3 or higher, per item and direction).
- Wrong answer: the app says whether caps, punctuation or spelling is off, highlights the differences,
  and the child must type the correct answer over. The item comes back 3 items later.
- Slash forms ("He / She", "neef / nicht") accept every variant. Sentences with `...` accept any
  fill-in, but the fixed part and the final full stop must be exact.
- Words like "Austria – Austrian" are split into two cards.

## Corrections made to the input (check against the book)
- `1 am` → `I am` (OCR error, 2×).
- Added a full stop to "Ik kom uit Engeland" and replaced the `:` in "We are from the Netherlands:" by `.`.
- The sentence blanks `My name is ...`, `I live in ...`, `Ik heet ...`, `Ik woon in ...` require a closing `.` when filled in.
- A few extra accepted variants were added (contractions like "I'm", "ze" for "zij", "jij" for "je").
- Words were transcribed from the photo (`input/*.webp`); "België" etc. follow the capitals in the book.

## Develop / test
```
npm test                    # unit tests (Node 20+)
python3 -m http.server 8000 # then open http://localhost:8000
```
