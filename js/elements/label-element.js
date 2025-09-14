
import { registry } from '../core/registry.js';
import { BaseElement } from './base-element.js';
export class LabelElement extends BaseElement{
  constructor(opts={}){ super(opts);
    this.setProp('fontFamily', opts.fontFamily ?? 'System');
    this.setProp('fontWeight', Number.isFinite(opts.fontWeight)? opts.fontWeight : 400);
    this.setProp('italic', !!opts.italic);
    this.setProp('fontSize', Number.isFinite(opts.fontSize)? opts.fontSize : 24);
    this.setProp('fontSizeUnit', opts.fontSizeUnit ?? 'px');
    this.setProp('letterSpacing', Number.isFinite(opts.letterSpacing)? opts.letterSpacing : 0);
    this.setProp('lineHeight', Number.isFinite(opts.lineHeight)? opts.lineHeight : 1.2);
    this.setProp('alignH', opts.alignH ?? 'left');
    this.setProp('alignV', opts.alignV ?? 'middle');
    this.setProp('shadowColor', opts.shadowColor ?? 'rgba(0,0,0,0.5)');
    this.setProp('shadowDx', Number.isFinite(opts.shadowDx)? opts.shadowDx : 0);
    this.setProp('shadowDy', Number.isFinite(opts.shadowDy)? opts.shadowDy : 0);
    this.setProp('shadowBlur', Number.isFinite(opts.shadowBlur)? opts.shadowBlur : 6);
    this.setProp('strokeColor', opts.strokeColor ?? null);
    this.setProp('strokeWidth', Number.isFinite(opts.strokeWidth)? opts.strokeWidth : 0);
    this.setProp('backgroundColor', opts.backgroundColor ?? 'rgba(0,0,0,0)');
    this.setProp('borderColor', opts.borderColor ?? 'rgba(0,0,0,0)');
    this.setProp('borderWidth', Number.isFinite(opts.borderWidth)? opts.borderWidth : 0);
    this.setProp('borderStyle', opts.borderStyle ?? 'solid');
    this.setProp('borderRadius', Number.isFinite(opts.borderRadius)? opts.borderRadius : 0);
 this.setProp('text', opts.text ?? 'Etichetta'); this.setProp('color', opts.color ?? '#ffffff'); this.setProp('fontSize', opts.fontSize ?? 24); this.setProp('shadow', opts.shadow ?? true); }
  updateDom(){
    super.updateDom();
    if(!this.content) return;
    const c = this.content;
    c.innerHTML='';
    // container styles
    c.style.position='absolute'; c.style.inset='0';
    c.style.display='flex';
    // alignment
    const ah=this.getProp('alignH')||'left';
    c.style.justifyContent=(ah==='left'?'flex-start':ah==='center'?'center':'flex-end');
    const av=this.getProp('alignV')||'middle';
    c.style.alignItems=(av==='top'?'flex-start':av==='middle'?'center':'flex-end');
    // background & border
    c.style.background = this.getProp('backgroundColor')||'transparent';
    const bw = Number(this.getProp('borderWidth')||0);
    c.style.borderStyle = bw>0 ? (this.getProp('borderStyle')||'solid') : 'none';
    c.style.borderWidth = bw>0 ? (bw+'px') : '0';
    c.style.borderColor = this.getProp('borderColor')||'transparent';
    c.style.borderRadius = (Number(this.getProp('borderRadius')||0)||0)+'px';
    c.style.boxSizing='border-box';

    const span = document.createElement('span');
    span.className='label';
    span.style.margin='0'; span.style.padding='0'; span.style.background='transparent';
    span.style.whiteSpace='pre-wrap'; span.style.display='inline-block';

    // text (rich HTML allowed; allowlist)
    let html = String(this.getProp('text') ?? '');
    html = html.replace(/<(?!\/?(b|strong|i|em|u|br)\b)[^>]*>/gi, '');
    span.innerHTML = html;

    // font family map
    const fam=this.getProp('fontFamily')||'System';
    span.style.fontFamily = fam;
    // font size scaled by stage zoom to keep same relative appearance when zooming
    const fs = this.getProp('fontSize') ?? 24;
    const unit = this.getProp('fontSizeUnit') || 'px';
    const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
    span.style.fontSize = (unit==='px' ? String(fs*zoom)+'px' : String(fs)+unit);
    // text alignment inside the label
    span.style.display='block'; span.style.width='100%';
    const tAlign = (this.getProp('alignH')||'left');
    span.style.textAlign = (tAlign==='justify' ? 'justify' : (tAlign||'left'));

    // weight / style
    span.style.fontWeight = String(this.getProp('fontWeight')||400);
    span.style.fontStyle = (this.getProp('italic') ? 'italic' : 'normal');

    // color
    span.style.color = this.getProp('color') || '#ffffff'; try{ span.style.textDecorationColor = 'currentColor'; }catch(e){}
    try{ span.style.textDecorationColor = span.style.color; }catch(e){}
    try{ span.querySelectorAll('u').forEach(u=> u.style.textDecorationColor = span.style.color); }catch(e){}

    // spacing
    const ls=this.getProp('letterSpacing'); span.style.letterSpacing = (Number.isFinite(ls)? ls : 0)+'px';
    const lh=this.getProp('lineHeight'); span.style.lineHeight = Number.isFinite(lh)? String(lh) : '1.2';

    // stroke
    const sw=Number(this.getProp('strokeWidth')||0), sc=this.getProp('strokeColor');
    if(sw>0 && sc){ span.style.webkitTextStroke=`${sw}px ${sc}`; try{ span.style.textStroke=`${sw}px ${sc}`;}catch(e){} } else { span.style.webkitTextStroke=''; try{ span.style.textStroke=''; }catch(e){} }

    // shadow (detailed)
    if(!!(this.getProp('shadow') ?? true)){
      const col=this.getProp('shadowColor')||'rgba(0,0,0,0.5)';
      const dx=Number(this.getProp('shadowDx')||0), dy=Number(this.getProp('shadowDy')||0), blur=Number(this.getProp('shadowBlur')||6);
      span.style.textShadow = `${dx}px ${dy}px ${blur}px ${col}`;
    }else{ span.style.textShadow=''; }

    c.appendChild(span);
    // apply stroke style after DOM is built
    this.applyStrokeStyle();

  }

  applyStrokeStyle(){
    const span = this.content.querySelector('span');
    if(!span) return;
    const style = this.getProp('strokeStyle') || 'line';
    const sw = Number(this.getProp('strokeWidth')||0);
    const sc = this.getProp('strokeColor') || '#000';
    // reset
    span.style.textShadow=''; span.style.filter='';
    // baseline solid using webkit-text-stroke already set elsewhere; supplement styles:
    if(sw>0){
      if(style==='double'){
        // simulate double by inner light stroke + outer dark
        span.style.textShadow = `0 0 ${Math.ceil(sw/2)}px ${sc}, 0 0 ${Math.ceil(sw)}px ${sc}`;
      }else if(style==='glow'){
        span.style.filter = `drop-shadow(0 0 ${Math.ceil(sw*1.5)}px ${sc})`;
      }else{
        // dash/dot/dashdot not natively supported on text stroke; fallback to solid
      }
    }
  }
}
LabelElement.type = 'label';
registry.registerElement(LabelElement.type, LabelElement);
