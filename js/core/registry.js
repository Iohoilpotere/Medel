
class Registry {
  constructor(){ this.elements = new Map(); this.properties = new Map(); }
  registerElement(type, cls){ this.elements.set(type, cls); }
  registerProperty(type, cls){ this.properties.set(type, cls); }
  getElementTypes(){ return Array.from(this.elements.keys()); }
  getPropertyTypes(){ return Array.from(this.properties.keys()); }
  createElement(type, opts){ const C = this.elements.get(type); if(!C) throw new Error(`Elemento non trovato: ${type}`); return new C(opts); }
  createProperty(type, opts){ const C = this.properties.get(type); if(!C) throw new Error(`Proprietà non trovata: ${type}`); return new C(opts); }
}
export const registry = new Registry();
const ROOT = new URL('../..', import.meta.url); // da /js/core/ al root del sito (…/<repo>/)
const toUrl = (p) => {
  // togli eventuali slash iniziali e risolvi dal ROOT
  const clean = String(p).replace(/^\/+/, '');
  return new URL(clean, ROOT).toString();
};
export async function loadModules() {
  const manifestUrl = new URL('js/manifest.json', ROOT);
  const res = await fetch(manifestUrl, { cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Manifest non trovato (${res.status}) at ${manifestUrl}\n${txt.slice(0,200)}`);
  }
  const m = await res.json();

  await Promise.all([
    ...m.elements.map(x => import(/* @vite-ignore */ toUrl(x))),
    ...m.properties.map(x => import(/* @vite-ignore */ toUrl(x))),
  ]);
}


