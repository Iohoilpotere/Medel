import { registry } from '../core/registry.js';
import { BaseElement } from './base-element.js';

export class RadioGroupElement extends BaseElement{
  constructor(opts={}){
    super(opts);
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
    this.setProp('items', Array.isArray(opts.items)? opts.items : ['Opzione A','Opzione B']);
    this.setProp('value', Number.isInteger(opts.value)? opts.value : 0);
    this.setProp('itemStyles', opts.itemStyles ?? {});
    this.setProp('styleScope', Number.isInteger(opts.styleScope)? opts.styleScope : -1);
  }
  updateDom(){
    super.updateDom();
    if(!this.content) return;
    this.content.innerHTML='';
    const wrap = document.createElement('div');
    // Likert mode: render as range slider with labels
    if((this.getProp('selectionStyle')||'standard')==='likert'){
      wrap.style.display='flex'; wrap.style.flexDirection='column';
      const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      const items = this.getProp('items') || [];
      const value = Number(this.getProp('value')||0);
      const range = document.createElement('input');
      range.type='range'; range.min='0'; range.max=String(Math.max(items.length-1,1)); range.step='1';
      range.value = String(Math.max(0, Math.min(items.length-1, value)));
      range.addEventListener('input', ()=> this.setProp('value', Number(range.value), {silent:true}));
      range.style.width='100%'; range.classList.add('likert');
      /*__LIKERT_STYLE_VARS__*/
      

      const lkThumb=this.getProp('likertThumbColor')||this.getProp('likertHandleColor')||'#22c55e';
      const lkTrack=this.getProp('likertTrackColor')||'rgba(255,255,255,0.25)';
      const lkBw=Number(this.getProp('likertBorderWidth')||0);
      const lkBc=this.getProp('likertBorderColor')||'transparent';
      const lkRad=Number(this.getProp('likertRadius')||6);
      const lkH=Number(this.getProp('likertHeight')||6);
      const shCol=this.getProp('likertShadowColor')||'';
      const sdx=Number(this.getProp('likertShadowDx')||0), sdy=Number(this.getProp('likertShadowDy')||0), sblur=Number(this.getProp('likertShadowBlur')||0);
      const lkShadow = shCol ? `${sdx}px ${sdy}px ${sblur}px ${shCol}` : 'none';
      try{ range.style.accentColor = lkThumb; }catch(e){}
      range.style.setProperty('--likert-thumb', lkThumb);
      range.style.setProperty('--likert-track', lkTrack);
      range.style.setProperty('--likert-bw', (lkBw*zoom)+'px');
      range.style.setProperty('--likert-bc', lkBc);
      range.style.setProperty('--likert-radius', (lkRad*zoom)+'px');
      range.style.setProperty('--likert-height', Math.max(2, lkH*zoom)+'px');
            {
        const _baseThickness = Math.max(2, lkH) + 2*lkBw; // track height + borders (pre-zoom)
        let _thumbBase = Number(this.getProp('likertThumbSize'));
        if(!Number.isFinite(_thumbBase) || _thumbBase <= 0){ _thumbBase = _baseThickness; }
              {
        const _baseThickness = Math.max(2, lkH) + 2*lkBw; // pre-zoom
        const _ref = Number(this.getProp('likertThumbRef')||24);
        const _minB = Number(this.getProp('likertThumbMin')||10);
        const _maxB = Number(this.getProp('likertThumbMax')||40);
        let _thumbBase = Number(this.getProp('likertThumbSize'));
        if(!Number.isFinite(_thumbBase) || _thumbBase <= 0){
          let inv = (_ref*_ref) / Math.max(1,_baseThickness);
          _thumbBase = Math.max(_minB, Math.min(_maxB, inv));
        }
        const _zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
        const _hTrackPx = Math.max(2, lkH) * _zoom; // colored bar only
        let _thumbPx = _thumbBase * _zoom;
        // Clamp: never exceed track height minus 2px margin
        _thumbPx = Math.min(Math.max(2, _hTrackPx - 2), _thumbPx);
        range.style.setProperty('--likert-thumb-size', String(_thumbPx)+'px');
      }
      }
      range.style.setProperty('--likert-shadow', lkShadow); range.style.margin = '0 0 ' + String((Number(this.getProp("labelGap")||6)*zoom)) + 'px 0'; const _accent=this.getProp('likertHandleColor'); if(_accent){ try{ range.style.accentColor=_accent; }catch(e){} }
{ // BEGIN: switch-like Likert rendering (scoped)
        // Hide native thumb visuals (keep input for state/keyboard)
        range.style.opacity = '0';
        range.style.position = 'absolute';
        range.style.left = '0';
        range.style.top = '0';
        range.style.height = 'auto';
        range.style.pointerEvents = 'none';

        const zoomL = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
        const bwL = Math.max(0, lkBw) * zoomL;
        const radL = Math.max(0, lkRad) * zoomL;
        const hTrackL = Math.max(2, lkH) * zoomL;
        const insetL = bwL;

        // visual wrapper
        const lkWrapL = document.createElement('div');
        lkWrapL.style.position = 'relative';
        lkWrapL.style.width = '100%';
        lkWrapL.style.height = String(hTrackL + 2*insetL) + 'px';
        lkWrapL.style.userSelect = 'none';

        // track
        const trackL = document.createElement('div');
        trackL.style.position = 'absolute';
        trackL.style.left = '0';
        trackL.style.top = '50%';
        trackL.style.transform = 'translateY(-50%)';
        trackL.style.height = String(hTrackL) + 'px';
        trackL.style.width = '100%';
        trackL.style.background = lkTrack;
        trackL.style.border = String(bwL) + 'px solid ' + lkBc;
        trackL.style.borderRadius = String(radL) + 'px';
        const lkShadowL = (this.getProp('likertShadowColor')||'') ? `${sdx*zoomL}px ${sdy*zoomL}px ${Number(this.getProp('likertShadowBlur')||0)*zoomL}px ${this.getProp('likertShadowColor')}` : 'none';
        trackL.style.boxShadow = lkShadowL;

        // knob
        const knobL = document.createElement('div');
        knobL.style.position = 'absolute';
        knobL.style.top = '50%';
        knobL.style.transform = 'translateY(-50%)';

        let thumbBaseL = Number(this.getProp('likertThumbSize'));
        if(!Number.isFinite(thumbBaseL) || thumbBaseL <= 0){
          thumbBaseL = (Math.max(2, lkH) + 2*lkBw); // pre-zoom
        }
        const kSizeL = Math.max(10*zoomL, thumbBaseL*zoomL);
        knobL.style.width = String(kSizeL) + 'px';
        knobL.style.height = String(kSizeL) + 'px';
        knobL.style.borderRadius = '50%';
        const _accentL = (this.getProp('accentColor')||'').trim();
        knobL.style.background = _accentL ? _accentL : lkThumb;
        knobL.style.boxShadow = lkShadowL;
        knobL.style.cursor = 'pointer';

        lkWrapL.appendChild(trackL);
        lkWrapL.appendChild(knobL);
        this.content.appendChild(lkWrapL);

        // position knob from value
        const N_lk = Math.max(items.length, 1);
        const valueToLeftL = () => {
          const rect = lkWrapL.getBoundingClientRect();
          const wWrap = rect.width;
          const minL = insetL;
          const maxL = Math.max(minL, wWrap - insetL - kSizeL);
          const t = (N_lk>1 ? (Number(range.value)||0) / (N_lk-1) : 0);
          return minL + t * (maxL - minL);
        };
        const applyKnobPosL = () => {
          knobL.style.left = String(valueToLeftL()) + 'px';
        };
        applyKnobPosL();
        range.addEventListener('input', applyKnobPosL);

        // pointer interactions
        let draggingL = false;
        const setValueFromClientXL = (clientX) => {
          const r = lkWrapL.getBoundingClientRect();
          const wWrap = r.width;
          const minL = insetL;
          const maxL = Math.max(minL, wWrap - insetL - kSizeL);
          let x = clientX - r.left - kSizeL/2;
          if(x < minL) x = minL;
          if(x > maxL) x = maxL;
          const t = (wWrap>0 ? (x - minL) / (maxL - minL || 1) : 0);
          const newVal = Math.round(t * Math.max(N_lk-1, 1));
          if(Number(range.value) !== newVal){
            range.value = String(newVal);
            this.setProp('value', newVal, {silent:true});
          }
          applyKnobPosL();
        };

        const onDownL = (ev) => {
          draggingL = true;
          lkWrapL.setPointerCapture && lkWrapL.setPointerCapture(ev.pointerId||0);
          setValueFromClientXL(ev.clientX);
        };
        const onMoveL = (ev) => {
          if(!draggingL) return;
          setValueFromClientXL(ev.clientX);
        };
        const onUpL = (ev) => {
          draggingL = false;
          lkWrapL.releasePointerCapture && lkWrapL.releasePointerCapture(ev.pointerId||0);
        };
        trackL.addEventListener('pointerdown', onDownL);
        knobL.addEventListener('pointerdown', onDownL);
        window.addEventListener('pointermove', onMoveL);
        window.addEventListener('pointerup', onUpL);

        // cleanup on re-render
        this._likertCleanup && this._likertCleanup();
        this._likertCleanup = () => {
          window.removeEventListener('pointermove', onMoveL);
          window.removeEventListener('pointerup', onUpL);
        };
      } // END: switch-like Likert rendering
      // labels row
      const labs = document.createElement('div'); labs.style.position='relative'; labs.style.height='1.5em'; labs.style.display='block'; labs.style.overflow='visible'; this.dom.style.overflow='visible';
      labs.style.fontSize = String((this.getProp('fontSize')||16)*zoom)+'px';
      labs.style.fontFamily = 'inherit'; labs.style.whiteSpace='nowrap'; labs.style.width='100%';
      const N = Math.max(items.length,1);
      
      items.forEach((t,i)=>{ 
        const sp=document.createElement('span'); 
        sp.textContent=String(t); 
        sp.style.position='absolute';
        const pct = (N>1? (i/(N-1))*100 : 0);
        sp.style.left = (i===0? '0%' : (i===N-1? '100%' : pct+'%'));
        sp.style.transform = (i===0? 'translateX(0%)' : (i===N-1? 'translateX(-100%)' : 'translateX(-50%)'));
        sp.style.whiteSpace='nowrap';
        if(i===value){ sp.style.fontWeight='700'; }

        // Base font styles
        const fontMap = {
          'System':'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
          'Inter':'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
          'Roboto':'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
          'Arial':'Arial, Helvetica, sans-serif',
          'Georgia':'Georgia, serif',
          'Times New Roman':'"Times New Roman", Times, serif',
          'Courier New':'"Courier New", monospace'
        };
        const fam = this.getProp('fontFamily') || 'System';
        sp.style.fontFamily = fontMap[fam] || fam;
        const baseFw = this.getProp('fontWeight') || 400;
        sp.style.fontStyle = (this.getProp('italic') ? 'italic' : 'normal');
        const fs = this.getProp('fontSize') ?? 16;
        const unit = this.getProp('fontSizeUnit') || 'px';
        sp.style.fontSize = (unit==='px' ? String((fs||16)*zoom)+'px' : String(fs)+unit);
        sp.style.textDecorationColor = 'currentColor'; sp.style.color = this.getProp('color') || '#ffffff';
        const ls = this.getProp('letterSpacing'); 
        sp.style.letterSpacing = (Number.isFinite(ls)? ls : 0)+'px';
        const lh = this.getProp('lineHeight'); 
        sp.style.lineHeight = Number.isFinite(lh)? String(lh) : '1.2';
        const sw = Number(this.getProp('strokeWidth')||0); 
        const sc = this.getProp('strokeColor');
        if(sw>0 && sc){ try{ sp.style.webkitTextStroke=`${sw}px ${sc}`; sp.style.textStroke=`${sw}px ${sc}`; }catch(e){} } 
        else { try{ sp.style.webkitTextStroke=''; sp.style.textStroke=''; }catch(e){} }
        const shOn = this.getProp('shadow') ?? true;
        const shCol = this.getProp('shadowColor') || 'rgba(0,0,0,0.5)'; 
        const dx0 = Number(this.getProp('shadowDx')||0); 
        const dy0 = Number(this.getProp('shadowDy')||0); 
        const blur0 = Number(this.getProp('shadowBlur')||6);
        sp.style.textShadow = shOn ? `${dx0}px ${dy0}px ${blur0}px ${shCol}` : '';

        // Per-item overrides via styleScope/itemStyles
        const styles = this.getProp('itemStyles') || {};
        const ov = Object.assign({}, styles[i]||{});
        if(ov.fontFamily){ sp.style.fontFamily = ov.fontFamily; }
        if(Number.isFinite(ov.fontWeight)){ sp.style.fontWeight = String(ov.fontWeight); }
        if(ov.italic!==undefined){ sp.style.fontStyle = (ov.italic? 'italic':'normal'); }
        if(Number.isFinite(ov.fontSize)){
          const unit2 = ov.fontSizeUnit || this.getProp('fontSizeUnit') || 'px';
          sp.style.fontSize = (unit2==='px' ? String((ov.fontSize||16)*zoom)+'px' : String(ov.fontSize)+unit2);
        }
        if(ov.color){ sp.style.textDecorationColor = 'currentColor'; sp.style.color = ov.color; }
        if(Number.isFinite(ov.letterSpacing)){ sp.style.letterSpacing = String(ov.letterSpacing)+'px'; }
        if(Number.isFinite(ov.lineHeight)){ sp.style.lineHeight = String(ov.lineHeight); }
        if(Number.isFinite(ov.strokeWidth) && ov.strokeColor){
          try{ sp.style.webkitTextStroke = `${ov.strokeWidth}px ${ov.strokeColor}`; sp.style.textStroke = `${ov.strokeWidth}px ${ov.strokeColor}`; }catch(e){}
        }
        if(ov.shadow!==undefined){
          if(ov.shadow){
            const sc2 = ov.shadowColor || shCol;
            const dx2 = Number.isFinite(ov.shadowDx)? ov.shadowDx : dx0;
            const dy2 = Number.isFinite(ov.shadowDy)? ov.shadowDy : dy0;
            const bl2 = Number.isFinite(ov.shadowBlur)? ov.shadowBlur : blur0;
            sp.style.textShadow = `${dx2}px ${dy2}px ${bl2}px ${sc2}`;
          }else{
            sp.style.textShadow = '';
          }
        }

        labs.appendChild(sp);
      });
      wrap.appendChild(range); wrap.appendChild(labs);
      
    
    // __ALIGN_NON_LIKERT__ – align radio input/label based on itemsAlign in non-likert mode
    (()=>{
      try{
        const sel = this.getProp('selectionStyle') || 'standard';
        if(sel==='likert') return;
        const align = this.getProp('itemsAlign') || 'start';
        const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
        const radios = this.content.querySelectorAll('label input[type=radio]');
        radios.forEach(inp=>{
          const lab = inp.parentElement;
          lab.style.whiteSpace='nowrap';
          if(align==='start'){
            lab.style.display='block'; lab.style.position='relative';
            lab.style.paddingLeft='';
            inp.style.position='absolute';
            inp.style.left = String(4*zoom)+'px';
            inp.style.top  = '0px';
            inp.style.transformOrigin='left top'; inp.style.transform=`scale(${zoom})`;
            const padBase = (inp.offsetWidth || 16) + 6;
            lab.style.paddingLeft = String(padBase*zoom)+'px';
          }else if(align==='center'){
            inp.style.position='static'; inp.style.left=''; inp.style.top='';
            inp.style.transformOrigin='center center'; inp.style.transform=`scale(${zoom})`;
            lab.style.display='flex'; lab.style.flexDirection='column'; lab.style.alignItems='center';
            lab.style.paddingLeft='0'; lab.style.gap=String((Number(this.getProp('labelGap')||6)*zoom))+'px';
          }else if(align==='end'){
            inp.style.position='static'; inp.style.left=''; inp.style.top='';
            inp.style.transformOrigin='center center'; inp.style.transform=`scale(${zoom})`;
            lab.style.display='flex'; lab.style.flexDirection='row-reverse'; lab.style.alignItems='center';
            lab.style.paddingLeft='0'; lab.style.gap=String((Number(this.getProp('labelGap')||6)*zoom))+'px';
          }
        });
      }catch(e){}
    })();
// apply group orientation (vertical/horizontal)
    (()=>{
      const dir = this.getProp('itemsDirection') || 'vertical';
      const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      wrap.style.display='flex';
      wrap.style.flexDirection = (dir==='horizontal') ? 'row' : 'column';
      if(dir==='horizontal'){ const _itemsAlign = this.getProp('itemsAlign') || 'start'; const _map={start:'flex-start',center:'center',end:'flex-end'}; wrap.style.justifyContent = _map[_itemsAlign]||'flex-start'; }
      const _itemsAlign = this.getProp('itemsAlign') || 'start'; const _map={start:'flex-start',center:'center',end:'flex-end'}; wrap.style.alignItems = _map[_itemsAlign]||'flex-start';
      const _gap = Number.isFinite(this.getProp('itemsGap'))? Number(this.getProp('itemsGap')):6; wrap.style.gap = String(_gap*zoom2)+'px';
    })();
    
    this.content.appendChild(wrap);
    // post-layout adjust: position input with absolute + scale by zoom (like reference build)
    (()=>{
      const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      const nodes = this.content.querySelectorAll('label > input[type=radio]');
      nodes.forEach(inp => {
        const lab = inp.parentElement;
        lab.style.position='relative';
        inp.style.position='absolute';
        inp.style.left = String(4*zoom2)+'px';
        inp.style.top = '0px';
        inp.style.transformOrigin='left top';
        inp.style.transform = `scale(${zoom2})`;
        const padBase = (inp.offsetWidth || 16) + 6;
        lab.style.paddingLeft = String(padBase*zoom2)+'px';
      });
    })();
    
      return;
    }

    wrap.style.display='flex'; wrap.style.flexDirection='column'; const __zoom=(this.stage&&this.stage.zoom)?this.stage.zoom:1; wrap.style.gap=String(6*__zoom)+'px';
    const items = this.getProp('items') || [];
    const name = 'r_'+(this.stage?this.stage.hostId:'')+'_'+Math.random().toString(36).slice(2);
    const value = this.getProp('value');
    items.forEach((txt,i)=>{
      const lab = document.createElement('label'); lab.style.display='block'; lab.style.width='100%'; lab.style.boxSizing='border-box'; lab.style.whiteSpace='nowrap';
      const input = document.createElement('input');
      input.type='radio'; input.name = name; input.checked = (value===i);
      input.addEventListener('change', ()=> this.setProp('value', i, {silent:true}));
      lab.appendChild(input);
      lab.append(' '+String(txt));
      wrap.appendChild(lab);
    });
    
    // apply group orientation (vertical/horizontal)
    (()=>{
      const dir = this.getProp('itemsDirection') || 'vertical';
      const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      wrap.style.display='flex';
      wrap.style.flexDirection = (dir==='horizontal') ? 'row' : 'column';
      if(dir==='horizontal'){ const _itemsAlign = this.getProp('itemsAlign') || 'start'; const _map={start:'flex-start',center:'center',end:'flex-end'}; wrap.style.justifyContent = _map[_itemsAlign]||'flex-start'; }
      const _itemsAlign = this.getProp('itemsAlign') || 'start'; const _map={start:'flex-start',center:'center',end:'flex-end'}; wrap.style.alignItems = _map[_itemsAlign]||'flex-start';
      const _gap = Number.isFinite(this.getProp('itemsGap'))? Number(this.getProp('itemsGap')):6; wrap.style.gap = String(_gap*zoom2)+'px';
    })();
    
    this.content.appendChild(wrap);
    // post-layout adjust: position input with absolute + scale by zoom (like reference build)
    (()=>{
      const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      const nodes = this.content.querySelectorAll('label > input[type=radio]');
      nodes.forEach(inp => {
        const lab = inp.parentElement;
        lab.style.position='relative';
        inp.style.position='absolute';
        inp.style.left = String(4*zoom2)+'px';
        inp.style.top = '0px';
        inp.style.transformOrigin='left top';
        inp.style.transform = `scale(${zoom2})`;
        const padBase = (inp.offsetWidth || 16) + 6;
        lab.style.paddingLeft = String(padBase*zoom2)+'px';
      });
    })();
    

    const fontMap = {
      'System':'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Inter':'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'Roboto':'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
      'Arial':'Arial, Helvetica, sans-serif',
      'Georgia':'Georgia, serif',
      'Times New Roman':'"Times New Roman", Times, serif',
      'Courier New':'"Courier New", monospace'
    };
    const baseFam = this.getProp('fontFamily') || 'System';
    const baseFw  = String(this.getProp('fontWeight') || 400);
    const baseIt  = this.getProp('italic') ? 'italic' : 'normal';
    const baseFs  = this.getProp('fontSize') ?? 16;
    const baseUnit= this.getProp('fontSizeUnit') || 'px';
    const baseColor = this.getProp('color') || '#ffffff';
    const baseLs = this.getProp('letterSpacing');
    const baseLh = this.getProp('lineHeight');
    const baseSw = Number(this.getProp('strokeWidth')||0);
    const baseSc = this.getProp('strokeColor');
    const baseSh = this.getProp('shadowColor') || 'rgba(0,0,0,0.5)';
    const baseDx = Number(this.getProp('shadowDx')||0);
    const baseDy = Number(this.getProp('shadowDy')||0);
    const baseBlur = Number(this.getProp('shadowBlur')||6);
    const styles = this.getProp('itemStyles') || {};

    (wrap.querySelectorAll('label')||[]).forEach((lbl,i)=>{
      // layout: make radio/checkbox absolute and scale indent by zoom so wrapping is stable across zoom
      const inp = lbl.querySelector('input');
      const zoom2 = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      if(inp){
        lbl.style.position='relative';
        inp.style.position='absolute';
        inp.style.left = (4*zoom2)+'px';
        // vertical align near text mid
        inp.style.top = '0.2em';
        const baseCtl = 16; const gap = Number(this.getProp('labelGap')||8); const padBase = baseCtl + gap;
        lbl.style.paddingLeft = String(padBase*zoom2)+'px';
      }
    
      const ov = Object.assign({}, styles[i]||{});
      const fam = ov.fontFamily ?? baseFam;
      lbl.style.fontFamily = fontMap[fam] || fam;
      lbl.style.fontWeight = String(ov.fontWeight ?? baseFw);
      lbl.style.fontStyle = (ov.italic ?? (baseIt==='italic')) ? 'italic' : 'normal';
      const fs = ov.fontSize ?? baseFs;
      const unit = ov.fontSizeUnit ?? baseUnit;
      const zoom = (this.stage && this.stage.zoom) ? this.stage.zoom : 1;
      lbl.style.fontSize = (unit==='px' ? String(fs*zoom)+'px' : String(fs)+unit);
      lbl.style.color = ov.color ?? baseColor;
      const ls = ov.letterSpacing ?? baseLs; lbl.style.letterSpacing = (Number.isFinite(ls)? ls : 0)+'px';
      const lh = ov.lineHeight ?? baseLh; lbl.style.lineHeight = Number.isFinite(lh)? String(lh) : '1.2';
      const sw = Number(ov.strokeWidth ?? baseSw); const sc = ov.strokeColor ?? baseSc;
      if(sw>0 && sc){ lbl.style.webkitTextStroke=`${sw}px ${sc}`; try{ lbl.style.textStroke=`${sw}px ${sc}`;}catch(e){} } else { lbl.style.webkitTextStroke=''; try{ lbl.style.textStroke=''; }catch(e){} }
      const shOn = (ov.hasOwnProperty('shadow') ? !!ov.shadow : !!(this.getProp('shadow') ?? true));
      const shCol = ov.shadowColor ?? baseSh; const dx = Number(ov.shadowDx ?? baseDx); const dy = Number(ov.shadowDy ?? baseDy); const blur = Number(ov.shadowBlur ?? baseBlur);
      lbl.style.textShadow = shOn ? `${dx}px ${dy}px ${blur}px ${shCol}` : '';
    });
  }
}
RadioGroupElement.type = 'radiogroup';
registry.registerElement(RadioGroupElement.type, RadioGroupElement);