
import { BaseCommand } from '../command-manager.js';
export class UpdatePropertyCommand extends BaseCommand{
  constructor(targets, prop, newVal, oldSnapshot=null){
    super();
    this.targets = Array.from(targets||[]);
    this.prop = prop;
    this.newVal = newVal;
    const olds = (oldSnapshot && oldSnapshot.length===this.targets.length)
      ? oldSnapshot
      : this.targets.map(t=> t.getProp(prop));
    this.prev = this.targets.map((t,i)=>({t, old: olds[i]}));
  }
  do(){ for(const {t} of this.prev){ t.setProp(this.prop, this.newVal, {silent:true}); t.updateDom(); } }
  undo(){ for(const {t,old} of this.prev){ t.setProp(this.prop, old, {silent:true}); t.updateDom(); } }
  label(){
    if(this.targets.length===1){
      const t = this.targets[0];
      const name = (t.name || t.constructor?.type || 'element');
      return `${name}: ${this.prop} (${this.prev[0].old} -> ${this.newVal})`;
    }
    return `Edit ${this.prop} (${this.targets.length} elementi)`;
  }
}
