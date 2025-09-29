
export class UpdateStepLogicCommand{
  constructor(step, nextLogic){
    this.step = step;
    this.next = nextLogic;
    this.prev = step.logic ? JSON.parse(JSON.stringify(step.logic)) : null;
    this.name = 'UpdateStepLogic';
  }
  do(){ this.step.logic = this.next; }
  undo(){ this.step.logic = this.prev; }
}
