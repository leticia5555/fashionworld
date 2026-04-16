# FashionWorld — Test Coverage Analysis

## Current State

**Test coverage: 0%.** There are no test files, no testing framework, no `package.json`, and no CI pipeline running tests. The entire application is a single 3,078-line HTML file (`public/index.html`) containing CSS, HTML, and vanilla JavaScript with no modularization.

---

## Codebase Inventory

The application contains **39 JavaScript functions** across these functional areas:

| Area | Key Functions | Lines (approx) | Complexity |
|------|--------------|-----------------|------------|
| Store Data/Catalog | `STORES`, `CATALOG`, `MOODS` | ~113 | Low |
| 3D Scene (Three.js) | setup, materials, lighting | ~340 | Medium |
| Store Facade Builder | `buildStoreFacade()` | ~391 | High |
| Movement/Controls | pointer lock, WASD, `getDt()` | ~30 | Low |
| Proximity Detection | `checkProx()` | ~12 | Low |
| Minimap | `drawMinimap()` | ~22 | Low |
| Animation Loop | `animate()` (NPCs, particles, fountain) | ~95 | Medium |
| Photo Try-On | `handleUserPhoto()`, `processUserPhoto()`, `overlayGarmentOnPhoto()` | ~180 | High |
| AI Try-On Engine | `generateAITryOn()`, `renderAITryOnCanvas()` | ~170 | High |
| Body Scan System | `startScan()`, `applyManual()`, `applyQuick()` | ~120 | Medium |
| Avatar Canvas Engine | `drawAvatar()`, color utils | ~600 | Very High |
| Outfit State Mgmt | `addPiece()`, `renderFitPanel()`, `clearFit()` | ~35 | Low |
| Store UI | `renderGrid()`, `openStore()`, `closeStore()` | ~50 | Medium |
| Share System | `shareWhatsApp()`, `copyLink()` | ~18 | Low |
| Mood Board | `buildMoods()`, `filterMood()` | ~30 | Low |
| Entry/Navigation | `enterMall()`, `showToast()` | ~20 | Low |

---

## Recommended Test Strategy

### Step 0: Prerequisites — Modularize and Add Tooling

Before any tests can be written, the project needs:

1. **Initialize npm** — Create a `package.json`
2. **Extract JavaScript into modules** — Move JS out of `index.html` into separate `.js` files (e.g., `catalog.js`, `avatar.js`, `bodyscan.js`, `color-utils.js`, etc.)
3. **Install a test framework** — Vitest or Jest recommended for this project
4. **Add jsdom** — For DOM-dependent function tests
5. **Add canvas mock** — For `drawAvatar()` and canvas rendering tests (e.g., `jest-canvas-mock`)

---

### Priority 1: Pure Logic Functions (High value, easy to test)

These functions have **no DOM or Three.js dependencies** and can be unit-tested immediately after extraction:

#### Color Utilities (`hexToRgb`, `darkColor`, `lightenColor`)
- **Why**: Used throughout avatar and garment rendering. Bugs here silently break visual output.
- **Test cases**:
  - `hexToRgb('#C8A96E')` → `{r: 200, g: 169, b: 110}`
  - `hexToRgb('#000000')` → `{r: 0, g: 0, b: 0}`
  - `hexToRgb('#FFFFFF')` → `{r: 255, g: 255, b: 255}`
  - `hexToRgb(null)` / `hexToRgb('#abc')` → fallback `{r:200,g:200,b:200}`
  - `darkColor('#C8A96E')` → rgb values each reduced by 45
  - `lightenColor('#C8A96E', 50)` → rgb values each increased by 50, clamped at 255

#### BMI Proportion Model (`applyQuick` logic)
- **Why**: Incorrect body estimation leads to distorted avatars. The math is testable in isolation.
- **Test cases**:
  - Normal BMI (height=165, weight=60) → reasonable chest/waist/hips
  - Underweight edge case (height=180, weight=45) → proportions stay within valid range
  - Overweight edge case (height=155, weight=120) → values don't exceed input max bounds (chest≤140, waist≤130, hips≤150)
  - Boundary: minimum height (140cm) and weight (35kg)
  - Boundary: maximum height (210cm) and weight (180kg)

#### Delta Time (`getDt`)
- **Why**: Incorrect frame timing causes animation speed bugs across devices.
- **Test cases**:
  - Normal frame interval → correct delta
  - Very large gap (tab backgrounded) → clamped at 0.05s max
  - Rapid calls → small positive delta

