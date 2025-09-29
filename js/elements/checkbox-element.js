import { registry } from '../core/registry.js';
import { BaseElement } from './base-element.js';

export class CheckboxElement extends BaseElement{
  constructor(opts={}){
    super(opts);
    this.setProp('text', opts.text ?? 'Checkbox');
    // text style defaults
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
  }
  updateDom(){
    super.updateDom();
    if(!this.content) return;
    this.content.innerHTML='';
    const label = document.createElement('label');
        const ctl=document.createElement('div'); ctl.className='ui-ctl'; label.appendChild(ctl); label.style.display='block'; label.style.width='100%'; label.style.boxSizing='border-box'; label.style.whiteSpace='nowrap';
    label.style.userSelect='none';
    const input = document.createElement('input');
    input.type='checkbox';
      // lock-on-select guards (single checkbox)
      input.addEventListener('mousedown', (e)=>{
        const _lock = !!this.getProp('lockOnSelect');
        if(_lock && input.checked && input.dataset && input.dataset.locked==='1'){
          e.preventDefault(); e.stopPropagation();
        }
      }, true);
      input.addEventListener('keydown', (e)=>{
        const _lock = !!this.getProp('lockOnSelect');
        const key = e.key || e.code;
        if(_lock && input.checked && input.dataset && input.dataset.locked==='1' && (key===' ' || key==='Space' || key==='Enter' || key==='Spacebar')){
          e.preventDefault(); e.stopPropagation();
        }
      });
      input.addEventListener('change', (e)=>{
        const _lock = !!this.getProp('lockOnSelect');
        if(!_lock) return;
        if(input.dataset && input.dataset.locked==='1' && !input.checked){
          input.checked = true;
          return;
        }
        if(input.checked){
          if(!input.dataset) input.dataset = {};
          input.dataset.locked = '1';
        }
      });
      const _lockOn = !!this.getProp('lockOnSelect');
      input.dataset.locked = input.checked && _lockOn ? '0' : '0';
    label.appendChild(input);
    const txt = document.createElement('span');
    txt.textContent = ' ' + String(this.getProp('text') ?? '');
    label.appendChild(txt);
    label.appendChild(ctl);
    this.content.appendChild(label);
    // post-layout adjust for single checkbox
    (()=>{
      const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      const inp = label.querySelector('input[type=checkbox]');
      if(!inp) return;
      label.style.position='relative';
      inp.style.position='absolute';
      inp.style.left = String(4*zoom2)+'px';
      inp.style.top = '0px';
      inp.style.transformOrigin='left top';
      inp.style.transform = `scale(${zoom2})`;
      const padBase = (inp.offsetWidth || 16) + (Number(this.getProp('labelGap')||6));
      label.style.paddingLeft = String(padBase*zoom2)+'px';
    })();

    // Switch style rendering (if enabled)
        // Switch style rendering (if enabled)
    if((this.getProp('selectionStyle')||'standard')==='switch'){
      const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      // hide native box, draw a switch track and knob
      input.style.opacity='0';
      input.style.position='absolute'; input.style.left='0'; input.style.top='0';
      label.style.position='relative';
      const track = document.createElement('div');
      const knob = document.createElement('div');
      const w=34*zoom, h=18*zoom;
      const rBase = Number.isFinite(this.getProp('switchRadius'))? this.getProp('switchRadius'):9; 
      const r=rBase*zoom;
      track.style.position='absolute'; track.style.left='0'; track.style.top='50%'; track.style.transform='translateY(-50%)';
      track.style.width=w+'px'; track.style.height=h+'px';
      const swOn=this.getProp('switchBgOn')||'#4ade80'; 
      const swOff=this.getProp('switchBgOff')||'#666'; 
      track.style.background = input.checked ? swOn : swOff;
      track.style.borderRadius=r+'px';
      const sbw=Number.isFinite(this.getProp('switchBorderWidth'))? this.getProp('switchBorderWidth'):1; 
      const sbc=this.getProp('switchBorderColor')||'rgba(255,255,255,0.3)'; 
      track.style.border = String(sbw*zoom)+'px solid '+sbc; label.style.minHeight = (h + 2*(sbw*zoom)) + 'px';

      knob.style.position='absolute'; 
      knob.style.top='50%'; knob.style.transform='translateY(-50%)';
      knob.style.left = input.checked ? (w - (sbw*zoom) - kSize) + 'px' : (sbw*zoom) + 'px';
      const inset=(sbw*zoom);
      const kSize=Math.max(10*zoom, h-2*inset);
      knob.style.width=kSize+'px'; 
      knob.style.height=kSize+'px'; 
      knob.style.borderRadius=(kSize/2)+'px';
      knob.style.background=this.getProp('switchKnobColor')||'#fff';

      const ssc=this.getProp('switchShadowColor')||''; 
      const sdx=Number(this.getProp('switchShadowDx')||0); 
      const sdy=Number(this.getProp('switchShadowDy')||0); 
      const sblur=Number(this.getProp('switchShadowBlur')||0);
      if(ssc){ track.style.boxShadow = `${sdx}px ${sdy}px ${sblur}px ${ssc}`; }
      else { track.style.boxShadow = ''; }

      track.appendChild(knob);
      label.appendChild(track);

      const updateSwitch = ()=>{
        track.style.background = input.checked ? swOn : swOff;
        knob.style.left = input.checked ? (w - (sbw*zoom) - kSize) + 'px' : (sbw*zoom) + 'px';
      };
      input.addEventListener('change', updateSwitch);
      input.addEventListener('click', (e)=>{ const _lockOn=!!this.getProp('lockOnSelect'); if(_lockOn && input.dataset.locked==='1' && input.checked){ e.preventDefault(); e.stopPropagation(); }});
      input.addEventListener('change', (e)=>{ const _lockOn=!!this.getProp('lockOnSelect'); if(_lockOn && input.checked){ input.dataset.locked='1'; } });
label.addEventListener('click', (e)=>{ if(e.target===input) return; const _lockOn=!!this.getProp('lockOnSelect'); if(_lockOn && input.checked){ e.preventDefault(); e.stopPropagation(); return; } input.checked = !input.checked; 
        updateSwitch(); 
        e.preventDefault(); e.stopPropagation();
        if(typeof input.onchange==='function') input.onchange(e);
      });
      updateSwitch();
    }

    // layout: absolute-position the checkbox input and scale indent with zoom (do after creation)
    const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
    label.style.position='relative'; label.style.display='flex'; label.style.alignItems='center'; label.style.gap='0.5em';
    input.style.position='absolute';
    input.style.left = (4*zoom2)+'px';
    input.style.top = '0.2em';
    const padBase2 = (input.offsetWidth || 16) + (Number(this.getProp('labelGap')||6));
    


    // apply text styles to label
    const fam = this.getProp('fontFamily')||'System';
    const fontMap = {
      'System':'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Inter':'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Roboto':'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
      'Arial':'Arial, Helvetica, sans-serif',
      'Georgia':'Georgia, serif',
      'Times New Roman':'\"Times New Roman\", Times, serif',
      'Courier New':'\"Courier New\", monospace'
    };
    label.style.fontFamily = fontMap[fam] || fam;
    label.style.fontWeight = String(this.getProp('fontWeight')||400);
    label.style.fontStyle = (this.getProp('italic') ? 'italic' : 'normal');
    const fs = this.getProp('fontSize') ?? 16;
    const unit = this.getProp('fontSizeUnit') || 'px';
    const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
    label.style.fontSize = (unit==='px' ? String(fs*zoom)+'px' : String(fs)+unit);
    label.style.textDecorationColor = 'currentColor'; label.style.color = this.getProp('color') || '#ffffff';
    const ls=this.getProp('letterSpacing'); label.style.letterSpacing = (Number.isFinite(ls)? ls : 0)+'px';
    const lh=this.getProp('lineHeight'); label.style.lineHeight = Number.isFinite(lh)? String(lh) : '1.2';
    const sw=Number(this.getProp('strokeWidth')||0), sc=this.getProp('strokeColor');
    if(sw>0 && sc){ label.style.webkitTextStroke=`${sw}px ${sc}`; try{ label.style.textStroke=`${sw}px ${sc}`;}catch(e){} } else { label.style.webkitTextStroke=''; try{ label.style.textStroke=''; }catch(e){} }
    const col=this.getProp('shadowColor')||'rgba(0,0,0,0.5)'; const dx=Number(this.getProp('shadowDx')||0), dy=Number(this.getProp('shadowDy')||0), blur=Number(this.getProp('shadowBlur')||6);
    label.style.textShadow = `${dx}px ${dy}px ${blur}px ${col}`;
  }
}
CheckboxElement.type = 'checkbox';
registry.registerElement(CheckboxElement.type, CheckboxElement);
