# PLAN — Compiler ZeoIsoDeno en page web statique

> **Objectif** : Transformer l'application Deno/Oak (isometric game + editors) en un site web statique, déployable sur GitHub Pages, Netlify, Vercel, ou tout serveur de fichiers statiques, **sans serveur Deno**.

---

## 1. Résumé d'architecture actuelle

```
ZeoIsoDeno/
├── webServer.ts          ← Serveur HTTP Oak (Deno)
│   ├── sert les fichiers statiques (HTML/CSS/JS/TS → esbuild bundling)
│   ├── route /api/map/deltas      → SQLite (map_data.db)
│   ├── route /api/users/*         → SQLite
│   ├── route /editor/*            → CRUD fichiers JSON + sharp preview
│   ├── route /assets-manager/*    → listing assets + sharp preview
│   └── route /iso/*               → isometric game client
│
├── IsoGame/              ← Cœur du jeu (logique métier, rendu isométrique)
├── IsoGameAddon/         ← Extensions (éditeurs, gestionnaire assets, palette)
│   ├── iso/web/          ← Client du jeu (HTML+CSS+TS → esbuild)
│   ├── editor/           ← Éditeur de configs (frontend + backend Oak)
│   ├── assets-manager/   ← Gestionnaire d'assets (frontend + backend Oak)
│   └── pallet/web/       ← Outil palette couleur (frontend)
│
└── img/                  ← Spritesheets, textures (PNG)
```

### Dépendances serveur actuellement utilisées

| Service | Technologie | Rôle |
|---------|-------------|------|
| HTTP Server | Deno + Oak | Routage, middleware CORS/COOP/COEP |
| Persistance | SQLite (`map_data.db`) | Sauvegarde des cartes utilisateurs |
| Bundling TS | esbuild + `denoPlugins()` | Compilation à la volée des `.ts` → `.js` |
| Preview assets | `npm:sharp` | Découpe de sprites côté serveur |
| CRUD configs | Oak + `Deno.readTextFile/writeTextFile` | Édition de configurations building |
| Extraction TS→JSON | Oak + `dynamicImport()` | Analyse de code TypeScript |

### ❌ Éditeur `/editor/` — **COMPLEXE**

**Partie frontend (`web/js/main.ts`)** : ⚠️ Dépend de l'API
- Toutes les opérations passent par `apiClient.ts` → `fetch("/editor/...")`
- Extraction, sauvegarde, validation, preview — tout est serveur

**Partie backend (`server.ts`)** : ❌ Très liée au serveur
- Lit/écrit des fichiers JSON sur le disque
- Utilise `dynamicImport()` pour extraire des classes TS
- Utilise `sharp` pour les previews d'assets
- Génère des previews de buildings avec le moteur de jeu

**Solution partielle :**
- Les fichiers de config JSON peuvent être pré-générés et embarqués
- La preview building peut être déplacée côté client (utilise déjà `World` et `WcAbstractBuildConf` qui sont compatibles navigateur)
- La validation peut être déplacée côté client

### ❌ Persistance (API maps + users) — **À REMPLACER**

- `mapRouter.ts` et `userRouter.ts` utilisent SQLite → impossible en statique
- **Solution :** Remplacer par `localStorage` ou `IndexedDB` (côté client)

---

## 3. Ce qui est TRÈS simple (quasi immédiat)

| Tâche | Estimation | Détail |
|-------|-----------|--------|
| 1. Pré-compiler les TS du client jeu | ~1h | esbuild sur `main.ts`, `gameWorker.ts`, et tous leurs imports |
| 2. Servir le jeu `/iso/` en statique | ~30min | Copier les fichiers compilés, ajuster les chemins |
| 3. Palette `/pallet/` en statique | ~30min | Même chose, outil 100% client |
| 4. Assets-manager frontend seul | ~2h | Déplacer la logique de liste côté client, pas de serveur |
| 5. Images statiques | ~15min | Les spritesheets sont déjà en `img/` |
| 6. Configurer headers COOP/COEP | ~15min | Fichier `_headers` ou config Netlify/Vercel |
| 7. Créer `index.html` racine | ~15min | Page d'accueil avec liens vers les outils |

