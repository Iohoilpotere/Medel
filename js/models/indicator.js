export class Indicator{
  constructor({id, name='', image='', prefix='', suffix=''} = {}){
    this.id = id || (Date.now().toString(36) + Math.random().toString(36).slice(2,7));
    this.name = name; this.image = image; this.prefix = prefix; this.suffix = suffix;
  }
  toJSON(){ return { id:this.id, name:this.name, image:this.image, prefix:this.prefix, suffix:this.suffix }; }
  static fromJSON(d){ return new Indicator(d||{}); }
}
