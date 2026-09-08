# read-map

A personal reading map. Every book you finish reveals its _K_ most similar
neighbours; everything undiscovered stays hidden. The more you read, the more of
the map you can see.

> **Status:** Phases 0–2 and 4 complete — the domain core, a persistent
> read/unread list (IndexedDB), the signal-based store, adding books from Open
> Library, and semantic similarity via embeddings (a local model, run offline for
> the seed and in the browser for added books). A demo/own-library split lets the
> app be deployed statically. The graph UI (Phase 3) is not built yet.

---

## Overview

`read-map` turns a private library into a force-directed graph of similarity.
Read books are anchors; unread books surface only when they are close enough to
something you have read. Node colour encodes genre, vertical position encodes
"heat" (how strongly a book is recommended), and marking a book as read triggers
a small discovery animation.

The similarity measure is intentionally pluggable. Today it is Jaccard overlap
of tags; it is a known-weak signal (see the notorious _Moby Dick ↔ Rebecca_ 60 %
false match) and is scheduled for replacement by embedding cosine similarity in
Phase 4. Every downstream calculation depends only on the `Similarity`
interface, so swapping the measure is a dependency change, not a rewrite.

The product decisions, measured numbers, and the seven bugs not to reintroduce
are recorded in [`HANDOFF.md`](HANDOFF.md). The original single-file d3
prototype, [`mapa-knjiga-v2.html`](mapa-knjiga-v2.html), is the **specification**
— not source to port line by line.

## Architecture

Three layers with one hard rule: **`domain/` must not import anything from
`@angular/*`.** The core is plain TypeScript so it can be reasoned about and
tested without a framework or a DOM.

```
src/app/
  domain/          pure TypeScript — no Angular, no DOM
    book.model.ts    Book, Pair, Genre
    similarity.ts    Similarity interface + TagJaccard + VectorCosine
    pairs.ts         buildPairs, adjacency index
    scoring.ts       score, heat, tier, HEAT_FLOOR
    discovery.ts     discoverFrom, frontierOf
    *.spec.ts        unit tests (Vitest)
  data/            DTO boundary + persistence
    books.json       seed dataset (202 books)
    raw-book.model.ts  external record shape (has `read`)
    book-data.ts     loadBooks: raw → domain Book + initial readIds
    persistence.ts   StatePersistence port (IndexedDB / in-memory)
    book-store.ts    signals + computed; the single source of truth
    open-library.client.ts  HttpClient search against Open Library
    open-library.mapper.ts   OL result → domain Book
  book-list/       container + presentational list components
  book-search/     Open Library search + add-to-library
  graph/           imperative d3 renderer (Phase 3)
  shell/           top bar, settings, side panel, book card               (Phase 3)
```

> **Note on change detection:** the project is zoneless (no `zone.js`). Change
> detection is driven entirely by signals, so the older `ngZone.runOutsideAngular`
> pattern does not apply here.

## Tech stack

| Concern       | Choice                                  |
| ------------- | --------------------------------------- |
| Language      | TypeScript 6                            |
| Framework     | Angular 22 (standalone, no NgModules)   |
| Build         | `@angular/build` (esbuild)              |
| Unit tests    | Vitest + jsdom (`@angular/build:unit-test`) |
| Visualisation | d3 v7 (Phase 3)                         |
| Persistence   | IndexedDB (Phase 1)                     |
| Embeddings    | Transformers.js — local multilingual sentence-transformer (Phase 4) |
| Runtime       | Node.js 22                              |

## Getting started

Prerequisites: **Node.js 22** and npm 10.

```bash
npm install       # install dependencies
npm start         # dev server at http://localhost:4200
npm test          # run the unit suite once (add -- --watch for watch mode)
npm run build     # production build into dist/
```

## Testing

Unit tests run on Vitest through the Angular build system; the domain layer needs
no browser. The Phase 0 suite pins the contracts that the prototype proved by
experiment:

1. **Data integrity** — every `id` in `books.json` is unique (202 books).
2. **Similarity** — `TagJaccard` is symmetric and bounded to `[0, 1]`.
3. **Heat floor (regression, bug #6)** — the recommendation denominator never
   drops below `HEAT_FLOOR = 0.8`, so un-reading every book collapses heat to `0`
   rather than dividing by ~0 and stacking every node into a heap.
4. **Cold start** — `discoverFrom` with an empty read set seeds exactly 6 hub
   books by degree.
5. **Discovery curve** — with `K = 5` and 4 read books, exactly 20 nodes are
   discovered (the read set is included in the result).

```bash
npm test
```

## Key invariants

- **One source of truth for read state.** Read status lives in a
  `readIds: Set<string>`, never as a boolean on a book object. Copying the flag
  onto duplicated objects was the single most common bug in the prototype.
- **`buildPairs` does not apply the threshold.** It keeps every pair with
  `w > 0`; the `0.2` threshold belongs to `frontierOf` only. Filtering earlier
  would silently change scores and the discovery curve.
- **The heat floor is load-bearing.** See test #3 above.

## Embeddings (Phase 4)

Similarity starts as tag overlap (Jaccard) — a known-weak signal (the notorious
_Moby Dick ↔ Rebecca_ 60% false match). It is replaced by embedding cosine
(`VectorCosine`) computed with a local, multilingual sentence-transformer
(Transformers.js) — no API key, no service, no per-user cost, so the app can be
deployed as a static site and still embed books in the visitor's browser.

Generate the seed vectors once (downloads the model to a local cache the first
time):

```bash
npm run embed:seed        # writes src/app/data/vectors.json (202 books)
```

The app auto-detects `vectors.json`: empty → Jaccard, populated → `VectorCosine`.
The absolute cosine sits high with this model, so what matters is the ranking, not
the number — verify a false match is out of the neighbourhood:

```bash
npm run check:pair -- moby rebecca   # 49% absolute, but Rebecca ranks ~33rd of 201
npm run check:pair -- zov ocnjak     # 85% (same author, wilderness)
```

The **same model** also runs in the browser (`EmbeddingService`, lazy-loaded) so
books added from Open Library get a vector in the same space at add time — this is
what makes discovery work on a deployed, multi-user page with no backend. If the
in-browser embed fails, the book is still added and falls back to Jaccard.

**Demo vs. your own.** A visitor opens into the seed as a demo (instant, no model
download; toggles there are ephemeral). "Start your own" switches to an empty
personal map stored in their browser (IndexedDB); added books are embedded on the
fly.

## Roadmap

| Phase | Deliverable                                          | Status      |
| ----- | ---------------------------------------------------- | ----------- |
| 0     | Skeleton, domain port, unit tests                    | ✅ Done     |
| 1     | IndexedDB + read/unread, ugly list (no graph yet)    | ✅ Done     |
| 2     | Add books via Open Library                           | ✅ Done     |
| 3     | Graph component: ladder layout, discovery, zoom      | Planned     |
| 4     | Embedding vectors + `VectorCosine` (seed + in-browser) | ✅ Done     |
| 5     | Discovery ceremony, orbits, PWA, deploy              | Planned     |

Phase 1 deliberately precedes the graph: a week of real use decides whether the
tool is worth the visualisation.

## References

- [`HANDOFF.md`](HANDOFF.md) — decisions, contracts, measured numbers, known bugs.
- [`mapa-knjiga-v2.html`](mapa-knjiga-v2.html) — the d3 prototype (specification).
- [`README.simple.md`](README.simple.md) — a short, plain-language summary.