---

### Priority 2: State Management & Business Logic (Medium effort, high value)

#### Outfit Management (`addPiece`, `clearFit`, outfit object)
- **Why**: Core shopping experience. Bugs here mean wrong items, wrong prices, wrong avatar.
- **Test cases**:
  - Adding a dress replaces a previously added dress (same `cat` slot)
  - Adding a top doesn't remove an existing dress
  - `clearFit()` resets outfit to empty
  - Adding a piece updates total price correctly
  - Item count reflects actual unique categories
  - Adding a piece with an ID not in CATALOG does nothing

#### Store Switching (`openStore` catalog swap)
- **Why**: The CATALOG global is swapped when entering different stores — a fragile pattern.
- **Test cases**:
  - Opening "zara" sets `CATALOG` to `STORES.zara.catalog`
  - Opening a store after adding items to outfit preserves the outfit
  - All store IDs in `STORE_POSITIONS` have matching entries in `STORES`
  - Every catalog item has required fields: `id`, `name`, `desc`, `price`, `color`, `cat`

#### Proximity Detection (`checkProx`)
- **Why**: Determines which store the player can enter. Incorrect distance → can't enter stores.
- **Test cases**:
  - Camera directly at ICONY position (0, 1.65, -8) → `nearTarget.id === 'icony'`
  - Camera at center of mall → `nearTarget` is the mood board or null
  - Camera far from all stores → `nearTarget === null`
  - Camera equidistant between two stores → picks one consistently

---

### Priority 3: Data Integrity (Low effort, prevents regressions)

#### Catalog Data Validation
- **Why**: Typos in data silently break the UI. One missing field = broken product card.
- **Test cases**:
  - Every store in `STORES` has all required keys: `name`, `tagline`, `wallColor`, `floorColor`, `accentColor`, `signColor`, `signGlow`, `dressColors`, `catalog`
  - Every catalog item has: `id`, `name`, `desc`, `price`, `color`, `cat`
  - `cat` values are limited to known types: `dress`, `top`, `bottom`, `set`, `shoes`, `bag`, `acc`
  - No duplicate `id` values within the same store catalog
  - All `color` values are valid hex strings (7 chars, starting with `#`)
  - All `price` values are positive numbers
  - Every store ID in `STORE_POSITIONS` exists in `STORES` and vice versa

#### Mood Board Data Validation
- **Why**: Broken mood data = empty mood board.
- **Test cases**:
  - Every mood has: `title`, `src`, `meta`, `img`, `ar`
  - `src` values are one of: `p`, `t`, `e`, `c`, `s`
  - `SRCM` map covers all `src` values used in `MOODS`

---

### Priority 4: DOM-Dependent UI Logic (Medium effort)

These require jsdom but are important for functional correctness:

