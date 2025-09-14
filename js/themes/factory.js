
import { ensureCss } from '../core/css-loader.js';
export class ThemeFactory{
  constructor(){
    ensureCss('./themes/dark.css'); ensureCss('./themes/light.css');
    this.current = 'dark';
    document.documentElement.setAttribute('data-theme', this.current);
  }
  set(name){
    if(name!=='dark' && name!=='light') name='dark';
    this.current = name;
    document.documentElement.setAttribute('data-theme', name);
  }
}
