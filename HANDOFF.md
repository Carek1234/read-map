# Mapa knjiga — predaja u Claude Code

**Prototip:** `mapa-knjiga-v2.html` — jedna datoteka, d3 v7, ~1600 linija.
**Podaci:** `books.json` — 202 knjige, 85 oznaka, 4 označene pročitanima.
**Varijanta:** `mapa-knjiga-post.html` — ista logika, siva/narančasta paleta. Odbačena.

**Prototip je specifikacija, ne izvor koda.** Ne portaj ga liniju po liniju.
Imperativni d3 u jednoj datoteci vrijedi samo kao dokaz da mehanika radi.
Prenose se odluke, ugovori i izmjerene brojke iz ovog dokumenta.

---

## 1. Što aplikacija radi

Graf pročitanih knjiga. Svaka pročitana otkriva svojih K najsličnijih.
Neotkriveno se ne crta. Što više čitaš, više mape vidiš.

**Raspored (ljestvica):** okomito = toplina, vodoravno = žanr (privremeno, vidi 6.3).

**Tri stanja čvora:**

| status | ispuna | rub |
|---|---|---|
| pročitano | 72 % boje žanra | pun; svijetli prsten samo na prvoj pročitanoj u žanru, +2 px polumjera |
| prijedlog | 5–50 %, po toplini | crtkano `3 3`, debljina `1 + 2.4 × heat` |
| nepoznato | bez ispune | crtkano `2 3`, sivo, `pointer-events: none`, bez naslova |

**Utezi:** pročitane su pribijene na dno (`fy`), poredane po redoslijedu čitanja
unutar žanra — 24 px po sloju do desetog, dalje 9 px. Prva pročitana je najniža.

**Naslovi:** samo pročitane, tri najtoplija prijedloga i odabir. Ostalo na hover.
Pri 50+ čvorova se natpisi inače preklapaju u kašu.

---

## 2. Arhitektura — tri sloja, tvrda granica

```
src/app/
  domain/            čisti TypeScript, NULA Angulara, NULA DOM-a
    book.model.ts
    similarity.ts        Similarity sučelje + TagJaccard + VectorCosine
    pairs.ts
    scoring.ts           score(), heat(), tier()
    discovery.ts         discoverFrom(), frontierOf()
    ladder.ts            ciljne Y pozicije, redoslijed utega
    *.spec.ts
  graph/
    graph.component.ts
    graph.renderer.ts    imperativni d3, izvan Angularove zone
    orbits.ts            mikro-gibanje čvorova (vidi 7)
  shell/               traka, postavke, desna ploča, kartica
  data/
    book.store.ts        signali + IndexedDB
    openlibrary.client.ts
```

Pravilo: `domain/` ne smije importati ništa iz `@angular/*`.

---

## 3. Stanje — signali

```ts
books    = signal<Book[]>([]);
readIds  = signal<ReadonlySet<string>>(new Set());
k        = signal(5);
threshold= signal(0.2);

pairs      = computed(() => buildPairs(this.books(), this.threshold()));
discovered = computed(() => discoverFrom(this.pairs(), this.readIds(), this.k()));
shadow     = computed(() => frontierOf(this.pairs(), this.discovered()));
```

U prototipu je `recomputeDiscovered()` bio ručni poziv i **dvaput sam ga
zaboravio**. Kao `computed` to se ne može dogoditi. To je jedini razlog zašto
Angular ovdje nešto donosi.

---

## 4. Ugovori domene

```ts
export interface Book {
  id: string;           // jedinstven — provjeriti testom
  title: string; author: string; pages: number;
  tags: string[];       // privremeno; zamjenjuje ga vektor
  genre: 'adv' | 'crime';
  vec?: Float32Array;   // faza 4
}

export interface Similarity { between(a: Book, b: Book): number; }
export class TagJaccard  implements Similarity {}   // port, za bacanje
export class VectorCosine implements Similarity {}  // pravi

discoverFrom(pairs, readIds, k): Set<string>
frontierOf(pairs, discovered): Set<string>
```