**Temps total pour la version "lite" (jeu uniquement)** : **~3-4 heures**

---

## 4. Points durs / Complexes

### 🔴 Hard Point #1 : API Editor (CRUD, extraction, preview)

**Problème :** L'éditeur de configurations building dépend entièrement d'un backend Oak qui :
- Lit/écrit des fichiers JSON sur le filesystem (`Deno.readTextFile`, `Deno.writeTextFile`)
- Importe dynamiquement du code TypeScript (`dynamicImport()`) pour l'extraction
- Utilise `npm:sharp` pour générer des previews d'assets
- Exécute le moteur de génération de buildings pour les previews

**Solutions possibles :**
- **Option A (recommandée)** : Geler les configurations en JSON pré-générés. Les fichiers sont déjà en JSON dans les dossiers `conf/`. Les embarquer statiquement et utiliser IndexedDB pour les modifications.
- **Option B** : Réécrire toute la logique d'extraction/preview en client-side. C'est faisable car `WcAbstractBuildConf`, `World`, et les classes de rendu sont déjà compatibles navigateur.
- **Option C** : Déployer l'éditeur séparément avec un vrai backend (Deno Deploy, Cloudflare Workers, etc.) et garder le jeu en statique.

### 🔴 Hard Point #2 : Persistance des cartes (SQLite)

**Problème :** Les cartes utilisateur sont stockées dans `map_data.db` (SQLite) et servies via des API REST Oak.

**Solutions :**
- **Option A (recommandée pour MVP)** : Utiliser `localStorage` pour les cartes. Simple mais limité à ~5-10MB.
- **Option B** : Utiliser `IndexedDB` — plus de capacité, asynchrone, idéal pour les données de carte.
- **Option C** : Utiliser un backend BaaS (Supabase, Firebase) ou un service comme `isomorphic-git` pour sauvegarder sur GitHub.

### 🔴 Hard Point #3 : Bundling TypeScript (esbuild à la volée)

**Problème :** Actuellement, le serveur compile les `.ts` en `.js` à chaque requête via esbuild + `denoPlugins()`. En statique, il faut pré-compiler.

**Solution :** Ajouter une étape de build (`deno task build`) qui utilise esbuild pour compiler tous les entry points du projet en JS. C'est simple mais nécessite de configurer le pipeline.

### 🔴 Hard Point #4 : SharedArrayBuffer et headers de sécurité

**Problème :** `SharedArrayBuffer` (utilisé pour la communication worker↔main thread) nécessite les headers :
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Ces headers sont déjà définis dans `webServer.ts` ligne 68-69 mais doivent être configurés sur le serveur statique.

**Solution :** Facile à configurer sur Netlify (`_headers`), Vercel (`vercel.json`), ou Cloudflare Pages.

### 🔴 Hard Point #5 : Chemins d'assets et spritesheets

**Problème :** Le code client construit les URLs d'assets avec `self.location.origin` (`assetImageLoader.ts` ligne 87-93). En statique, les spritesheets seront servies avec des chemins relatifs.

**Solution :** Ajuster la résolution des chemins d'assets. C'est simple mais nécessite de vérifier chaque `fetch()`.

---

## 5. Architecture cible recommandée

```
                    ┌─────────────────────────────┐
                    │   STATIC FILE SERVER         │
                    │  (Netlify / GitHub Pages)    │
                    │                              │
                    │  /index.html       → accueil │
                    │  /iso/             → jeu     │
                    │  /iso/js/main.js   → bundle  │
                    │  /pallet/          → palette │
                    │  /assets-manager/  → assets  │
                    │  /img/             → images  │
                    │  /conf/            → configs │
                    │  /_headers         → COOP/COEP│
                    └───────────┬─────────────────┘
                                │
                    ┌───────────▼─────────────────┐
                    │   CLIENT (navigateur)        │
                    │                              │
                    │  ├─ Web Worker (game loop)   │
                    │  ├─ SharedArrayBuffer (perf) │
                    │  ├─ OffscreenCanvas (render) │
                    │  ├─ Canvas 2D (isometric)    │
                    │  └─ IndexedDB (persistance)  │
                    └──────────────────────────────┘
```

