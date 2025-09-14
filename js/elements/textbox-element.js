
import { registry } from '../core/registry.js';
import { BaseElement } from './base-element.js';
export class TextBoxElement extends BaseElement{
  constructor(opts={}){ super(opts);
    this.setProp('fontFamily', opts.fontFamily ?? 'System');
    this.setProp('fontWeight', Number.isFinite(opts.fontWeight)? opts.fontWeight : 400);
    this.setProp('italic', !!opts.italic);
    this.setProp('fontSize', Number.isFinite(opts.fontSize)? opts.fontSize : 16);
    this.setProp('fontSizeUnit', opts.fontSizeUnit ?? 'px');
    this.setProp('letterSpacing', Number.isFinite(opts.letterSpacing)? opts.letterSpacing : 0);
    this.setProp('lineHeight', Number.isFinite(opts.lineHeight)? opts.lineHeight : 1.2);
    this.setProp('shadowColor', opts.shadowColor ?? 'rgba(0,0,0,0.5)');
    this.setProp('shadowDx', Number.isFinite(opts.shadowDx)? opts.shadowDx : 0);
    this.setProp('shadowDy', Number.isFinite(opts.shadowDy)? opts.shadowDy : 0);
    this.setProp('shadowBlur', Number.isFinite(opts.shadowBlur)? opts.shadowBlur : 6);
    this.setProp('strokeColor', opts.strokeColor ?? null);
    this.setProp('strokeWidth', Number.isFinite(opts.strokeWidth)? opts.strokeWidth : 0);
     this.setProp('placeholder', opts.placeholder ?? 'Testo...'); this.setProp('value', opts.value ?? ''); }
  updateDom(){
    super.updateDom();
    if(!this.content) return;
    this.content.innerHTML='';
    const input = document.createElement('input');
    input.type='text'; input.placeholder = this.getProp('placeholder');
    input.value = this.getProp('value') ?? '';
    input.addEventListener('input', ()=> this.setProp('value', input.value, {silent:true}));
    const fam = this.getProp('fontFamily')||'System';
    const fontMap = {
      'System':'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Inter':'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Roboto':'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
      'Arial':'Arial, Helvetica, sans-serif',
      'Georgia':'Georgia, serif',
      'Times New Roman':'"Times New Roman", Times, serif',
      'Courier New':'"Courier New", monospace'
    };
    input.style.fontFamily = fontMap[fam] || fam;
    input.style.fontWeight = String(this.getProp('fontWeight')||400);
    input.style.fontStyle = (this.getProp('italic') ? 'italic' : 'normal');
    const fs = this.getProp('fontSize') ?? 16;
    const unit = this.getProp('fontSizeUnit') || 'px';
    const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
    input.style.fontSize = (unit==='px' ? String(fs*zoom)+'px' : String(fs)+unit);
    input.style.color = this.getProp('color') || '#ffffff';
    const ls=this.getProp('letterSpacing'); input.style.letterSpacing = (Number.isFinite(ls)? ls : 0)+'px';
    const lh=this.getProp('lineHeight'); input.style.lineHeight = Number.isFinite(lh)? String(lh) : '1.2';
    const sw=Number(this.getProp('strokeWidth')||0), sc=this.getProp('strokeColor');
    if(sw>0 && sc){ input.style.webkitTextStroke=`${sw}px ${sc}`; try{ input.style.textStroke=`${sw}px ${sc}`;}catch(e){} } else { input.style.webkitTextStroke=''; try{ input.style.textStroke=''; }catch(e){} }
    if(!!(this.getProp('shadow') ?? true)){ const col=this.getProp('shadowColor')||'rgba(0,0,0,0.5)'; const dx=Number(this.getProp('shadowDx')||0), dy=Number(this.getProp('shadowDy')||0), blur=Number(this.getProp('shadowBlur')||6); input.style.textShadow = `${dx}px ${dy}px ${blur}px ${col}`; } else { input.style.textShadow=''; }
    
    input.style.width='100%'; input.style.height='100%';
    this.content.appendChild(input);
  }
}
TextBoxElement.type = 'textbox';
registry.registerElement(TextBoxElement.type, TextBoxElement);
