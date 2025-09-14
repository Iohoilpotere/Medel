
import { BaseCommand } from '../command-manager.js';
export class AddElementCommand extends BaseCommand{
  constructor(stage,el){ super(); this.stage=stage; this.el=el; }
  do(){ this.stage.addElement(this.el) }
  undo(){ this.stage.removeElement(this.el) }
  label(){ return `Add: ${this.el.name||this.el.constructor.type}`; }
}
