export class Flag{
  /**
   * @param {{id?:string,name?:string,image?:string,value?:boolean}} param0
   */
  constructor({id, name='', image='', value=false, visible=true} = {}){
    this.id = id || (Date.now().toString(36) + Math.random().toString(36).slice(2,7));
    this.name = name;
    this.image = image;
    this.value = !!value; this.visible = (visible!==false);
  }
  toJSON(){ return { id:this.id, name:this.name, image:this.image, value:!!this.value, visible: this.visible!==false }; }
  static fromJSON(d){ return new Flag(d||{}); }
}