### Stack cible

| Composant | Actuel | Cible statique |
|-----------|--------|---------------|
| Serveur | Deno + Oak | N/A (fichiers statiques) |
| Bundling | esbuild runtime | esbuild en build step |
| Persistance cartes | SQLite | IndexedDB / localStorage |
| Configs buildings | JSON fichiers | JSON embarqués + localStorage |
| Preview assets | sharp (serveur) | Canvas client |
| Preview buildings | Moteur serveur | Moteur client |
| Validation | Côté serveur | Côté client |
| Images | `img/` directory | `img/` directory (inchangé) |

---

## 6. Plan de migration — Phases

### Phase 1 : Le jeu uniquement (MVP statique) — ~1-2 jours

**Objectif :** Avoir le jeu isométrique fonctionnel en statique.

1. Creer `scripts/build.ts` — pipeline esbuild qui compile :
   - `IsoGameAddon/iso/web/js/main.ts` → `dist/iso/js/main.js`
   - `IsoGameAddon/iso/web/js/gameWorker.ts` → `dist/iso/js/gameWorker.js`
2. Copier les fichiers statiques : HTML, CSS, img/, assets
3. Ajuster les chemins dans le HTML (pointer vers les .js compiles)
4. Creer `dist/_headers` pour COOP/COEP
5. Tester localement avec un serveur statique

### Phase 2 : Palette + Assets Manager — ~1-2 jours

1. Compiler les TS de la palette → JS
2. Compiler les TS du gestionnaire d'assets → JS
3. Copier les fichiers HTML/CSS
4. Assets Manager : les donnees de configuration d'assets sont deja en TS/JS et peuvent etre importees directement cote client

### Phase 3 : Editeur de configurations — ~3-5 jours

1. **Lecture seule d'abord** : Embarquer les fichiers JSON existants
2. **Edition locale** : Stocker les modifications dans IndexedDB/localStorage
3. **Preview building cote client** : Deplacer la logique de previewBuilder.ts et WcAbstractBuildConf cote client
4. **Validation cote client** : Deplacer la logique de validation
5. **Export** : Permettre de telecharger les configurations modifiees en JSON

### Phase 4 : Persistance des cartes — ~2-3 jours

1. Implementer un `ClientDatabase` qui remplace `serverDatabase.ts` avec IndexedDB
2. Adapter les appels fetch("/api/map/deltas") en appels locaux IndexedDB

---

## 7. Pipeline de build recommande

```bash
# deno.json — nouvelles taches
{
  "tasks": {
    "build:static": "deno run -A scripts/build-static.ts",
    "serve:static": "deno run --allow-net --allow-read scripts/serve-static.ts",
    "preview": "deno task build:static && deno task serve:static"
  }
}
```

### Ce que doit faire `scripts/build-static.ts` :

```typescript
import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.1";

// 1. Compiler le jeu (main.ts)
await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["./IsoGameAddon/iso/web/js/main.ts"],
  bundle: true,
  format: "esm",
  outfile: "./dist/iso/js/main.js",
});

// 2. Compiler le worker
await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["./IsoGameAddon/iso/web/js/gameWorker.ts"],
  bundle: true,
  format: "esm",
  outfile: "./dist/iso/js/gameWorker.js",
});

// 3. Copier les fichiers statiques (HTML, CSS, images...)
// 4. Generer _headers pour COOP/COEP
await Deno.writeTextFile("./dist/_headers",
  "/*\n" +
  "  Cross-Origin-Opener-Policy: same-origin\n" +
  "  Cross-Origin-Embedder-Policy: require-corp\n"
);
```