Sučelje ubaci **odmah**, dok postoji samo Jaccard. Zamjena je tada promjena u
DI-ju, ne refaktor.

### Toplina — NE normaliziraj tekućim maksimumom

```ts
const MAX = Math.max(...scores, 0.8);   // POD JE OBAVEZAN
heat = book.read ? 1 : Math.min(1, score(book) / MAX);
```

Bez poda od 0.8: odznačiš zadnju pročitanu knjigu → svi rezultati padnu na nulu
→ `MAX` padne na 0.001 → toplina podivlja → **čvorovi se stisnu u hrpu**.
Izmjereno prije popravka: rasprostranjenost mape 820 px → kolaps.
Nakon popravka: 820 px → 820 px.

---

## 5. d3 u Angularu — pet pravila

1. `ngZone.runOutsideAngular(() => sim.on('tick', render))`. Bez toga 60 change
   detectiona u sekundi.
2. **Nikad `@for` preko čvorova.** D3 posjeduje to podstablo.
3. `effect()` gleda signale i zove `renderer.rebuild(snapshot)`.
4. `ngZone.run()` samo na korisnički klik koji mijenja stanje.
5. Mikro-gibanje traži vlastiti `d3.timer` koji zove `renderPositions()` svaki
   kadar, neovisno o simulaciji — simulacija zaspi, gibanje ne smije.

---

## 6. Izmjerene brojke (ne procjene)

### 6.1 Gustoća — zašto oznake moraju otići

| | 95 knjiga | 202 knjige |
|---|---|---|
| parova | 4 465 | 20 301 |
| bridova ≥ 0.20 | ~400 | **1 881** |
| veza ≥ 50 % | — | 269 |
| oznaka | ~60 | 85, prosjek 3.9 po knjizi |

### 6.2 Dokaz da je mjera pokvarena

```
Moby Dick  <->  Rebecca   60 %
```
Zajedničke oznake: `more`, `mračno`, `klasik`. Kitolovački brod u Pacifiku i
gotička priča o vili u Cornwallu. Preživjelo tri proširenja podataka.

**Problem nikad nisu bili podaci nego mjera.** Ne dodavaj knjige prije zamjene
`similarity()`.

### 6.3 Žanrovska sidra

Mostova preko granice žanra: **13 od 990 parova** (1,3 %). Kad dođu embeddingi,
klasteri se pojave sami → **izbaci `genre` u fazi 4.**

### 6.4 Krivulja otkrivanja (K = 5)

| pročitano | otkriveno |
|---|---|
| 3 | 14 / 202 |
| 4 | 18 |
| 5 | 20 |
| 6 | 21 |

~2 nove po pročitanoj, ne 5 — preporuke se preklapaju. To je točan signal da si
iscrpio područje.

### 6.5 Cijena mikro-gibanja

1601 element se osvježava po kadru (747 bridova × 2 + 107 čvorova).
Na 200 čvorova prolazi. **Na 500 knjiga ovo prvo gasi ili seli na canvas.**

---

## 7. Kalibracija animacije — prag vidljivosti

Tri puta sam kalibrirao ispod praga i tri puta je izgledalo kao da je pokvareno.
Prag na kojem oko registrira gibanje je **~2 px/s**.

| pokušaj | izmjereno | ishod |
|---|---|---|
| rotacija sloja 0.30° / 95 s | 0.02 °/s | nevidljivo |
| rotacija sloja 1.07° / 45 s | 0.12 °/s | vidljivo (referenca: minutna kazaljka 0.1 °/s) |
| orbite 1.4–3.8 px / 18–40 s | 0.5 px/s | nevidljivo |
| **orbite 4.5–11 px / 7–16 s** | **3.9 px/s** | konačno |

**Formula, računaj je prije nego pogodiš:** vršna brzina = `amplituda × 2π / period`.

