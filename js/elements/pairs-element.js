
import { BaseElement } from './base-element.js';
import { registry } from '../core/registry.js';

function resolveStyle(el, idx){
  const base = el.getProp('itemStyles')||{};
  const item = base[idx] || {};
  const g = (k, def)=> (item[k]!==undefined ? item[k] : (el.getProp(k)!==undefined ? el.getProp(k) : def));

  return {
    // alignment
    keyAlign: g('keyAlign','left'),
    valueAlign: g('valueAlign','left'),
    // typography
    keyColor: g('keyColor', el.getProp('color')||'#ffffff'),
    keyFontSize: g('keyFontSize', el.getProp('fontSize')||16),
    keyFontWeight: g('keyFontWeight', el.getProp('fontWeight')),
    keyBold: !!g('keyBold', (el.getProp('fontWeight')||400)>=600),
    keyItalic: !!g('keyItalic', !!el.getProp('italic')),
    keyLineHeight: g('keyLineHeight', el.getProp('lineHeight')||1.25),
    keyFontFamily: g('keyFontFamily', el.getProp('fontFamily')||'System'),
    keyLetterSpacing: g('keyLetterSpacing', el.getProp('letterSpacing')||0),
    valueColor: g('valueColor', el.getProp('color')||'#ffffff'),
    valueFontSize: g('valueFontSize', el.getProp('fontSize')||16),
    valueFontWeight: g('valueFontWeight', el.getProp('fontWeight')),
    valueBold: !!g('valueBold', (el.getProp('fontWeight')||400)>=600),
    valueItalic: !!g('valueItalic', !!el.getProp('italic')),
    valueLineHeight: g('valueLineHeight', el.getProp('lineHeight')||1.25),
    valueFontFamily: g('valueFontFamily', el.getProp('fontFamily')||'System'),
    valueLetterSpacing: g('valueLetterSpacing', el.getProp('letterSpacing')||0),
    // effects (reuse label keys),
    // effects, fallback: key*/value* -> generic -> label defaults
    keyShadow: !!g('keyShadow', g('shadow', el.getProp('shadow'))),
    keyShadowColor: g('keyShadowColor', g('shadowColor', el.getProp('shadowColor')||'rgba(0,0,0,0.5)')),
    keyShadowDx: g('keyShadowDx', g('shadowDx', el.getProp('shadowDx')||0)),
    keyShadowDy: g('keyShadowDy', g('shadowDy', el.getProp('shadowDy')||0)),
    keyShadowBlur: g('keyShadowBlur', g('shadowBlur', el.getProp('shadowBlur')||6)),
    keyStrokeWidth: g('keyStrokeWidth', g('strokeWidth', el.getProp('strokeWidth')||0)),
    keyStrokeColor: g('keyStrokeColor', g('strokeColor', el.getProp('strokeColor')||'rgba(0,0,0,1)')),
    keyStrokeStyle: g('keyStrokeStyle', g('strokeStyle', el.getProp('strokeStyle')||'line')),
    valueShadow: !!g('valueShadow', g('shadow', el.getProp('shadow'))),
    valueShadowColor: g('valueShadowColor', g('shadowColor', el.getProp('shadowColor')||'rgba(0,0,0,0.5)')),
    valueShadowDx: g('valueShadowDx', g('shadowDx', el.getProp('shadowDx')||0)),
    valueShadowDy: g('valueShadowDy', g('shadowDy', el.getProp('shadowDy')||0)),
    valueShadowBlur: g('valueShadowBlur', g('shadowBlur', el.getProp('shadowBlur')||6)),
    valueStrokeWidth: g('valueStrokeWidth', g('strokeWidth', el.getProp('strokeWidth')||0)),
    valueStrokeColor: g('valueStrokeColor', g('strokeColor', el.getProp('strokeColor')||'rgba(0,0,0,1)')),
    valueStrokeStyle: g('valueStrokeStyle', g('strokeStyle', el.getProp('strokeStyle')||'line'))
};
}

function applyTextStyles(node, cfg){
  const z = Number(cfg.zoom || 1);
  node.style.color = cfg.color;
  const fs = Number(cfg.fontSize||16) * (isFinite(z) ? z : 1);
  node.style.fontSize = fs + 'px';
  const fw = (cfg.fontWeight!==undefined && cfg.fontWeight!==null) ? String(cfg.fontWeight) : (cfg.bold ? '700' : '400');
  node.style.fontWeight = fw;
  node.style.fontStyle = cfg.italic ? 'italic' : 'normal';
  node.style.lineHeight = String(cfg.lineHeight);
  node.style.fontFamily = cfg.fontFamily;
  node.style.letterSpacing = (Number.isFinite(cfg.letterSpacing)? cfg.letterSpacing : 0) + 'px';
  const sw = Number(cfg.strokeWidth||0), sc = cfg.strokeColor;
  if(sw>0 && sc){ node.style.webkitTextStroke = `${sw}px ${sc}`; try{ node.style.textStroke = `${sw}px ${sc}`; }catch(e){} }
  else { node.style.webkitTextStroke=''; try{ node.style.textStroke=''; }catch(e){} }
  const dx = Number(cfg.shadowDx||0), dy = Number(cfg.shadowDy||0), blur = Number(cfg.shadowBlur||0);
  const col = cfg.shadowColor || 'rgba(0,0,0,0.5)';
  let useShadow = !!cfg.shadow;
  if(!useShadow){ if(dx!==0 || dy!==0 || blur>0){ useShadow = true; } }
  let shadowParts = [];
  if(useShadow){ shadowParts.push(`${dx}px ${dy}px ${blur}px ${col}`); }
  node.style.filter = '';
  if(sw>0 && sc){
    if(cfg.strokeStyle==='double'){
      shadowParts.push(`0 0 ${Math.ceil(sw/2)}px ${sc}`, `0 0 ${Math.ceil(sw)}px ${sc}`);
    }else if(cfg.strokeStyle==='glow'){
      node.style.filter = `drop-shadow(0 0 ${Math.ceil(sw*1.5)}px ${sc})`;
    }
  }
  node.style.textShadow = shadowParts.length ? shadowParts.join(', ') : 'none';
}