---

## 8. Tableau recapitulatif

| Application | Statique possible ? | Effort principal | Difficulté |
|-------------|-------------------|-----------------|------------|
| **Jeu isometrique** `/iso/` | Oui, immediat | Pre-compilation TS | Facile |
| **Palette** `/pallet/` | Oui, immediat | Pre-compilation TS | Facile |
| **Assets Manager** `/assets-manager/` | Oui, avec adaptation | Deplacer logique liste en frontend | Modere |
| **Editeur configs** `/editor/` | Partiellement | Remplacer API backend par logique locale | Complexe |
| **Persistance cartes** | A remplacer | IndexedDB → adapter les appels API | Modere |
| **Preview buildings** | Possible | Deplacer l'execution cote client | Modere |

---

## 9. Recommandation strategique

### Pour un MVP rapide (1 semaine) :

1. **Jeu iso** en statique — priorite #1
2. **Palette** — presque gratuit une fois le pipeline de build en place
3. **Assets Manager** en "viewer only" — pas de preview serveur, juste les sprites charges cote client
4. **Editeur** en mode "lecture seule" — les JSON sont embarques
5. **Persistance** → `localStorage` pour commencer, migrer vers IndexedDB ensuite

### Pour une version complete (2-3 semaines) :

1. Tout ce qui precede
2. Editeur avec edition locale complete (sauvegarde dans IndexedDB)
3. Persistance IndexedDB pour les cartes
4. Export JSON des configurations modifiees
5. Deploiement sur GitHub Pages ou Netlify avec configuration COOP/COEP

---

## 10. Notes techniques importantes

### SharedArrayBuffer et COOP/COEP

Le jeu utilise `SharedArrayBuffer` pour la communication performante entre le thread principal et le Web Worker. C'est **obligatoire** pour le bon fonctionnement :

```nginx
# Netlify _headers
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

```json
// Vercel vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

> **Attention** : Avec COEP `require-corp`, toutes les ressources externes (CDN, polices, etc.) doivent envoyer le header `Cross-Origin-Resource-Policy: cross-origin` ou utiliser un attribut `crossorigin`. Les CDN utilises (`font-awesome`, `fonts.googleapis.com`, `htmx.org`) peuvent poser probleme — il faudra peut-etre les embarquer localement.

### Import maps et resolution de modules

Le fichier `deno.json` definit des alias d'import :
```json
{
  "imports": {
    "@iso-game/": "./IsoGame/",
    "@iso-web/": "./IsoGameAddon/iso/web/"
  }
}
```

esbuild avec `denoPlugins()` resout ces alias. En statique, c'est transparent car le bundle resout tout en imports relatifs.

### Taille des assets

Le dossier `img/` contient des centaines de spritesheets PNG. La taille totale peut etre consequence (plusieurs centaines de Mo). Pour un deploiement web :
1. Optimiser les PNG (compression)
2. N'embarquer que les spritesheets reellement utilisees par le jeu
3. Envisager un lazy loading des assets

---

## Annexe : Arbre des dependances critiques

```
indexIso.html
  +-- js/main.ts
        +-- menu/sections/*.ts            100% client
        +-- menu/headMenu.ts              100% client
        +-- main/keyboad.ts               100% client
        +-- IsoGame/handlers/handlers.ts  100% client

gameWorker.ts
  +-- IsoGame/word.ts                     100% client
  +-- IsoGame/mapIso/canvasMapDrawer.ts   Canvas 2D
  +-- IsoGame/mapIso/asset/assetLoaderOpti.ts  OffscreenCanvas + fetch
  +-- IsoGame/handlers/game/gameState.ts  100% client
  +-- IsoGame/handlers/handlers.ts        100% client
```

**Aucun fichier dans `IsoGame/` n'utilise `Deno.*`, Oak, SQLite, ou toute API serveur.** Le c ur du jeu est deja 100% compatible navigateur !

