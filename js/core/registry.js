
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
const toAbs = p => p.startsWith('/')? p : '/' + p.replace(/^\.\/?/, '');
export async function loadModules(){
  const m = await (await fetch('/js/manifest.json')).json();
  await Promise.all([ ...m.elements.map(x=> import(toAbs(x))), ...m.properties.map(x=> import(toAbs(x))) ]);
}
