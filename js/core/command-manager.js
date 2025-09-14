
export class CommandManager{
  constructor(){ this.undoStack=[]; this.redoStack=[]; this.listeners=new Set(); }
  onChange(cb){ this.listeners.add(cb); }
  _notify(){ for(const cb of this.listeners) cb({canUndo:this.canUndo(),canRedo:this.canRedo()}); }
  execute(cmd){ cmd.do(); this.undoStack.push(cmd); this.redoStack.length=0; this._notify(); }
  undo(){ const c=this.undoStack.pop(); if(!c) return; c.undo(); this.redoStack.push(c); this._notify(); }
  redo(){ const c=this.redoStack.pop(); if(!c) return; c.do(); this.undoStack.push(c); this._notify(); }
  canUndo(){ return this.undoStack.length>0 } canRedo(){ return this.redoStack.length>0 }
  getTimeline(){ return {list:[...this.undoStack, ...this.redoStack.slice().reverse()], cursor:this.undoStack.length-1}; }
  jumpTo(index){ let cursor=this.undoStack.length-1; while(cursor>index){ this.undo(); cursor--; } while(cursor<index){ this.redo(); cursor++; } }
}
export class BaseCommand{ do(){} undo(){} label(){ return this.constructor.name; } }
