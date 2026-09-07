# read-map — ukratko

Što je: mapa pročitanih knjiga. Pročitaš knjigu → pokažu se njoj najsličnije.
Nepročitano i nepovezano se ne crta.

## Što smo koristili

- **Angular 22** — glavni framework (standalone, bez NgModula)
- **TypeScript 6** — jezik
- **Vitest + jsdom** — testovi (brzo, bez browsera)
- **esbuild** (`@angular/build`) — build
- **d3 v7** — crtanje grafa (dolazi u fazi 3)
- **IndexedDB** — spremanje podataka u browseru (faza 1)
- **Node.js 22**

## Naredbe

```bash
npm install     # instaliraj sve
npm start       # pokreni app (localhost:4200)
npm test        # pokreni testove
npm run build   # produkcijski build
```

## Gdje je što

```
src/app/domain/     čista logika, BEZ Angulara — ovdje živi sva matematika
  book.model.ts       tipovi: Book, Pair
  similarity.ts       koliko su dvije knjige slične (sad: tagovi)
  pairs.ts            napravi sve parove knjiga
  scoring.ts          koliko je knjiga "topla" (preporučena)
  discovery.ts        što se otkriva kad nešto pročitaš
  *.spec.ts           testovi
src/app/data/       podaci i granica prema domeni
  books.json          202 knjige
  raw-book.model.ts   vanjski oblik zapisa (ima `read`)
  book-data.ts        pretvara vanjski oblik u domenski Book + readIds
HANDOFF.md          duga specifikacija (sve odluke i brojke)
mapa-knjiga-v2.html prototip u jednom fajlu (uzor, ne kopiramo ga)
```

## Kako radi (u tri rečenice)

1. Za svaki par knjiga izračunamo sličnost (`buildPairs`).
2. Za svaku pročitanu uzmemo njenih 5 najsličnijih (`discoverFrom`).
3. Boja = žanr, visina = koliko je preporučena (`heat`).

## Što je gotovo

Faza 0: logika + testovi (12/12 zeleno). Grafičko sučelje još ne postoji.
