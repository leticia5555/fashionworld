/* ════════════════════════════════════════════════════════════════════
   FASHIONWORLD — CATÁLOGO RAÍZ (single source of truth)
   ────────────────────────────────────────────────────────────────────
   Este archivo es la FUENTE ÚNICA de la que comen las dos caras:
     • El mall 3D  → pinta las cards, las vitrinas, el try-on
     • El agente   → razona sobre estos atributos para recomendar

   Regla de oro: un producto se agrega UNA vez aquí, y aparece en ambas.
   Nunca dupliques datos de producto en el HTML ni en el agente.

   CÓMO AGREGAR UN PRODUCTO REAL (ej. vía Awin):
     1. Copia el bloque {...} de plantilla de abajo
     2. Llena los campos (mientras más atributos, mejor razona el agente)
     3. img = packshot (Higgsfield) o foto del feed del afiliado
     4. buyUrl = tu link de afiliado Awin (deeplink con tu publisher id)
   ════════════════════════════════════════════════════════════════════ */

const SCHEMA_VERSION = 1;

/* ---- Vocabularios controlados (para que el agente razone consistente) ----
   El agente filtra y combina usando ESTOS valores. Manténlos cerrados:
   inventar valores nuevos rompe el razonamiento. */
const VOCAB = {
  category:  ['dress','top','bottom','set','outerwear','shoes','bag','accessory'],
  occasion:  ['casual','work','evening','wedding-guest','beach','party','everyday'],
  season:    ['spring','summer','fall','winter','all-season'],
  formality: ['relaxed','smart-casual','formal','black-tie'],
  silhouette:['fitted','flowy','structured','oversized','straight'],
  fabricFeel:['satin','linen','cotton','knit','denim','leather','velvet','silk']
};

/* ---- PLANTILLA DE PRODUCTO ----
   Campos con * los lee el AGENTE para razonar; sin * son solo visuales.
   Llena todo lo que puedas — un producto "rico" se recomienda mejor. */
const PRODUCT_TEMPLATE = {
  id:          '',          // único global, ej. 'icony-lavender-slip'
  store:       '',          // 'icony' | 'zara' | 'mango' | 'revolve' | 'hm'
  name:        '',          // nombre mostrado
  desc:        '',          // 1 línea para la card
  price:       0,           // número
  currency:    'MXN',       // 'MXN' | 'USD'
  color:       '#000000',   // swatch fallback si no hay img
  colorName:   '',          // * 'lavanda', 'negro' — el agente habla en palabras
  img:         null,        // packshot/foto. null = usa swatch de color
  // ---- atributos que el AGENTE razona (* ) ----
  category:    '',          // * de VOCAB.category
  occasion:    [],          // * lista de VOCAB.occasion (puede ser varias)
  season:      [],          // * lista de VOCAB.season
  formality:   '',          // * de VOCAB.formality
  silhouette:  '',          // * de VOCAB.silhouette
  fabricFeel:  '',          // * de VOCAB.fabricFeel
  pairsWith:   [],          // * categorías que combinan, ej ['shoes','bag']
  // ---- comercio ----
  buyUrl:      null,        // link de afiliado Awin (deeplink). null = no shoppable aún
  inStock:     true,        // el agente NO recomienda agotados (regla de oro: no alucinar stock)
  affiliate:   null         // 'awin' | null — de dónde viene la comisión
};

/* ════════════════════════════════════════════════════════════════════
   PRODUCTOS
   Empezamos con el vestido REAL de hoy + el resto migrado del catálogo
   viejo (los viejos son placeholders sin img — se irán reemplazando por
   producto real de Awin). El patrón del vestido lavanda es el molde.
   ════════════════════════════════════════════════════════════════════ */
