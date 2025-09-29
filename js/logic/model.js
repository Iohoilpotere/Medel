
export class ConditionRule{
  constructor(type='element', ref='', pred={kind:'checked', value:true}){ this.type=type; this.ref=ref; this.pred=pred; }
  toJSON(){ return {type:this.type, ref:this.ref, pred:this.pred}; }
  static fromJSON(o){ if(!o) return null; return new ConditionRule(o.type, o.ref, Object.assign({}, o.pred)); }
}
export class ConditionGroup{
  constructor(op='all', rules=[]){ this.op=op; this.rules=Array.isArray(rules)?rules:[]; }
  toJSON(){ return { op:this.op, rules:this.rules.map(r=> (r && r.op) ? ConditionGroup.fromJSON(r) : ConditionRule.fromJSON(r)) }; }
  static fromJSON(o){ if(!o) return null; const rules=(o.rules||[]).map(r=> (r && r.op) ? ConditionGroup.fromJSON(r) : ConditionRule.fromJSON(r)); return new ConditionGroup(o.op||'all', rules); }
}
export class StepLogic{
  constructor({nextEnabledIf=null, next={type:'sequential'}, readOnlyAfterAdvance=false, exclusiveGroup=null, unlockedIf=null}={}){
    this.nextEnabledIf = nextEnabledIf ? ConditionGroup.fromJSON(nextEnabledIf) : null;
    this.next = next || {type:'sequential'};
    this.readOnlyAfterAdvance = !!readOnlyAfterAdvance;
    this.exclusiveGroup = exclusiveGroup||null;
    this.unlockedIf = unlockedIf ? ConditionGroup.fromJSON(unlockedIf) : null;
  }
  toJSON(){ return { nextEnabledIf: this.nextEnabledIf? this.nextEnabledIf.toJSON():null, next:this.next, readOnlyAfterAdvance:!!this.readOnlyAfterAdvance, exclusiveGroup:this.exclusiveGroup||null, unlockedIf:this.unlockedIf? this.unlockedIf.toJSON():null }; }
  static fromJSON(o){ return new StepLogic(o||{}); }
}
