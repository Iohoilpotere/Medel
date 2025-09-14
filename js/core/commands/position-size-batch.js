
import { BaseCommand } from '../command-manager.js';
export class PositionSizeBatchCommand extends BaseCommand{
  constructor(before, after, kind=null){ super(); this.before = before; this.after = after; this.kind = kind || this._guessType(); }
  do(){ for(const it of this.after){ if(it.el.setXY) it.el.setXY(it.x, it.y, {silent:true}); if(it.el.setSize && (it.w!==undefined||it.h!==undefined)) it.el.setSize(it.w ?? it.el.w, it.h ?? it.el.h, {silent:true}); it.el.updateDom(); } }
  undo(){ for(const it of this.before){ if(it.el.setXY) it.el.setXY(it.x, it.y, {silent:true}); if(it.el.setSize && (it.w!==undefined||it.h!==undefined)) it.el.setSize(it.w ?? it.el.w, it.h ?? it.el.h, {silent:true}); it.el.updateDom(); } }
  label(){ if(this.kind==='move'){ const a=this.after[0], b=this.before[0]; return this.after.length===1 ? `${a.el.name||a.el.constructor.type}: move (${b.x},${b.y} -> ${a.x},${a.y})` : `Move: ${this.after.length} elementi`; } if(this.kind==='resize'){ const a=this.after[0], b=this.before[0]; return this.after.length===1 ? `${a.el.name||a.el.constructor.type}: resize (${b.w}x${b.h} -> ${a.w}x${a.h})` : `Resize: ${this.after.length} elementi`; } return `Edit: ${this.after.length} elementi`; }
  _guessType(){ const a=this.after[0], b=this.before[0]; if(a && b && (a.w!==undefined) && (a.w!==b.w || a.h!==b.h)) return 'resize'; if(a && b && (a.x!==b.x || a.y!==b.y)) return 'move'; return 'edit'; }
}