Konačno rješenje: svaki čvor kruži oko svoje pozicije, vlastiti polumjer, period
i faza. Pročitane na 55 % amplitude, sidra miruju. Bez zajedničkog ritma —
mapa djeluje živo, ne kao da se ljulja u komadu.

---

## 8. Ceremonija otkrivanja

Oznaka pročitanog pokreće slijed:

```
klik    →  traka "PRETRAŽUJEM SUSJEDSTVO…"   + putujuće točke krenu
700 ms  →  "PRONAĐENO N NOVIH KNJIGA"
2.6 s   →  traka nestaje
```

Putujuća točka ide od pročitane knjige do svake novootkrivene, po njihovom bridu,
razmak 90 ms, na odredištu je dočeka bljesak (prsten koji naraste 5× i nestane).

**Odznačavanje ima svoju poruku:** „Mapa se suzila za N". Prije je javljalo
„Ništa novo u susjedstvu", što je bilo besmisleno.

**Bljesak prati prijelaz nepoznato → poznato, ne ulazak u DOM.** Otkrivena knjiga
je već bila na ekranu kao anonimni krug, pa enter-selekcija ne pomaže. Koristi
razliku dvaju skupova otkrivenog.

---

## 9. Sedam bugova iz prototipa — ne uvedi ih ponovno

1. **Identitet objekata.** `nodes` su bile kopije `BOOKS`; označavanje iz trake
   mijenjalo je jedan objekt, a graf se crtao iz drugog. Radilo je samo klikanje
   po grafu. Prisutno desetak izmjena.
   → Jedan izvor istine, `readIds` kao `Set<string>`, nikad `boolean` na kopiji.

2. **Duplikat id-a** (`wild` za *Into the Wild* i *Divlja*). Tri linije testa.

3. **Redoslijed deklaracija — tri puta.** `yFor`, zatim `rng`, zatim `initOrbits`
   deklarirani nakon mjesta gdje se prvi put koriste. D3 sile pozivaju svoj
   akcesor odmah pri `initialize()`. Temporal dead zone, app ne starta.

4. **Kaskadno kašnjenje na prvom crtanju.** Svi čvorovi su „novi", pa je kaskada
   od 90 ms značila da zadnji dobije boju nakon 5 s. Razlikuj prvo crtanje.

5. **Pomak središta.** Zatvaranje ploče širi platno za 300 px → `CX` se pomakne
   za 150 → sve sile dobiju nove ciljeve → mapa se pomakne na svaki klik u
   prazno (86 od 107 čvorova). Odvoji „dimenzije za zoom" od „središta za sile".

6. **Toplina normalizirana tekućim maksimumom** — vidi 4.

7. **Prsten s `fill: none` ne hvata klik u sredini.** Nevidljivi `circle.hit`,
   `r = max(radius, 13)`, `pointer-events: all`; vidljivi krug i bljesak
   `pointer-events: none`.

Sve je uhvatio jsdom test. **Nijedan nisam vidio čitajući kod.**

---

## 10. Ostale naučene sitnice

- `d3.zoom()` bez `.extent()` čita širinu iz atributa SVG-a; kod CSS-om
  dimenzioniranog elementa ih nema. Uvijek `.extent(() => [[0,0],[W,H]])`.
- `forceLink` baca `node not found` čim `sim.nodes()` izostavi čvor na koji veza
  pokazuje. Isprazni veze prije `sim.nodes()`, pa ih napuni filtrirane.
- Ne postavljaj `font-size` na dva mjesta; prijelaz pregazi protuskaliranje zooma
  pola sekunde kasnije.
- `vector-effect: non-scaling-stroke` + `font-size = 10.5 / k` drži prikaz
  čitljivim na svakom zoomu.
- Debljina brida **po rangu unutar vidljivog skupa**, ne po apsolutnom Jaccardu.
  Apsolutne vrijednosti žive u pojasu 0.2–0.6 pa ne razlikuju ništa.
  Raspon debljina: 2.72 → 4.13 nakon prelaska na rang.