export class PairsElement extends BaseElement{
  constructor(opts={}){
    super(Object.assign({w:360,h:160}, opts));
    if(!this.getProp('pairs')){
      this.props.set('pairs', [{label:'Altezza', value:'175 cm'}, {label:'Peso', value:'70 kg'}]);
      this.props.set('items', ['Altezza','Peso']); // for style-scope
    }
    if(!this.getProp('labelWidth')) this.props.set('labelWidth', 40); // percent
    if(!this.getProp('itemsGap')) this.props.set('itemsGap', 8);
    if(!this.getProp('keyAlign')) this.props.set('keyAlign','left');
    if(!this.getProp('valueAlign')) this.props.set('valueAlign','left');
  }
  updateDom(){
    // geometry & z
    super.updateDom?.();
    if(!this.dom) return;
    // container
    this.dom.dataset.type='pairs';
    this.dom.style.display='block';
    this.dom.style.overflow='visible'; // allow resize handles outside bounds
    const pairs = Array.isArray(this.getProp('pairs')) ? this.getProp('pairs') : [];
    if(!this.content){
      this.content = document.createElement('div');
      this.content.className='pairs-content';
      Object.assign(this.content.style,{position:'absolute', left:'0', top:'0', right:'0', bottom:'0', overflow:'auto', pointerEvents:'none'});
      this.dom.appendChild(this.content);
    }
    this.content.innerHTML='';
    const grid = document.createElement('div');
    grid.style.display='grid';
    grid.style.gridTemplateColumns = `${this.getProp('labelWidth')||40}% 1fr`;
    grid.style.gap = `${this.getProp('itemsGap')||8}px ${Math.max(8, (this.w*0.02)|0)}px`;
    grid.style.padding='4px';
    this.content.appendChild(grid);

    pairs.forEach((p, i)=>{
      const st = resolveStyle(this, i);
      const L = document.createElement('div');
      const R = document.createElement('div');
      L.textContent = String(p?.label ?? '—'); R.textContent = String(p?.value ?? '');

      // align
      L.style.textAlign = st.keyAlign;
      R.style.textAlign = st.valueAlign;

      // apply text styles
      
      applyTextStyles(L, { fontWeight: st.keyFontWeight, zoom: (this.stage && this.stage.zoom) ? this.stage.zoom : 1,
        color: st.keyColor, fontSize: st.keyFontSize, bold: st.keyBold, italic: st.keyItalic, lineHeight: st.keyLineHeight,
        fontFamily: st.keyFontFamily, letterSpacing: st.keyLetterSpacing,
        strokeWidth: st.keyStrokeWidth, strokeColor: st.keyStrokeColor, strokeStyle: st.keyStrokeStyle,
        shadow: st.keyShadow, shadowColor: st.keyShadowColor, shadowDx: st.keyShadowDx, shadowDy: st.keyShadowDy, shadowBlur: st.keyShadowBlur
      });
      applyTextStyles(R, { fontWeight: st.valueFontWeight, zoom: (this.stage && this.stage.zoom) ? this.stage.zoom : 1,
        color: st.valueColor, fontSize: st.valueFontSize, bold: st.valueBold, italic: st.valueItalic, lineHeight: st.valueLineHeight,
        fontFamily: st.valueFontFamily, letterSpacing: st.valueLetterSpacing,
        strokeWidth: st.valueStrokeWidth, strokeColor: st.valueStrokeColor, strokeStyle: st.valueStrokeStyle,
        shadow: st.valueShadow, shadowColor: st.valueShadowColor, shadowDx: st.valueShadowDx, shadowDy: st.valueShadowDy, shadowBlur: st.valueShadowBlur
      });


      grid.appendChild(L); grid.appendChild(R);
    });

    // draw border/background if present
    const bg = this.getProp('bg'); if(bg) this.dom.style.background = bg;
    const br = this.getProp('border'); if(br) this.dom.style.border = br;
    this.dom.style.borderRadius='4px';
  }
  setProp(k,v,{silent=false}={}){
    super.setProp(k,v,{silent});
    if(k==='pairs'){
      // sync items for style-scope
      const items = Array.isArray(v)? v.map(o=> String(o?.label??'Item')) : [];
      super.setProp('items', items, {silent});
    }
  }
}
PairsElement.type='pairs';
registry.registerElement(PairsElement.type, PairsElement);