
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
export async function loadModules(){  
  // Manifest relativo alla pagina (funziona sia in Live Server che su GitHub Pages)
  const manifestUrl = new URL('./js/manifest.json', window.location.href);
  const res = await fetch(manifestUrl, { cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Manifest non trovato (${res.status}) at ${manifestUrl}\n${txt.slice(0,200)}`);
  }
  const m = await res.json();

  // Converte "/js/..." o "js/..." in un URL relativo alla pagina corrente
  const toUrl = (p) => new URL(p.replace(/^\/+/, './'), window.location.href).toString();

  await Promise.all([
    ...m.elements.map(x => import(toUrl(x))),
    ...m.properties.map(x => import(toUrl(x)))
  ]);
}