#### Body Scan Flow
- **Why**: Multi-step onboarding with conditional UI. Easy to break navigation between steps.
- **Test cases**:
  - `selectScanMethod('photo')` shows photo flow, hides others
  - `selectScanMethod('manual')` shows manual flow, hides others
  - `backToMethods()` hides all flows
  - `startScan()` is idempotent (can't double-start)
  - `applyManual()` defaults to sensible values when fields are empty

#### Fitting Room Panel (`renderFitPanel`)
- **Why**: Displays prices and item counts — must be accurate.
- **Test cases**:
  - Empty outfit → "$0" total, "0 pieces selected"
  - One item → correct price displayed, "1 piece selected" (singular)
  - Multiple items across categories → correct sum
  - Clearing outfit resets the panel

#### Product Grid (`renderGrid`)
- **Why**: Renders differently based on user photo state and outfit state.
- **Test cases**:
  - Without photo: cards show "+ Add to look"
  - With photo: cards show "Try on with AI"
  - Item already in outfit: shows checkmark, click is no-op

---

### Priority 5: API Integration (Requires mocking)

#### AI Try-On (`generateAITryOn`)
- **Why**: Calls external API — must handle success and failure gracefully.
- **Test cases**:
  - Successful API response → `renderAITryOnCanvas` called with AI text
  - Network error → falls back to hardcoded encouraging text
  - API returns unexpected shape → doesn't crash, uses fallback
  - No user photo → shows "upload photo" message instead of calling API
  - Processing UI states transition correctly: spinner → result

---

### Priority 6: Visual/Canvas Rendering (Hardest, lowest priority)

#### Avatar Rendering (`drawAvatar`)
- **Why**: 600-line function — the largest and most complex in the codebase. However, canvas rendering is inherently hard to unit test.
- **Recommended approach**: Snapshot testing with canvas-to-image comparison
- **Test cases**:
  - Default measurements produce a valid canvas (non-empty, correct dimensions)
  - Each garment category (`dress`, `top`, `bottom`, `shoes`, `bag`, `acc`) renders without errors
  - Extreme measurements (minimum/maximum values) don't cause rendering artifacts
  - Different outfit combinations don't crash (dress + bag, top + bottom + shoes, etc.)

#### Garment Overlay (`overlayGarmentOnPhoto`)
- **Test cases**:
  - Each garment category renders without error on a mock canvas
  - Missing `userPhotoCtx` gracefully returns without error
  - `globalAlpha` is reset to 1.0 after rendering (currently verified in code)

---

## Architectural Recommendations

### 1. Extract JavaScript Modules

The single-file architecture is the biggest barrier to testing. Recommended module split:

```
src/
├── data/
│   ├── stores.js          # STORES, STORE_POSITIONS
│   └── moods.js           # MOODS, SRCM
├── utils/
│   ├── color.js           # hexToRgb, darkColor, lightenColor
│   ├── time.js            # getDt
│   └── body-model.js      # BMI calculation, measure defaults
├── state/
│   └── outfit.js          # outfit object, addPiece, clearFit
├── ui/
│   ├── store-overlay.js   # openStore, closeStore, renderGrid
│   ├── fit-panel.js       # renderFitPanel
│   ├── body-scan.js       # scan flow logic
│   ├── mood-board.js      # buildMoods, filterMood
│   ├── share.js           # openShare, shareWhatsApp, copyLink
│   └── toast.js           # showToast
├── avatar/
│   ├── canvas.js          # initAvatarCanvas, drawAvatar
│   └── garment-overlay.js # overlayGarmentOnPhoto
├── ai/
│   └── tryon.js           # generateAITryOn, renderAITryOnCanvas
└── scene/
    ├── mall.js            # Three.js scene setup
    ├── facades.js         # buildStoreFacade
    ├── animate.js         # animation loop
    └── controls.js        # pointer lock, WASD, proximity
```

### 2. Reduce `drawAvatar()` Complexity

At ~600 lines, `drawAvatar()` is extremely difficult to maintain or test. Refactor into smaller functions:
- `drawAvatarHead(ctx, params)`
- `drawAvatarTorso(ctx, params)`
- `drawAvatarLegs(ctx, params)`
- `drawGarmentDress(ctx, params, item)`
- `drawGarmentTop(ctx, params, item)`
- `drawGarmentBottom(ctx, params, item)`
- `drawGarmentShoes(ctx, params, item)`
- `drawGarmentBag(ctx, params, item)`

### 3. Replace Global State with Module Scope

Current globals (`outfit`, `CATALOG`, `currentStoreId`, `userPhotoData`, `bodyMeasures`, `scanActive`, `mallActive`, etc.) make testing unreliable. Encapsulating state in module-scoped variables with getter/setter functions would make tests deterministic.

---

## Estimated Test Effort by Priority

| Priority | Area | Est. Tests | Effort | Impact |
|----------|------|-----------|--------|--------|
| P1 | Pure logic (color, BMI, timing) | ~20 | Low | High |
| P2 | State management (outfit, store) | ~25 | Medium | High |
| P3 | Data integrity (catalogs, moods) | ~15 | Low | Medium |
| P4 | DOM UI logic (scan, panel, grid) | ~20 | Medium | Medium |
| P5 | API integration (AI try-on) | ~10 | Medium | Medium |
| P6 | Canvas rendering (avatar) | ~15 | High | Low |
| **Total** | | **~105** | | |

---

## Quick Wins (Start Here)

If choosing just **3 things** to test first:

1. **Color utilities** (`hexToRgb`, `darkColor`, `lightenColor`) — 5 minutes to extract, 10 tests, catches silent visual bugs
2. **Catalog data validation** — No extraction needed, just import the data object and validate structure. Catches typos on every commit
3. **BMI proportion model** — Extract the 4 lines of math from `applyQuick()`, write boundary tests. Prevents distorted avatars for edge-case body types
