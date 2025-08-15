import { uid } from '../core/utils/index.js';

export class Step {
  constructor(name = 'Step', orient = 'landscape') {
    this.id = uid('step'); 
    this.name = name; 
    this.orient = orient; 
    this.bgUrl = ''; 
    this.items = [];
    this._thumbNeedsUpdate = true; this._thumbEl = null;
  }
}

export class Category {
  constructor(name = 'Categoria') {
    this.id = uid('cat'); 
    this.name = name; 
    this.steps = []; 
    this.collapsed = false;
  }
}