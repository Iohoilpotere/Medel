import { Indicator } from './indicator.js';
export class IndicatorsStore{
  constructor(project){ this.project = project; if(!this.project.indicators) this.project.indicators = []; this.selectedId = null; }
  get items(){ return this.project.indicators.map(d=> Indicator.fromJSON(d)); }
  set items(arr){ this.project.indicators = arr.map(x=> x instanceof Indicator ? x.toJSON() : x); }
  add(partial={}){ const ind = new Indicator(partial); this.project.indicators.push(ind.toJSON()); this.selectedId = ind.id; return ind; }
  remove(id){ const i = this.project.indicators.findIndex(d=> d.id===id); if(i>=0) this.project.indicators.splice(i,1); if(this.selectedId===id) this.selectedId=null; }
  findById(id){ const d = this.project.indicators.find(x=> x.id===id); return d? Indicator.fromJSON(d):null; }
  select(id){ this.selectedId = id; }
  get selected(){ return this.findById(this.selectedId); }
  update(id, patch){ const d = this.project.indicators.find(x=> x.id===id); if(d) Object.assign(d, patch||{}); }
}
