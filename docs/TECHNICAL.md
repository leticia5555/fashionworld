# FashionWorld — Technical Documentation

## Architecture
Single HTML file (~145KB) containing:
- Three.js 3D scene
- CSS styling
- JavaScript logic
- Avatar canvas engine
- Store catalogs

## Key Functions
- `buildStoreFacade(storeId)` — builds unique 3D store interior
- `drawAvatar()` — renders proportioned 2D fashion figure on canvas
- `generateAITryOn(item)` — calls Anthropic API with user photo
- `renderAITryOnCanvas(item, aiText)` — composites garment on photo
- `openStore(storeId)` — loads store products and opens overlay
- `applyMeasures(measures)` — applies body scan data to avatar

## Store Data Structure
Each store has: name, tagline, wallColor, floorColor, accentColor, signColor, signGlow, dressColors[], catalog[]

## Body Scan Methods
1. Photo scan — AI analyzes front+side photo
2. Manual entry — 6 measurements
3. Quick setup — height+weight → BMI model

## API Integration
- Anthropic Claude claude-sonnet-4-20250514
- FASHN API (pending integration)
- Awin affiliate feed (publisher ID: 2828462)
- Replicate IDM-VTON (pending)
