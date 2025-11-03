import { Flag } from './flag.js';

/**
 * Store for boolean flags, kept inside project.flags
 */
export class FlagsStore{
  constructor(project){
    this.project = project;
    if(!this.project.flags) this.project.flags = [];
    if(typeof this.project.flagsVisible !== 'boolean') this.project.flagsVisible = true;
    this.selectedId = null;
  }
  get items(){ return this.project.flags.map(d => Flag.fromJSON(d)); }
  set items(arr){ this.project.flags = arr.map(x => x instanceof Flag ? x.toJSON() : x); }
  add(partial={}){
    const f = new Flag(partial);
    this.project.flags.push(f.toJSON());
    this.selectedId = f.id;
    return f;
  }
  remove(id){
    const i = this.project.flags.findIndex(d => d.id === id);
    if(i>=0){ this.project.flags.splice(i,1); }
    if(this.selectedId === id) this.selectedId = null;
  }
  findById(id){
    const d = this.project.flags.find(x => x.id === id);
    return d ? Flag.fromJSON(d) : null;
  }
  select(id){ this.selectedId = id; }
  get selected(){ return this.findById(this.selectedId); }
  update(id, patch){
    const d = this.project.flags.find(x => x.id === id);
    if(d) Object.assign(d, patch||{});
  }
  setVisible(v){ this.project.flagsVisible = !!v; }
  get visible(){ return !!this.project.flagsVisible; }
}