- `applyLayout(alpha)` uzima jačinu kao parametar. Fiksnih `alpha(0.6)` znači da
  se mapa preslaguje i na promjenu širine platna.
- O(n²) geometrija se kešira po ključu `layout:CX:CY`.

---

## 11. Redoslijed faza

| faza | sati | gotovo kad |
|---|---|---|
| 0. kostur, port domene, jedinični testovi | 6–8 | `npm test` zelen, nula Angulara u `domain/` |
| 1. IndexedDB + oznaka pročitano, **ružna lista bez grafa** | 4–6 | preživi refresh; koristiš tjedan dana |
| 2. dodavanje knjige (Open Library) | 6–10 | dodaš knjigu koje nema u `books.json` |
| 3. grafička komponenta | 8–12 | ljestvica, otkrivanje, zoom, bljesak |
| 4. skripta za vektore + `VectorCosine` | 6–8 | *Moby Dick ↔ Rebecca* padne ispod 20 % |
| 5. ceremonija, orbite, kartica, PWA, deploy | 6–8 | javni URL, radi offline |

Ukupno **36–52 h**.

**Faza 1 je namjerno prije grafa.** Nakon nje tjedan dana koristiš alat i saznaš
hoćeš li ga uopće otvarati. Ako ga ne otvoriš tjedan dana — stani. Bila je to
vizualizacija, ne alat.

---

## 12. Što se NE portira

- radijalni raspored (izbačen), „presloži mapu" (izbačen), zvjezdana pozadina
  (izbačena), gradijentna podloga (izbačena), lažni „neistraženi" čvorovi
  (zamijenjeni stvarnim knjigama bez naslova)
- žanrovska sidra → izbaci u fazi 4
- backend s korisnicima, prijava, sinkronizacija → jedan si korisnik

---

## 13. Otvorena pitanja

- **Ocjene 1–5.** Bez njih „slično" ≠ „svidjet će mi se". Loša ocjena mora davati
  **negativan** doprinos:
  `score += sim(book, read) * W[rating]`, `W = {1:-1, 2:-0.5, 3:0.2, 4:0.8, 5:1}`.
- **Trajno otkriveno?** Sada se izvodi iz stanja: skineš oznaku pročitano i ono
  što je ta knjiga otkrila nestaje (izmjereno: 20 → 14). Alternativa je `Set`
  koji pamti zauvijek.
- **Frontiera raste brže od otkrivenog.** Na 30 pročitanih bit će gruda anonimnih
  krugova. Ograniči je na najjačih N veza, ne na sve iznad praga.
- **Deduplikacija Open Libraryja** (`work` vs `edition` vs ISBN) je najveći
  pojedinačni potrošač vremena u fazi 2. Računaj 4–6 h samo na to.

---

## 14. Prvi prompt za Claude Code

> Pročitaj HANDOFF.md i books.json. Napravi fazu 0: Angular 17+ standalone
> projekt, mapa `src/app/domain/` bez ijednog importa iz @angular/*, s modelom
> Book, sučeljem Similarity, implementacijom TagJaccard te funkcijama
> buildPairs, score, heat, discoverFrom, frontierOf.
> Uz to jedinične testove koji provjeravaju:
> 1. jedinstvenost id-eva u books.json,
> 2. da je Jaccard simetričan i u [0,1],
> 3. da heat koristi pod od 0.8 i da odznačavanje zadnje pročitane knjige NE
>    mijenja raspon topline ostalih (regresija za bug 6),
> 4. da discoverFrom s praznim readIds vrati 6 početnih čvorišta,
> 5. da s K=5 i 4 pročitane knjige vrati točno 20 otkrivenih.
> Brojke 4 i 5 su izmjerene na prototipu.
> Ne diraj graf ni Angular komponente u ovoj fazi.
