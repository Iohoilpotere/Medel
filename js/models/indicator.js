export class Indicator{
  constructor({ id, name = '', image = '', prefix = '', suffix = '', value = 0, visible = true } = {}){
    this.id = id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
    this.name = name;
    this.image = image;
    this.prefix = prefix;
    this.suffix = suffix;
    // default = 0; if a value is provided and numeric, use it; otherwise keep 0
    const num = (value === null || value === undefined || value === '') ? 0 : Number(value);
    this.value = Number.isNaN(num) ? 0 : num;
    this.visible = (visible !== false);
  }

  toJSON(){
    return {
      id: this.id,
      name: this.name,
      image: this.image,
      prefix: this.prefix,
      suffix: this.suffix,
      value: this.value,
      visible: this.visible !== false
    };
  }

  static fromJSON(d){
    return new Indicator(d || {});
  }
}