const CATALOG = [

  /* ─── PRODUCTO REAL #1 — el de hoy, totalmente cargado como ejemplo ─── */
  {
    id:'icony-lavender-slip', store:'icony',
    name:'Lavender Slip Dress',
    desc:'Satín midi, encaje en el busto · ICONY signature',
    price:1850, currency:'MXN',
    color:'#C9B8D4', colorName:'lavanda',
    img:'/garments/icony-slip-dress.png',
    category:'dress',
    occasion:['evening','wedding-guest','party'],
    season:['spring','summer'],
    formality:'formal',
    silhouette:'flowy',
    fabricFeel:'satin',
    pairsWith:['shoes','bag','accessory'],
    buyUrl:null,            // ← aquí va tu deeplink Awin cuando lo conectes
    inStock:true,
    affiliate:null
  },

  /* ─── ICONY — resto (placeholders del catálogo viejo, sin img aún) ─── */
  { id:'icony-satin-slip', store:'icony', name:'Satin Slip Dress', desc:'Satín fluido, tirantes ajustables', price:1850, currency:'MXN', color:'#E8B4B8', colorName:'rosa', img:null, category:'dress', occasion:['evening','party'], season:['spring','summer'], formality:'smart-casual', silhouette:'flowy', fabricFeel:'satin', pairsWith:['shoes','bag'], buyUrl:null, inStock:true, affiliate:null },
  { id:'icony-sage-linen-set', store:'icony', name:'Sage Linen Set', desc:'Top coordinado + pantalón ancho', price:2200, currency:'MXN', color:'#B8C9B8', colorName:'verde salvia', img:null, category:'set', occasion:['casual','everyday','beach'], season:['summer'], formality:'relaxed', silhouette:'flowy', fabricFeel:'linen', pairsWith:['shoes','bag'], buyUrl:null, inStock:true, affiliate:null },
  { id:'icony-coral-sundress', store:'icony', name:'Coral Sundress', desc:'Busto fruncido, espalda abierta', price:1450, currency:'MXN', color:'#E8A090', colorName:'coral', img:null, category:'dress', occasion:['beach','casual','party'], season:['summer'], formality:'relaxed', silhouette:'flowy', fabricFeel:'cotton', pairsWith:['shoes','accessory'], buyUrl:null, inStock:true, affiliate:null },
  { id:'icony-ivory-blazer', store:'icony', name:'Ivory Blazer', desc:'Estructurado, botones dorados', price:2800, currency:'MXN', color:'#F0EDE8', colorName:'marfil', img:null, category:'outerwear', occasion:['work','evening'], season:['all-season'], formality:'formal', silhouette:'structured', fabricFeel:'cotton', pairsWith:['top','bottom','dress'], buyUrl:null, inStock:true, affiliate:null },
  { id:'icony-burgundy-velvet', store:'icony', name:'Burgundy Velvet', desc:'Hombros descubiertos, largo midi', price:2400, currency:'MXN', color:'#6B2D3E', colorName:'vino', img:null, category:'dress', occasion:['evening','wedding-guest'], season:['fall','winter'], formality:'formal', silhouette:'fitted', fabricFeel:'velvet', pairsWith:['shoes','bag'], buyUrl:null, inStock:true, affiliate:null },
  { id:'icony-gold-pleated', store:'icony', name:'Gold Pleated', desc:'Plisado acordeón, metálico', price:3200, currency:'MXN', color:'#C8A96E', colorName:'dorado', img:null, category:'dress', occasion:['party','evening'], season:['fall','winter'], formality:'black-tie', silhouette:'flowy', fabricFeel:'silk', pairsWith:['shoes','bag','accessory'], buyUrl:null, inStock:true, affiliate:null },

];

/* ════════════════════════════════════════════════════════════════════
   HELPERS — el AGENTE usa estos para razonar sin alucinar.
   (El mall también puede usarlos para filtrar vitrinas.)
   ════════════════════════════════════════════════════════════════════ */
const Catalog = {
  all() { return CATALOG.filter(p => p.inStock); },   // nunca devuelve agotados

  byStore(store) { return this.all().filter(p => p.store === store); },

  byOccasion(occ) { return this.all().filter(p => (p.occasion||[]).includes(occ)); },

  // productos que combinan con uno dado (para "completa el look")
  pairings(product) {
    const want = product.pairsWith || [];
    return this.all().filter(p =>
      p.id !== product.id && want.includes(p.category));
  },

  // contexto compacto que se le pasa al agente (solo lo que necesita razonar)
  agentContext() {
    return this.all().map(p => ({
      id:p.id, name:p.name, price:p.price, currency:p.currency,
      color:p.colorName, category:p.category, occasion:p.occasion,
      season:p.season, formality:p.formality, silhouette:p.silhouette,
      fabric:p.fabricFeel, shoppable: !!p.buyUrl
    }));
  },

  find(id) { return CATALOG.find(p => p.id === id) || null; }
};

/* Export para ambos mundos: navegador (mall) y serverless (agente) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATALOG, Catalog, VOCAB, SCHEMA_VERSION };
}
if (typeof window !== 'undefined') {
  window.CATALOG = CATALOG; window.Catalog = Catalog; window.VOCAB = VOCAB;
}
